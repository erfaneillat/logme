import '../entities/weight_entry.dart';
import '../repositories/weight_repository.dart';

class GetLatestWeightUseCase {
  final WeightRepository repository;
  GetLatestWeightUseCase(this.repository);

  Future<WeightEntryEntity?> execute() => repository.getLatest();
}
