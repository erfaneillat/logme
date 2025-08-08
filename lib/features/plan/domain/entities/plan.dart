class PlanEntity {
  final int calories;
  final int carbsGrams;
  final int proteinGrams;
  final int fatsGrams;
  final int healthScore; // 0..10
  final double? targetChangeLbs; // negative = lose, positive = gain
  final DateTime? targetDate;
  final int? maintenanceCalories;
  final int? calorieDeficit; // positive for loss, negative for gain
  final String? dailyGoal; // lose_weight | gain_weight | maintain_weight

  const PlanEntity({
    required this.calories,
    required this.carbsGrams,
    required this.proteinGrams,
    required this.fatsGrams,
    required this.healthScore,
    this.targetChangeLbs,
    this.targetDate,
    this.maintenanceCalories,
    this.calorieDeficit,
    this.dailyGoal,
  });

  factory PlanEntity.fromJson(Map<String, dynamic> json) {
    final plan = json['plan'] is Map<String, dynamic>
        ? json['plan'] as Map<String, dynamic>
        : json;
    return PlanEntity(
      calories: (plan['calories'] as num).toInt(),
      carbsGrams: (plan['carbsGrams'] as num).toInt(),
      proteinGrams: (plan['proteinGrams'] as num).toInt(),
      fatsGrams: (plan['fatsGrams'] as num).toInt(),
      healthScore: (plan['healthScore'] as num).toInt(),
      targetChangeLbs: plan['targetChangeLbs'] != null
          ? (plan['targetChangeLbs'] as num).toDouble()
          : null,
      targetDate: plan['targetDateIso'] != null
          ? DateTime.tryParse(plan['targetDateIso'] as String)
          : null,
      maintenanceCalories: plan['maintenanceCalories'] == null
          ? null
          : (plan['maintenanceCalories'] as num).toInt(),
      calorieDeficit: plan['calorieDeficit'] == null
          ? null
          : (plan['calorieDeficit'] as num).toInt(),
      dailyGoal: plan['dailyGoal'] as String?,
    );
  }
}

