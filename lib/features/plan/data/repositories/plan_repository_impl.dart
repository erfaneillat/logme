import '../../domain/entities/plan.dart';
import '../../domain/repositories/plan_repository.dart';
import '../datasources/plan_remote_data_source.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class PlanRepositoryImpl implements PlanRepository {
  final PlanRemoteDataSource remote;
  PlanRepositoryImpl(this.remote);

  @override
  Future<PlanEntity> fetchLatestPlan() async {
    return remote.getLatestPlan();
  }

  @override
  Future<PlanEntity> updatePlanManual({
    required int calories,
    required int proteinGrams,
    required int carbsGrams,
    required int fatsGrams,
  }) {
    return remote.updatePlanManual(
      calories: calories,
      proteinGrams: proteinGrams,
      carbsGrams: carbsGrams,
      fatsGrams: fatsGrams,
    );
  }
}

final planRepositoryProvider = Provider<PlanRepository>((ref) {
  final remote = ref.read(planRemoteDataSourceProvider);
  return PlanRepositoryImpl(remote);
});

