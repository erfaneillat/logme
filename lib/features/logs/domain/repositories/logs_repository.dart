import '../../domain/entities/daily_log.dart';
import 'package:cal_ai/features/food_recognition/domain/entities/food_analysis.dart';

abstract class LogsRepository {
  Future<DailyLogEntity> getDailyLog(String yyyyMmDd);
  Future<List<DailyLogEntity>> getLogsRange(
      {required String startIso, required String endIso});

  Future<DailyLogItemEntity> addItem({
    required String dateIso,
    required String title,
    required int calories,
    required int carbsGrams,
    required int proteinGrams,
    required int fatsGrams,
    required double portions,
    int? healthScore,
    String? imageUrl,
    List<IngredientEntity> ingredients,
    bool liked,
  });

  Future<DailyLogItemEntity> updateItem({
    required String dateIso,
    required String itemId,
    required String title,
    required int calories,
    required int carbsGrams,
    required int proteinGrams,
    required int fatsGrams,
    double? portions,
    int? healthScore,
    String? imageUrl,
    List<IngredientEntity>? ingredients,
    bool? liked,
  });

  Future<void> deleteItem({
    required String dateIso,
    required String itemId,
  });

  Future<void> toggleItemLike({
    required String dateIso,
    required String itemId,
    required bool liked,
  });

  Future<Map<String, dynamic>> updateBurnedCalories({
    required String dateIso,
    required int burnedCalories,
  });
}
