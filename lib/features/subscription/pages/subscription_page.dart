import 'dart:async';

import 'package:cal_ai/features/login/presentation/providers/auth_provider.dart';
import 'package:cal_ai/features/subscription/presentation/providers/subscription_provider.dart';
import 'package:cal_ai/features/subscription/presentation/widgets/subscription_header.dart';
import 'package:cal_ai/features/subscription/presentation/widgets/subscription_hero_section.dart';
import 'package:cal_ai/features/subscription/presentation/widgets/subscription_pricing_section.dart';
import 'package:cal_ai/features/subscription/presentation/widgets/purchase_button.dart';
import 'package:cal_ai/features/subscription/presentation/widgets/lucky_wheel_dialog.dart';
import 'package:cal_ai/features/subscription/presentation/utils/lucky_wheel_logging.dart';
import 'package:cal_ai/services/api_service_provider.dart';
import 'package:cal_ai/services/payment_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SubscriptionPage extends HookConsumerWidget {
  const SubscriptionPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subscriptionState = ref.watch(subscriptionNotifierProvider);
    final subscriptionNotifier =
        ref.read(subscriptionNotifierProvider.notifier);
    final paymentService = ref.watch(paymentServiceProvider);
    final isProcessing = useState(false);
    final currentTestimonial = useState(0);
    final currentUser = ref.watch(currentUserProvider).value;

    useEffect(() {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        // Check if lucky wheel has been shown before
        final secureStorage = ref.read(secureStorageProvider);
        final hasBeenShown = await secureStorage.hasLuckyWheelBeenShown();

        if (!hasBeenShown && context.mounted) {
          _showLuckyWheelDialog(context, subscriptionNotifier, ref);
        }
      });
      return null;
    }, const []);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: SafeArea(
        child: Stack(
          children: [
            SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 80),
                child: Column(
                  children: [
                    const SubscriptionHeader(),

                    // Hero Section with Image and Testimonial
                    SubscriptionHeroSection(
                      currentTestimonial: currentTestimonial,
                      state: subscriptionState,
                    ),

                    // Pricing Section
                    SubscriptionPricingSection(
                      state: subscriptionState,
                      notifier: subscriptionNotifier,
                      currentUser: currentUser,
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: PurchaseButton(
                paymentService: paymentService,
                isProcessing: isProcessing,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLuckyWheelDialog(
      BuildContext context, SubscriptionNotifier notifier, WidgetRef ref) {
    logLuckyWheelView(context);

    final secureStorage = ref.read(secureStorageProvider);
    secureStorage.setLuckyWheelShown(true);

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return LuckyWheelDialog(
          onClaim: () {
            notifier.selectPlan(SubscriptionPlan.yearly);
            Navigator.of(dialogContext).pop();
          },
        );
      },
    );
  }
}
