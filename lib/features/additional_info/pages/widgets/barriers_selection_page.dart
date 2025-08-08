import 'package:cal_ai/extensions/context.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class BarriersSelectionPage extends StatefulWidget {
  final VoidCallback? onNext;
  final Function(List<String>)? onSelectionChanged;

  const BarriersSelectionPage({
    super.key,
    this.onNext,
    this.onSelectionChanged,
  });

  @override
  State<BarriersSelectionPage> createState() => _BarriersSelectionPageState();
}

class _BarriersSelectionPageState extends State<BarriersSelectionPage> {
  final Set<String> _selected = {};

  void _toggle(String key) {
    setState(() {
      if (_selected.contains(key)) {
        _selected.remove(key);
      } else {
        _selected.add(key);
      }
    });
    widget.onSelectionChanged?.call(_selected.toList());
  }

  Widget _item({
    required String keyValue,
    required IconData icon,
    required String title,
  }) {
    final bool isSelected = _selected.contains(keyValue);
    final Color base = context.colorScheme.primary;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isSelected ? base.withOpacity(0.08) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? base : Colors.grey.withOpacity(0.2),
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
          onTap: () => _toggle(keyValue),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Icon container with gradient background
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isSelected
                          ? [base, base.withOpacity(0.8)]
                          : [Colors.grey.shade100, Colors.grey.shade50],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: base.withOpacity(0.3),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: Icon(
                    icon,
                    color: isSelected ? Colors.white : Colors.grey.shade600,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                // Text content
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          color: isSelected
                              ? base
                              : Theme.of(context).colorScheme.onSurface,
                        ),
                  ),
                ),
                const SizedBox(width: 8),
                // Animated selection indicator
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? base : Colors.grey.withOpacity(0.4),
                      width: 2,
                    ),
                    color: isSelected ? base : Colors.transparent,
                  ),
                  child: isSelected
                      ? const Icon(
                          Icons.check,
                          color: Colors.white,
                          size: 14,
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
                  // Icon with gradient background
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          context.colorScheme.primary,
                          context.colorScheme.primary.withOpacity(0.8),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: context.colorScheme.primary.withOpacity(0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.psychology_rounded,
                      size: 30,
                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Title
                  Text(
                    'additional_info.barriers_title'.tr(),
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
                    'additional_info.barriers_subtitle'.tr(),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 14,
                          height: 1.4,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Options list - no scrolling
              Expanded(
                child: Column(
                  children: [
                    _item(
                      keyValue: 'consistency',
                      icon: Icons.trending_up_rounded,
                      title:
                          'additional_info.barriers_options.consistency'.tr(),
                    ),
                    _item(
                      keyValue: 'unhealthy_eating',
                      icon: Icons.fastfood_rounded,
                      title: 'additional_info.barriers_options.unhealthy_eating'
                          .tr(),
                    ),
                    _item(
                      keyValue: 'lack_of_supports',
                      icon: Icons.people_rounded,
                      title: 'additional_info.barriers_options.lack_of_supports'
                          .tr(),
                    ),
                    _item(
                      keyValue: 'busy_schedule',
                      icon: Icons.schedule_rounded,
                      title:
                          'additional_info.barriers_options.busy_schedule'.tr(),
                    ),
                    _item(
                      keyValue: 'lack_of_inspiration',
                      icon: Icons.restaurant_menu_rounded,
                      title:
                          'additional_info.barriers_options.lack_of_inspiration'
                              .tr(),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Continue button with gradient
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: LinearGradient(
                    colors: _selected.isNotEmpty
                        ? [
                            context.colorScheme.primary,
                            context.colorScheme.primary.withOpacity(0.8),
                          ]
                        : [
                            Colors.grey.withOpacity(0.3),
                            Colors.grey.withOpacity(0.3),
                          ],
                  ),
                  boxShadow: _selected.isNotEmpty
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
                  onPressed: _selected.isNotEmpty ? widget.onNext : null,
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
                        'additional_info.continue'.tr(),
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: _selected.isNotEmpty
                                      ? Colors.white
                                      : Colors.grey.withOpacity(0.7),
                                ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.arrow_forward_rounded,
                        color: _selected.isNotEmpty
                            ? Colors.white
                            : Colors.grey.withOpacity(0.7),
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
