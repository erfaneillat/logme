import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:cal_ai/features/additional_info/pages/widgets/custom_weight_ruler.dart';
import '../presentation/providers/analytics_providers.dart';
import '../../additional_info/presentation/providers/additional_info_provider.dart';
import 'package:cal_ai/extensions/string.dart';

class AnalyticsPage extends HookConsumerWidget {
  const AnalyticsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rangeIndex = useState<int>(0); // 0: 90d, 1: 6m, 2: 1y, 3: all
    final weekIndex = useState<int>(0); // 0: this, 1: last, 2: 2w, 3: 3w

    final goalAchievedAsync = ref.watch(goalAchievedPercentProvider(rangeIndex.value));
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: Colors.black,
        heroTag: 'analytics_fab',
        elevation: 8,
        tooltip: 'Add new item', // Accessibility tooltip
        child: const Icon(Icons.add, color: Colors.white, size: 24),
      ),
      body: Stack(
        children: [
          _buildTopGradientBackground(context),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Section with Analytics Overview
                  _buildHeader(context),
                  const SizedBox(height: 24),

                  // Weight Goal and Current Weight Card
                  Semantics(
                    label: 'Weight tracking section',
                    child: _WeightGoalAndCurrentCard(),
                  ),
                  const SizedBox(height: 24),

                  // BMI Information Section
                  Semantics(
                    label: 'BMI information and status',
                    child: _BmiSection(),
                  ),
                  const SizedBox(height: 24),

                  // Goal Progress Section with Time Range Selector
                  _SectionHeader(
                    left: 'analytics.goal_progress'.tr(),
                    right: goalAchievedAsync.when(
                      data: (v) => '${v.toStringAsFixed(1)}% ${'analytics.goal_achieved'.tr()}'.toPersianNumbers(context),
                      loading: () => '... ${'analytics.goal_achieved'.tr()}'.toPersianNumbers(context),
                      error: (_, __) => '--'.toPersianNumbers(context),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _SegmentControl(
                    labels: [
                      'analytics.days_90'.tr(),
                      'analytics.months_6'.tr(),
                      'analytics.year_1'.tr(),
                      'analytics.all_time'.tr(),
                    ],
                    index: rangeIndex.value,
                    onChanged: (i) => rangeIndex.value = i,
                  ),
                  const SizedBox(height: 20),
                  Semantics(
                    label: 'Goal progress chart',
                    child: _ProgressLineChart(index: rangeIndex.value),
                  ),
                  const SizedBox(height: 24),

                  // Nutrition Section with Weekly Data
                  _buildNutritionSection(context, weekIndex),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'analytics.overview'.tr(),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w900,
                fontSize: 28,
                color: Colors.black87,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'analytics.progress_tracking'.tr(),
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.black54,
                fontWeight: FontWeight.w500,
              ),
        ),
      ],
    );
  }

  Widget _buildNutritionSection(
      BuildContext context, ValueNotifier<int> weekIndex) {
    final nutritionMode = useState<int>(0); // 0: Calories, 1: Macros
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'analytics.nutrition'.tr(),
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
                fontSize: 22,
                color: Colors.black87,
              ),
        ),
        const SizedBox(height: 16),
        _SegmentControl(
          labels: [
            'analytics.this_week'.tr(),
            'analytics.last_week'.tr(),
            'analytics.two_weeks_ago'.tr(),
            'analytics.three_weeks_ago'.tr(),
          ],
          index: weekIndex.value,
          onChanged: (i) => weekIndex.value = i,
        ),
        const SizedBox(height: 16),
        _SegmentControl(
          labels: [
            'analytics.chart_calories'.tr(),
            'analytics.macros'.tr(),
          ],
          index: nutritionMode.value,
          onChanged: (i) => nutritionMode.value = i,
        ),
        const SizedBox(height: 20),
        if (nutritionMode.value == 0) ...[
          _CaloriesStatsRow(index: weekIndex.value),
          const SizedBox(height: 16),
        ],
        _NutritionBarChart(index: weekIndex.value, mode: nutritionMode.value),
      ],
    );
  }

  Widget _buildTopGradientBackground(BuildContext context) {
    return Container(
      height: 280,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xFFF0F2F5),
            const Color(0xFFF8F9FA),
            Colors.white.withOpacity(0.8),
          ],
          stops: const [0.0, 0.7, 1.0],
        ),
      ),
    );
  }
}

