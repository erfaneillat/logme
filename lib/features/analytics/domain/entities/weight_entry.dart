class WeightEntryEntity {
  final String date; // YYYY-MM-DD
  final double weightKg;

  const WeightEntryEntity({required this.date, required this.weightKg});

  factory WeightEntryEntity.fromJson(Map<String, dynamic> json) {
    return WeightEntryEntity(
      date: (json['date'] as String?)?.substring(0, 10) ?? '',
      weightKg: (json['weightKg'] as num?)?.toDouble() ?? 0,
    );
  }
}
