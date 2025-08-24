import '../repositories/weight_repository.dart';
import '../entities/weight_entry.dart';

class UpsertWeightUseCase {
  final WeightRepository repository;
  UpsertWeightUseCase(this.repository);

  Future<WeightEntryEntity> execute({required String dateIso, required double weightKg}) {
    return repository.upsert(dateIso: dateIso, weightKg: weightKg);
  }
}
