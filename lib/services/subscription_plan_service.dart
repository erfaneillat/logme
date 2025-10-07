import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_service.dart';
import 'api_service_provider.dart';
import '../config/api_config.dart';
import '../features/subscription/data/models/subscription_plan_model.dart';

class SubscriptionPlanService {
  final ApiService _apiService;

  SubscriptionPlanService(this._apiService);

  /// Get all subscription plans (optionally only active ones)
  Future<List<SubscriptionPlanModel>> getPlans({bool activeOnly = true}) async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        ApiConfig.subscriptionPlans,
        queryParameters: {
          if (activeOnly) 'activeOnly': 'true',
        },
      );

      if (response['success'] == true && response['data'] != null) {
        final plans = (response['data']['plans'] as List<dynamic>)
            .map((planJson) => SubscriptionPlanModel.fromJson(
                planJson as Map<String, dynamic>))
            .toList();
        return plans;
      }

      return [];
    } catch (e) {
      print('Error fetching subscription plans: $e');
      rethrow;
    }
  }

  /// Get a single subscription plan by ID
  Future<SubscriptionPlanModel?> getPlanById(String id) async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        '${ApiConfig.subscriptionPlans}/$id',
      );

      if (response['success'] == true && response['data'] != null) {
        return SubscriptionPlanModel.fromJson(
            response['data']['plan'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      print('Error fetching subscription plan: $e');
      rethrow;
    }
  }
}

// Provider for SubscriptionPlanService
final subscriptionPlanServiceProvider =
    Provider<SubscriptionPlanService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return SubscriptionPlanService(apiService);
});
