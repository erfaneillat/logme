import 'package:cal_ai/features/subscription/presentation/providers/subscription_provider.dart';
import 'package:cal_ai/services/payment_service.dart';
import 'package:cal_ai/services/api_service_provider.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

Future<void> handleSubscriptionPurchase(
  BuildContext context,
  WidgetRef ref,
  SubscriptionState state,
  PaymentService paymentService,
  ValueNotifier<bool> isProcessing,
) async {
  try {
    isProcessing.value = true;

    final activeOffer = state.activeOffer;
    final offerHasCafebazaarKey = activeOffer != null &&
        activeOffer.isCurrentlyValid &&
        activeOffer.cafebazaarProductKey != null &&
        activeOffer.cafebazaarProductKey!.isNotEmpty;

    final productKey = offerHasCafebazaarKey
        ? activeOffer.cafebazaarProductKey
        : (state.selectedPlan == SubscriptionPlan.yearly
            ? state.yearlyCafebazaarProductKey
            : state.selectedPlan == SubscriptionPlan.threeMonth
                ? state.threeMonthCafebazaarProductKey
                : state.monthlyCafebazaarProductKey);

    if (productKey == null || productKey.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(
                child: Text('subscription.payment.product_not_found'.tr()),
              ),
            ],
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 3),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('subscription.payment.processing'.tr()),
          duration: const Duration(seconds: 2),
        ),
      );
    }

    final result = await paymentService.purchaseSubscription(productKey);

    if (!context.mounted) return;

    if (result.success) {
      final secureStorage = ref.read(secureStorageProvider);
      await secureStorage.setSubscriptionActive(true);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(
                child: Text('subscription.payment.subscription_activated'.tr()),
              ),
            ],
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 3),
          behavior: SnackBarBehavior.floating,
        ),
      );

      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(
                child: Text(result.message),
              ),
            ],
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(
                child: Text('${'subscription.payment.error'.tr()}: $e'),
              ),
            ],
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  } finally {
    isProcessing.value = false;
  }
}
