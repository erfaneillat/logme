import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../domain/entities/plan.dart';
import '../../data/repositories/plan_repository_impl.dart';

class PlanSummaryState {
  final bool isLoading;
  final String? error;
  final PlanEntity? plan;

  const PlanSummaryState({this.isLoading = false, this.error, this.plan});

  PlanSummaryState copyWith(
      {bool? isLoading, String? error, PlanEntity? plan}) {
    return PlanSummaryState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      plan: plan ?? this.plan,
    );
  }
}

class PlanSummaryNotifier extends StateNotifier<PlanSummaryState> {
  final Ref ref;
  PlanSummaryNotifier(this.ref)
      : super(const PlanSummaryState(isLoading: true)) {
    _load();
  }

  Future<void> _load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final repo = ref.read(planRepositoryProvider);
      final plan = await repo.fetchLatestPlan();
      state = state.copyWith(isLoading: false, plan: plan);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> refresh() async => _load();
}

final planSummaryProvider =
    StateNotifierProvider.autoDispose<PlanSummaryNotifier, PlanSummaryState>(
        (ref) {
  return PlanSummaryNotifier(ref);
});

