import 'package:cal_ai/features/subscription/presentation/handlers/subscription_purchase_handler.dart';
import 'package:cal_ai/features/subscription/presentation/providers/subscription_provider.dart';
import 'package:cal_ai/services/payment_service.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class PurchaseButton extends StatelessWidget {
  const PurchaseButton({
    super.key,
    required this.paymentService,
    required this.isProcessing,
  });

  final PaymentService paymentService;
  final ValueNotifier<bool> isProcessing;

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final state = ref.watch(subscriptionNotifierProvider);
      return Padding(
        padding: const EdgeInsets.all(8.0),
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: isProcessing.value
                ? null
                : () => handleSubscriptionPurchase(
                      context,
                      ref,
                      state,
                      paymentService,
                      isProcessing,
                    ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A1A1A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(50),
              ),
              elevation: 0,
              disabledBackgroundColor: Colors.grey[300],
            ),
            child: isProcessing.value
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'subscription.payment.processing'.tr(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  )
                : const Text(
                    'خرید اشتراک لقمه پلاس',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
      );
    });
  }
}
