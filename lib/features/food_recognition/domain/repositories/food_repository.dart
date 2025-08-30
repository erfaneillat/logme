import '../entities/food_analysis.dart';
import '../../../../core/network/cancellation.dart';

abstract class FoodRepository {
  Future<FoodAnalysisEntity> analyzeImage({
    required String filePath,
    String fileName,
    String? targetDateIso,
    CancellationToken? cancellationToken,
  });
  
  Future<FoodAnalysisEntity> analyzeFoodDescription({
    required String description,
    String? targetDateIso,
    CancellationToken? cancellationToken,
  });
}
