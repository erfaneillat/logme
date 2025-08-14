import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../../services/api_service_provider.dart';
import '../../../../config/api_config.dart';
import '../../domain/entities/daily_log.dart';

class LogsRemoteDataSource {
  final ProviderRef ref;
  LogsRemoteDataSource(this.ref);

  Future<DailyLogEntity> getDailyLog(String yyyyMmDd) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api
        .get<Map<String, dynamic>>(ApiConfig.logsDaily, queryParameters: {
      'date': yyyyMmDd,
    });
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    final logJson = data['log'] as Map<String, dynamic>? ?? data;
    return DailyLogEntity.fromJson(logJson);
  }

  Future<DailyLogEntity> upsertDailyLog(DailyLogEntity log) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api.post<Map<String, dynamic>>(
      ApiConfig.logsDaily,
      data: {
        'date': log.date,
        'caloriesConsumed': log.caloriesConsumed,
        'carbsGrams': log.carbsGrams,
        'proteinGrams': log.proteinGrams,
        'fatsGrams': log.fatsGrams,
      },
    );
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    final logJson = data['log'] as Map<String, dynamic>? ?? data;
    return DailyLogEntity.fromJson(logJson);
  }

  Future<void> toggleItemLike({
    required String dateIso,
    required String itemId,
    required bool liked,
  }) async {
    final api = ref.read(apiServiceProvider);
    await api.patch<Map<String, dynamic>>(
      '${ApiConfig.logsDaily}/item/like',
      data: {
        'date': dateIso,
        'itemId': itemId,
        'liked': liked,
      },
    );
  }
}

final logsRemoteDataSourceProvider = Provider<LogsRemoteDataSource>((ref) {
  return LogsRemoteDataSource(ref);
});
