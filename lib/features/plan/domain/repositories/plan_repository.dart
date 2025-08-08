import '../entities/plan.dart';

abstract class PlanRepository {
  Future<PlanEntity> fetchLatestPlan();
}

