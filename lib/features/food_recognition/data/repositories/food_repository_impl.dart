import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../domain/entities/food_analysis.dart';
import '../../domain/repositories/food_repository.dart';
import '../datasources/food_remote_data_source.dart';

class FoodRepositoryImpl implements FoodRepository {
  final FoodRemoteDataSource remote;
  FoodRepositoryImpl(this.remote);

  @override
  Future<FoodAnalysisEntity> analyzeImage({
    required String filePath,
    String fileName = 'image.jpg',
  }) {
    return remote.analyzeImage(filePath: filePath, fileName: fileName);
  }
}

final foodRepositoryProvider = Provider<FoodRepository>((ref) {
  final remote = ref.read(foodRemoteDataSourceProvider);
  return FoodRepositoryImpl(remote);
});
