import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:shamsi_date/shamsi_date.dart';
// Plan repo provider for fetching latest plan
import '../../../plan/data/repositories/plan_repository_impl.dart';
import '../../../logs/data/datasources/logs_remote_data_source.dart';
import '../../../settings/presentation/providers/settings_providers.dart';

/// Provides today's Jalali date
final todayJalaliProvider = Provider<Jalali>((ref) {
  return Jalali.now();
});

/// Provides the list of 7 Jalali dates for the current week (Saturday → Friday)
final currentJalaliWeekProvider = Provider<List<Jalali>>((ref) {
  final today = ref.watch(todayJalaliProvider);
  final startOfWeek = today.addDays(-(today.weekDay - 1));
  return List.generate(7, (i) => startOfWeek.addDays(i));
});

/// Holds the currently selected Jalali date in the Home page
final selectedJalaliDateProvider = StateProvider<Jalali>((ref) {
  return ref.read(todayJalaliProvider);
});

bool isSameJalaliDate(Jalali a, Jalali b) {
  return a.year == b.year && a.month == b.month && a.day == b.day;
}

/// Provides a scrollable range of Jalali dates centered on today
final jalaliDateRangeProvider = Provider<List<Jalali>>((ref) {
  // Range: 90 days past to 90 days future
  const int daysPast = 90;
  const int daysFuture = 90;
  final today = ref.watch(todayJalaliProvider);
  final start = today.addDays(-daysPast);
  final total = daysPast + daysFuture + 1;
  return List.generate(total, (i) => start.addDays(i));
});

// Use shared logs data source in logs feature

/// Combines plan with daily log to compute remaining per day
class DailyRemaining {
  final int caloriesRemaining;
  final int carbsRemaining;
  final int proteinRemaining;
  final int fatsRemaining;
  final int totalCalories;
  final int totalCarbs;
  final int totalProtein;
  final int totalFats;
  final int rolloverCalories; // Calories added from yesterday

  const DailyRemaining({
    required this.caloriesRemaining,
    required this.carbsRemaining,
    required this.proteinRemaining,
    required this.fatsRemaining,
    required this.totalCalories,
    required this.totalCarbs,
    required this.totalProtein,
    required this.totalFats,
    this.rolloverCalories = 0,
  });
}

String _toIsoDateFromJalali(Jalali d) {
  final g = d.toGregorian();
  final mm = g.month.toString().padLeft(2, '0');
  final dd = g.day.toString().padLeft(2, '0');
  return '${g.year}-$mm-$dd';
}

/// Fetches plan and log for selected day, computes remaining
final dailyRemainingProvider = FutureProvider<DailyRemaining>((ref) async {
  final selected = ref.watch(selectedJalaliDateProvider);
  final planRepo = ref.read(planRepositoryProvider);
  final logsRemote = ref.read(logsRemoteDataSourceProvider);
  final prefs = ref.watch(preferencesProvider);

  final plan = await planRepo.fetchLatestPlan();
  final dateIso = _toIsoDateFromJalali(selected);
  final log = await logsRemote.getDailyLog(dateIso);

  int clampNonNegative(int value) => value < 0 ? 0 : value;

  // Calculate total daily calories including burned calories if setting is enabled
  int totalDailyCalories = plan.calories;
  if (prefs.addBurnedCalories) {
    totalDailyCalories += log.burnedCalories;
  }

  // Add rollover calories from yesterday if setting is enabled
  int rolloverCalories = 0;
  if (prefs.rolloverCalories) {
    try {
      final yesterday = selected.addDays(-1);
      final yesterdayIso = _toIsoDateFromJalali(yesterday);
      final yesterdayLog = await logsRemote.getDailyLog(yesterdayIso);

      // Only apply rollover if yesterday actually has data (not a new user)
      // Check if yesterday log has any consumed calories or logged items
      if (yesterdayLog.caloriesConsumed > 0 ||
          (yesterdayLog.items?.isNotEmpty ?? false)) {
        // Calculate yesterday's remaining calories (goal - consumed)
        int yesterdayGoal = plan.calories;
        if (prefs.addBurnedCalories) {
          yesterdayGoal += yesterdayLog.burnedCalories;
        }

        final yesterdayRemaining =
            yesterdayGoal - yesterdayLog.caloriesConsumed;

        // Add up to 200 calories if there were remaining calories yesterday
        if (yesterdayRemaining > 0) {
          rolloverCalories =
              yesterdayRemaining > 200 ? 200 : yesterdayRemaining;
          totalDailyCalories += rolloverCalories;
        }
      }
    } catch (e) {
      // If there's an error fetching yesterday's data, continue without rollover
      print('Error calculating rollover calories: $e');
    }
  }

  return DailyRemaining(
    caloriesRemaining:
        clampNonNegative(totalDailyCalories - log.caloriesConsumed),
    carbsRemaining: clampNonNegative(plan.carbsGrams - log.carbsGrams),
    proteinRemaining: clampNonNegative(plan.proteinGrams - log.proteinGrams),
    fatsRemaining: clampNonNegative(plan.fatsGrams - log.fatsGrams),
    totalCalories: totalDailyCalories,
    totalCarbs: plan.carbsGrams,
    totalProtein: plan.proteinGrams,
    totalFats: plan.fatsGrams,
    rolloverCalories: rolloverCalories,
  );
});
