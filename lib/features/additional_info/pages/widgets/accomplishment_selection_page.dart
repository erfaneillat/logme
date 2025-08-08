import 'package:cal_ai/extensions/context.dart';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'common_next_button.dart';

class AccomplishmentSelectionPage extends StatefulWidget {
  final GlobalKey<FormBuilderState> formKey;
  final String? initialValue;
  final VoidCallback? onNext;
  final Function(String)? onSelectionChanged;

  const AccomplishmentSelectionPage({
    super.key,
    required this.formKey,
    required this.initialValue,
    this.onNext,
    this.onSelectionChanged,
  });

  @override
  State<AccomplishmentSelectionPage> createState() =>
      _AccomplishmentSelectionPageState();
}

class _AccomplishmentSelectionPageState
    extends State<AccomplishmentSelectionPage>
    with AutomaticKeepAliveClientMixin {
  String? selectedAccomplishment;

  @override
  void initState() {
    super.initState();
    selectedAccomplishment = widget.initialValue;
  }

  void _onAccomplishmentSelected(String accomplishment) {
    setState(() {
      selectedAccomplishment = accomplishment;
    });
    widget.onSelectionChanged?.call(accomplishment);
    final field = widget.formKey.currentState?.fields['accomplishment'];
    field?.didChange(accomplishment);
  }

  Widget _buildAccomplishmentCard({
    required String accomplishmentKey,
    required String title,
    required IconData icon,
    required Color color,
  }) {
    final isSelected = selectedAccomplishment == accomplishmentKey;

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
          onTap: () => _onAccomplishmentSelected(accomplishmentKey),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
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

                const SizedBox(width: 16),

                // Title
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                  ),
                ),

                const SizedBox(width: 16),

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
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
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
              const SizedBox(height: 24),

              // Header Section
              Column(
                children: [
                  // Icon with gradient background container
                  Container(
                    width: 65,
                    height: 65,
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
                      Icons.psychology,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 18),

                  // Title
                  Text(
                    'additional_info.accomplishment_title'.tr(),
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
                    'additional_info.accomplishment_subtitle'.tr(),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 16,
                          height: 1.5,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),

              const SizedBox(height: 30),

              // Hidden field to persist accomplishment in parent form
              FormBuilderField<String>(
                name: 'accomplishment',
                initialValue: selectedAccomplishment,
                builder: (field) => const SizedBox.shrink(),
              ),

              // Accomplishment Selection Cards
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      _buildAccomplishmentCard(
                        accomplishmentKey: 'eat_healthier',
                        title:
                            'additional_info.accomplishment_options.eat_healthier'
                                .tr(),
                        icon: Icons.apple,
                        color: const Color(0xFF4CAF50),
                      ),
                      _buildAccomplishmentCard(
                        accomplishmentKey: 'boost_energy',
                        title:
                            'additional_info.accomplishment_options.boost_energy'
                                .tr(),
                        icon: Icons.wb_sunny,
                        color: const Color(0xFFFF9800),
                      ),
                      _buildAccomplishmentCard(
                        accomplishmentKey: 'stay_motivated',
                        title:
                            'additional_info.accomplishment_options.stay_motivated'
                                .tr(),
                        icon: Icons.fitness_center,
                        color: const Color(0xFF2196F3),
                      ),
                      _buildAccomplishmentCard(
                        accomplishmentKey: 'feel_better',
                        title:
                            'additional_info.accomplishment_options.feel_better'
                                .tr(),
                        icon: Icons.self_improvement,
                        color: const Color(0xFF9C27B0),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Continue button
              CommonNextButton(
                onPressed:
                    selectedAccomplishment != null ? widget.onNext : null,
                isEnabled: selectedAccomplishment != null,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  @override
  bool get wantKeepAlive => true;
}
