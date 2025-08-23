import '../entities/weight_entry.dart';

abstract class WeightRepository {
  Future<WeightEntryEntity?> getLatest();
  Future<List<WeightEntryEntity>> getRange({required String startIso, required String endIso});
  Future<WeightEntryEntity> upsert({required String dateIso, required double weightKg});
}
