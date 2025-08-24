import 'package:hooks_riverpod/hooks_riverpod.dart';
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
  for (final log in logs) {
    final dt = DateTime.parse(log.date);
    final weekdayIndex = (dt.weekday) % 7; // Sun=0
    series[weekdayIndex] = log.carbsGrams;
  }
  return series;
});

final weeklyProteinSeriesProvider =
    FutureProvider.family<List<int>, int>((ref, index) async {
  final logs = await ref.watch(weeklyLogsProvider(index).future);
  final series = List<int>.filled(7, 0);
  for (final log in logs) {
    final dt = DateTime.parse(log.date);
    final weekdayIndex = (dt.weekday) % 7;
    series[weekdayIndex] = log.proteinGrams;
  }
  return series;
});

final weeklyFatsSeriesProvider =
    FutureProvider.family<List<int>, int>((ref, index) async {
  final logs = await ref.watch(weeklyLogsProvider(index).future);
  final series = List<int>.filled(7, 0);
  for (final log in logs) {
    final dt = DateTime.parse(log.date);
    final weekdayIndex = (dt.weekday) % 7;
    series[weekdayIndex] = log.fatsGrams;
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
  if (entries.isEmpty) return const <double>[];
  // Sort by date
  entries.sort((a, b) => a.date.compareTo(b.date));
  final weights = entries.map((e) => e.weightKg).toList();
  final minW = weights.reduce((a, b) => a < b ? a : b);
  final maxW = weights.reduce((a, b) => a > b ? a : b);
  if ((maxW - minW).abs() < 1e-6) {
    return List<double>.filled(weights.length, 0.5);
  }
  return weights.map((w) => (w - minW) / (maxW - minW)).toList();
});

// Goal achieved percent for header chip (0..100)
// Uses only current weight and target weight to show closeness to goal.
final goalAchievedPercentProvider =
    FutureProvider.family<double, int>((ref, _indexUnused) async {
  final addlLocal = ref.watch(additionalInfoProvider);
  final addlRemote = await ref.watch(currentAdditionalInfoProvider.future);
  final target = addlRemote?.targetWeight ?? addlLocal.targetWeight;
  if (target == null) {
    return 0.0;
  }

  // Current weight from latest entry or additional info
  final latest = await ref.watch(latestWeightProvider.future);
  final current = latest?.weightKg ?? addlRemote?.weight ?? addlLocal.weight;
  if (current == null) {
    return 0.0;
  }

  final distance = (current - target).abs();
  final denom = target.abs() < 1e-6 && current.abs() < 1e-6
      ? 1.0
      : (target.abs() > current.abs() ? target.abs() : current.abs());
  final closeness = 1.0 - (distance / denom);
  final pct = (closeness.clamp(0.0, 1.0)) * 100.0;

  return double.parse(pct.toStringAsFixed(1));
});
