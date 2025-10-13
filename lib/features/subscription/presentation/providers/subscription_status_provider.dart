import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/services/payment_service.dart';
import 'package:cal_ai/services/api_service_provider.dart';

/// Trigger to force refresh subscription status
final subscriptionRefreshTriggerProvider = StateProvider<int>((ref) => 0);

/// Exposes whether the current user has an active subscription.
final subscriptionActiveProvider = FutureProvider<bool>((ref) async {
  // Watch the trigger to force refresh when it changes
  ref.watch(subscriptionRefreshTriggerProvider);
  
  final paymentService = ref.watch(paymentServiceProvider);
  try {
    final status = await paymentService.checkSubscriptionStatus();

    // Persist locally for quick checks/fallbacks.
    final storage = ref.read(secureStorageProvider);
    await storage.setSubscriptionActive(status.isActive);

    return status.isActive;
  } catch (_) {
    // Fallback to locally cached flag if network fails.
    final storage = ref.read(secureStorageProvider);
    return await storage.isSubscriptionActive();
  }
});
