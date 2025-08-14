import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../entities/daily_log.dart';
import '../repositories/logs_repository.dart';
import 'package:cal_ai/features/logs/data/repositories/logs_repository_impl.dart';
import 'package:cal_ai/features/food_recognition/domain/entities/food_analysis.dart';

class AddLogItemParams {
  final String dateIso;
  final String title;
  final int calories;
  final int carbsGrams;
  final int proteinGrams;
  final int fatsGrams;
  final int portions;
  final int? healthScore;
  final String? imageUrl;
  final List<IngredientEntity> ingredients;
  final bool liked;

  const AddLogItemParams({
    required this.dateIso,
    required this.title,
    required this.calories,
    required this.carbsGrams,
    required this.proteinGrams,
    required this.fatsGrams,
    required this.portions,
    this.healthScore,
    this.imageUrl,
    this.ingredients = const [],
    this.liked = false,
  });
}

class AddLogItemUseCase {
  final LogsRepository repository;
  const AddLogItemUseCase(this.repository);

  Future<DailyLogItemEntity> call(AddLogItemParams params) {
    return repository.addItem(
      dateIso: params.dateIso,
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

final addLogItemUseCaseProvider = Provider<AddLogItemUseCase>((ref) {
  return AddLogItemUseCase(ref.read(logsRepositoryProvider));
});
