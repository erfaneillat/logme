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
        'burnedCalories': log.burnedCalories,
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

  Future<void> deleteItem({
    required String dateIso,
    required String itemId,
  }) async {
    final api = ref.read(apiServiceProvider);
    await api.delete<Map<String, dynamic>>(
      '${ApiConfig.logsDaily}/item/$itemId',
      queryParameters: {
        'date': dateIso,
      },
    );
  }

  Future<DailyLogItemEntity> updateItem({
    required String dateIso,
    required String itemId,
    required String title,
    required int calories,
    required int carbsGrams,
    required int proteinGrams,
    required int fatsGrams,
    double? portions,
    int? healthScore,
    String? imageUrl,
    List<IngredientEntity>? ingredients,
    bool? liked,
  }) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api.patch<Map<String, dynamic>>(
      '${ApiConfig.logsDaily}/item/$itemId',
      data: {
        'date': dateIso,
        'title': title,
        'calories': calories,
        'carbsGrams': carbsGrams,
        'proteinGrams': proteinGrams,
        'fatsGrams': fatsGrams,
        if (portions != null) 'portions': portions,
        if (healthScore != null) 'healthScore': healthScore,
        if (imageUrl != null) 'imageUrl': imageUrl,
        if (ingredients != null)
          'ingredients': ingredients
              .map((ing) => {
                    'name': ing.name,
                    'calories': ing.calories,
                    'proteinGrams': ing.proteinGrams,
                    'fatGrams': ing.fatGrams,
                    'carbsGrams': ing.carbsGrams,
                  })
              .toList(),
        if (liked != null) 'liked': liked,
      },
    );
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    final Map<String, dynamic> itemJson =
        data['item'] as Map<String, dynamic>? ?? data;
    return DailyLogItemEntity.fromJson(itemJson);
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
    required double portions,
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
        'portions': portions,
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

  Future<Map<String, dynamic>> updateBurnedCalories({
    required String dateIso,
    required int burnedCalories,
  }) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api.patch<Map<String, dynamic>>(
      '${ApiConfig.logsDaily}/burned-calories',
      data: {
        'date': dateIso,
        'burnedCalories': burnedCalories,
      },
    );

    // Always expect log data now
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    final Map<String, dynamic> logJson =
        data['log'] as Map<String, dynamic>? ?? data;

    // Check preference status from response
    final bool preferenceEnabled = data['preferenceEnabled'] as bool? ?? true;
    final String message =
        data['message'] as String? ?? 'Exercise added successfully';

    return {
      'success': true,
      'preferenceDisabled': !preferenceEnabled,
      'burnedCalories': burnedCalories,
      'message': message,
      'log': DailyLogEntity.fromJson(logJson)
    };
  }

  Future<Map<String, dynamic>> analyzeExercise({
    required String exercise,
    required int duration,
  }) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api.post<Map<String, dynamic>>(
      '${ApiConfig.logsDaily}/analyze-exercise',
      data: {
        'exercise': exercise,
        'duration': duration,
      },
    );

    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);

    return {
      'success': true,
      'activityName': data['activityName'] as String? ?? exercise,
      'caloriesBurned': data['caloriesBurned'] as int? ?? 0,
      'duration': data['duration'] as int? ?? duration,
      'intensity': data['intensity'] as String? ?? '',
      'tips': data['tips'] as List<dynamic>? ?? [],
      'meta': response['meta'],
    };
  }
}

final logsRemoteDataSourceProvider = Provider<LogsRemoteDataSource>((ref) {
  return LogsRemoteDataSource(ref);
});
