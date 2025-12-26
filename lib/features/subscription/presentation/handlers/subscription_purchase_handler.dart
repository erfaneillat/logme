import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/features/subscription/presentation/providers/subscription_provider.dart';
import 'package:cal_ai/services/payment_service.dart';

Future<void> handleSubscriptionPurchase(
  BuildContext context,
  WidgetRef ref,
  SubscriptionState state,
  PaymentService paymentService,
  ValueNotifier<bool> isProcessing,
) async {
  if (isProcessing.value) return;

  isProcessing.value = true;

  try {
    String? productKey;

    switch (state.selectedPlan) {
      case SubscriptionPlan.monthly:
        productKey = state.monthlyCafebazaarProductKey;
        break;
      case SubscriptionPlan.threeMonth:
        productKey = state.threeMonthCafebazaarProductKey;
        break;
      case SubscriptionPlan.yearly:
        productKey = state.yearlyCafebazaarProductKey;
        break;
    }

    if (productKey == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Product key not found for selected plan')),
      );
      isProcessing.value = false;
      return;
    }

    final result = await paymentService.purchaseSubscription(productKey);

    if (context.mounted) {
      if (result.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.message)),
        );
        // Additional success logic (e.g., closing the screen) can be added here
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.message),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  } finally {
    isProcessing.value = false;
  }
}
