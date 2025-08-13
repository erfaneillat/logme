import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../entities/food_analysis.dart';
import '../repositories/food_repository.dart';
import '../../data/repositories/food_repository_impl.dart';

class AnalyzeFoodImageUseCase {
  final FoodRepository repository;
  AnalyzeFoodImageUseCase(this.repository);

  Future<FoodAnalysisEntity> call({
    required String filePath,
    String fileName = 'image.jpg',
  }) {
    return repository.analyzeImage(filePath: filePath, fileName: fileName);
  }
}

final analyzeFoodImageUseCaseProvider =
    Provider<AnalyzeFoodImageUseCase>((ref) {
  final repo = ref.read(foodRepositoryProvider);
  return AnalyzeFoodImageUseCase(repo);
});
