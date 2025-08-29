import 'dart:math' as math;
import 'package:cal_ai/router/app_router.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../presentation/providers/plan_summary_provider.dart';

class PlanSummaryPage extends ConsumerWidget {
  const PlanSummaryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(planSummaryProvider);
    final t = Theme.of(context);
    final cs = Theme.of(context).colorScheme;

    if (state.isLoading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator(color: cs.primary)),
      );
    }

    if (state.error != null || state.plan == null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(tr('common.please_wait')),
              const SizedBox(height: 8),
              Text(state.error ?? 'common.unknown_error'.tr()),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () =>
                    ref.read(planSummaryProvider.notifier).refresh(),
                child: Text(tr('common.next')),
              ),
            ],
          ),
        ),
      );
    }

    final plan = state.plan!;

    final double carbsCal = plan.carbsGrams * 4.0;
    final double proteinCal = plan.proteinGrams * 4.0;
    final double fatsCal = plan.fatsGrams * 9.0;
    double safeDiv(double a, double b) => b == 0 ? 0 : (a / b);

    final double calories = plan.calories.toDouble();
    final double carbsRatio = safeDiv(carbsCal, calories).clamp(0.0, 1.0);
    final double proteinRatio = safeDiv(proteinCal, calories).clamp(0.0, 1.0);
    final double fatsRatio = safeDiv(fatsCal, calories).clamp(0.0, 1.0);

    final double absLbs = (plan.targetChangeLbs ?? 0).abs();
    final bool isLoss = (plan.dailyGoal ?? '').contains('lose') ||
        (plan.targetChangeLbs ?? 0) < 0;
    final dateStr = plan.targetDate != null
        ? DateFormat.MMMMd(context.locale.toLanguageTag())
            .format(plan.targetDate!)
        : '';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Stack(
        children: [
          Positioned.fill(
            child: IgnorePointer(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      cs.primary.withOpacity(0.08),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Check circle with glow effect
                        Center(
                          child: TweenAnimationBuilder<double>(
                            tween: Tween(begin: 0.85, end: 1.0),
                            duration: const Duration(milliseconds: 700),
                            curve: Curves.easeOutBack,
                            builder: (context, scale, child) => Transform.scale(
                              scale: scale,
                              child: child,
                            ),
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: cs.primary,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: cs.primary.withOpacity(0.3),
                                    blurRadius: 20,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: Icon(Icons.check,
                                  color: cs.onPrimary, size: 40),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        // Title with better typography
                        Text(
                          tr('plan_summary.congrats_title'),
                          style: t.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            height: 1.2,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          tr('plan_summary.congrats_subtitle'),
                          style: t.textTheme.titleMedium?.copyWith(
                            height: 1.3,
                            color: cs.onSurface.withOpacity(0.8),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        // const SizedBox(height: 24),
                        // // You should lose/gain section
                        // Text(
                        //   tr('plan_summary.you_should'),
                        //   style: t.textTheme.titleMedium?.copyWith(
                        //     fontWeight: FontWeight.w700,
                        //     color: cs.onSurface.withOpacity(0.9),
                        //   ),
                        //   textAlign: TextAlign.center,
                        // ),
                        // const SizedBox(height: 12),
                        // // Enhanced pill design
                        // Center(
                        //   child: Container(
                        //     padding: const EdgeInsets.symmetric(
                        //       horizontal: 20,
                        //       vertical: 12,
                        //     ),
                        //     decoration: BoxDecoration(
                        //       color: cs.surface,
                        //       borderRadius: BorderRadius.circular(999),
                        //       border: Border.all(
                        //         color: cs.outline.withOpacity(0.1),
                        //       ),
                        //       boxShadow: [
                        //         BoxShadow(
                        //           color: Colors.black.withOpacity(0.08),
                        //           blurRadius: 12,
                        //           offset: const Offset(0, 4),
                        //         )
                        //       ],
                        //     ),
                        //     child: Text(
                        //       isLoss
                        //           ? tr('plan_summary.lose_by', args: [
                        //               absLbs.toStringAsFixed(1),
                        //               dateStr
                        //             ])
                        //           : tr('plan_summary.gain_by', args: [
                        //               absLbs.toStringAsFixed(1),
                        //               dateStr
                        //             ]),
                        //       style: t.textTheme.titleMedium?.copyWith(
                        //         fontWeight: FontWeight.w600,
                        //       ),
                        //     ),
                        //   ),
                        // ),
                        const SizedBox(height: 32),

                        // Daily recommendation card with enhanced design
                        _Appear(
                          child: _enhancedCard(
                            context,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.restaurant_menu,
                                      color: cs.primary,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      tr('plan_summary.daily_recommendation_title'),
                                      style: t.textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  tr('plan_summary.edit_anytime'),
                                  style: t.textTheme.bodySmall?.copyWith(
                                    color: cs.onSurface.withOpacity(0.6),
                                  ),
                                ),
                                const SizedBox(height: 20),
                                // Enhanced metric grid
                                GridView(
                                  gridDelegate:
                                      const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    mainAxisSpacing: 16,
                                    crossAxisSpacing: 16,
                                    childAspectRatio: 1.1,
                                  ),
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  children: [
                                    _enhancedMetricCard(
                                      context,
                                      Icons.local_fire_department_outlined,
                                      tr('plan_generation.metric.calories'),
                                      plan.calories.toString(),
                                      null,
                                      cs.primary,
                                    ),
                                    _enhancedMetricCard(
                                      context,
                                      Icons.grain_outlined,
                                      tr('plan_generation.metric.carbs'),
                                      '${plan.carbsGrams}g',
                                      carbsRatio,
                                      const Color(0xffFF6B35),
                                    ),
                                    _enhancedMetricCard(
                                      context,
                                      Icons.bolt_outlined,
                                      tr('plan_generation.metric.protein'),
                                      '${plan.proteinGrams}g',
                                      proteinRatio,
                                      const Color(0xffEF4444),
                                    ),
                                    _enhancedMetricCard(
                                      context,
                                      Icons.water_drop_outlined,
                                      tr('plan_generation.metric.fats'),
                                      '${plan.fatsGrams}g',
                                      fatsRatio,
                                      const Color(0xff3B82F6),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                _enhancedHealthScore(context, plan.healthScore),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 20),
                        // Enhanced tips section
                        _Appear(
                          child: _enhancedCard(
                            context,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.lightbulb_outline,
                                      color: cs.primary,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      tr('plan_summary.how_to_reach_title'),
                                      style: t.textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                _enhancedTipItem(
                                  context,
                                  Icons.favorite_border,
                                  tr('plan_summary.weekly_score_tip'),
                                ),
                                _enhancedTipItem(
                                  context,
                                  Icons.restaurant_outlined,
                                  tr('plan_summary.track_food_tip'),
                                ),
                                _enhancedTipItem(
                                  context,
                                  Icons.local_fire_department_outlined,
                                  tr('plan_summary.follow_calorie_tip'),
                                ),
                                _enhancedTipItem(
                                  context,
                                  Icons.bubble_chart_outlined,
                                  tr('plan_summary.balance_macros_tip'),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      // Enhanced bottom button
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        decoration: BoxDecoration(
          color: cs.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: () => AppRouter.router.pushReplacement('/home'),
              style: ElevatedButton.styleFrom(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: Text(
                'submit'.tr(),
                style: t.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: cs.onPrimary,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _enhancedCard(BuildContext context, {required Widget child}) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(
          color: cs.outline.withOpacity(0.08),
        ),
      ),
      padding: const EdgeInsets.all(20),
      child: child,
    );
  }

  Widget _enhancedMetricCard(BuildContext context, IconData icon, String title,
      String value, double? progress, Color color) {
    final t = Theme.of(context);
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: cs.outline.withOpacity(0.08),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: t.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              // if (progress != null)
              //   Container(
              //     padding:
              //         const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              //     decoration: BoxDecoration(
              //       color: color.withOpacity(0.08),
              //       borderRadius: BorderRadius.circular(999),
              //       border: Border.all(color: color.withOpacity(0.25)),
              //     ),
              //     child: Text(
              //       '${(progress.clamp(0.0, 1.0) * 100).round()}%',
              //       style: t.textTheme.labelSmall?.copyWith(
              //         color: color,
              //         fontWeight: FontWeight.w700,
              //       ),
              //     ),
              //   ),
            ],
          ),
          const Spacer(),
          Center(
            child: SizedBox(
              width: 76,
              height: 76,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  _RingProgress(
                    progress: (progress ?? 1.0).clamp(0.0, 1.0),
                    color: color,
                    backgroundColor: cs.surfaceVariant.withOpacity(0.5),
                    strokeWidth: 8,
                  ),
                  Text(
                    value,
                    style: t.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _enhancedHealthScore(BuildContext context, int score) {
    final cs = Theme.of(context).colorScheme;
    final t = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: cs.outline.withOpacity(0.08),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.pinkAccent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.favorite_border,
                  color: Colors.pinkAccent,
                  size: 16,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                tr('plan_generation.metric.health_score'),
                style: t.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Text(
                '$score/10',
                style: t.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: (score / 10).clamp(0.0, 1.0),
              minHeight: 8,
              color: Colors.green,
              backgroundColor: cs.surfaceVariant.withOpacity(0.6),
            ),
          ),
        ],
      ),
    );
  }

  Widget _enhancedTipItem(BuildContext context, IconData icon, String text) {
    final cs = Theme.of(context).colorScheme;
    final t = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: cs.outline.withOpacity(0.06),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: cs.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: cs.primary,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: t.textTheme.bodyMedium?.copyWith(
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Appear extends StatelessWidget {
  const _Appear({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 20, end: 0),
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeOutCubic,
      builder: (context, offsetY, child) {
        final double opacity = (1 - (offsetY / 20)).clamp(0.0, 1.0);
        return Opacity(
          opacity: opacity,
          child: Transform.translate(
            offset: Offset(0, offsetY),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}

class _RingProgress extends StatelessWidget {
  const _RingProgress({
    required this.progress,
    required this.color,
    required this.backgroundColor,
    this.strokeWidth = 8,
  });

  final double progress;
  final Color color;
  final Color backgroundColor;
  final double strokeWidth;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: progress.clamp(0.0, 1.0)),
      duration: const Duration(milliseconds: 800),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return SizedBox.expand(
          child: CustomPaint(
            painter: _RingPainter(
              progress: value,
              color: color,
              backgroundColor: backgroundColor,
              strokeWidth: strokeWidth,
            ),
          ),
        );
      },
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({
    required this.progress,
    required this.color,
    required this.backgroundColor,
    required this.strokeWidth,
  });

  final double progress;
  final Color color;
  final Color backgroundColor;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final Offset center = size.center(Offset.zero);
    final double radius = (size.shortestSide - strokeWidth) / 2;

    final Rect rect = Rect.fromCircle(center: center, radius: radius);

    final Paint basePaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final Paint progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    // Background track
    canvas.drawArc(rect, -math.pi / 2, 2 * math.pi, false, basePaint);

    // Progress arc
    final double sweep = 2 * math.pi * progress.clamp(0.0, 1.0);
    canvas.drawArc(rect, -math.pi / 2, sweep, false, progressPaint);
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.color != color ||
        oldDelegate.backgroundColor != backgroundColor ||
        oldDelegate.strokeWidth != strokeWidth;
  }
}
