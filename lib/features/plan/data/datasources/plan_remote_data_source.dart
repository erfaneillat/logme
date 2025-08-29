import 'package:flutter/foundation.dart';
import '../../../../services/api_service_provider.dart';
import '../../../../config/api_config.dart';
import '../../domain/entities/plan.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class PlanRemoteDataSource {
  final ProviderRef ref;
  PlanRemoteDataSource(this.ref);

  Future<PlanEntity> getLatestPlan() async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response =
        await api.get<Map<String, dynamic>>(ApiConfig.planLatest);
    if (kDebugMode) {
      // ignore: avoid_print
      print('Plan latest response: $response');
    }
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>?) ?? response;
    return PlanEntity.fromJson(data);
  }

  Future<PlanEntity> updatePlanManual({
    required int calories,
    required int proteinGrams,
    required int carbsGrams,
    required int fatsGrams,
  }) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api.patch<Map<String, dynamic>>(
      ApiConfig.planUpdateManual,
      data: {
        'calories': calories,
        'proteinGrams': proteinGrams,
        'carbsGrams': carbsGrams,
        'fatsGrams': fatsGrams,
      },
    );
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>?) ?? response;
    return PlanEntity.fromJson(data);
  }
}

final planRemoteDataSourceProvider = Provider<PlanRemoteDataSource>((ref) {
  return PlanRemoteDataSource(ref);
});

