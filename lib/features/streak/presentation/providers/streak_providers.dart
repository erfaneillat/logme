import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../domain/usecases/get_streak_completions_range_usecase.dart';

String _toIsoDate(DateTime d) {
  final mm = d.month.toString().padLeft(2, '0');
  final dd = d.day.toString().padLeft(2, '0');
  return '${d.year}-$mm-$dd';
}

/// Fetches completions for the last 7 days ending today (Gregorian local dates)
final streakWeeklyCompletionsProvider = FutureProvider<List<String>>((ref) async {
  final usecase = ref.read(getStreakCompletionsRangeUseCaseProvider);
  final now = DateTime.now();
  final start = DateTime(now.year, now.month, now.day).subtract(const Duration(days: 6));
  final end = DateTime(now.year, now.month, now.day);
  final startIso = _toIsoDate(start);
  final endIso = _toIsoDate(end);
  return usecase(startIso: startIso, endIso: endIso);
});
