import '../../domain/entities/weight_entry.dart';
import '../../domain/repositories/weight_repository.dart';
import '../datasources/weight_remote_data_source.dart';

class WeightRepositoryImpl implements WeightRepository {
  final WeightRemoteDataSource remote;
  WeightRepositoryImpl(this.remote);

  @override
  Future<WeightEntryEntity?> getLatest() => remote.getLatest();

  @override
  Future<List<WeightEntryEntity>> getRange({
    required String startIso,
    required String endIso,
  }) => remote.getRange(startIso: startIso, endIso: endIso);

  @override
  Future<WeightEntryEntity> upsert({
    required String dateIso,
    required double weightKg,
  }) => remote.upsert(dateIso: dateIso, weightKg: weightKg);
}
