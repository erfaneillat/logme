import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:cal_ai/extensions/context.dart';

class WeightLossSpeedPage extends StatefulWidget {
  final double? initialValue;
  final Function(double) onSelectionChanged;
  final VoidCallback? onNext;
  final String? goal; // 'lose_weight' | 'gain_weight'

  const WeightLossSpeedPage({
    super.key,
    this.initialValue,
    required this.onSelectionChanged,
    this.onNext,
    this.goal,
  });

  @override
  State<WeightLossSpeedPage> createState() => _WeightLossSpeedPageState();
}

class _WeightLossSpeedPageState extends State<WeightLossSpeedPage> {
  late double selectedSpeed;

  final List<WeightLossSpeedOption> speedOptions = [
    WeightLossSpeedOption(
      value: 0.1,
      label: '0.1 kg',
      description: 'additional_info.slow_and_steady'.tr(),
      icon: Icons.directions_walk, // Slow walking icon
      color: const Color(0xFF8B4513), // Brown color for sloth
    ),
    WeightLossSpeedOption(
      value: 0.8,
      label: '0.8 kg',
      description: 'additional_info.moderate_pace'.tr(),
      icon: Icons.directions_run, // Running icon
      color: Colors.black87,
    ),
    WeightLossSpeedOption(
      value: 1.5,
      label: '1.5 kg',
      description: 'additional_info.fast_track'.tr(),
      icon: Icons.flash_on, // Fast/lightning icon
      color: Colors.black87,
    ),
  ];

  @override
  void initState() {
    super.initState();
    selectedSpeed = widget.initialValue ?? 0.1;
  }

  @override
  Widget build(BuildContext context) {
    final bool isGain = widget.goal == 'gain_weight';
    final String perWeekText = isGain
        ? 'additional_info.weight_gain_speed_per_week'.tr()
        : 'additional_info.weight_loss_speed_per_week'.tr();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        children: [
          const SizedBox(height: 40),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Title
                Text(
                  'additional_info.weight_loss_speed_title'.tr(),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        fontSize: 28,
                        height: 1.3,
                        color: Colors.black87,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),

                // Speed per week label
                Text(
                  perWeekText,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontSize: 16,
                        color: Colors.black54,
                        fontWeight: FontWeight.w500,
                      ),
                ),
                const SizedBox(height: 16),

                // Selected value display
                Text(
                  '${selectedSpeed.toStringAsFixed(1)} kg',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        fontSize: 32,
                        color: Colors.black87,
                      ),
                ),
                const SizedBox(height: 40),

                // Speed selection slider
                Container(
                  height: 120,
                  child: Stack(
                    children: [
                      // Horizontal line connecting the options
                      Positioned(
                        top: 30,
                        left: 40,
                        right: 40,
                        child: Container(
                          height: 2,
                          color: Colors.grey[300],
                        ),
                      ),

                      // Speed options
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: speedOptions.map((option) {
                          final isSelected = selectedSpeed == option.value;
                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                selectedSpeed = option.value;
                              });
                              widget.onSelectionChanged(option.value);
                            },
                            child: Column(
                              children: [
                                // Icon
                                Container(
                                  width: 60,
                                  height: 60,
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? option.color
                                        : Colors.grey[200],
                                    borderRadius: BorderRadius.circular(30),
                                  ),
                                  child: Icon(
                                    option.icon,
                                    color: isSelected
                                        ? Colors.white
                                        : Colors.grey[600],
                                    size: 30,
                                  ),
                                ),
                                const SizedBox(height: 8),

                                // Selection indicator
                                Container(
                                  width: 12,
                                  height: 12,
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? option.color
                                        : Colors.grey[300],
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(height: 8),

                                // Weight label
                                Text(
                                  option.label,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: isSelected
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                    color: isSelected
                                        ? Colors.black87
                                        : Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Description for selected option
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    speedOptions
                        .firstWhere((option) => option.value == selectedSpeed)
                        .description,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontSize: 14,
                          color: Colors.black54,
                          fontWeight: FontWeight.w500,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),

          // Next button
          Container(
            width: double.infinity,
            height: 56,
            margin: const EdgeInsets.only(bottom: 16),
            child: ElevatedButton(
              onPressed: widget.onNext,
              style: ElevatedButton.styleFrom(
                backgroundColor: context.colorScheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: Text(
                'additional_info.next'.tr(),
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

class WeightLossSpeedOption {
  final double value;
  final String label;
  final String description;
  final IconData icon;
  final Color color;

  WeightLossSpeedOption({
    required this.value,
    required this.label,
    required this.description,
    required this.icon,
    required this.color,
  });
}
