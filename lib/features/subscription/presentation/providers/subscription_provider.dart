import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../services/subscription_plan_service.dart';

part 'subscription_provider.g.dart';

enum SubscriptionPlan {
  monthly,
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
      final plans = await service.getPlans(activeOnly: true);

      // Find monthly and yearly plans
      final monthlyPlan = plans.where((p) => p.isMonthly).firstOrNull;
      final yearlyPlan = plans.where((p) => p.isYearly).firstOrNull;

      state = state.copyWith(
        monthlyPrice: monthlyPlan?.price,
        yearlyPrice: yearlyPlan?.price,
        yearlyOriginalPrice: yearlyPlan?.originalPrice,
        yearlyDiscountPercentage: yearlyPlan?.discountPercentage,
        yearlyPricePerMonth: yearlyPlan?.pricePerMonth,
        monthlyCafebazaarProductKey: monthlyPlan?.cafebazaarProductKey,
        yearlyCafebazaarProductKey: yearlyPlan?.cafebazaarProductKey,
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
}

class SubscriptionState {
  final SubscriptionPlan selectedPlan;
  final double? monthlyPrice;
  final double? yearlyPrice;
  final double? yearlyOriginalPrice;
  final int? yearlyDiscountPercentage;
  final double? yearlyPricePerMonth;
  final String? monthlyCafebazaarProductKey;
  final String? yearlyCafebazaarProductKey;
  final bool isLoading;
  final String? error;

  const SubscriptionState({
    required this.selectedPlan,
    this.monthlyPrice,
    this.yearlyPrice,
    this.yearlyOriginalPrice,
    this.yearlyDiscountPercentage,
    this.yearlyPricePerMonth,
    this.monthlyCafebazaarProductKey,
    this.yearlyCafebazaarProductKey,
    this.isLoading = false,
    this.error,
  });

  SubscriptionState copyWith({
    SubscriptionPlan? selectedPlan,
    double? monthlyPrice,
    double? yearlyPrice,
    double? yearlyOriginalPrice,
    int? yearlyDiscountPercentage,
    double? yearlyPricePerMonth,
    String? monthlyCafebazaarProductKey,
    String? yearlyCafebazaarProductKey,
    bool? isLoading,
    String? error,
  }) {
    return SubscriptionState(
      selectedPlan: selectedPlan ?? this.selectedPlan,
      monthlyPrice: monthlyPrice ?? this.monthlyPrice,
      yearlyPrice: yearlyPrice ?? this.yearlyPrice,
      yearlyOriginalPrice: yearlyOriginalPrice ?? this.yearlyOriginalPrice,
      yearlyDiscountPercentage:
          yearlyDiscountPercentage ?? this.yearlyDiscountPercentage,
      yearlyPricePerMonth: yearlyPricePerMonth ?? this.yearlyPricePerMonth,
      monthlyCafebazaarProductKey:
          monthlyCafebazaarProductKey ?? this.monthlyCafebazaarProductKey,
      yearlyCafebazaarProductKey:
          yearlyCafebazaarProductKey ?? this.yearlyCafebazaarProductKey,
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
