import User from '../models/User';
import DailyLog from '../models/DailyLog';
import Notification from '../models/Notification';
import { NotificationType } from '../models/Notification';
import notificationService from './notificationService';
import { logServiceError } from '../utils/errorLogger';

function formatDateTZ(date: Date, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = fmt.formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value || '0000';
  const m = parts.find(p => p.type === 'month')?.value || '01';
  const d = parts.find(p => p.type === 'day')?.value || '01';
  return `${y}-${m}-${d}`;
}

function startOfDayTZ(date: Date, timeZone: string): Date {
  const ymd = formatDateTZ(date, timeZone);
  return new Date(`${ymd}T00:00:00.000Z`);
}

const DAILY_REMINDER_MESSAGES = [
  'وقتشه غذات رو ثبت کنی\nعکس بگیر تا بدونی چند کالری داری می‌خوری!',
  'یادت نره امروز کالری‌هات رو چک کنی',
  'فقط چند ثانیه لازمه برای ثبت وعده‌هات ⏱',
 ] as const;

const INACTIVITY_MESSAGES: Record<number, string> = {
  2: 'دو روزه غذات رو ثبت نکردی، برگرد و مسیرت رو ادامه بده.',
  3: 'یادت رفت کالری‌هات رو ثبت کنی؟ هر روز فقط چند ثانیه زمان می‌بره',
  5: 'بدون ثبت روزانه، پیشرفت دیده نمی‌شه. همین الان برگرد!',
  7: 'یک هفته‌ست سر نزدی، همه زحماتت از دست می‌ره. برگرد و از همین‌جا ادامه بده.',
  10: 'برگرد و پیشرفتت رو از نو شروع کن. لقمه همیشه اینجاست',
  15: 'برگرد و پیشرفتت رو از نو شروع کن. لقمه همیشه اینجاست',
};

class ReminderService {
  private readonly tz = 'Asia/Tehran';

  async sendDailyReminders(): Promise<void> {
    try {
      const today = formatDateTZ(new Date(), this.tz);
      const existing = await Notification.find({
        type: NotificationType.DAILY_REMINDER,
        createdAt: { $gte: startOfDayTZ(new Date(), this.tz) },
      }).select('userId').lean();
      const alreadyNotified = new Set<string>((existing || []).map((n: any) => String(n.userId)));

      const logs = await DailyLog.find({ date: today }).select('userId items').lean();
      const loggedUsers = new Set<string>();
      for (const l of logs) {
        const items = Array.isArray((l as any).items) ? (l as any).items : [];
        if (items.length > 0) loggedUsers.add(String((l as any).userId));
      }

      const users = await User.find({}).select('_id').lean();
      for (const u of users) {
        const uid = String((u as any)._id);
        if (alreadyNotified.has(uid)) continue;
        if (loggedUsers.has(uid)) continue;
        const idx = Math.floor(Math.random() * DAILY_REMINDER_MESSAGES.length);
        const msg = DAILY_REMINDER_MESSAGES[idx] ?? DAILY_REMINDER_MESSAGES[0];
        await notificationService.createNotification(uid, NotificationType.DAILY_REMINDER, 'یادآور روزانه', msg, { date: today });
      }
    } catch (error) {
      logServiceError('reminderService', 'sendDailyReminders', error as Error, {});
    }
  }

  async sendInactivityReminders(): Promise<void> {
    try {
      const now = new Date();
      const todayStart = startOfDayTZ(now, this.tz);
      const users = await User.find({}).select('_id lastActivity').lean();

      for (const u of users) {
        const uid = String((u as any)._id);
        let lastActivity: Date | null = (u as any).lastActivity ? new Date((u as any).lastActivity) : null;
        if (!lastActivity) {
          const lastLog = await DailyLog.findOne({ userId: uid }).sort({ updatedAt: -1 }).select('updatedAt').lean();
          lastActivity = lastLog?.updatedAt ? new Date(lastLog.updatedAt) : null;
        }
        if (!lastActivity) continue;

        const diffDays = Math.floor((todayStart.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
        if (![2,3,5,7,10,15].includes(diffDays)) continue;

        const exists = await Notification.findOne({
          userId: uid,
          type: NotificationType.INACTIVITY,
          'data.inactivityDays': diffDays,
          createdAt: { $gte: todayStart },
        }).lean();
        if (exists) continue;

        const body = INACTIVITY_MESSAGES[diffDays];
        if (!body) continue;
        await notificationService.createNotification(uid, NotificationType.INACTIVITY, 'یادآور بازگشت', body, { inactivityDays: diffDays });
      }
    } catch (error) {
      logServiceError('reminderService', 'sendInactivityReminders', error as Error, {});
    }
  }
}

export default new ReminderService();
