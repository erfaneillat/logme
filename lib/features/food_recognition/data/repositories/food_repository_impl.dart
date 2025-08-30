import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../../core/network/cancellation.dart';
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
    String? targetDateIso,
    CancellationToken? cancellationToken,
  }) {
    return remote.analyzeImage(
      filePath: filePath,
      fileName: fileName,
      targetDateIso: targetDateIso,
      cancelToken: cancellationToken?.dioToken,
    );
  }
  
  @override
  Future<FoodAnalysisEntity> analyzeFoodDescription({
    required String description,
    String? targetDateIso,
    CancellationToken? cancellationToken,
  }) {
    return remote.analyzeFoodDescription(
      description: description,
      targetDateIso: targetDateIso,
      cancelToken: cancellationToken?.dioToken,
    );
  }
}

final foodRepositoryProvider = Provider<FoodRepository>((ref) {
  final remote = ref.read(foodRemoteDataSourceProvider);
  return FoodRepositoryImpl(remote);
});
