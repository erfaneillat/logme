import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';

class WeightHeightPage extends StatefulWidget {
  final GlobalKey<FormBuilderState> formKey;
  final double? initialWeight;
  final double? initialHeight;
  final VoidCallback? onNext;

  const WeightHeightPage({
    super.key,
    required this.formKey,
    required this.initialWeight,
    required this.initialHeight,
    this.onNext,
  });

  @override
  State<WeightHeightPage> createState() => _WeightHeightPageState();
}

class _WeightHeightPageState extends State<WeightHeightPage> {
  late final List<int> heightValues;
  late final List<int> weightValues;

  late int selectedHeightIndex;
  late int selectedWeightIndex;

  late final FixedExtentScrollController heightController;
  late final FixedExtentScrollController weightController;

  @override
  void initState() {
    super.initState();
    heightValues = List<int>.generate(151, (index) => 100 + index); // 100-250
    weightValues = List<int>.generate(271, (index) => 30 + index); // 30-300

    final defaultHeight = 170;
    final defaultWeight = 70;

    selectedHeightIndex = _indexForValue(
      values: heightValues,
      value: widget.initialHeight?.round() ?? defaultHeight,
      fallbackValue: defaultHeight,
    );

    selectedWeightIndex = _indexForValue(
      values: weightValues,
      value: widget.initialWeight?.round() ?? defaultWeight,
      fallbackValue: defaultWeight,
    );

    heightController =
        FixedExtentScrollController(initialItem: selectedHeightIndex);
    weightController =
        FixedExtentScrollController(initialItem: selectedWeightIndex);
  }

  int _indexForValue(
      {required List<int> values,
      required int value,
      required int fallbackValue}) {
    final clamped = value.clamp(values.first, values.last);
    final index = values.indexOf(clamped);
    return index >= 0 ? index : values.indexOf(fallbackValue);
  }

  @override
  void dispose() {
    heightController.dispose();
    weightController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
                  // Icon
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Icon(
                      Icons.height,
                      size: 32,
                      color: colorScheme.onPrimaryContainer,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Title
                  Text(
                    'additional_info.weight_height_title'.tr(),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: colorScheme.onSurface,
                        ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 12),

                  // Subtitle
                  Text(
                    'additional_info.weight_height_subtitle'.tr(),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                          height: 1.4,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),

              const SizedBox(height: 40),

              // Pickers Section
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
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildPickerField(
                          name: 'height',
                          labelText: 'additional_info.height'.tr(),
                          unit: 'additional_info.height_unit'.tr(),
                          values: heightValues,
                          controller: heightController,
                          initialIndex: selectedHeightIndex,
                          icon: Icons.height,
                          colorScheme: colorScheme,
                        ),
                      ),
                      Container(
                        width: 1,
                        height: 200,
                        margin: const EdgeInsets.symmetric(horizontal: 16),
                        color: colorScheme.outline.withOpacity(0.2),
                      ),
                      Expanded(
                        child: _buildPickerField(
                          name: 'weight',
                          labelText: 'additional_info.weight'.tr(),
                          unit: 'additional_info.weight_unit'.tr(),
                          values: weightValues,
                          controller: weightController,
                          initialIndex: selectedWeightIndex,
                          icon: Icons.monitor_weight,
                          colorScheme: colorScheme,
                        ),
                      ),
                    ],
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
                      colorScheme.primary,
                      colorScheme.primary.withOpacity(0.8),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: colorScheme.primary.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: widget.onNext,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
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

  Widget _buildPickerField({
    required String name,
    required String labelText,
    required String unit,
    required List<int> values,
    required FixedExtentScrollController controller,
    required int initialIndex,
    required IconData icon,
    required ColorScheme colorScheme,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Label with icon
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 20,
              color: colorScheme.primary,
            ),
            const SizedBox(width: 8),
            Text(
              labelText,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),

        const SizedBox(height: 16),

        // Current value display
        FormBuilderField<double>(
          name: name,
          initialValue: values[initialIndex].toDouble(),
          builder: (field) {
            return Column(
              children: [
                Container(
                  height: 200,
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceVariant.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: colorScheme.outline.withOpacity(0.2),
                      width: 1,
                    ),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Selection overlay
                      Container(
                        height: 38,
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          color: colorScheme.primaryContainer.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: colorScheme.primary.withOpacity(0.3),
                            width: 1,
                          ),
                        ),
                      ),

                      // Picker
                      CupertinoPicker(
                        scrollController: controller,
                        itemExtent: 44,
                        diameterRatio: 1.5,
                        useMagnifier: true,
                        magnification: 1.1,
                        selectionOverlay: const SizedBox.shrink(),
                        onSelectedItemChanged: (int index) {
                          field.didChange(values[index].toDouble());
                        },
                        children: values
                            .map((v) => Center(
                                  child: Text(
                                    '$v $unit',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(
                                          fontWeight: FontWeight.w600,
                                          color: colorScheme.onSurface,
                                        ),
                                  ),
                                ))
                            .toList(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${field.value?.round() ?? values[initialIndex]} $unit',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: colorScheme.onPrimaryContainer,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }
}