// ===================== Weight Bottom Sheet =====================

enum _WeightSheetMode { logNew, updateGoal }

Future<double?> _showWeightSheet(BuildContext context, WidgetRef ref, {required _WeightSheetMode mode}) async {
  return await showModalBottomSheet<double?>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
      child: _WeightSheet(mode: mode),
    ),
  );
}

class _WeightSheet extends HookConsumerWidget {
  const _WeightSheet({required this.mode});
  final _WeightSheetMode mode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final additionalInfo = ref.watch(additionalInfoProvider);
    final additionalInfoRemoteAsync = ref.watch(currentAdditionalInfoProvider);
    final latestWeightAsync = ref.watch(latestWeightProvider);

    final remote = additionalInfoRemoteAsync.maybeWhen(data: (d) => d, orElse: () => null);
    final currentWeight = latestWeightAsync.maybeWhen(
      data: (w) => w?.weightKg,
      orElse: () => null,
    ) ?? remote?.weight ?? additionalInfo.weight ?? 70.0;
    final goalWeight = remote?.targetWeight ?? additionalInfo.targetWeight ?? currentWeight;

    final initial = mode == _WeightSheetMode.logNew ? currentWeight : goalWeight;
    final selected = useState<double>(initial);

    final values = List<int>.generate(271, (i) => i + 30); // 30..300 kg
    final diff = (selected.value - (mode == _WeightSheetMode.logNew ? currentWeight : goalWeight));

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, size: 18),
                  onPressed: () => Navigator.of(context).maybePop(),
                ),
                const SizedBox(width: 4),
                Text(
                  mode == _WeightSheetMode.logNew
                      ? 'analytics.update_weight_title'.tr()
                      : 'analytics.update_goal_weight_title'.tr(),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: Colors.black87,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            const Icon(Icons.scale_outlined, size: 36, color: Color(0xFFB0B7C3)),
            const SizedBox(height: 8),
            Text(
              'kg ${selected.value.toStringAsFixed(0)}'.toPersianNumbers(context),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: Colors.black87,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              'analytics.selected_weight_label'.tr(),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.black54),
            ),
            const SizedBox(height: 12),
            // Big number + ruler
            Text(
              '${selected.value.toStringAsFixed(0)} ${'analytics.weight_unit'.tr()}'.toPersianNumbers(context),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: Colors.black,
                  ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 120,
              child: CustomWeightRuler(
                weightValues: values,
                selectedWeight: selected.value,
                goalColor: Colors.black,
                onWeightChanged: (w) => selected.value = w,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${(mode == _WeightSheetMode.logNew ? currentWeight : goalWeight).toStringAsFixed(0)} ${'analytics.weight_unit'.tr()}'.toPersianNumbers(context),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.black54),
            ),
            const SizedBox(height: 16),
            // Change card
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFF6F7F9),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('analytics.change'.tr(),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.black54)),
                        const SizedBox(height: 6),
                        Text(
                          '${diff >= 0 ? '+' : ''}${diff.toStringAsFixed(0)} ${'analytics.weight_unit'.tr()}'.toPersianNumbers(context),
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: diff == 0
                                    ? Colors.black87
                                    : (diff < 0 ? Colors.green : Colors.red),
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('analytics.current_weight_short'.tr(),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.black54)),
                        const SizedBox(height: 6),
                        Text(
                          '${currentWeight.toStringAsFixed(0)} ${'analytics.weight_unit'.tr()}'.toPersianNumbers(context),
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: Colors.black87,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () {
                  Navigator.of(context).pop(selected.value);
                },
                child: Text(
                  mode == _WeightSheetMode.logNew
                      ? 'analytics.submit_new_weight'.tr()
                      : 'analytics.update_goal'.tr(),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _ChartContainer extends StatelessWidget {
  const _ChartContainer({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 240,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: 0,
          ),
        ],
      ),
      child: child,
    );
  }
}

