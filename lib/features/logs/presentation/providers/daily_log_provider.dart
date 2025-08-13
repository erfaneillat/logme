import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:shamsi_date/shamsi_date.dart';

import '../../../home/presentation/providers/home_date_provider.dart';
import '../../data/datasources/logs_remote_data_source.dart';
import '../../domain/entities/daily_log.dart';

class DailyLogViewState {
  final AsyncValue<DailyLogEntity> log;
  final int pendingCount;

  const DailyLogViewState({
    required this.log,
    required this.pendingCount,
  });

  const DailyLogViewState.initial()
      : log = const AsyncValue.loading(),
        pendingCount = 0;

  DailyLogViewState copyWith({
    AsyncValue<DailyLogEntity>? log,
    int? pendingCount,
  }) {
    return DailyLogViewState(
      log: log ?? this.log,
      pendingCount: pendingCount ?? this.pendingCount,
    );
  }
}

class DailyLogController extends StateNotifier<DailyLogViewState> {
  final Ref ref;
  DailyLogController(this.ref) : super(const DailyLogViewState.initial()) {
    // Fetch initially for current selected date
    _fetchForSelectedDate();

    // React to date changes
    ref.listen<Jalali>(selectedJalaliDateProvider, (prev, next) {
      _fetchForSelectedDate();
    });
  }

  void addPendingPlaceholder() {
    state = state.copyWith(pendingCount: state.pendingCount + 1);
  }

  void clearPendingPlaceholders() {
    if (state.pendingCount == 0) return;
    state = state.copyWith(pendingCount: 0);
  }

  Future<void> refresh() async {
    await _fetchForSelectedDate();
    clearPendingPlaceholders();
  }

  Future<void> _fetchForSelectedDate() async {
    final selected = ref.read(selectedJalaliDateProvider);
    final yyyyMmDd = _toIsoDateFromJalali(selected);
    await fetchForDate(yyyyMmDd);
  }

  Future<void> fetchForDate(String yyyyMmDd) async {
    final logsRemote = ref.read(logsRemoteDataSourceProvider);
    state = state.copyWith(log: const AsyncValue.loading());
    try {
      final log = await logsRemote.getDailyLog(yyyyMmDd);
      state = state.copyWith(log: AsyncValue.data(log));
    } catch (e, st) {
      state = state.copyWith(log: AsyncValue.error(e, st));
    }
  }

  String _toIsoDateFromJalali(Jalali d) {
    final g = d.toGregorian();
    final mm = g.month.toString().padLeft(2, '0');
    final dd = g.day.toString().padLeft(2, '0');
    return '${g.year}-$mm-$dd';
  }
}

final dailyLogControllerProvider =
    StateNotifierProvider.autoDispose<DailyLogController, DailyLogViewState>(
        (ref) {
  return DailyLogController(ref);
});
