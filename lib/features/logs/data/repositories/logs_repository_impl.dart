import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../domain/repositories/logs_repository.dart';
import '../../domain/entities/daily_log.dart';
import '../datasources/logs_remote_data_source.dart';
import 'package:cal_ai/features/food_recognition/domain/entities/food_analysis.dart';

class LogsRepositoryImpl implements LogsRepository {
  final Ref ref;
  LogsRepositoryImpl(this.ref);

  LogsRemoteDataSource get _remote => ref.read(logsRemoteDataSourceProvider);

  @override
  Future<DailyLogEntity> getDailyLog(String yyyyMmDd) {
    return _remote.getDailyLog(yyyyMmDd);
  }

  @override
  Future<DailyLogItemEntity> addItem({
    required String dateIso,
    required String title,
    required int calories,
    required int carbsGrams,
    required int proteinGrams,
    required int fatsGrams,
    required int portions,
    int? healthScore,
    String? imageUrl,
    List<IngredientEntity> ingredients = const [],
    bool liked = false,
  }) {
    return _remote.addItem(
      dateIso: dateIso,
      title: title,
      calories: calories,
      carbsGrams: carbsGrams,
      proteinGrams: proteinGrams,
      fatsGrams: fatsGrams,
      portions: portions,
      healthScore: healthScore,
      imageUrl: imageUrl,
      ingredients: ingredients,
      liked: liked,
    );
  }

  @override
  Future<DailyLogItemEntity> updateItem({
    required String dateIso,
    required String itemId,
    required String title,
    required int calories,
    required int carbsGrams,
    required int proteinGrams,
    required int fatsGrams,
    int? portions,
    int? healthScore,
    String? imageUrl,
    List<IngredientEntity>? ingredients,
    bool? liked,
  }) {
    return _remote.updateItem(
      dateIso: dateIso,
      itemId: itemId,
      title: title,
      calories: calories,
      carbsGrams: carbsGrams,
      proteinGrams: proteinGrams,
      fatsGrams: fatsGrams,
      portions: portions,
      healthScore: healthScore,
      imageUrl: imageUrl,
      ingredients: ingredients,
      liked: liked,
    );
  }

  @override
  Future<void> deleteItem({required String dateIso, required String itemId}) {
    return _remote.deleteItem(dateIso: dateIso, itemId: itemId);
  }

  @override
  Future<void> toggleItemLike({
    required String dateIso,
    required String itemId,
    required bool liked,
  }) {
    return _remote.toggleItemLike(
        dateIso: dateIso, itemId: itemId, liked: liked);
  }
}

final logsRepositoryProvider = Provider<LogsRepository>((ref) {
  return LogsRepositoryImpl(ref);
});
