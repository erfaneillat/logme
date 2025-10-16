import Plan from '../models/Plan';
import DailyLog from '../models/DailyLog';
import User from '../models/User';
import Streak from '../models/Streak';
import { logServiceError } from '../utils/errorLogger';

/**
 * Update user's last activity timestamp to current time
 * @param userId - The user's ID
 */
export async function updateUserLastActivity(userId: string): Promise<void> {
  try {
    await User.findByIdAndUpdate(userId, {
      $set: { lastActivity: new Date() }
    }).exec();
  } catch (error) {
    logServiceError('streakService', 'updateUserLastActivity', error as Error, { userId });
    // Don't throw error as this is not critical functionality
  }
}

/**
 * Update user's streak when additional meals are logged.
 * - Since we want streaks to increase by just logging meals (not requiring calorie goals),
 *   this function always increments the streak when meals are logged.
 * - If the user missed days (gap > 1 day) before this date, reset streak to 0 before incrementing.
 * - If already counted for this date (lastStreakDate === date), do nothing.
 *
 * Dates are in YYYY-MM-DD format.
 */
export async function updateStreakIfEligible(userId: string, date: string): Promise<void> {
  const targetDate = (date || '').slice(0, 10);
  if (!targetDate) return;

  // Fetch user streak state
  const user = await User.findById(userId).lean();
  if (!user) return;

  const lastStreakDate: string | null = (user as any).lastStreakDate ?? null;
  const currentStreak: number = Math.max(0, Number((user as any).streakCount ?? 0));

  // Already counted for this date -> nothing to do
  if (lastStreakDate === targetDate) return;

  // Helpers
  const parse = (d: string) => {
    if (!d || typeof d !== 'string') return new Date(NaN);
    const parts = d.split('-');
    if (parts.length !== 3) return new Date(NaN);
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const dd = Number(parts[2]);
    if (!isFinite(y) || !isFinite(m) || !isFinite(dd) || m < 1 || m > 12 || dd < 1 || dd > 31) {
      return new Date(NaN);
    }
    return new Date(y, m - 1, dd);
  };
  const fmt = (dt: Date) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d2 = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d2}`;
  };
  const prevDate = (d: string) => {
    const t = parse(d);
    t.setDate(t.getDate() - 1);
    return fmt(t);
  };

  // Since we want streaks to increase just by logging meals (not requiring calorie goals),
  // we always increment the streak when meals are logged (except for the first meal which uses updateStreakOnFirstMeal)

  // Determine new streak value (always increment when meals are logged).
  const yesterday = prevDate(targetDate);

  let nextStreak = 1;
  if (lastStreakDate === yesterday) {
    nextStreak = currentStreak + 1;
  } else if (lastStreakDate && lastStreakDate < yesterday) {
    // Gap > 1 day -> reset to 1
    nextStreak = 1;
  } else if (!lastStreakDate) {
    nextStreak = 1;
  }

  await User.findByIdAndUpdate(userId, {
    $set: {
      streakCount: nextStreak,
      lastStreakDate: targetDate,
    },
  }).exec();

  // Update last activity timestamp
  await updateUserLastActivity(userId);

  // Record completion for this date in Streaks collection
  try {
    await Streak.findOneAndUpdate(
      { userId, date: targetDate },
      { $set: { userId, date: targetDate, completed: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  } catch (_) { }
}

/**
 * Update user's streak when the first meal of the day is logged.
 * - Increments streak for the given date when any meal is logged for the first time that day.
 * - If the user missed days (gap > 1 day) before this date, reset streak to 0 before incrementing.
 * - If already counted for this date (lastStreakDate === date), do nothing.
 *
 * Dates are in YYYY-MM-DD format.
 */
export async function updateStreakOnFirstMeal(userId: string, date: string): Promise<void> {
  const targetDate = (date || '').slice(0, 10);
  if (!targetDate) return;

  // Fetch user streak state
  const user = await User.findById(userId).lean();
  if (!user) return;

  const lastStreakDate: string | null = (user as any).lastStreakDate ?? null;
  const currentStreak: number = Math.max(0, Number((user as any).streakCount ?? 0));

  // Helpers
  const parse = (d: string) => {
    if (!d || typeof d !== 'string') return new Date(NaN);
    const parts = d.split('-');
    if (parts.length !== 3) return new Date(NaN);
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const dd = Number(parts[2]);
    if (!isFinite(y) || !isFinite(m) || !isFinite(dd) || m < 1 || m > 12 || dd < 1 || dd > 31) {
      return new Date(NaN);
    }
    return new Date(y, m - 1, dd);
  };
  const fmt = (dt: Date) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d2 = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d2}`;
  };
  const prevDate = (d: string) => {
    const t = parse(d);
    t.setDate(t.getDate() - 1);
    return fmt(t);
  };

  // Already counted for this date -> nothing to do
  if (lastStreakDate === targetDate) return;

  // Determine new streak value
  const yesterday = prevDate(targetDate);
  let nextStreak = 1;

  if (lastStreakDate === yesterday) {
    nextStreak = currentStreak + 1;
  } else if (lastStreakDate && lastStreakDate < yesterday) {
    // Gap > 1 day -> reset to 1
    nextStreak = 1;
  } else if (!lastStreakDate) {
    nextStreak = 1;
  }

  // Update user streak
  await User.findByIdAndUpdate(userId, {
    $set: {
      streakCount: nextStreak,
      lastStreakDate: targetDate,
    },
  }).exec();

  // Update last activity timestamp
  await updateUserLastActivity(userId);

  // Record completion for this date in Streaks collection
  try {
    await Streak.findOneAndUpdate(
      { userId, date: targetDate },
      { $set: { userId, date: targetDate, completed: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  } catch (_) { }
}

/**
 * Fetch completed streak dates within [startDate, endDate] (inclusive).
 * Returns an array of strings (YYYY-MM-DD) for dates where completed === true.
 */
export async function getCompletedStreakDatesInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<string[]> {
  const start = (startDate || '').slice(0, 10);
  const end = (endDate || '').slice(0, 10);
  if (!start || !end) return [];

  const docs = await Streak.find({
    userId,
    date: { $gte: start, $lte: end },
    completed: true,
  })
    .select({ date: 1 })
    .lean();

  return (docs || []).map((d: any) => String(d?.date || '')).filter(Boolean);
}

/**
 * Reset streaks for users who have been inactive for more than the specified number of days.
 * A user is considered inactive if their lastActivity is older than the threshold.
 *
 * @param inactivityDaysThreshold - Number of days of inactivity before resetting streak (default: 7)
 * @returns Promise with the number of users whose streaks were reset
 */
export async function resetInactiveUserStreaks(inactivityDaysThreshold: number = 7): Promise<number> {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - inactivityDaysThreshold);

    // Find users who are inactive (lastActivity is null or older than threshold)
    // and have an active streak (streakCount > 0)
    const inactiveUsers = await User.find({
      $or: [
        { lastActivity: { $lt: thresholdDate } },
        { lastActivity: null }
      ],
      streakCount: { $gt: 0 }
    }).select('_id streakCount lastStreakDate lastActivity');

    console.log(`Found ${inactiveUsers.length} users with active streaks who may be inactive`);

    let resetCount = 0;

    for (const user of inactiveUsers) {
      // Double-check if user is still inactive by checking their most recent activity
      // This could be from DailyLog entries or other activity sources
      const lastLog = await DailyLog.findOne({ userId: user._id })
        .sort({ updatedAt: -1 })
        .select('updatedAt');

      const lastActivityDate = lastLog?.updatedAt || user.lastActivity;

      // If the user has been inactive for the threshold period, reset their streak
      if (!lastActivityDate || lastActivityDate < thresholdDate) {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            streakCount: 0,
            lastStreakDate: null,
            lastActivity: new Date(), // Update lastActivity to current time to avoid reprocessing
          }
        });

        console.log(`Reset streak for user ${user._id} (streak was ${user.streakCount}, last activity: ${lastActivityDate})`);
        resetCount++;
      }
    }

    console.log(`Streak reset completed. Reset ${resetCount} user streaks.`);
    return resetCount;
  } catch (error) {
    logServiceError('streakService', 'resetInactiveUserStreaks', error as Error, { days: inactivityDaysThreshold });
    throw error;
  }
}
