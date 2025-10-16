import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../../data/datasources/weight_remote_data_source.dart';
import '../../data/repositories/weight_repository_impl.dart';
import '../../domain/entities/weight_entry.dart';
import '../../domain/repositories/weight_repository.dart';
import '../../domain/usecases/get_latest_weight_usecase.dart';
import '../../../additional_info/presentation/providers/additional_info_provider.dart';
import '../../../logs/data/repositories/logs_repository_impl.dart';
import '../../../logs/domain/entities/daily_log.dart';
import '../../../logs/domain/usecases/get_logs_range_usecase.dart';
import '../../domain/usecases/get_weight_range_usecase.dart';
import '../../domain/usecases/upsert_weight_usecase.dart';

// Repository DI
final weightRepositoryProvider = Provider<WeightRepository>((ref) {
  final remote = ref.watch(weightRemoteDataSourceProvider);
  return WeightRepositoryImpl(remote);
});

// Usecases
final getLatestWeightUseCaseProvider = Provider<GetLatestWeightUseCase>((ref) {
  final repo = ref.watch(weightRepositoryProvider);
  return GetLatestWeightUseCase(repo);
});

final getWeightRangeUseCaseProvider = Provider<GetWeightRangeUseCase>((ref) {
  final repo = ref.watch(weightRepositoryProvider);
  return GetWeightRangeUseCase(repo);
});

final upsertWeightUseCaseProvider = Provider<UpsertWeightUseCase>((ref) {
  final repo = ref.watch(weightRepositoryProvider);
  return UpsertWeightUseCase(repo);
});

// Data providers
final latestWeightProvider = FutureProvider<WeightEntryEntity?>((ref) async {
  final usecase = ref.watch(getLatestWeightUseCaseProvider);
  return usecase.execute();
});

// Derived BMI provider
final bmiProvider = FutureProvider<double?>((ref) async {
  final infoLocal = ref.watch(additionalInfoProvider);
  final infoRemote = await ref.watch(currentAdditionalInfoProvider.future);
  final latest = await ref.watch(latestWeightProvider.future);
  final double? weight =
      latest?.weightKg ?? infoRemote?.weight ?? infoLocal.weight;
  final double? heightCm = infoRemote?.height ?? infoLocal.height;
  if (weight == null || heightCm == null || heightCm <= 0) return null;
  final h = heightCm / 100.0;
  return weight / (h * h);
});

// Logs range use case
final getLogsRangeUseCaseProvider = Provider<GetLogsRangeUseCase>((ref) {
  final repo = ref.watch(logsRepositoryProvider);
  return GetLogsRangeUseCase(repo);
});

DateTime _startOfWeekSunday(DateTime d) {
  // Make local date at midnight
  final local = DateTime(d.year, d.month, d.day);
  // In Dart, weekday: Mon=1..Sun=7. We want Sunday start.
  final daysSinceSunday = local.weekday % 7; // Sun->0, Mon->1, ...
  return local.subtract(Duration(days: daysSinceSunday));
}

