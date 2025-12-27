import User from '../models/User';
import DailyLog from '../models/DailyLog';
import Notification from '../models/Notification';
import { NotificationType } from '../models/Notification';
import notificationService from './notificationService';
import { logServiceError } from '../utils/errorLogger';
import {
  NotificationLocale,
  getDailyReminderMessage,
  getInactivityReminderMessage,
} from '../locales/notificationTranslations';

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

      // Fetch users with their preferred language
      const users = await User.find({}).select('_id preferredLanguage').lean();
      for (const u of users) {
        const uid = String((u as any)._id);
        if (alreadyNotified.has(uid)) continue;
        if (loggedUsers.has(uid)) continue;

        // Get user's preferred language, default to 'fa' for backward compatibility
        const locale: NotificationLocale = ((u as any).preferredLanguage as NotificationLocale) || 'fa';
        const { title, body } = getDailyReminderMessage(locale);

        await notificationService.createNotification(uid, NotificationType.DAILY_REMINDER, title, body, { date: today });
      }
    } catch (error) {
      logServiceError('reminderService', 'sendDailyReminders', error as Error, {});
    }
  }

  async sendInactivityReminders(): Promise<void> {
    try {
      const now = new Date();
      const todayStart = startOfDayTZ(now, this.tz);
      // Fetch users with their preferred language
      const users = await User.find({}).select('_id lastActivity preferredLanguage').lean();

      for (const u of users) {
        const uid = String((u as any)._id);
        let lastActivity: Date | null = (u as any).lastActivity ? new Date((u as any).lastActivity) : null;
        if (!lastActivity) {
          const lastLog = await DailyLog.findOne({ userId: uid }).sort({ updatedAt: -1 }).select('updatedAt').lean();
          lastActivity = lastLog?.updatedAt ? new Date(lastLog.updatedAt) : null;
        }
        if (!lastActivity) continue;

        const diffDays = Math.floor((todayStart.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
        if (![2, 3, 5, 7, 10, 15].includes(diffDays)) continue;

        const exists = await Notification.findOne({
          userId: uid,
          type: NotificationType.INACTIVITY,
          'data.inactivityDays': diffDays,
          createdAt: { $gte: todayStart },
        }).lean();
        if (exists) continue;

        // Get user's preferred language, default to 'fa' for backward compatibility
        const locale: NotificationLocale = ((u as any).preferredLanguage as NotificationLocale) || 'fa';
        const message = getInactivityReminderMessage(diffDays, locale);

        if (!message) continue;
        await notificationService.createNotification(uid, NotificationType.INACTIVITY, message.title, message.body, { inactivityDays: diffDays });
      }
    } catch (error) {
      logServiceError('reminderService', 'sendInactivityReminders', error as Error, {});
    }
  }
}

export default new ReminderService();

