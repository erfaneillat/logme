import '../entities/plan.dart';

abstract class PlanRepository {
  Future<PlanEntity> fetchLatestPlan();
  Future<PlanEntity> updatePlanManual({
    required int calories,
    required int proteinGrams,
    required int carbsGrams,
    required int fatsGrams,
  });
}

