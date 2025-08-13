import '../entities/food_analysis.dart';

abstract class FoodRepository {
  Future<FoodAnalysisEntity> analyzeImage({
    required String filePath,
    String fileName,
    String? targetDateIso,
  });
}
