import 'package:cal_ai/extensions/context.dart';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

class MotivationalPage extends StatelessWidget {
  final VoidCallback? onNext;
  final VoidCallback? onBack;
  final double currentProgress;
  final double targetWeightLoss; // absolute kg difference
  final String? goal; // 'lose_weight' | 'gain_weight' | 'maintain_weight'

  const MotivationalPage({
    super.key,
    this.onNext,
    this.onBack,
    this.currentProgress = 0.67,
    this.targetWeightLoss = 4.1,
    this.goal,
  });

  @override
  Widget build(BuildContext context) {
    final double amount = double.parse(targetWeightLoss.toStringAsFixed(1));
    final bool isMaintain = goal == 'maintain_weight' || amount == 0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        children: [
          const SizedBox(height: 40),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (!isMaintain)
                  RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style:
                          Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                fontSize: 28,
                                height: 1.3,
                                color: Colors.black87,
                              ),
                      children: [
                        TextSpan(
                          text: goal == 'gain_weight'
                              ? 'additional_info.motivational_gaining_prefix'
                                  .tr()
                              : 'additional_info.motivational_losing_prefix'
                                  .tr(),
                        ),
                        TextSpan(
                          text: '${amount.toStringAsFixed(1)} kg',
                          style: const TextStyle(
                            color: Color(0xFFD4A574),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        TextSpan(
                          text: 'additional_info.motivational_suffix'.tr(),
                        ),
                      ],
                    ),
                  )
                else
                  Text(
                    'additional_info.motivational_maintain_title'.tr(),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 28,
                          height: 1.3,
                          color: Colors.black87,
                        ),
                    textAlign: TextAlign.center,
                  ),
                const SizedBox(height: 32),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Text(
                    'additional_info.motivational_testimonial'.tr(),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontSize: 16,
                          height: 1.5,
                          color: Colors.black54,
                          fontWeight: FontWeight.w500,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: double.infinity,
            height: 56,
            margin: const EdgeInsets.only(bottom: 16),
            child: ElevatedButton(
              onPressed: onNext,
              style: ElevatedButton.styleFrom(
                backgroundColor: context.colorScheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: Text(
                'additional_info.continue'.tr(),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                      color: Colors.white,
                    ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