class _WeightGoalAndCurrentCard extends HookConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final latestWeightAsync = ref.watch(latestWeightProvider);
    final additionalInfo = ref.watch(additionalInfoProvider);
    final additionalInfoRemoteAsync = ref.watch(currentAdditionalInfoProvider);
    final targetWeight = additionalInfoRemoteAsync.maybeWhen(
          data: (d) => d?.targetWeight,
          orElse: () => null,
        ) ??
        additionalInfo.targetWeight;

    // Weight displayed via latestWeightAsync.when below

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'analytics.weight_goal'.tr(),
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                  color: Colors.black87,
                ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'analytics.weight_goal'.tr(),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
              ),
              GestureDetector(
                onTap: () async {
                  final value = await _showWeightSheet(context, ref, mode: _WeightSheetMode.updateGoal);
                  if (value != null) {
                    try {
                      // Update local state and persist target weight
                      ref.read(additionalInfoProvider.notifier).updateTargetWeight(value);
                      await ref.read(saveAdditionalInfoUseCaseProvider).execute(ref.read(additionalInfoProvider));
                      // Refresh remote additional info
                      ref.invalidate(currentAdditionalInfoProvider);
                      // Feedback
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('analytics.goal_updated'.tr())),
                        );
                      }
                    } catch (_) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('common.error'.tr())),
                        );
                      }
                    }
                  }
                },
                child: _Chip(text: 'analytics.update'.tr()),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            (targetWeight != null
                    ? '${targetWeight.toStringAsFixed(0)} ${'analytics.weight_unit'.tr()}'.toPersianNumbers(context)
                    : '--')
                .toPersianNumbers(context),
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                  fontSize: 32,
                  color: Colors.black,
                ),
          ),
          const SizedBox(height: 20),
          Text(
            'analytics.current_weight'.tr(),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  height: 1.2,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFF8F9FA),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.grey.shade200,
                width: 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  latestWeightAsync.when(
                    data: (w) {
                      if (w != null) {
                        return '${w.weightKg.toStringAsFixed(0)} ${'analytics.weight_unit'.tr()}'.toPersianNumbers(context);
                      }
                      final remote = additionalInfoRemoteAsync.maybeWhen(
                        data: (d) => d,
                        orElse: () => null,
                      );
                      final fallback = remote?.weight ?? additionalInfo.weight;
                      return fallback != null
                          ? '${fallback.toStringAsFixed(0)} ${'analytics.weight_unit'.tr()}'.toPersianNumbers(context)
                          : '--';
                    },
                    loading: () => '... ${'analytics.weight_unit'.tr()}'.toPersianNumbers(context),
                    error: (_, __) => '--',
                  ),
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                        fontSize: 28,
                        color: Colors.black,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'analytics.update_weight_hint'.tr(),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.black54,
                        height: 1.4,
                      ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 4,
                      shadowColor: Colors.black.withOpacity(0.3),
                    ),
                    onPressed: () async {
                      final value = await _showWeightSheet(context, ref, mode: _WeightSheetMode.logNew);
                      if (value != null) {
                        try {
                          final now = DateTime.now();
                          final dateIso = '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
                          await ref.read(upsertWeightUseCaseProvider).execute(dateIso: dateIso, weightKg: value);
                          // Refresh providers that show latest and progress (await to ensure fresh data)
                          // Use the returned value to satisfy lints and ensure completion
                          final _ = await ref.refresh(latestWeightProvider.future);
                          await Future.wait([
                            for (int i = 0; i < 4; i++) ref.refresh(weightProgressSeriesProvider(i).future),
                          ]);
                          // Feedback
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('analytics.weight_saved'.tr())),
                            );
                          }
                        } catch (_) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('common.error'.tr())),
                            );
                          }
                        }
                      }
                    },
                    child: Text(
                      'analytics.log_weight'.tr(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BmiSection extends HookConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bmiAsync = ref.watch(bmiProvider);
    final bmi = bmiAsync.maybeWhen(data: (v) => v ?? 0, orElse: () => 0);
    // Simple scale 15..35 for marker position
    final min = 15.0;
    final max = 35.0;
    final clamped = bmi.clamp(min, max);
    final pos = (clamped - min) / (max - min);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'analytics.your_bmi'.tr(),
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                  color: Colors.black87,
                ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  '${'analytics.weight_status_prefix'.tr()} ${'analytics.healthy'.tr()}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.info_outline,
                  size: 20,
                  color: Colors.blue.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            bmiAsync.when(
              data: (v) => (v ?? 0).toStringAsFixed(2).toPersianNumbers(context),
              loading: () => '...'.toString(),
              error: (_, __) => '--',
            ),
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                  fontSize: 32,
                  color: Colors.black,
                ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 32,
            child: Stack(
              children: [
                // Color scale
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: const LinearGradient(
                        colors: [
                          Color(0xFF2DA8FF), // under
                          Color(0xFF2ECC71), // healthy
                          Color(0xFFF1C40F), // over
                          Color(0xFFE74C3C), // obese
                        ],
                      ),
                    ),
                  ),
                ),
                // Marker
                Positioned(
                  left: pos * (MediaQuery.of(context).size.width - 88),
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
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 12,
            children: [
              _LegendDot(
                  color: const Color(0xFF2DA8FF),
                  label: 'analytics.underweight'.tr()),
              _LegendDot(
                  color: const Color(0xFF2ECC71),
                  label: 'analytics.healthy'.tr()),
              _LegendDot(
                  color: const Color(0xFFF1C40F),
                  label: 'analytics.overweight'.tr()),
              _LegendDot(
                  color: const Color(0xFFE74C3C),
                  label: 'analytics.obese'.tr()),
            ],
          )
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.left, required this.right});
  final String left;
  final String right;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          left.toPersianNumbers(context),
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
                fontSize: 22,
                color: Colors.black87,
              ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.green.shade200),
          ),
          child: Text(
            right.toPersianNumbers(context),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.green.shade700,
                ),
          ),
        ),
      ],
    );
  }
}

