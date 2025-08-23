import '../../domain/entities/weight_entry.dart';
import '../../domain/repositories/weight_repository.dart';

class GetWeightRangeUseCase {
  final WeightRepository repository;
  GetWeightRangeUseCase(this.repository);

  Future<List<WeightEntryEntity>> execute({
    required String startIso,
    required String endIso,
  }) => repository.getRange(startIso: startIso, endIso: endIso);
}
