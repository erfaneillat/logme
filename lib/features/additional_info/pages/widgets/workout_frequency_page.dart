import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'common_next_button.dart';

class WorkoutFrequencyPage extends StatefulWidget {
  final GlobalKey<FormBuilderState> formKey;
  final String? initialValue;
  final VoidCallback? onNext;
  final bool showNext;
  final Function(String)? onSelectionChanged;

  const WorkoutFrequencyPage({
    super.key,
    required this.formKey,
    required this.initialValue,
    this.onNext,
    this.showNext = true,
    this.onSelectionChanged,
  });

  @override
  State<WorkoutFrequencyPage> createState() => _WorkoutFrequencyPageState();
}

class _WorkoutFrequencyPageState extends State<WorkoutFrequencyPage>
    with TickerProviderStateMixin, AutomaticKeepAliveClientMixin {
  String? selectedFrequency;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    selectedFrequency = widget.initialValue;

    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final workoutOptions = [
      {
        'key': '0-2',
        'title': 'additional_info.workout_frequency_0_2_title'.tr(),
        'subtitle': 'additional_info.workout_frequency_0_2_subtitle'.tr(),
        'icon': Icons.fitness_center,
        'color': const Color(0xFFE57373),
        'gradient': const LinearGradient(
          colors: [Color(0xFFE57373), Color(0xFFEF5350)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      },
      {
        'key': '3-5',
        'title': 'additional_info.workout_frequency_3_5_title'.tr(),
        'subtitle': 'additional_info.workout_frequency_3_5_subtitle'.tr(),
        'icon': Icons.directions_run,
        'color': const Color(0xFF81C784),
        'gradient': const LinearGradient(
          colors: [Color(0xFF81C784), Color(0xFF66BB6A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      },
      {
        'key': '6+',
        'title': 'additional_info.workout_frequency_6_plus_title'.tr(),
        'subtitle': 'additional_info.workout_frequency_6_plus_subtitle'.tr(),
        'icon': Icons.sports_gymnastics,
        'color': const Color(0xFF64B5F6),
        'gradient': const LinearGradient(
          colors: [Color(0xFF64B5F6), Color(0xFF42A5F5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      },
    ];

    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            children: [
              const SizedBox(height: 40),

              // Header Section
              _buildHeader(),

              const SizedBox(height: 40),

              // Hidden field to bind to parent form
              FormBuilderField<String>(
                name: 'workoutFrequency',
                initialValue: selectedFrequency,
                builder: (field) => const SizedBox.shrink(),
              ),

              // Workout frequency options
              Expanded(
                child: Column(
                  children: workoutOptions.asMap().entries.map((entry) {
                    final index = entry.key;
                    final option = entry.value;
                    final isSelected = selectedFrequency == option['key'];

                    return AnimatedContainer(
                      duration: Duration(milliseconds: 300 + (index * 100)),
                      curve: Curves.easeInOut,
                      margin: const EdgeInsets.only(bottom: 16),
                      child: _WorkoutFrequencyCard(
                        title: option['title'] as String,
                        subtitle: option['subtitle'] as String,
                        icon: option['icon'] as IconData,
                        color: option['color'] as Color,
                        gradient: option['gradient'] as LinearGradient,
                        frequency: option['key'] as String,
                        isSelected: isSelected,
                        onTap: () {
                          setState(() =>
                              selectedFrequency = option['key'] as String);
                          widget.onSelectionChanged
                              ?.call(option['key'] as String);
                          final field = widget
                              .formKey.currentState?.fields['workoutFrequency'];
                          field?.didChange(option['key'] as String);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 24),

              // Next button
              if (widget.showNext) _buildNextButton(),

              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        // Icon
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Theme.of(context).colorScheme.primary,
                Theme.of(context).colorScheme.primary.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
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
          'additional_info.workout_frequency_title'.tr(),
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 28,
                height: 1.2,
              ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 12),

        // Subtitle
        Text(
          'additional_info.workout_frequency_subtitle'.tr(),
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 16,
                height: 1.5,
              ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildNextButton() {
    return CommonNextButton(
      onPressed: selectedFrequency != null ? widget.onNext : null,
      isEnabled: selectedFrequency != null,
    );
  }

  @override
  bool get wantKeepAlive => true;
}

class _WorkoutFrequencyCard extends StatefulWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final LinearGradient gradient;
  final String frequency;
  final bool isSelected;
  final VoidCallback onTap;

  const _WorkoutFrequencyCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.gradient,
    required this.frequency,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_WorkoutFrequencyCard> createState() => _WorkoutFrequencyCardState();
}

class _WorkoutFrequencyCardState extends State<_WorkoutFrequencyCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.02,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(_WorkoutFrequencyCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected != oldWidget.isSelected) {
      if (widget.isSelected) {
        _animationController.forward();
      } else {
        _animationController.reverse();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Transform.scale(
          scale: _isHovered ? 1.02 : 1.0,
          child: GestureDetector(
            onTap: widget.onTap,
            onTapDown: (_) => setState(() => _isHovered = true),
            onTapUp: (_) => setState(() => _isHovered = false),
            onTapCancel: () => setState(() => _isHovered = false),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: widget.isSelected ? widget.gradient : null,
                color: widget.isSelected ? null : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: widget.isSelected
                      ? widget.color
                      : Colors.grey.withOpacity(0.2),
                  width: widget.isSelected ? 2 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: widget.isSelected
                        ? widget.color.withOpacity(0.3)
                        : Colors.black.withOpacity(0.05),
                    blurRadius: widget.isSelected ? 15 : 8,
                    offset: const Offset(0, 4),
                    spreadRadius: widget.isSelected ? 2 : 0,
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Icon Container
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: widget.isSelected
                          ? Colors.white.withOpacity(0.2)
                          : widget.color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      widget.icon,
                      color: widget.isSelected ? Colors.white : widget.color,
                      size: 28,
                    ),
                  ),

                  const SizedBox(width: 16),

                  // Text Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(
                                color: widget.isSelected
                                    ? Colors.white
                                    : Theme.of(context).colorScheme.onSurface,
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.subtitle,
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: widget.isSelected
                                        ? Colors.white.withOpacity(0.9)
                                        : Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant,
                                    fontSize: 14,
                                    height: 1.4,
                                  ),
                        ),
                      ],
                    ),
                  ),

                  // Frequency Indicator
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: widget.isSelected
                          ? Colors.white.withOpacity(0.2)
                          : widget.color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: _buildFrequencyIndicator(),
                  ),

                  const SizedBox(width: 12),

                  // Selection Indicator
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color:
                          widget.isSelected ? Colors.white : Colors.transparent,
                      border: Border.all(
                        color: widget.isSelected
                            ? Colors.white
                            : Colors.grey.withOpacity(0.3),
                        width: 2,
                      ),
                    ),
                    child: widget.isSelected
                        ? Icon(
                            Icons.check,
                            size: 16,
                            color: widget.color,
                          )
                        : null,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildFrequencyIndicator() {
    final isSelected = widget.isSelected;
    final color = isSelected ? Colors.white : widget.color;

    switch (widget.frequency) {
      case '0-2':
        return Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildDot(color, 6),
              const SizedBox(width: 2),
              _buildDot(color, 6),
            ],
          ),
        );
      case '3-5':
        return Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildDot(color, 5),
              const SizedBox(width: 2),
              _buildDot(color, 5),
              const SizedBox(width: 2),
              _buildDot(color, 5),
            ],
          ),
        );
      case '6+':
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildDot(color, 4),
                  const SizedBox(width: 2),
                  _buildDot(color, 4),
                  const SizedBox(width: 2),
                  _buildDot(color, 4),
                ],
              ),
              const SizedBox(height: 2),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildDot(color, 4),
                  const SizedBox(width: 2),
                  _buildDot(color, 4),
                  const SizedBox(width: 2),
                  _buildDot(color, 4),
                ],
              ),
            ],
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildDot(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
      ),
    );
  }
}
