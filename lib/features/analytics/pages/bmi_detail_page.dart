import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/extensions/string.dart';
import '../presentation/providers/analytics_providers.dart';

class BmiDetailPage extends HookConsumerWidget {
  const BmiDetailPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bmiAsync = ref.watch(bmiProvider);
    final bmi = bmiAsync.maybeWhen(data: (v) => v ?? 0, orElse: () => 0);

    // Calculate position on the scale (15-35 range)
    final min = 15.0;
    final max = 35.0;
    final clamped = bmi.clamp(min, max);
    final pos = (clamped - min) / (max - min);

    // Determine BMI category and color
    String category;
    Color categoryColor;
    if (bmi < 18.5) {
      category = 'analytics.underweight'.tr();
      categoryColor = const Color(0xFF2DA8FF);
    } else if (bmi < 25) {
      category = 'analytics.healthy'.tr();
      categoryColor = const Color(0xFF2ECC71);
    } else if (bmi < 30) {
      category = 'analytics.overweight'.tr();
      categoryColor = const Color(0xFFF1C40F);
    } else {
      category = 'analytics.obese'.tr();
      categoryColor = const Color(0xFFE74C3C);
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'bmi.title'.tr(),
          style: const TextStyle(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // BMI Value and Status
            Row(
              children: [
                Text(
                  '${'analytics.weight_status_prefix'.tr()} ',
                  style: const TextStyle(
                    fontSize: 16,
                    color: Colors.black87,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: categoryColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    category,
                    style: TextStyle(
                      fontSize: 14,
                      color: categoryColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // BMI Number
            Text(
              bmiAsync.when(
                data: (v) => (v ?? 0).toStringAsFixed(2).toPersianNumbers(context),
                loading: () => '...',
                error: (_, __) => '--',
              ),
              style: const TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.w900,
                color: Colors.black,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 24),

            // Color Scale with Marker
            SizedBox(
              height: 40,
              child: Stack(
                children: [
                  // Color gradient bar
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFF2DA8FF), // underweight
                            Color(0xFF2ECC71), // healthy
                            Color(0xFFF1C40F), // overweight
                            Color(0xFFE74C3C), // obese
                          ],
                        ),
                      ),
                    ),
                  ),
                  // Marker
                  Positioned(
                    left: pos * (MediaQuery.of(context).size.width - 48) - 2,
                    top: 0,
                    bottom: 0,
                    child: Container(
                      width: 4,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Legend
            Wrap(
              spacing: 16,
              runSpacing: 12,
              children: [
                _LegendItem(
                  color: const Color(0xFF2DA8FF),
                  label: 'analytics.underweight'.tr(),
                ),
                _LegendItem(
                  color: const Color(0xFF2ECC71),
                  label: 'analytics.healthy'.tr(),
                ),
                _LegendItem(
                  color: const Color(0xFFF1C40F),
                  label: 'analytics.overweight'.tr(),
                ),
                _LegendItem(
                  color: const Color(0xFFE74C3C),
                  label: 'analytics.obese'.tr(),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Disclaimer Section
            Text(
              'bmi.disclaimer_title'.tr(),
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'bmi.disclaimer_text'.tr(),
              style: const TextStyle(
                fontSize: 15,
                color: Colors.black87,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 28),

            // Why BMI Matters Section
            Text(
              'bmi.why_matters_title'.tr(),
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'bmi.why_matters_text'.tr(),
              style: const TextStyle(
                fontSize: 15,
                color: Colors.black87,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 16),

            // Conditions List
            _ConditionItem(text: 'bmi.condition_diabetes'.tr()),
            _ConditionItem(text: 'bmi.condition_arthritis'.tr()),
            _ConditionItem(text: 'bmi.condition_liver_disease'.tr()),
            _ConditionItem(text: 'bmi.condition_cancer'.tr()),
            _ConditionItem(text: 'bmi.condition_hypertension'.tr()),
            _ConditionItem(text: 'bmi.condition_cholesterol'.tr()),
            _ConditionItem(text: 'bmi.condition_sleep_apnea'.tr()),
            const SizedBox(height: 28),

            // Source
            Text(
              'bmi.source'.tr(),
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  const _LegendItem({
    required this.color,
    required this.label,
  });

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: Colors.black87,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _ConditionItem extends StatelessWidget {
  const _ConditionItem({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 6),
            child: Text(
              '• ',
              style: TextStyle(
                fontSize: 15,
                color: Colors.black87,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 15,
                color: Colors.black87,
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
