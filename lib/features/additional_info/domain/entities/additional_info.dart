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
      );

  bool get isComplete {
    return gender != null &&
        birthDate != null &&
        weight != null &&
        height != null &&
        activityLevel != null &&
        weightGoal != null &&
        workoutFrequency != null &&
        targetWeight != null;
  }

  @override
  String toString() =>
      'AdditionalInfo(gender: $gender, birthDate: $birthDate, age: $age, weight: $weight, height: $height, activityLevel: $activityLevel, weightGoal: $weightGoal, workoutFrequency: $workoutFrequency, targetWeight: $targetWeight)';

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
        other.targetWeight == targetWeight;
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
      targetWeight.hashCode;
}
