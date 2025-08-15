import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../entities/food_analysis.dart';
import '../repositories/food_repository.dart';
import '../../data/repositories/food_repository_impl.dart';
import '../../../../core/network/cancellation.dart';

class AnalyzeFoodImageUseCase {
  final FoodRepository repository;
  AnalyzeFoodImageUseCase(this.repository);

  Future<FoodAnalysisEntity> call({
    required String filePath,
    String fileName = 'image.jpg',
    String? targetDateIso,
    CancellationToken? cancellationToken,
  }) {
    return repository.analyzeImage(
      filePath: filePath,
      fileName: fileName,
      targetDateIso: targetDateIso,
      cancellationToken: cancellationToken,
    );
  }
}

final analyzeFoodImageUseCaseProvider =
    Provider<AnalyzeFoodImageUseCase>((ref) {
  final repo = ref.read(foodRepositoryProvider);
  return AnalyzeFoodImageUseCase(repo);
});
