import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../presentation/providers/plan_generation_provider.dart';

class PlanGenerationPage extends ConsumerWidget {
  const PlanGenerationPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(planGenerationProvider, (previous, next) {
      if (next.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${next.errorMessage}')),
        );
      }
      if (previous?.progressPercent != 100 && next.progressPercent >= 100) {
        Future.delayed(const Duration(milliseconds: 300), () {
          if (context.mounted) context.go('/home');
        });
      }
    });
    final state = ref.watch(planGenerationProvider);

    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),

              // Circular progress + heading
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 160,
                      height: 160,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: colorScheme.primary.withOpacity(0.12),
                            blurRadius: 32,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          SizedBox(
                            width: 160,
                            height: 160,
                            child: CircularProgressIndicator(
                              value:
                                  (state.progressPercent / 100).clamp(0.0, 1.0),
                              strokeWidth: 10,
                              backgroundColor:
                                  colorScheme.surfaceVariant.withOpacity(0.7),
                              valueColor: AlwaysStoppedAnimation<Color>(
                                colorScheme.primary,
                              ),
                            ),
                          ),
                          TweenAnimationBuilder<double>(
                            tween: Tween<double>(
                              begin: 0,
                              end: state.progressPercent.toDouble(),
                            ),
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeOut,
                            builder: (_, value, __) {
                              final int display = value.clamp(0, 100).toInt();
                              return RichText(
                                text: TextSpan(
                                  children: [
                                    TextSpan(
                                      text: '$display',
                                      style: textTheme.displayMedium?.copyWith(
                                        fontWeight: FontWeight.w800,
                                        color: colorScheme.onSurface,
                                      ),
                                    ),
                                    TextSpan(
                                      text: '%',
                                      style: textTheme.titleLarge?.copyWith(
                                        fontWeight: FontWeight.w700,
                                        color: colorScheme.onSurface
                                            .withOpacity(0.8),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'plan_generation.heading'.tr(),
                      style: textTheme.headlineSmall?.copyWith(
                        height: 1.3,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              const SizedBox(height: 8),

              // Step message
              Center(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  switchInCurve: Curves.easeOut,
                  switchOutCurve: Curves.easeIn,
                  child: Text(
                    state.currentStepMessage.tr(),
                    key: ValueKey(state.currentStepMessage),
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurface.withOpacity(0.7),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),

              const Spacer(),

              // Card with checklist
              Container(
                decoration: BoxDecoration(
                  color: colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.07),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
                  border: Border.all(
                    color: colorScheme.outline.withOpacity(0.06),
                  ),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'plan_generation.daily_recommendation_for'.tr(),
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ...[
                      'calories',
                      'carbs',
                      'protein',
                      'fats',
                      'health_score',
                    ].map((k) => _ChecklistRow(
                          label: 'plan_generation.metric.$k'.tr(),
                          checked: state.completedMetrics.contains(k),
                        )),
                  ],
                ),
              ),

              if (state.errorMessage != null) ...[
                const SizedBox(height: 16),
                Center(
                  child: Text(
                    tr('common.please_wait'),
                    style: textTheme.bodySmall?.copyWith(
                      color: Colors.redAccent,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: ElevatedButton(
                    onPressed: () =>
                        ref.read(planGenerationProvider.notifier).retry(),
                    child: Text(tr('common.retry', args: [])),
                  ),
                ),
              ],

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChecklistRow extends StatelessWidget {
  final String label;
  final bool checked;

  const _ChecklistRow({required this.label, required this.checked});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Expanded(
            child: Text(
              '• $label',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: checked ? colorScheme.primary : Colors.transparent,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color: checked
                    ? Colors.transparent
                    : colorScheme.outline.withOpacity(0.5),
              ),
            ),
            child: checked
                ? Icon(Icons.check, color: colorScheme.onPrimary, size: 18)
                : null,
          ),
        ],
      ),
    );
  }
}
