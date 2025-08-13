class IngredientEntity {
  final String name;
  final int calories;
  final int proteinGrams;
  final int fatGrams;
  final int carbsGrams;

  const IngredientEntity({
    required this.name,
    required this.calories,
    required this.proteinGrams,
    required this.fatGrams,
    required this.carbsGrams,
  });

  factory IngredientEntity.fromJson(Map<String, dynamic> json) {
    return IngredientEntity(
      name: (json['name'] ?? '').toString(),
      calories: _toInt(json['calories']),
      proteinGrams: _toInt(json['proteinGrams']),
      fatGrams: _toInt(json['fatGrams']),
      carbsGrams: _toInt(json['carbsGrams']),
    );
  }

  static int _toInt(dynamic v) {
    if (v is int) return v;
    if (v is double) return v.round();
    return int.tryParse(v?.toString() ?? '0') ?? 0;
  }
}

class FoodAnalysisEntity {
  final String title;
  final int calories;
  final int portions;
  final int proteinGrams;
  final int fatGrams;
  final int carbsGrams;
  final int healthScore; // 0..10
  final List<IngredientEntity> ingredients;

  const FoodAnalysisEntity({
    required this.title,
    required this.calories,
    required this.portions,
    required this.proteinGrams,
    required this.fatGrams,
    required this.carbsGrams,
    required this.healthScore,
    required this.ingredients,
  });

  factory FoodAnalysisEntity.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>? ?? json;
    final ingredientsJson = data['ingredients'] as List<dynamic>? ?? const [];
    return FoodAnalysisEntity(
      title: (data['title'] ?? '').toString(),
      calories: IngredientEntity._toInt(data['calories']),
      portions: IngredientEntity._toInt(data['portions'] ?? 1),
      proteinGrams: IngredientEntity._toInt(data['proteinGrams']),
      fatGrams: IngredientEntity._toInt(data['fatGrams']),
      carbsGrams: IngredientEntity._toInt(data['carbsGrams']),
      healthScore: IngredientEntity._toInt(data['healthScore']),
      ingredients: ingredientsJson
          .map((e) => IngredientEntity.fromJson(
              e is Map<String, dynamic> ? e : <String, dynamic>{}))
          .toList(),
    );
  }
}