class _SegmentControl extends StatelessWidget {
  const _SegmentControl({
    required this.labels,
    required this.index,
    required this.onChanged,
  });
  final List<String> labels;
  final int index;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          for (int i = 0; i < labels.length; i++)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: GestureDetector(
                  onTap: () => onChanged(i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: i == index ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: i == index
                          ? [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Text(
                      labels[i].toPersianNumbers(context),
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            fontWeight:
                                i == index ? FontWeight.w600 : FontWeight.w500,
                            color: i == index ? Colors.black87 : Colors.black54,
                          ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ProgressLineChart extends HookConsumerWidget {
  const _ProgressLineChart({required this.index});
  final int index; // 0:90d 1:6m 2:1y 3:all

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final seriesAsync = ref.watch(weightProgressSeriesProvider(index));
    if (seriesAsync.isLoading) {
      return _ChartContainer(child: const Center(child: CircularProgressIndicator()));
    }
    if (seriesAsync.hasError) {
      return _ChartContainer(
        child: Center(
          child: Text(
            'analytics.failed_to_load'.tr(),
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      );
    }
    final values = seriesAsync.maybeWhen(data: (v) => v, orElse: () => const <double>[]);
    final spots = values.isEmpty
        ? [const FlSpot(0, 0)]
        : [for (int i = 0; i < values.length; i++) FlSpot(i.toDouble(), values[i].clamp(0.0, 1.0))];
    return _ChartContainer(
      child: LineChart(
        LineChartData(
          backgroundColor: Colors.white,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (value) => FlLine(
              color: Colors.grey.shade200,
              strokeWidth: 1,
            ),
          ),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 40,
                getTitlesWidget: (value, meta) {
                  return Text(
                    value.toStringAsFixed(1).toPersianNumbers(context),
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  );
                },
              ),
            ),
            rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              color: Colors.black,
              barWidth: 4,
              dotData: FlDotData(
                show: true,
                getDotPainter: (spot, percent, barData, index) {
                  return FlDotCirclePainter(
                    radius: 4,
                    color: Colors.white,
                    strokeWidth: 3,
                    strokeColor: Colors.black,
                  );
                },
              ),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withOpacity(0.2),
                    Colors.black.withOpacity(0.05),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ],
          minY: 0,
          maxY: 1.2,
        ),
      ),
    );
  }
}

class _NutritionBarChart extends HookConsumerWidget {
  const _NutritionBarChart({required this.index, required this.mode});
  final int index; // 0:this 1:last 2:2w 3:3w
  final int mode; // 0: calories, 1: macros

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Build bar groups based on mode
    List<BarChartGroupData> barGroups = [];
    double maxY = 0;

    if (mode == 0) {
      final seriesAsync = ref.watch(weeklyCaloriesSeriesProvider(index));
      if (seriesAsync.isLoading) {
        return _ChartContainer(child: const Center(child: CircularProgressIndicator()));
      }
      if (seriesAsync.hasError) {
        return _ChartContainer(
          child: Center(
            child: Text(
              'analytics.failed_to_load'.tr(),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        );
      }
      final values = seriesAsync.maybeWhen(data: (v) => v, orElse: () => const <double>[]);
      final data = values.isEmpty ? List<double>.filled(7, 0) : values;
      final computedMax = data.isEmpty ? 0.0 : data.reduce((a, b) => a > b ? a : b) * 1.2;
      maxY = computedMax <= 0 ? 100 : computedMax; // ensure visible scale when all zeros
      for (var i = 0; i < data.length; i++) {
        barGroups.add(
          BarChartGroupData(
            x: i,
            barRods: [
              BarChartRodData(
                toY: data[i].toDouble(),
                width: 20,
                borderRadius: BorderRadius.circular(8),
                gradient: const LinearGradient(
                  colors: [Color(0xFF2DA8FF), Color(0xFF2ECC71)],
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                ),
              ),
            ],
          ),
        );
      }
    } else {
      final carbsAsync = ref.watch(weeklyCarbsSeriesProvider(index));
      final proteinAsync = ref.watch(weeklyProteinSeriesProvider(index));
      final fatsAsync = ref.watch(weeklyFatsSeriesProvider(index));
      if (carbsAsync.isLoading || proteinAsync.isLoading || fatsAsync.isLoading) {
        return _ChartContainer(child: const Center(child: CircularProgressIndicator()));
      }
      if (carbsAsync.hasError || proteinAsync.hasError || fatsAsync.hasError) {
        return _ChartContainer(
          child: Center(
            child: Text(
              'analytics.failed_to_load'.tr(),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        );
      }
      final carbs = carbsAsync.maybeWhen(data: (v) => v, orElse: () => List<int>.filled(7, 0));
      final protein = proteinAsync.maybeWhen(data: (v) => v, orElse: () => List<int>.filled(7, 0));
      final fats = fatsAsync.maybeWhen(data: (v) => v, orElse: () => List<int>.filled(7, 0));

      final maxVal = [
        ...carbs.map((e) => e.toDouble()),
        ...protein.map((e) => e.toDouble()),
        ...fats.map((e) => e.toDouble()),
      ];
      final computedMax = maxVal.isEmpty ? 0.0 : (maxVal.reduce((a, b) => a > b ? a : b) * 1.2);
      maxY = computedMax <= 0 ? 50 : computedMax; // grams fallback

      final maxLen = [carbs.length, protein.length, fats.length].reduce((a, b) => a > b ? a : b);
      for (var i = 0; i < maxLen; i++) {
        barGroups.add(
          BarChartGroupData(
            x: i,
            barsSpace: 4,
            barRods: [
              BarChartRodData(
                toY: (i < carbs.length ? carbs[i] : 0).toDouble(),
                width: 8,
                borderRadius: BorderRadius.circular(6),
                gradient: const LinearGradient(
                  colors: [Color(0xFF3498DB), Color(0xFF85C1E9)], // Carbs - blue
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                ),
              ),
              BarChartRodData(
                toY: (i < protein.length ? protein[i] : 0).toDouble(),
                width: 8,
                borderRadius: BorderRadius.circular(6),
                gradient: const LinearGradient(
                  colors: [Color(0xFF27AE60), Color(0xFF7DCEA0)], // Protein - green
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                ),
              ),
              BarChartRodData(
                toY: (i < fats.length ? fats[i] : 0).toDouble(),
                width: 8,
                borderRadius: BorderRadius.circular(6),
                gradient: const LinearGradient(
                  colors: [Color(0xFFF39C12), Color(0xFFF8C471)], // Fats - orange
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                ),
              ),
            ],
          ),
        );
      }
    }

    return _ChartContainer(
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          barGroups: barGroups,
          maxY: maxY,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (value) => FlLine(
              color: Colors.grey.shade200,
              strokeWidth: 1,
            ),
          ),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 50,
                getTitlesWidget: (value, meta) {
                  return Text(
                    value.toInt().toString().toPersianNumbers(context),
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  );
                },
              ),
            ),
            rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  final labels = [
                    'analytics.day_sun'.tr(),
                    'analytics.day_mon'.tr(),
                    'analytics.day_tue'.tr(),
                    'analytics.day_wed'.tr(),
                    'analytics.day_thu'.tr(),
                    'analytics.day_fri'.tr(),
                    'analytics.day_sat'.tr(),
                  ];
                  final idx = value.toInt();
                  return idx >= 0 && idx < labels.length
                      ? Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            labels[idx],
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        )
                      : const SizedBox.shrink();
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});
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
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.3),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label.toPersianNumbers(context),
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w500,
                color: Colors.black87,
              ),
        ),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Text(
        text.toPersianNumbers(context),
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.blue.shade700,
            ),
      ),
    );
  }
}

class _CaloriesStatsRow extends HookConsumerWidget {
  const _CaloriesStatsRow({required this.index});
  final int index;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final totalAsync = ref.watch(weeklyCaloriesTotalProvider(index));
    final avgAsync = ref.watch(weeklyCaloriesAvgProvider(index));
    return Row(
      children: [
        Expanded(
          child: _StatTile(
            title: totalAsync.when(
              data: (v) => v.toStringAsFixed(0),
              loading: () => '...',
              error: (_, __) => '--',
            ),
            subtitle: 'analytics.total_calories'.tr(),
            icon: Icons.local_fire_department,
            color: Colors.orange,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _StatTile(
            title: avgAsync.when(
              data: (v) => v.toStringAsFixed(1),
              loading: () => '...',
              error: (_, __) => '--',
            ),
            subtitle: 'analytics.daily_avg'.tr(),
            icon: Icons.trending_up,
            color: Colors.green,
          ),
        ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
  });
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 20,
                ),
              ),
              const Spacer(),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            title.toPersianNumbers(context),
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                  fontSize: 28,
                  color: Colors.black,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle.toPersianNumbers(context),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.black54,
                  fontWeight: FontWeight.w500,
                ),
          ),
        ],
      ),
    );
  }
}
