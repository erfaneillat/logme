import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../entities/food_analysis.dart';
import '../repositories/food_repository.dart';
import '../../data/repositories/food_repository_impl.dart';
import '../../../../core/network/cancellation.dart';

class AnalyzeFoodTextUseCase {
  final FoodRepository repository;
  AnalyzeFoodTextUseCase(this.repository);

  Future<FoodAnalysisEntity> call({
    required String description,
    String? targetDateIso,
    CancellationToken? cancellationToken,
  }) {
    return repository.analyzeFoodDescription(
      description: description,
      targetDateIso: targetDateIso,
      cancellationToken: cancellationToken,
    );
  }
}

final analyzeFoodTextUseCaseProvider =
    Provider<AnalyzeFoodTextUseCase>((ref) {
  final repo = ref.read(foodRepositoryProvider);
  return AnalyzeFoodTextUseCase(repo);
});