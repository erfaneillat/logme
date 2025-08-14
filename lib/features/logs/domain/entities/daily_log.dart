import 'package:cal_ai/features/food_recognition/domain/entities/food_analysis.dart';

class DailyLogEntity {
  final String date; // YYYY-MM-DD
  final int caloriesConsumed;
  final int carbsGrams;
  final int proteinGrams;
  final int fatsGrams;
  final List<DailyLogItemEntity> items;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const DailyLogEntity({
    required this.date,
    required this.caloriesConsumed,
    required this.carbsGrams,
    required this.proteinGrams,
    required this.fatsGrams,
    required this.items,
    this.createdAt,
    this.updatedAt,
  });

  factory DailyLogEntity.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>? ?? const [])
        .map((e) => DailyLogItemEntity.fromJson(
            e is Map<String, dynamic> ? e : <String, dynamic>{}))
        .toList();
    DateTime? parseDt(dynamic v) {
      if (v == null) return null;
      return DateTime.tryParse(v.toString());
    }

    return DailyLogEntity(
      date: (json['date'] as String).substring(0, 10),
      caloriesConsumed: (json['caloriesConsumed'] as num? ?? 0).toInt(),
      carbsGrams: (json['carbsGrams'] as num? ?? 0).toInt(),
      proteinGrams: (json['proteinGrams'] as num? ?? 0).toInt(),
      fatsGrams: (json['fatsGrams'] as num? ?? 0).toInt(),
      items: items,
      createdAt: parseDt(json['createdAt']),
      updatedAt: parseDt(json['updatedAt']),
    );
  }
}

class DailyLogItemEntity {
  final String title;
  final int calories;
  final int carbsGrams;
  final int proteinGrams;
  final int fatsGrams;
  final int? healthScore; // optional, 0..10
  final String timeIso; // ISO timestamp
  final String? imageUrl;
  final List<IngredientEntity> ingredients;

  const DailyLogItemEntity({
    required this.title,
    required this.calories,
    required this.carbsGrams,
    required this.proteinGrams,
    required this.fatsGrams,
    this.healthScore,
    required this.timeIso,
    this.imageUrl,
    this.ingredients = const [],
  });

  factory DailyLogItemEntity.fromJson(Map<String, dynamic> json) {
    int toInt(dynamic v) =>
        v is int ? v : (v is num ? v.toInt() : int.tryParse('${v ?? 0}') ?? 0);

    final ingredientsJson = json['ingredients'] as List<dynamic>? ?? [];
    final ingredients = ingredientsJson
        .map((e) => IngredientEntity.fromJson(
            e is Map<String, dynamic> ? e : <String, dynamic>{}))
        .toList();

    return DailyLogItemEntity(
      title: (json['title'] ?? '').toString(),
      calories: toInt(json['calories']),
      carbsGrams: toInt(json['carbsGrams']),
      proteinGrams: toInt(json['proteinGrams']),
      fatsGrams: toInt(json['fatsGrams']),
      healthScore: json['healthScore'] == null
          ? null
          : toInt(json['healthScore']).clamp(0, 10),
      timeIso: (json['timeIso'] ?? '').toString(),
      imageUrl: (json['imageUrl'] as String?),
      ingredients: ingredients,
    );
  }
}
