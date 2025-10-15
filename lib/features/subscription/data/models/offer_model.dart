class OfferPlanPricingModel {
  final String planId;
  final double? discountedPrice;
  final double? discountedPricePerMonth;

  OfferPlanPricingModel({
    required this.planId,
    this.discountedPrice,
    this.discountedPricePerMonth,
  });

  factory OfferPlanPricingModel.fromJson(Map<String, dynamic> json) {
    return OfferPlanPricingModel(
      planId: json['planId'] as String,
      discountedPrice: json['discountedPrice'] != null
          ? (json['discountedPrice'] as num).toDouble()
          : null,
      discountedPricePerMonth: json['discountedPricePerMonth'] != null
          ? (json['discountedPricePerMonth'] as num).toDouble()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'planId': planId,
      'discountedPrice': discountedPrice,
      'discountedPricePerMonth': discountedPricePerMonth,
    };
  }
}

class OfferConditionsModel {
  final int? userRegisteredWithinDays;
  final int? userRegisteredAfterDays;
  final bool? hasActiveSubscription;
  final bool? hasExpiredSubscription;
  final double? minPurchaseAmount;

  OfferConditionsModel({
    this.userRegisteredWithinDays,
    this.userRegisteredAfterDays,
    this.hasActiveSubscription,
    this.hasExpiredSubscription,
    this.minPurchaseAmount,
  });

  factory OfferConditionsModel.fromJson(Map<String, dynamic> json) {
    return OfferConditionsModel(
      userRegisteredWithinDays: json['userRegisteredWithinDays'] as int?,
      userRegisteredAfterDays: json['userRegisteredAfterDays'] as int?,
      hasActiveSubscription: json['hasActiveSubscription'] as bool?,
      hasExpiredSubscription: json['hasExpiredSubscription'] as bool?,
      minPurchaseAmount: json['minPurchaseAmount'] != null
          ? (json['minPurchaseAmount'] as num).toDouble()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userRegisteredWithinDays': userRegisteredWithinDays,
      'userRegisteredAfterDays': userRegisteredAfterDays,
      'hasActiveSubscription': hasActiveSubscription,
      'hasExpiredSubscription': hasExpiredSubscription,
      'minPurchaseAmount': minPurchaseAmount,
    };
  }
}

class OfferDisplayModel {
  final String bannerText;
  final String? bannerSubtext;
  final String backgroundColor;
  final String textColor;
  final String? badgeText;
  final String? icon;

  OfferDisplayModel({
    required this.bannerText,
    this.bannerSubtext,
    required this.backgroundColor,
    required this.textColor,
    this.badgeText,
    this.icon,
  });

  factory OfferDisplayModel.fromJson(Map<String, dynamic> json) {
    return OfferDisplayModel(
      bannerText: json['bannerText'] as String,
      bannerSubtext: json['bannerSubtext'] as String?,
      backgroundColor: json['backgroundColor'] as String? ?? '#E53935',
      textColor: json['textColor'] as String? ?? '#FFFFFF',
      badgeText: json['badgeText'] as String?,
      icon: json['icon'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bannerText': bannerText,
      'bannerSubtext': bannerSubtext,
      'backgroundColor': backgroundColor,
      'textColor': textColor,
      'badgeText': badgeText,
      'icon': icon,
    };
  }
}

class OfferModel {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final OfferDisplayModel display;
  final String offerType;
  final double? discountPercentage;
  final double? discountAmount;
  final List<OfferPlanPricingModel>? planPricing;
  final String? cafebazaarProductKey;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool isTimeLimited;
  final String targetUserType;
  final OfferConditionsModel? conditions;
  final List<String> applicablePlanIds;
  final bool applyToAllPlans;
  final int priority;
  final bool isActive;
  final int usageCount;
  final int? maxUsageLimit;
  final DateTime createdAt;
  final DateTime updatedAt;

