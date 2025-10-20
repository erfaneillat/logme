import { Request, Response } from 'express';
import WeightEntry from '../models/WeightEntry';
import DailyLog from '../models/DailyLog';
import { updateUserLastActivity } from '../services/streakService';
import errorLogger from '../services/errorLoggerService';
import AdditionalInfo from '../models/AdditionalInfo';
import notificationService from '../services/notificationService';
import Notification, { NotificationType } from '../models/Notification';

interface AuthRequest extends Request { user?: any }

export class WeightController {
  private async checkWeightMotivations(userId: string, date: string): Promise<void> {
    try {
      const info = await AdditionalInfo.findOne({ userId }).select('targetWeight weightLossSpeed').lean();
      const target = Number((info as any)?.targetWeight);
      if (!isFinite(target)) return;

      const current = await WeightEntry.findOne({ userId, date }).lean();
      if (!current) return;
      const currentW = Number((current as any).weightKg);
      if (!isFinite(currentW)) return;

      const start = await WeightEntry.findOne({ userId }).sort({ date: 1 }).lean();
      const startW = start ? Number((start as any).weightKg) : undefined;

      // 1) Progress percent
      if (isFinite(startW as number) && Math.abs((startW as number) - target) > 0.0001) {
        const progress = Math.max(0, Math.min(100, Math.round(Math.abs((startW as number) - currentW) * 100 / Math.abs((startW as number) - target))));
        const exists = await Notification.findOne({ userId, type: NotificationType.MOTIVATION, 'data.kind': 'progress_percent', 'data.date': date }).lean();
        if (!exists) {
          await notificationService.createNotification(
            userId,
            NotificationType.MOTIVATION,
            'پیشرفت عالی',
            `عالی پیش میری! تا الان ${progress}% از مسیر هدفت رو گذروندی.`,
            { kind: 'progress_percent', date, progress }
          );
        }
      }

      // 2) Remaining kg to target
      const remainingKg = Math.max(0, Math.round(Math.abs(currentW - target)));
      if (remainingKg > 0) {
        const existsRem = await Notification.findOne({ userId, type: NotificationType.MOTIVATION, 'data.kind': 'remaining_to_target', 'data.date': date }).lean();
        if (!existsRem) {
          await notificationService.createNotification(
            userId,
            NotificationType.MOTIVATION,
            'نزدیک به هدف',
            `تا رسیدن به وزن هدفت فقط ${remainingKg} کیلو باقی مونده`,
            { kind: 'remaining_to_target', date, remainingKg }
          );
        }
      }

      // 3) 1 kg closer to target since previous entry
      const prev = await WeightEntry.findOne({ userId, date: { $lt: date } }).sort({ date: -1 }).lean();
      if (prev) {
        const prevW = Number((prev as any).weightKg);
        if (isFinite(prevW)) {
          const improvement = Math.abs(prevW - target) - Math.abs(currentW - target);
          if (improvement >= 1.0) {
            const exists1kg = await Notification.findOne({ userId, type: NotificationType.MOTIVATION, 'data.kind': 'one_kg_closer', 'data.date': date }).lean();
            if (!exists1kg) {
              await notificationService.createNotification(
                userId,
                NotificationType.MOTIVATION,
                'تبریک',
                'عالی! 1 کیلو به هدف نزدیک‌تر شدی، ادامه بده!',
                { kind: 'one_kg_closer', date, improvementKg: Math.round(improvement) }
              );
            }
          }
        }
      }

      // 4) ETA to target date using weightLossSpeed (kg/week)
      const speed = Number((info as any)?.weightLossSpeed);
      if (isFinite(speed) && speed > 0 && remainingKg > 0) {
        const weeks = remainingKg / speed;
        const eta = new Date();
        eta.setDate(eta.getDate() + Math.ceil(weeks * 7));
        const etaStr = eta.toISOString().slice(0, 10);
        const existsEta = await Notification.findOne({ userId, type: NotificationType.MOTIVATION, 'data.kind': 'eta_to_target', 'data.date': date }).lean();
        if (!existsEta) {
          await notificationService.createNotification(
            userId,
            NotificationType.MOTIVATION,
            'پیش‌بینی رسیدن به هدف',
            `عالیه! با همین سرعت تا تاریخ ${etaStr} می‌تونی به وزن هدفت برسی.`,
            { kind: 'eta_to_target', date, eta: etaStr, speedKgPerWeek: speed }
          );
        }
      }
    } catch (_) { }
  }
  async upsertWeight(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { date, weightKg } = req.body || {};
      if (!date || typeof date !== 'string' || typeof weightKg !== 'number') {
        res.status(400).json({ success: false, message: 'date (YYYY-MM-DD) and weightKg (number) are required' });
        return;
      }

      const sanitizedDate = date.slice(0, 10);
      const weight = Math.max(20, Math.min(400, Number(weightKg)));

      const entry = await WeightEntry.findOneAndUpdate(
        { userId, date: sanitizedDate },
        { userId, date: sanitizedDate, weightKg: weight },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Ensure a DailyLog exists for this date so logs/range reflects the day
      try {
        await DailyLog.findOneAndUpdate(
          { userId, date: sanitizedDate },
          {
            $setOnInsert: {
              userId,
              date: sanitizedDate,
              caloriesConsumed: 0,
              carbsGrams: 0,
              proteinGrams: 0,
              fatsGrams: 0,
              items: [],
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).exec();
      } catch (_) { }

      // Update user's last activity
      try { await updateUserLastActivity(userId); } catch (_) { }
      await this.checkWeightMotivations(userId, sanitizedDate);

      res.json({ success: true, data: { entry } });
    } catch (error) {
      errorLogger.error('Upsert weight error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getLatest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const latest = await WeightEntry.findOne({ userId }).sort({ date: -1 }).lean();
      res.json({ success: true, data: { latest } });
    } catch (error) {
      errorLogger.error('Get latest weight error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getRange(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const start = (req.query.start as string) || '';
      const end = (req.query.end as string) || '';
      if (!start || !end) {
        res.status(400).json({ success: false, message: 'start and end (YYYY-MM-DD) are required' });
        return;
      }

      const startDate = start.slice(0, 10);
      const endDate = end.slice(0, 10);

      const entries = await WeightEntry.find({
        userId,
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: 1 }).lean();

      res.json({ success: true, data: { entries } });
    } catch (error) {
      errorLogger.error('Get weight range error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
