import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';

class ActivityLevelPage extends StatelessWidget {
  final GlobalKey<FormBuilderState> formKey;
  final String? initialValue;
  final VoidCallback? onNext;

  const ActivityLevelPage({
    super.key,
    required this.formKey,
    required this.initialValue,
    this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final activityLevels = [
      {
        'key': 'sedentary',
        'title': 'additional_info.sedentary'.tr(),
        'subtitle': 'additional_info.sedentary_desc'.tr(),
        'icon': Icons.weekend,
      },
      {
        'key': 'lightly_active',
        'title': 'additional_info.lightly_active'.tr(),
        'subtitle': 'additional_info.lightly_active_desc'.tr(),
        'icon': Icons.directions_walk,
      },
      {
        'key': 'moderately_active',
        'title': 'additional_info.moderately_active'.tr(),
        'subtitle': 'additional_info.moderately_active_desc'.tr(),
        'icon': Icons.directions_run,
      },
      {
        'key': 'very_active',
        'title': 'additional_info.very_active'.tr(),
        'subtitle': 'additional_info.very_active_desc'.tr(),
        'icon': Icons.fitness_center,
      },
    ];

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          const SizedBox(height: 40),

          // Title
          Text(
            'additional_info.activity_level_title'.tr(),
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 16),

          // Subtitle
          Text(
            'additional_info.activity_level_subtitle'.tr(),
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 32),

          // Activity level options using FormBuilder
          Expanded(
            child: FormBuilderRadioGroup<String>(
              name: 'activityLevel',
              initialValue: initialValue,
              decoration: const InputDecoration(
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
              validator: FormBuilderValidators.compose([
                FormBuilderValidators.required(
                    errorText: 'additional_info.activity_level_required'.tr()),
              ]),
              options: activityLevels.map((level) {
                return FormBuilderFieldOption(
                  value: level['key'] as String,
                  child: _ActivityLevelCard(
                    title: level['title'] as String,
                    subtitle: level['subtitle'] as String,
                    icon: level['icon'] as IconData,
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 16),

          // Next button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onNext,
              child: Text(
                'next'.tr(),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

class _ActivityLevelCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;

  const _ActivityLevelCard({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            size: 32,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontWeight: FontWeight.normal,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
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
