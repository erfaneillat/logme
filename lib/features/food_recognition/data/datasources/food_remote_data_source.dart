import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../services/api_service_provider.dart';
import '../../../../config/api_config.dart';
import '../../domain/entities/food_analysis.dart';

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
  }
}

final foodRemoteDataSourceProvider = Provider<FoodRemoteDataSource>((ref) {
  return FoodRemoteDataSource(ref);
});