String _ymd(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

({String startIso, String endIso}) _progressRangeIso(int index) {
  final now = DateTime.now();
  DateTime start;
  switch (index) {
    case 0: // 90 days
      start = now.subtract(const Duration(days: 90));
      break;
    case 1: // 6 months approx (182 days)
      start = now.subtract(const Duration(days: 182));
      break;
    case 2: // 1 year approx (365 days)
      start = now.subtract(const Duration(days: 365));
      break;
    case 3: // all time fallback to 2 years if backend cannot return all
    default:
      start = now.subtract(const Duration(days: 730));
      break;
  }
  return (startIso: _ymd(start), endIso: _ymd(now));
}

({String startIso, String endIso}) _weekRangeIso(int weekOffset) {
  final now = DateTime.now();
  final startThisWeek = _startOfWeekSunday(now);
  final start = startThisWeek.subtract(Duration(days: 7 * weekOffset));
  final end = start.add(const Duration(days: 6));
  return (startIso: _ymd(start), endIso: _ymd(end));
}

// Weekly logs provider family: 0=this week, 1=last, 2=2w, 3=3w
final weeklyLogsProvider =
    FutureProvider.family<List<DailyLogEntity>, int>((ref, index) async {
  final range = _weekRangeIso(index);
  final uc = ref.watch(getLogsRangeUseCaseProvider);
  final logs = await uc.execute(startIso: range.startIso, endIso: range.endIso);
  // Ensure 7-day coverage by filling missing days with zeros later in series provider
  return logs;
});

// Weekly calories series (Sun..Sat)
final weeklyCaloriesSeriesProvider =
    FutureProvider.family<List<double>, int>((ref, index) async {
  final logs = await ref.watch(weeklyLogsProvider(index).future);
  // Map date->calories
  final map = <String, int>{for (final l in logs) l.date: l.caloriesConsumed};
  final range = _weekRangeIso(index);
  final start = DateTime.parse(range.startIso);
  final series = <double>[];
  for (int i = 0; i < 7; i++) {
    final d = start.add(Duration(days: i));
    final key = _ymd(d);
    series.add((map[key] ?? 0).toDouble());
  }
  return series;
});

final weeklyCaloriesTotalProvider =
    FutureProvider.family<double, int>((ref, index) async {
  final s = await ref.watch(weeklyCaloriesSeriesProvider(index).future);
  return s.fold<double>(0, (a, b) => a + b);
});

final weeklyCaloriesAvgProvider =
    FutureProvider.family<double, int>((ref, index) async {
  final total = await ref.watch(weeklyCaloriesTotalProvider(index).future);
  return total / 7.0;
});

// Weekly macros series: carbs/protein/fats per day (length up to 7)
final weeklyCarbsSeriesProvider =
    FutureProvider.family<List<int>, int>((ref, index) async {
  final logs = await ref.watch(weeklyLogsProvider(index).future);
  final series = List<int>.filled(7, 0);
  final range = _weekRangeIso(index);
  final start = DateTime.parse(range.startIso);
  for (final log in logs) {
    final dt = DateTime.parse(log.date);
    final offset = dt.difference(start).inDays;
    if (offset >= 0 && offset < 7) {
      series[offset] = log.carbsGrams;
    }
  }
  return series;
});

final weeklyProteinSeriesProvider =
    FutureProvider.family<List<int>, int>((ref, index) async {
  final logs = await ref.watch(weeklyLogsProvider(index).future);
  final series = List<int>.filled(7, 0);
  final range = _weekRangeIso(index);
  final start = DateTime.parse(range.startIso);
  for (final log in logs) {
    final dt = DateTime.parse(log.date);
    final offset = dt.difference(start).inDays;
    if (offset >= 0 && offset < 7) {
      series[offset] = log.proteinGrams;
    }
  }
  return series;
});

final weeklyFatsSeriesProvider =
    FutureProvider.family<List<int>, int>((ref, index) async {
  final logs = await ref.watch(weeklyLogsProvider(index).future);
  final series = List<int>.filled(7, 0);
  final range = _weekRangeIso(index);
  final start = DateTime.parse(range.startIso);
  for (final log in logs) {
    final dt = DateTime.parse(log.date);
    final offset = dt.difference(start).inDays;
    if (offset >= 0 && offset < 7) {
      series[offset] = log.fatsGrams;
    }
  }
  return series;
});

final weeklyCarbsTotalProvider =
    FutureProvider.family<int, int>((ref, index) async {
  final s = await ref.watch(weeklyCarbsSeriesProvider(index).future);
  return s.fold<int>(0, (a, b) => a + b);
});

final weeklyProteinTotalProvider =
    FutureProvider.family<int, int>((ref, index) async {
  final s = await ref.watch(weeklyProteinSeriesProvider(index).future);
  return s.fold<int>(0, (a, b) => a + b);
});

final weeklyFatsTotalProvider =
    FutureProvider.family<int, int>((ref, index) async {
  final s = await ref.watch(weeklyFatsSeriesProvider(index).future);
  return s.fold<int>(0, (a, b) => a + b);
});

// Weight progress series (normalized 0..1)
final weightProgressSeriesProvider =
    FutureProvider.family<List<double>, int>((ref, index) async {
  final uc = ref.watch(getWeightRangeUseCaseProvider);
  final range = _progressRangeIso(index);
  final entries =
      await uc.execute(startIso: range.startIso, endIso: range.endIso);
  if (entries.isEmpty) {
    // No points in this range: build a 2-point synthetic series using
    // global baseline and latest so user still sees progress.
    final addlLocal = ref.watch(additionalInfoProvider);
    final addlRemote = await ref.watch(currentAdditionalInfoProvider.future);
    final double? target = addlRemote?.targetWeight ?? addlLocal.targetWeight;
    if (target == null) {
      if (kDebugMode) {
        print('[progressSeries] target is null -> returning empty');
      }
      return const <double>[];
    }

    // baseline
    double? startWeight = addlRemote?.weight ?? addlLocal.weight;
    try {
      final now = DateTime.now();
      final earliest = await uc.execute(
        startIso: _ymd(now.subtract(const Duration(days: 730))),
        endIso: _ymd(now),
      );
      if (earliest.isNotEmpty) {
        earliest.sort((a, b) => a.date.compareTo(b.date));
        startWeight = earliest.first.weightKg;
      }
    } catch (_) {}

    final latest = await ref.watch(latestWeightProvider.future);
    final double? current =
        latest?.weightKg ?? addlRemote?.weight ?? addlLocal.weight;
    if (startWeight == null || current == null) {
      if (kDebugMode) {
        print('[progressSeries] missing start/current -> returning empty (start=$startWeight, current=$current)');
      }
      return const <double>[];
    }

    final startDist = (startWeight - target).abs();
    if (startDist < 1e-6) {
      const threshold = 1.0; // kg
      final startP = (startWeight - target).abs() <= threshold ? 1.0 : 0.0;
      final currP = (current - target).abs() <= threshold ? 1.0 : 0.0;
      if (kDebugMode) {
        print('[progressSeries] synthetic (threshold) start=$startWeight current=$current target=$target -> [$startP,$currP]');
      }
      return [startP, currP];
    }
    final startP = 0.0; // progress at baseline is zero by definition
    final currentDist = (current - target).abs();
    final currP = ((startDist - currentDist) / startDist).clamp(0.0, 1.0);
    if (kDebugMode) {
      print('[progressSeries] synthetic start=$startWeight current=$current target=$target -> [$startP,$currP]');
    }
    return [startP, currP];
  }

  // Sort by date and extract weights
  entries.sort((a, b) => a.date.compareTo(b.date));
  final weights = entries.map((e) => e.weightKg).toList();

  // Determine target weight
  final addlLocal = ref.watch(additionalInfoProvider);
  final addlRemote = await ref.watch(currentAdditionalInfoProvider.future);
  final double? target = addlRemote?.targetWeight ?? addlLocal.targetWeight;
  if (target == null) {
    // Without a target weight we cannot compute goal progress; return 0s.
    if (kDebugMode) {
      print('[progressSeries] target null -> zeros, len=${weights.length}');
    }
    return List<double>.filled(weights.length, 0.0);
  }

  // Baseline: earliest entry available in the last ~2 years (global),
  // so progress reflects real journey even if the selected range has few points
  double? startWeight = addlRemote?.weight ?? addlLocal.weight;
  try {
    final now = DateTime.now();
    final earliest = await uc.execute(
      startIso: _ymd(now.subtract(const Duration(days: 730))),
      endIso: _ymd(now),
    );
    if (earliest.isNotEmpty) {
      earliest.sort((a, b) => a.date.compareTo(b.date));
      startWeight = earliest.first.weightKg;
    }
  } catch (_) {}
  startWeight ??= (weights.isNotEmpty ? weights.first : null);
  if (startWeight == null) {
    // No baseline at all; cannot compute progress, return zeros for the series length
    if (kDebugMode) {
      print('[progressSeries] startWeight null -> zeros, len=${weights.length}');
    }
    return List<double>.filled(weights.length, 0.0);
  }

  // If there is only a single entry in the selected range, prefer an
  // alternative baseline from additional info when it is clearly farther from
  // the target than the single point. This yields a meaningful non-zero
  // progress when the user just started logging.
  if (weights.length == 1) {
    final alt = addlRemote?.weight ?? addlLocal.weight;
    if (alt != null) {
      final altDist = (alt - target).abs();
      final currDist = (weights.first - target).abs();
      if (altDist > currDist + 0.1) {
        startWeight = alt;
      }
    }
  }

  final startDist = (startWeight - target).abs();
  if (startDist < 1e-6) {
    const threshold = 1.0; // kg
    final out = weights.map((w) => (w - target).abs() <= threshold ? 1.0 : 0.0).toList();
    if (kDebugMode) {
      print('[progressSeries] startDist≈0 start=$startWeight target=$target -> $out');
    }
    return out;
  }

  // If only one value and baseline equals that value, fall back to
  // "closeness-to-target" so the user sees a meaningful point.
  if (weights.length == 1 && (startWeight - weights.first).abs() < 1e-6) {
    final w = weights.first;
    final denom = [w.abs(), target.abs(), 1.0].reduce((a, b) => a > b ? a : b);
    final closeness = (1.0 - ((w - target).abs() / denom)).clamp(0.0, 1.0);
    final out = [0.0, closeness];
    if (kDebugMode) {
      print('[progressSeries] single-entry fallback start=$startWeight w=${weights.first} target=$target -> $out');
    }
    return out;
  }

  final out = weights
      .map((w) {
        final remaining = (w - target).abs();
        final p = ((startDist - remaining) / startDist).clamp(0.0, 1.0);
        return p;
      })
      .toList();
  if (kDebugMode) {
    print('[progressSeries] computed start=$startWeight target=$target weights=$weights -> $out');
  }
  return out;
});

// Raw weight series (kg) for the selected range
final weightSeriesKgProvider =
    FutureProvider.family<List<double>, int>((ref, index) async {
  final uc = ref.watch(getWeightRangeUseCaseProvider);
  final range = _progressRangeIso(index);
  final entries =
      await uc.execute(startIso: range.startIso, endIso: range.endIso);
  if (entries.isEmpty) {
    // Fallback to a single current point so the chart can still render
    final addlLocal = ref.watch(additionalInfoProvider);
    final addlRemote = await ref.watch(currentAdditionalInfoProvider.future);
    final latest = await ref.watch(latestWeightProvider.future);
    final w = latest?.weightKg ?? addlRemote?.weight ?? addlLocal.weight;
    return w != null ? <double>[w] : const <double>[];
  }
  entries.sort((a, b) => a.date.compareTo(b.date));
  return entries.map((e) => e.weightKg).toList();
});

// Goal achieved percent for header chip (0..100)
// Uses only current weight and target weight to show closeness to goal.
final goalAchievedPercentProvider =
    FutureProvider.family<double, int>((ref, _indexUnused) async {
  final addlLocal = ref.watch(additionalInfoProvider);
  final addlRemote = await ref.watch(currentAdditionalInfoProvider.future);
  
  // Target weight is required to define the goal direction
  final double? target = addlRemote?.targetWeight ?? addlLocal.targetWeight;
  if (target == null) {
    if (kDebugMode) print('[goalPercent] target null -> 0');
    return 0.0;
  }

  // Determine current from 2-year range first to avoid null latest
  double? current;
  try {
    final uc = ref.watch(getWeightRangeUseCaseProvider);
    final now = DateTime.now();
    final entries = await uc.execute(
      startIso: _ymd(now.subtract(const Duration(days: 730))),
      endIso: _ymd(now),
    );
    if (entries.isNotEmpty) {
      entries.sort((a, b) => a.date.compareTo(b.date));
      current = entries.last.weightKg;
    }
  } catch (_) {}
  current ??= (await ref.watch(latestWeightProvider.future))?.weightKg ??
      addlRemote?.weight ?? addlLocal.weight;
  if (current == null) {
    if (kDebugMode) print('[goalPercent] current null -> 0');
    return 0.0;
  }

  // Closeness to target: independent from a baseline, so it works with a
  // single measurement too.
  final distance = (current - target).abs();
  final denom = [target.abs(), current.abs(), 1.0].reduce((a, b) => a > b ? a : b);
  final closeness = 1.0 - (distance / denom);
  final pct = (closeness.clamp(0.0, 1.0)) * 100.0;
  final res = double.parse(pct.toStringAsFixed(1));
  if (kDebugMode) {
    print('[goalPercent] target=$target current=$current -> $res%');
  }
  return res;
});

void refreshWeightAnalytics(WidgetRef ref) {
  ref.invalidate(latestWeightProvider);
  for (final i in [0, 1, 2, 3]) {
    ref.invalidate(weightSeriesKgProvider(i));
    ref.invalidate(weightProgressSeriesProvider(i));
    ref.invalidate(goalAchievedPercentProvider(i));
  }
}
