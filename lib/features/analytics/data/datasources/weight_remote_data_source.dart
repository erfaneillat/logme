import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../../services/api_service_provider.dart';
import '../../../../config/api_config.dart';
import '../../domain/entities/weight_entry.dart';

class WeightRemoteDataSource {
  final Ref ref;
  WeightRemoteDataSource(this.ref);

  Future<WeightEntryEntity?> getLatest() async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response =
        await api.get<Map<String, dynamic>>(ApiConfig.weightLatest);
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    final latest = data['latest'];
    if (latest == null) return null;
    return WeightEntryEntity.fromJson(
        latest is Map<String, dynamic> ? latest : <String, dynamic>{});
  }

  Future<List<WeightEntryEntity>> getRange({
    required String startIso,
    required String endIso,
  }) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api.get<Map<String, dynamic>>(
      ApiConfig.weightRange,
      queryParameters: {
        'start': startIso,
        'end': endIso,
      },
    );
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    final List<dynamic> arr = data['entries'] as List<dynamic>? ?? const [];
    return arr
        .map((e) => WeightEntryEntity.fromJson(
            e is Map<String, dynamic> ? e : <String, dynamic>{}))
        .toList();
  }

  Future<WeightEntryEntity> upsert({
    required String dateIso,
    required double weightKg,
  }) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api.post<Map<String, dynamic>>(
      ApiConfig.weightBase,
      data: {
        'date': dateIso,
        'weightKg': weightKg,
      },
    );
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    final entry = data['entry'] as Map<String, dynamic>? ?? data;
    return WeightEntryEntity.fromJson(entry);
  }
}

final weightRemoteDataSourceProvider = Provider<WeightRemoteDataSource>((ref) {
  return WeightRemoteDataSource(ref);
});
