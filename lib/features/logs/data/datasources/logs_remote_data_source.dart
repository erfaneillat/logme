import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../../services/api_service_provider.dart';
import '../../../../config/api_config.dart';
import '../../domain/entities/daily_log.dart';
import 'package:cal_ai/features/food_recognition/domain/entities/food_analysis.dart';

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

  Future<void> removeItemFromFavorites({
    required String itemId,
  }) async {
    final api = ref.read(apiServiceProvider);
    await api.delete<Map<String, dynamic>>(
      '${ApiConfig.logsDaily}/item/$itemId/favorite',
    );
  }

  Future<List<DailyLogEntity>> getLogsRange({
    required String startIso,
    required String endIso,
  }) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api.get<Map<String, dynamic>>(
      '${ApiConfig.logsDaily}/range',
      queryParameters: {
        'start': startIso,
        'end': endIso,
      },
    );
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    final List<dynamic> logsJson = data['logs'] as List<dynamic>? ?? const [];
    return logsJson
        .map((e) => DailyLogEntity.fromJson(
            e is Map<String, dynamic> ? e : <String, dynamic>{}))
        .toList();
  }

  Future<DailyLogItemEntity> addItem({
    required String dateIso,
    required String title,
    required int calories,
    required int carbsGrams,
    required int proteinGrams,
    required int fatsGrams,
    int? healthScore,
    String? imageUrl,
    List<IngredientEntity> ingredients = const [],
    bool liked = false,
  }) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api.post<Map<String, dynamic>>(
      '${ApiConfig.logsDaily}/item',
      data: {
        'date': dateIso,
        'title': title,
        'calories': calories,
        'carbsGrams': carbsGrams,
        'proteinGrams': proteinGrams,
        'fatsGrams': fatsGrams,
        if (healthScore != null) 'healthScore': healthScore,
        if (imageUrl != null) 'imageUrl': imageUrl,
        'ingredients': ingredients
            .map((ing) => {
                  'name': ing.name,
                  'calories': ing.calories,
                  'proteinGrams': ing.proteinGrams,
                  'fatGrams': ing.fatGrams,
                  'carbsGrams': ing.carbsGrams,
                })
            .toList(),
        'liked': liked,
      },
    );
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    final Map<String, dynamic> itemJson =
        data['item'] as Map<String, dynamic>? ?? data;
    return DailyLogItemEntity.fromJson(itemJson);
  }
}

final logsRemoteDataSourceProvider = Provider<LogsRemoteDataSource>((ref) {
  return LogsRemoteDataSource(ref);
});
