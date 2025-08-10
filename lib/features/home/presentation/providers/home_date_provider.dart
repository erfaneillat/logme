import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:shamsi_date/shamsi_date.dart';

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
