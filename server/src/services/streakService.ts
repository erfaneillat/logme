import Plan from '../models/Plan';
import DailyLog from '../models/DailyLog';
import User from '../models/User';
import Streak from '../models/Streak';

/**
 * Update user's streak based on whether a given date's log meets the daily calorie goal.
 * - If caloriesConsumed >= plan.calories for that date, increment streak for that date.
 * - If the user missed days (gap > 1 day) before this date, reset streak to 0 before incrementing.
 * - If already counted for this date (lastStreakDate === date), do nothing.
 *
 * Dates are in YYYY-MM-DD format.
 */
export async function updateStreakIfEligible(userId: string, date: string): Promise<void> {
  const targetDate = (date || '').slice(0, 10);
  if (!targetDate) return;

  // Fetch latest plan
  const plan = await Plan.findOne({ userId }).sort({ createdAt: -1 }).lean();
  if (!plan || !plan.calories || plan.calories <= 0) return;

  // Fetch that day's log
  const log = await DailyLog.findOne({ userId, date: targetDate }).lean();
  const consumed = Number(log?.caloriesConsumed ?? 0);
  const goal = Number(plan.calories);

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

  // If not meeting goal, no increment. Optionally reset if missed days before targetDate.
  if (consumed < goal) {
    // If last streak date is older than yesterday of target date, reset to 0
    if (lastStreakDate) {
      const yesterday = prevDate(targetDate);
      if (lastStreakDate < yesterday) {
        await User.findByIdAndUpdate(userId, { $set: { streakCount: 0 } }).exec();
      }
    }
    // Persist non-completion for the date to keep explicit records (optional)
    try {
      await Streak.findOneAndUpdate(
        { userId, date: targetDate },
        { $set: { userId, date: targetDate, completed: false } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).exec();
    } catch (_) {}
    return;
  }

  // At this point the day meets the goal.
  // Determine new streak value.
  const yesterday = prevDate(targetDate);

  // Already counted for this date -> nothing to do
  if (lastStreakDate === targetDate) return;

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

  // Record completion for this date in Streaks collection
  try {
    await Streak.findOneAndUpdate(
      { userId, date: targetDate },
      { $set: { userId, date: targetDate, completed: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  } catch (_) {}
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
