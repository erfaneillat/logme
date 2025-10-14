import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../services/subscription_plan_service.dart';
import '../../../../services/api_service_provider.dart';
import '../../data/services/offer_service.dart';
import '../../data/models/offer_model.dart';

part 'subscription_provider.g.dart';

// Offer Service Provider
@riverpod
OfferService offerService(Ref ref) {
  final apiClient = ref.watch(apiServiceProvider);
  return OfferService(apiClient);
}

enum SubscriptionPlan {
  monthly,
  threeMonth,
  yearly,
}

@riverpod
class SubscriptionNotifier extends _$SubscriptionNotifier {
  @override
  SubscriptionState build() {
    // Fetch prices when the provider is initialized
    _fetchPrices();
    return const SubscriptionState(
      selectedPlan: SubscriptionPlan.yearly,
      isLoading: true,
    );
  }

  Future<void> _fetchPrices() async {
    try {
      final service = ref.read(subscriptionPlanServiceProvider);
      final apiService = ref.read(apiServiceProvider);
      final offerSvc = OfferService(apiService);
      
      // Fetch plans and offers in parallel
      final results = await Future.wait<dynamic>([
        service.getPlans(activeOnly: true),
        offerSvc.getActiveOffers(),
      ]);
      
      final plans = results[0] as List;
      final offers = results[1] as List<OfferModel>;

      // Find monthly, 3-month, and yearly plans
      final monthlyPlan = plans.where((p) => p.isMonthly).firstOrNull;
      final threeMonthPlan = plans.where((p) => p.is3Month).firstOrNull;
      final yearlyPlan = plans.where((p) => p.isYearly).firstOrNull;

      // Find the best offer for the yearly plan (highest priority)
      final yearlyOffer = _findBestOffer(offers, yearlyPlan?.id);
      
      state = state.copyWith(
        monthlyTitle: monthlyPlan?.title,
        monthlyPrice: monthlyPlan?.price,
        monthlyOriginalPrice: monthlyPlan?.originalPrice,
        monthlyDiscountPercentage: monthlyPlan?.discountPercentage,
        monthlyPricePerMonth: monthlyPlan?.pricePerMonth,
        threeMonthTitle: threeMonthPlan?.title,
        threeMonthPrice: threeMonthPlan?.price,
        threeMonthOriginalPrice: threeMonthPlan?.originalPrice,
        threeMonthDiscountPercentage: threeMonthPlan?.discountPercentage,
        threeMonthPricePerMonth: threeMonthPlan?.pricePerMonth,
        yearlyTitle: yearlyPlan?.title,
        yearlyPrice: yearlyPlan?.price,
        yearlyOriginalPrice: yearlyPlan?.originalPrice,
        yearlyDiscountPercentage: yearlyPlan?.discountPercentage,
        yearlyPricePerMonth: yearlyPlan?.pricePerMonth,
        monthlyCafebazaarProductKey: monthlyPlan?.cafebazaarProductKey,
        threeMonthCafebazaarProductKey: threeMonthPlan?.cafebazaarProductKey,
        yearlyCafebazaarProductKey: yearlyPlan?.cafebazaarProductKey,
        offers: offers,
        activeOffer: yearlyOffer,
        isLoading: false,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  void selectPlan(SubscriptionPlan plan) {
    state = state.copyWith(selectedPlan: plan);
  }

  // Refresh plans and offers (e.g., when an offer expires)
  Future<void> refresh() async {
    await _fetchPrices();
  }
  
  // Find the best offer for a plan (highest priority, currently valid)
  OfferModel? _findBestOffer(List<OfferModel> offers, String? planId) {
    if (planId == null || offers.isEmpty) return null;
    
    final applicableOffers = offers
        .where((offer) => offer.isCurrentlyValid && offer.appliesToPlan(planId))
        .toList();
    
    if (applicableOffers.isEmpty) return null;
    
    // Sort by priority (highest first)
    applicableOffers.sort((a, b) => b.priority.compareTo(a.priority));
    return applicableOffers.first;
  }
}

class SubscriptionState {
  final SubscriptionPlan selectedPlan;
  final String? monthlyTitle;
  final double? monthlyPrice;
  final double? monthlyOriginalPrice;
  final int? monthlyDiscountPercentage;
  final double? monthlyPricePerMonth;
  final String? threeMonthTitle;
  final double? threeMonthPrice;
  final double? threeMonthOriginalPrice;
  final int? threeMonthDiscountPercentage;
  final double? threeMonthPricePerMonth;
  final String? yearlyTitle;
  final double? yearlyPrice;
  final double? yearlyOriginalPrice;
  final int? yearlyDiscountPercentage;
  final double? yearlyPricePerMonth;
  final String? monthlyCafebazaarProductKey;
  final String? threeMonthCafebazaarProductKey;
  final String? yearlyCafebazaarProductKey;
  final List<OfferModel> offers;
  final OfferModel? activeOffer;
  final bool isLoading;
  final String? error;

  const SubscriptionState({
    required this.selectedPlan,
    this.monthlyTitle,
    this.monthlyPrice,
    this.monthlyOriginalPrice,
    this.monthlyDiscountPercentage,
    this.monthlyPricePerMonth,
    this.threeMonthTitle,
    this.threeMonthPrice,
    this.threeMonthOriginalPrice,
    this.threeMonthDiscountPercentage,
    this.threeMonthPricePerMonth,
    this.yearlyTitle,
    this.yearlyPrice,
    this.yearlyOriginalPrice,
    this.yearlyDiscountPercentage,
    this.yearlyPricePerMonth,
    this.monthlyCafebazaarProductKey,
    this.threeMonthCafebazaarProductKey,
    this.yearlyCafebazaarProductKey,
    this.offers = const [],
    this.activeOffer,
    this.isLoading = false,
    this.error,
  });

  SubscriptionState copyWith({
    SubscriptionPlan? selectedPlan,
    String? monthlyTitle,
    double? monthlyPrice,
    double? monthlyOriginalPrice,
    int? monthlyDiscountPercentage,
    double? monthlyPricePerMonth,
    String? threeMonthTitle,
    double? threeMonthPrice,
    double? threeMonthOriginalPrice,
    int? threeMonthDiscountPercentage,
    double? threeMonthPricePerMonth,
    String? yearlyTitle,
    double? yearlyPrice,
    double? yearlyOriginalPrice,
    int? yearlyDiscountPercentage,
    double? yearlyPricePerMonth,
    String? monthlyCafebazaarProductKey,
    String? threeMonthCafebazaarProductKey,
    String? yearlyCafebazaarProductKey,
    List<OfferModel>? offers,
    OfferModel? activeOffer,
    bool? isLoading,
    String? error,
  }) {
    return SubscriptionState(
      selectedPlan: selectedPlan ?? this.selectedPlan,
      monthlyTitle: monthlyTitle ?? this.monthlyTitle,
      monthlyPrice: monthlyPrice ?? this.monthlyPrice,
      monthlyOriginalPrice: monthlyOriginalPrice ?? this.monthlyOriginalPrice,
      monthlyDiscountPercentage:
          monthlyDiscountPercentage ?? this.monthlyDiscountPercentage,
      monthlyPricePerMonth: monthlyPricePerMonth ?? this.monthlyPricePerMonth,
      threeMonthTitle: threeMonthTitle ?? this.threeMonthTitle,
      threeMonthPrice: threeMonthPrice ?? this.threeMonthPrice,
      threeMonthOriginalPrice: threeMonthOriginalPrice ?? this.threeMonthOriginalPrice,
      threeMonthDiscountPercentage:
          threeMonthDiscountPercentage ?? this.threeMonthDiscountPercentage,
      threeMonthPricePerMonth: threeMonthPricePerMonth ?? this.threeMonthPricePerMonth,
      yearlyTitle: yearlyTitle ?? this.yearlyTitle,
      yearlyPrice: yearlyPrice ?? this.yearlyPrice,
      yearlyOriginalPrice: yearlyOriginalPrice ?? this.yearlyOriginalPrice,
      yearlyDiscountPercentage:
          yearlyDiscountPercentage ?? this.yearlyDiscountPercentage,
      yearlyPricePerMonth: yearlyPricePerMonth ?? this.yearlyPricePerMonth,
      monthlyCafebazaarProductKey:
          monthlyCafebazaarProductKey ?? this.monthlyCafebazaarProductKey,
      threeMonthCafebazaarProductKey:
          threeMonthCafebazaarProductKey ?? this.threeMonthCafebazaarProductKey,
      yearlyCafebazaarProductKey:
          yearlyCafebazaarProductKey ?? this.yearlyCafebazaarProductKey,
      offers: offers ?? this.offers,
      activeOffer: activeOffer ?? this.activeOffer,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Convenience providers
@riverpod
bool isMonthlySelected(Ref ref) {
  return ref.watch(subscriptionNotifierProvider.select(
    (state) => state.selectedPlan == SubscriptionPlan.monthly,
  ));
}

@riverpod
bool isYearlySelected(Ref ref) {
  return ref.watch(subscriptionNotifierProvider.select(
    (state) => state.selectedPlan == SubscriptionPlan.yearly,
  ));
}
