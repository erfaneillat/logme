import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../services/api_service_provider.dart';
import '../../../../config/api_config.dart';
import '../../domain/entities/food_analysis.dart';
import '../exceptions/free_tier_exceptions.dart';

class FoodRemoteDataSource {
  final ProviderRef ref;
  FoodRemoteDataSource(this.ref);

  Future<FoodAnalysisEntity> analyzeImage({
    required String filePath,
    String fileName = 'image.jpg',
    String? targetDateIso,
    CancelToken? cancelToken,
  }) async {
    final api = ref.read(apiServiceProvider);
    try {
      final Map<String, dynamic> response =
          await api.uploadFile<Map<String, dynamic>>(
        ApiConfig.foodAnalyze,
        fileField: 'image',
        filePath: filePath,
        fileName: fileName,
        formData: {
          if (targetDateIso != null) 'date': targetDateIso,
        },
        options: Options(headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        }),
        cancelToken: cancelToken,
      );
      return FoodAnalysisEntity.fromJson(response);
    } on DioException catch (e) {
      if (e.response?.statusCode == 429 || e.response?.statusCode == 403) {
        final responseData = e.response?.data as Map<String, dynamic>?;
        if (responseData?['error'] == 'free_tier_limit_reached') {
          final rawMessage = responseData?['messageFa'] as String? ??
              responseData?['message'] as String? ??
              'Free tier limit reached';
          final nextResetDate =
              responseData?['nextResetDateJalaliFa'] as String? ??
                  responseData?['nextResetDate'] as String? ??
                  '';
          throw FreeTierLimitExceededException(
            message: rawMessage,
            nextResetDate: nextResetDate,
            needsSubscription: responseData?['needsSubscription'] ?? true,
          );
        }
      }
      rethrow;
    }
  }

  Future<FoodAnalysisEntity> analyzeFoodDescription({
    required String description,
    String? targetDateIso,
    CancelToken? cancelToken,
  }) async {
    final api = ref.read(apiServiceProvider);

    // Use the dedicated analyze-description endpoint
    final requestData = {
      'description': description,
      if (targetDateIso != null) 'date': targetDateIso,
    };

    try {
      final Map<String, dynamic> response =
          await api.post<Map<String, dynamic>>(
        ApiConfig.foodAnalyzeDescription,
        data: requestData,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
        cancelToken: cancelToken,
      );

      return FoodAnalysisEntity.fromJson(response);
    } on DioException catch (e) {
      if (e.response?.statusCode == 429 || e.response?.statusCode == 403) {
        final responseData = e.response?.data as Map<String, dynamic>?;
        if (responseData?['error'] == 'free_tier_limit_reached') {
          final rawMessage = responseData?['messageFa'] as String? ??
              responseData?['message'] as String? ??
              'Free tier limit reached';
          final nextResetDate =
              responseData?['nextResetDateJalaliFa'] as String? ??
                  responseData?['nextResetDate'] as String? ??
                  '';
          throw FreeTierLimitExceededException(
            message: rawMessage,
            nextResetDate: nextResetDate,
            needsSubscription: responseData?['needsSubscription'] ?? true,
          );
        }
      }
      rethrow;
    }
  }
}

final foodRemoteDataSourceProvider = Provider<FoodRemoteDataSource>((ref) {
  return FoodRemoteDataSource(ref);
});