  OfferModel({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    required this.display,
    required this.offerType,
    this.discountPercentage,
    this.discountAmount,
    this.planPricing,
    this.cafebazaarProductKey,
    this.startDate,
    this.endDate,
    required this.isTimeLimited,
    required this.targetUserType,
    this.conditions,
    required this.applicablePlanIds,
    required this.applyToAllPlans,
    required this.priority,
    required this.isActive,
    required this.usageCount,
    this.maxUsageLimit,
    required this.createdAt,
    required this.updatedAt,
  });

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    return OfferModel(
      id: json['_id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      description: json['description'] as String?,
      display: OfferDisplayModel.fromJson(json['display'] as Map<String, dynamic>),
      offerType: json['offerType'] as String,
      discountPercentage: json['discountPercentage'] != null
          ? (json['discountPercentage'] as num).toDouble()
          : null,
      discountAmount: json['discountAmount'] != null
          ? (json['discountAmount'] as num).toDouble()
          : null,
      planPricing: json['planPricing'] != null
          ? (json['planPricing'] as List<dynamic>)
              .map((e) => OfferPlanPricingModel.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
      cafebazaarProductKey: json['cafebazaarProductKey'] as String?,
      startDate: json['startDate'] != null
          ? DateTime.parse(json['startDate'] as String)
          : null,
      endDate: json['endDate'] != null
          ? DateTime.parse(json['endDate'] as String)
          : null,
      isTimeLimited: json['isTimeLimited'] as bool,
      targetUserType: json['targetUserType'] as String,
      conditions: json['conditions'] != null
          ? OfferConditionsModel.fromJson(json['conditions'] as Map<String, dynamic>)
          : null,
      applicablePlanIds: (json['applicablePlans'] as List<dynamic>)
          .map((e) => (e is Map<String, dynamic> ? e['_id'] : e) as String)
          .toList(),
      applyToAllPlans: json['applyToAllPlans'] as bool,
      priority: json['priority'] as int,
      isActive: json['isActive'] as bool,
      usageCount: json['usageCount'] as int,
      maxUsageLimit: json['maxUsageLimit'] as int?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'display': display.toJson(),
      'offerType': offerType,
      'discountPercentage': discountPercentage,
      'discountAmount': discountAmount,
      'planPricing': planPricing?.map((e) => e.toJson()).toList(),
      'cafebazaarProductKey': cafebazaarProductKey,
      'startDate': startDate?.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'isTimeLimited': isTimeLimited,
      'targetUserType': targetUserType,
      'conditions': conditions?.toJson(),
      'applicablePlans': applicablePlanIds,
      'applyToAllPlans': applyToAllPlans,
      'priority': priority,
      'isActive': isActive,
      'usageCount': usageCount,
      'maxUsageLimit': maxUsageLimit,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // Helper method to check if offer applies to a plan
  bool appliesToPlan(String planId) {
    if (applyToAllPlans) return true;
    return applicablePlanIds.contains(planId);
  }

  // Helper method to check if offer is currently valid
  bool get isCurrentlyValid {
    if (!isActive) return false;

    if (isTimeLimited) {
      final now = DateTime.now();
      if (startDate != null && now.isBefore(startDate!)) return false;
      if (endDate != null && now.isAfter(endDate!)) return false;
    }

    if (maxUsageLimit != null && usageCount >= maxUsageLimit!) return false;

    return true;
  }

  // Get time remaining until offer expires
  Duration? get timeRemaining {
    if (!isTimeLimited || endDate == null) return null;
    final now = DateTime.now();
    if (now.isAfter(endDate!)) return Duration.zero;
    return endDate!.difference(now);
  }

  // Get effective end date for new user offers
  DateTime? getEffectiveEndDate(DateTime? userCreatedAt) {
    // For time-limited offers with explicit end date
    if (isTimeLimited && endDate != null) {
      return endDate;
    }

    // For new user offers with userRegisteredWithinDays condition
    if (targetUserType == 'new' && 
        conditions?.userRegisteredWithinDays != null && 
        userCreatedAt != null) {
      return userCreatedAt.add(Duration(days: conditions!.userRegisteredWithinDays!));
    }

    return null;
  }

  // Get time remaining for new user offers
  Duration? getTimeRemainingForUser(DateTime? userCreatedAt) {
    final effectiveEndDate = getEffectiveEndDate(userCreatedAt);
    if (effectiveEndDate == null) return null;
    
    final now = DateTime.now();
    if (now.isAfter(effectiveEndDate)) return Duration.zero;
    return effectiveEndDate.difference(now);
  }

  // Calculate discounted price
  double calculateDiscountedPrice(double originalPrice) {
    if (offerType == 'percentage' && discountPercentage != null) {
      return originalPrice * (1 - discountPercentage! / 100);
    } else if (offerType == 'fixed_amount' && discountAmount != null) {
      final discounted = originalPrice - discountAmount!;
      return discounted > 0 ? discounted : 0;
    }
    return originalPrice;
  }

  @override
  String toString() {
    return 'OfferModel(id: $id, name: $name, slug: $slug, offerType: $offerType, isActive: $isActive)';
  }
}
