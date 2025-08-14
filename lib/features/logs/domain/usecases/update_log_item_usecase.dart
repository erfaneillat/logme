import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../entities/daily_log.dart';
import '../repositories/logs_repository.dart';
import 'package:cal_ai/features/logs/data/repositories/logs_repository_impl.dart';
import 'package:cal_ai/features/food_recognition/domain/entities/food_analysis.dart';

class UpdateLogItemParams {
  final String dateIso;
  final String itemId;
  final String title;
  final int calories;
  final int carbsGrams;
  final int proteinGrams;
  final int fatsGrams;
  final int? portions;
  final int? healthScore;
  final String? imageUrl;
  final List<IngredientEntity>? ingredients;
  final bool? liked;

  const UpdateLogItemParams({
    required this.dateIso,
    required this.itemId,
    required this.title,
    required this.calories,
    required this.carbsGrams,
    required this.proteinGrams,
    required this.fatsGrams,
    this.portions,
    this.healthScore,
    this.imageUrl,
    this.ingredients,
    this.liked,
  });
}

class UpdateLogItemUseCase {
  final LogsRepository repository;
  const UpdateLogItemUseCase(this.repository);

  Future<DailyLogItemEntity> call(UpdateLogItemParams params) {
    return repository.updateItem(
      dateIso: params.dateIso,
      itemId: params.itemId,
      title: params.title,
      calories: params.calories,
      carbsGrams: params.carbsGrams,
      proteinGrams: params.proteinGrams,
      fatsGrams: params.fatsGrams,
      portions: params.portions,
      healthScore: params.healthScore,
      imageUrl: params.imageUrl,
      ingredients: params.ingredients,
      liked: params.liked,
    );
  }
}

final updateLogItemUseCaseProvider = Provider<UpdateLogItemUseCase>((ref) {
  return UpdateLogItemUseCase(ref.read(logsRepositoryProvider));
});
