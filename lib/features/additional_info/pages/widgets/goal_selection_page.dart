import 'package:cal_ai/extensions/context.dart';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

class GoalSelectionPage extends StatefulWidget {
  final String? initialValue;
  final VoidCallback? onNext;
  final Function(String)? onSelectionChanged;

  const GoalSelectionPage({
    super.key,
    required this.initialValue,
    this.onNext,
    this.onSelectionChanged,
  });

  @override
  State<GoalSelectionPage> createState() => _GoalSelectionPageState();
}

class _GoalSelectionPageState extends State<GoalSelectionPage> {
  String? selectedGoal;

  @override
  void initState() {
    super.initState();
    selectedGoal = widget.initialValue;
  }

  void _onGoalSelected(String goal) {
    setState(() {
      selectedGoal = goal;
    });
    widget.onSelectionChanged?.call(goal);
  }

  Widget _buildGoalCard({
    required String goalKey,
    required String title,
    required String description,
    required IconData icon,
    required Color color,
  }) {
    final isSelected = selectedGoal == goalKey;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isSelected ? color.withOpacity(0.1) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? color : Colors.grey.withOpacity(0.2),
          width: isSelected ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _onGoalSelected(goalKey),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                // Radio button
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? color : Colors.grey.withOpacity(0.5),
                      width: 2,
                    ),
                  ),
                  child: isSelected
                      ? Container(
                          margin: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: color,
                          ),
                        )
                      : null,
                ),

                const SizedBox(width: 16),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        description,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 16),

                // Icon
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    icon,
                    color: color,
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Theme.of(context).colorScheme.surface,
            Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
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
                          color: context.colorScheme.primary.withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.fitness_center,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Title
                  Text(
                    'additional_info.what_is_your_goal'.tr(),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 28,
                          height: 1.2,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 12),

                  // Subtitle
                  Text(
                    'additional_info.goal_selection_subtitle'.tr(),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 16,
                          height: 1.5,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),

              const SizedBox(height: 40),

              // Goal Selection Cards
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      _buildGoalCard(
                        goalKey: 'lose_weight',
                        title: 'additional_info.lose_weight'.tr(),
                        description:
                            'additional_info.lose_weight_description'.tr(),
                        icon: Icons.trending_down,
                        color: const Color(0xFFE57373),
                      ),
                      _buildGoalCard(
                        goalKey: 'maintain_weight',
                        title: 'additional_info.maintain_weight'.tr(),
                        description:
                            'additional_info.maintain_weight_description'.tr(),
                        icon: Icons.trending_flat,
                        color: const Color(0xFF81C784),
                      ),
                      _buildGoalCard(
                        goalKey: 'gain_weight',
                        title: 'additional_info.gain_weight'.tr(),
                        description:
                            'additional_info.gain_weight_description'.tr(),
                        icon: Icons.trending_up,
                        color: const Color(0xFF64B5F6),
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
                    colors: selectedGoal != null
                        ? [
                            context.colorScheme.primary,
                            context.colorScheme.primary.withOpacity(0.8),
                          ]
                        : [
                            Colors.grey.withOpacity(0.3),
                            Colors.grey.withOpacity(0.3),
                          ],
                  ),
                  boxShadow: selectedGoal != null
                      ? [
                          BoxShadow(
                            color: context.colorScheme.primary.withOpacity(0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : null,
                ),
                child: ElevatedButton(
                  onPressed: selectedGoal != null ? widget.onNext : null,
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
                                  color: selectedGoal != null
                                      ? Colors.white
                                      : Colors.grey.withOpacity(0.7),
                                ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.arrow_forward_rounded,
                        color: selectedGoal != null
                            ? Colors.white
                            : Colors.grey.withOpacity(0.7),
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
