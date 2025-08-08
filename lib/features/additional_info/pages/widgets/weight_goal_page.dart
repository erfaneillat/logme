import 'package:cal_ai/extensions/context.dart';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'custom_weight_ruler.dart';

class WeightGoalPage extends StatefulWidget {
  final String? initialValue;
  final VoidCallback? onNext;
  final Function(String)? onSelectionChanged;
  final double? currentWeight;

  const WeightGoalPage({
    super.key,
    required this.initialValue,
    required this.currentWeight,
    this.onNext,
    this.onSelectionChanged,
  });

  @override
  State<WeightGoalPage> createState() => _WeightGoalPageState();
}

class _WeightGoalPageState extends State<WeightGoalPage> {
  late final List<int> weightValues;
  late int selectedWeightIndex;
  String? selectedGoal;
  late double selectedWeight;

  @override
  void initState() {
    super.initState();
    selectedGoal = widget.initialValue ?? 'maintain_weight';

    // Generate weight values based on the goal
    if (selectedGoal == 'lose_weight') {
      // For losing weight, show range from 40 to 120 kg
      weightValues = List<int>.generate(81, (index) => 40 + index);
    } else if (selectedGoal == 'gain_weight') {
      // For gaining weight, show range from 50 to 150 kg
      weightValues = List<int>.generate(101, (index) => 50 + index);
    } else {
      // For maintaining weight, show range from 45 to 130 kg
      weightValues = List<int>.generate(86, (index) => 45 + index);
    }

    final defaultWeight = (widget.currentWeight?.round() ?? 70);
    selectedWeightIndex = _indexForValue(
      values: weightValues,
      value: defaultWeight,
      fallbackValue: defaultWeight,
    );
    selectedWeight = weightValues[selectedWeightIndex].toDouble();
  }

  int _indexForValue({
    required List<int> values,
    required int value,
    required int fallbackValue,
  }) {
    final clamped = value.clamp(values.first, values.last);
    final index = values.indexOf(clamped);
    return index >= 0 ? index : values.indexOf(fallbackValue);
  }

  String _getGoalTitle() {
    switch (selectedGoal) {
      case 'lose_weight':
        return 'additional_info.lose_weight'.tr();
      case 'gain_weight':
        return 'additional_info.gain_weight'.tr();
      case 'maintain_weight':
        return 'additional_info.maintain_weight'.tr();
      default:
        return 'additional_info.choose_weight'.tr();
    }
  }

  String _getGoalSubtitle() {
    switch (selectedGoal) {
      case 'lose_weight':
        return 'additional_info.lose_weight_subtitle'.tr();
      case 'gain_weight':
        return 'additional_info.gain_weight_subtitle'.tr();
      case 'maintain_weight':
        return 'additional_info.maintain_weight_subtitle'.tr();
      default:
        return 'additional_info.choose_weight_subtitle'.tr();
    }
  }

  IconData _getGoalIcon() {
    switch (selectedGoal) {
      case 'lose_weight':
        return Icons.trending_down;
      case 'gain_weight':
        return Icons.trending_up;
      case 'maintain_weight':
        return Icons.trending_flat;
      default:
        return Icons.monitor_weight;
    }
  }

  Color _getGoalColor() {
    switch (selectedGoal) {
      case 'lose_weight':
        return const Color(0xFFE57373);
      case 'gain_weight':
        return const Color(0xFF64B5F6);
      case 'maintain_weight':
        return const Color(0xFF81C784);
      default:
        return Colors.grey;
    }
  }

  void _onWeightChanged(double weight) {
    setState(() {
      selectedWeight = weight;
      selectedWeightIndex = weightValues.indexOf(weight.round());
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final goalColor = _getGoalColor();

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            colorScheme.surface,
            colorScheme.surfaceVariant.withOpacity(0.3),
          ],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 32),

              // Header Section
              Column(
                children: [
                  // Icon with gradient background container
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: context.colorScheme.primary,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: goalColor.withOpacity(0.3),
                          blurRadius: 20,
                          spreadRadius: 10,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Icon(
                      _getGoalIcon(),
                      size: 40,
                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Title
                  Text(
                    _getGoalTitle(),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 28,
                          height: 1.2,
                          color: colorScheme.onSurface,
                        ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 12),

                  // Subtitle
                  Text(
                    _getGoalSubtitle(),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                          fontSize: 16,
                          height: 1.5,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),

              const SizedBox(height: 40),

              // Current Weight Display
              Container(
                padding:
                    const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                decoration: BoxDecoration(
                  color: goalColor.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: goalColor.withOpacity(0.2),
                    width: 1,
                  ),
                ),
                child: Column(
                  children: [
                    Text(
                      'additional_info.target_weight'.tr(),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: colorScheme.onSurfaceVariant,
                            fontSize: 14,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${selectedWeight.round()}',
                      style:
                          Theme.of(context).textTheme.headlineLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: colorScheme.onSurface,
                                fontSize: 36,
                              ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'kg',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                            color: colorScheme.onSurfaceVariant,
                            fontSize: 16,
                          ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Current Weight Display
              if (widget.currentWeight != null)
                Container(
                  padding:
                      const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceVariant.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: colorScheme.outline.withOpacity(0.2),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.info_outline,
                        size: 16,
                        color: colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'additional_info.current_weight'.tr(),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w500,
                              color: colorScheme.onSurfaceVariant,
                              fontSize: 14,
                            ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${widget.currentWeight!.round()} kg',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: colorScheme.onSurface,
                              fontSize: 14,
                            ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 32),

              // Custom Weight Selector
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: colorScheme.surface,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: FormBuilderField<double>(
                    name: 'targetWeight',
                    initialValue: selectedWeight,
                    validator: (value) {
                      if (value == null) {
                        return 'additional_info.target_weight_required'.tr();
                      }
                      final double? current = widget.currentWeight;
                      if (current == null) return null;
                      switch (selectedGoal) {
                        case 'lose_weight':
                          if (value >= current) {
                            return 'additional_info.target_weight_must_be_less_than_current'
                                .tr();
                          }
                          break;
                        case 'gain_weight':
                          if (value <= current) {
                            return 'additional_info.target_weight_must_be_greater_than_current'
                                .tr();
                          }
                          break;
                        case 'maintain_weight':
                          if (value.round() != current.round()) {
                            return 'additional_info.target_weight_must_equal_current'
                                .tr();
                          }
                          break;
                        default:
                          return null;
                      }
                      return null;
                    },
                    builder: (field) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            child: CustomWeightRuler(
                              weightValues: weightValues,
                              selectedWeight: selectedWeight,
                              goalColor: goalColor,
                              onWeightChanged: (weight) {
                                _onWeightChanged(weight);
                                field.didChange(weight);
                              },
                            ),
                          ),
                          const SizedBox(height: 8),
                          if (field.errorText != null)
                            Align(
                              alignment: Alignment.center,
                              child: Text(
                                field.errorText!,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                  fontSize: 12,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Next button
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: LinearGradient(
                    colors: [
                      goalColor,
                      goalColor.withOpacity(0.8),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: goalColor.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: () {
                    // Update the weight goal with the selected weight
                    widget.onSelectionChanged?.call(selectedGoal ?? '');
                    widget.onNext?.call();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.colorScheme.primary,
                    shadowColor: Colors.transparent,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'next'.tr(),
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(
                        Icons.arrow_forward_rounded,
                        color: Colors.white,
                        size: 20,
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
    );
  }
}
