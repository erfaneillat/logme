import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

part 'subscription_provider.g.dart';

enum SubscriptionPlan {
  monthly,
  yearly,
}

@riverpod
class SubscriptionNotifier extends _$SubscriptionNotifier {
  @override
  SubscriptionState build() {
    return const SubscriptionState(
      selectedPlan: SubscriptionPlan.monthly,
    );
  }

  void selectPlan(SubscriptionPlan plan) {
    state = state.copyWith(selectedPlan: plan);
  }
}

class SubscriptionState {
  final SubscriptionPlan selectedPlan;

  const SubscriptionState({
    required this.selectedPlan,
  });

  SubscriptionState copyWith({
    SubscriptionPlan? selectedPlan,
  }) {
    return SubscriptionState(
      selectedPlan: selectedPlan ?? this.selectedPlan,
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
