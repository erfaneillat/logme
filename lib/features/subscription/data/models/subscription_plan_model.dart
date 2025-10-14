class SubscriptionPlanModel {
  final String id;
  final String name;
  final String? title;
  final String duration; // 'monthly' or 'yearly'
  final double price;
  final double? originalPrice;
  final int? discountPercentage;
  final double? pricePerMonth;
  final String? cafebazaarProductKey;
  final String? imageUrl;
  final bool isActive;
  final List<String> features;
  final int sortOrder;
  final DateTime createdAt;
  final DateTime updatedAt;

  SubscriptionPlanModel({
    required this.id,
    required this.name,
    this.title,
    required this.duration,
    required this.price,
    this.originalPrice,
    this.discountPercentage,
    this.pricePerMonth,
    this.cafebazaarProductKey,
    this.imageUrl,
    required this.isActive,
    required this.features,
    required this.sortOrder,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SubscriptionPlanModel.fromJson(Map<String, dynamic> json) {
    return SubscriptionPlanModel(
      id: json['_id'] as String,
      name: json['name'] as String,
      title: json['title'] as String?,
      duration: json['duration'] as String,
      price: (json['price'] as num).toDouble(),
      originalPrice: json['originalPrice'] != null
          ? (json['originalPrice'] as num).toDouble()
          : null,
      discountPercentage: json['discountPercentage'] as int?,
      pricePerMonth: json['pricePerMonth'] != null
          ? (json['pricePerMonth'] as num).toDouble()
          : null,
      cafebazaarProductKey: json['cafebazaarProductKey'] as String?,
      imageUrl: json['imageUrl'] as String?,
      isActive: json['isActive'] as bool,
      features:
          (json['features'] as List<dynamic>).map((e) => e as String).toList(),
      sortOrder: json['sortOrder'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'title': title,
      'duration': duration,
      'price': price,
      'originalPrice': originalPrice,
      'discountPercentage': discountPercentage,
      'pricePerMonth': pricePerMonth,
      'cafebazaarProductKey': cafebazaarProductKey,
      'imageUrl': imageUrl,
      'isActive': isActive,
      'features': features,
      'sortOrder': sortOrder,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isMonthly => duration == 'monthly';
  bool get is3Month => duration == '3month';
  bool get isYearly => duration == 'yearly';

  @override
  String toString() {
    return 'SubscriptionPlanModel(id: $id, name: $name, title: $title, duration: $duration, price: $price, cafebazaarProductKey: $cafebazaarProductKey)';
  }
}
