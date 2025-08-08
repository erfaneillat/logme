import 'package:cal_ai/extensions/context.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';

class DietSelectionPage extends HookConsumerWidget {
  final GlobalKey<FormBuilderState> formKey;
  final String? initialValue;
  final Function(String) onSelectionChanged;
  final VoidCallback onNext;

  const DietSelectionPage({
    super.key,
    required this.formKey,
    this.initialValue,
    required this.onSelectionChanged,
    required this.onNext,
  });

  Widget _buildDietCard({
    required BuildContext context,
    required String dietKey,
    required String title,
    required IconData icon,
    required Color color,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isSelected ? color.withOpacity(0.1) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? color : Colors.grey.withOpacity(0.2),
          width: isSelected ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Radio button
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? color : Colors.grey.withOpacity(0.5),
                      width: 2,
                    ),
                  ),
                  child: isSelected
                      ? Container(
                          margin: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: color,
                          ),
                        )
                      : null,
                ),

                const SizedBox(width: 12),

                // Content
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                  ),
                ),

                const SizedBox(width: 12),

                // Icon
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(
                    icon,
                    color: color,
                    size: 16,
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
  Widget build(BuildContext context, WidgetRef ref) {
    useAutomaticKeepAlive();
    // Hook widgets do not support AutomaticKeepAliveClientMixin directly
    final selectedDiet = useState<String?>(initialValue);

    final dietOptions = [
      {
        'key': 'classic',
        'title': 'additional_info.diet_options.classic'.tr(),
        'icon': Icons.restaurant,
        'color': const Color(0xFFFF9800),
      },
      {
        'key': 'pescatarian',
        'title': 'additional_info.diet_options.pescatarian'.tr(),
        'icon': Icons.set_meal,
        'color': const Color(0xFF2196F3),
      },
      {
        'key': 'vegetarian',
        'title': 'additional_info.diet_options.vegetarian'.tr(),
        'icon': Icons.apple,
        'color': const Color(0xFF4CAF50),
      },
      {
        'key': 'vegan',
        'title': 'additional_info.diet_options.vegan'.tr(),
        'icon': Icons.eco,
        'color': const Color(0xFF8BC34A),
      },
    ];

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
              const SizedBox(height: 20),

              // Header Section
              Column(
                children: [
                  // Icon with gradient background container
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: context.colorScheme.primary,
                      borderRadius: BorderRadius.circular(15),
                      boxShadow: [
                        BoxShadow(
                          color: context.colorScheme.primary.withOpacity(0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.restaurant_menu,
                      size: 30,
                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Title
                  Text(
                    'additional_info.diet_title'.tr(),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                          height: 1.2,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 8),

                  // Subtitle
                  Text(
                    'additional_info.diet_subtitle'.tr(),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 14,
                          height: 1.4,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Diet Selection Cards
              Expanded(
                child: Column(
                  children: dietOptions.map((diet) {
                    final isSelected = selectedDiet.value == diet['key'];

                    return _buildDietCard(
                      context: context,
                      dietKey: diet['key'] as String,
                      title: diet['title'] as String,
                      icon: diet['icon'] as IconData,
                      color: diet['color'] as Color,
                      isSelected: isSelected,
                      onTap: () {
                        selectedDiet.value = diet['key'] as String;
                        onSelectionChanged(diet['key'] as String);
                        final field = formKey.currentState?.fields['diet'];
                        field?.didChange(diet['key'] as String);
                      },
                    );
                  }).toList(),
                ),
              ),

              // Hidden field to persist selection in parent form
              FormBuilderField<String>(
                name: 'diet',
                initialValue: selectedDiet.value,
                builder: (field) => const SizedBox.shrink(),
              ),

              const SizedBox(height: 20),

              // Next button
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: LinearGradient(
                    colors: selectedDiet.value != null
                        ? [
                            context.colorScheme.primary,
                            context.colorScheme.primary.withOpacity(0.8),
                          ]
                        : [
                            Colors.grey.withOpacity(0.3),
                            Colors.grey.withOpacity(0.3),
                          ],
                  ),
                  boxShadow: selectedDiet.value != null
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
                  onPressed: selectedDiet.value != null ? onNext : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
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
                                  color: selectedDiet.value != null
                                      ? Colors.white
                                      : Colors.grey.withOpacity(0.7),
                                ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.arrow_forward_rounded,
                        color: selectedDiet.value != null
                            ? Colors.white
                            : Colors.grey.withOpacity(0.7),
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
