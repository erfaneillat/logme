import { Request, Response } from 'express';
import WeightEntry from '../models/WeightEntry';
import DailyLog from '../models/DailyLog';

interface AuthRequest extends Request { user?: any }

export class WeightController {
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
      } catch (_) {}

      res.json({ success: true, data: { entry } });
    } catch (error) {
      console.error('Upsert weight error:', error);
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
      console.error('Get latest weight error:', error);
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
      console.error('Get weight range error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
