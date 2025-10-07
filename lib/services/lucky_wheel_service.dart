import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_service.dart';
import 'api_service_provider.dart';
import '../config/api_config.dart';

class LuckyWheelService {
  final ApiService _apiService;

  LuckyWheelService(this._apiService);

  /// Log when a user views the lucky wheel
  Future<Map<String, dynamic>> logLuckyWheelView() async {
    try {
      final response = await _apiService.post<Map<String, dynamic>>(
        ApiConfig.luckyWheelView,
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  /// Get lucky wheel view history for a user
  Future<Map<String, dynamic>> getLuckyWheelHistory({
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        ApiConfig.luckyWheelHistory,
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  /// Get lucky wheel statistics for a user
  Future<Map<String, dynamic>> getLuckyWheelStats() async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        ApiConfig.luckyWheelStats,
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }
}

// Provider for LuckyWheelService
final luckyWheelServiceProvider = Provider<LuckyWheelService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return LuckyWheelService(apiService);
});
