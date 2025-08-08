enum Gender { male, female, other }

class AdditionalInfo {
  final String? gender;
  final DateTime? birthDate;
  final int? age;
  final double? weight; // in kg
  final double? height; // in cm
  final String? activityLevel;
  final String? weightGoal;
  final String? workoutFrequency;
  final double? targetWeight; // in kg
  final double? weightLossSpeed; // in kg per week

  const AdditionalInfo({
    this.gender,
    this.birthDate,
    this.age,
    this.weight,
    this.height,
    this.activityLevel,
    this.weightGoal,
    this.workoutFrequency,
    this.targetWeight,
    this.weightLossSpeed,
  });

  AdditionalInfo copyWith({
    String? gender,
    DateTime? birthDate,
    int? age,
    double? weight,
    double? height,
    String? activityLevel,
    String? weightGoal,
    String? workoutFrequency,
    double? targetWeight,
    double? weightLossSpeed,
  }) {
    return AdditionalInfo(
      gender: gender ?? this.gender,
      birthDate: birthDate ?? this.birthDate,
      age: age ?? this.age,
      weight: weight ?? this.weight,
      height: height ?? this.height,
      activityLevel: activityLevel ?? this.activityLevel,
      weightGoal: weightGoal ?? this.weightGoal,
      workoutFrequency: workoutFrequency ?? this.workoutFrequency,
      targetWeight: targetWeight ?? this.targetWeight,
      weightLossSpeed: weightLossSpeed ?? this.weightLossSpeed,
    );
  }

  Map<String, dynamic> toJson() => {
        'gender': gender,
        'birthDate': birthDate?.toIso8601String(),
        'age': age,
        'weight': weight,
        'height': height,
        'activityLevel': activityLevel,
        'weightGoal': weightGoal,
        'workoutFrequency': workoutFrequency,
        'targetWeight': targetWeight,
        'weightLossSpeed': weightLossSpeed,
      };

  factory AdditionalInfo.fromJson(Map<String, dynamic> json) => AdditionalInfo(
        gender: json['gender'],
        birthDate: json['birthDate'] != null
            ? DateTime.parse(json['birthDate'])
            : null,
        age: json['age'],
        weight: json['weight']?.toDouble(),
        height: json['height']?.toDouble(),
        activityLevel: json['activityLevel'],
        weightGoal: json['weightGoal'],
        workoutFrequency: json['workoutFrequency'],
        targetWeight: json['targetWeight']?.toDouble(),
        weightLossSpeed: json['weightLossSpeed']?.toDouble(),
      );

  bool get isComplete {
    final bool baseComplete = gender != null &&
        birthDate != null &&
        weight != null &&
        height != null &&
        activityLevel != null &&
        weightGoal != null &&
        workoutFrequency != null &&
        targetWeight != null;

    // Require speed for both lose and gain goals
    if (weightGoal == 'lose_weight' || weightGoal == 'gain_weight') {
      return baseComplete && weightLossSpeed != null;
    }
    return baseComplete;
  }

  @override
  String toString() =>
      'AdditionalInfo(gender: $gender, birthDate: $birthDate, age: $age, weight: $weight, height: $height, activityLevel: $activityLevel, weightGoal: $weightGoal, workoutFrequency: $workoutFrequency, targetWeight: $targetWeight, weightLossSpeed: $weightLossSpeed)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is AdditionalInfo &&
        other.gender == gender &&
        other.birthDate == birthDate &&
        other.age == age &&
        other.weight == weight &&
        other.height == height &&
        other.activityLevel == activityLevel &&
        other.weightGoal == weightGoal &&
        other.workoutFrequency == workoutFrequency &&
        other.targetWeight == targetWeight &&
        other.weightLossSpeed == weightLossSpeed;
  }

  @override
  int get hashCode =>
      gender.hashCode ^
      birthDate.hashCode ^
      age.hashCode ^
      weight.hashCode ^
      height.hashCode ^
      activityLevel.hashCode ^
      weightGoal.hashCode ^
      workoutFrequency.hashCode ^
      targetWeight.hashCode ^
      weightLossSpeed.hashCode;
}
