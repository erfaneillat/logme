import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:cal_ai/extensions/context.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'common_next_button.dart';

class WeightLossSpeedPage extends StatefulWidget {
  final GlobalKey<FormBuilderState> formKey;
  final double? initialValue;
  final Function(double) onSelectionChanged;
  final VoidCallback? onNext;
  final String? goal; // 'lose_weight' | 'gain_weight'

  const WeightLossSpeedPage({
    super.key,
    required this.formKey,
    this.initialValue,
    required this.onSelectionChanged,
    this.onNext,
    this.goal,
  });

  @override
  State<WeightLossSpeedPage> createState() => _WeightLossSpeedPageState();
}

class _WeightLossSpeedPageState extends State<WeightLossSpeedPage>
    with TickerProviderStateMixin, AutomaticKeepAliveClientMixin {
  double? selectedSpeed;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  final List<WeightLossSpeedOption> speedOptions = [
    WeightLossSpeedOption(
      value: 0.1,
      title: '0.1 kg',
      subtitle: 'additional_info.slow_and_steady'.tr(),
      icon: Icons.directions_walk,
      color: const Color(0xFF8B4513),
      gradient: const LinearGradient(
        colors: [Color(0xFF8B4513), Color(0xFFA0522D)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    WeightLossSpeedOption(
      value: 0.8,
      title: '0.8 kg',
      subtitle: 'additional_info.moderate_pace'.tr(),
      icon: Icons.directions_run,
      color: const Color(0xFF2196F3),
      gradient: const LinearGradient(
        colors: [Color(0xFF2196F3), Color(0xFF1976D2)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    WeightLossSpeedOption(
      value: 1.5,
      title: '1.5 kg',
      subtitle: 'additional_info.fast_track'.tr(),
      icon: Icons.flash_on,
      color: const Color(0xFFFF9800),
      gradient: const LinearGradient(
        colors: [Color(0xFFFF9800), Color(0xFFF57C00)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
  ];

  @override
  void initState() {
    super.initState();
    selectedSpeed = widget.initialValue ?? 0.1;

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

    // Ensure default selection is synced to the parent state and form
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (selectedSpeed != null) {
        // Update the hidden form field so validation passes
        final field = widget.formKey.currentState?.fields['weightLossSpeed'];
        field?.didChange(selectedSpeed);
        // Propagate to parent so onNext condition is satisfied without re-tap
        widget.onSelectionChanged(selectedSpeed!);
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _selectSpeed(double speed) {
    setState(() {
      selectedSpeed = speed;
    });
    widget.onSelectionChanged(speed);
    final field = widget.formKey.currentState?.fields['weightLossSpeed'];
    field?.didChange(speed);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final bool isGain = widget.goal == 'gain_weight';

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
              _buildHeader(isGain),

              const SizedBox(height: 40),

              // Hidden field to persist value in parent form
              FormBuilderField<double>(
                name: 'weightLossSpeed',
                initialValue: selectedSpeed,
                builder: (field) => const SizedBox.shrink(),
              ),

              // Speed selection cards
              Expanded(
                child: Column(
                  children: speedOptions.asMap().entries.map((entry) {
                    final index = entry.key;
                    final option = entry.value;
                    final isSelected = selectedSpeed == option.value;

                    return AnimatedContainer(
                      duration: Duration(milliseconds: 300 + (index * 100)),
                      curve: Curves.easeInOut,
                      margin: const EdgeInsets.only(bottom: 16),
                      child: _WeightLossSpeedCard(
                        title: option.title,
                        subtitle: option.subtitle,
                        icon: option.icon,
                        color: option.color,
                        gradient: option.gradient,
                        speed: option.value,
                        isSelected: isSelected,
                        onTap: () => _selectSpeed(option.value),
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 24),

              // Next button
              _buildNextButton(),

              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(bool isGain) {
    return Column(
      children: [
        // Icon
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                context.colorScheme.primary,
                context.colorScheme.primary.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
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
            isGain ? Icons.trending_up : Icons.trending_down,
            size: 40,
            color: Colors.white,
          ),
        ),

        const SizedBox(height: 24),

        // Title
        Text(
          isGain
              ? 'additional_info.weight_gain_speed_title'.tr()
              : 'additional_info.weight_loss_speed_title'.tr(),
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
          isGain
              ? 'additional_info.weight_gain_speed_subtitle'.tr()
              : 'additional_info.weight_loss_speed_subtitle'.tr(),
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
      onPressed: selectedSpeed != null ? widget.onNext : null,
      isEnabled: selectedSpeed != null,
    );
  }

  @override
  bool get wantKeepAlive => true;
}

class WeightLossSpeedOption {
  final double value;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final LinearGradient gradient;

  WeightLossSpeedOption({
    required this.value,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.gradient,
  });
}

class _WeightLossSpeedCard extends StatefulWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final LinearGradient gradient;
  final double speed;
  final bool isSelected;
  final VoidCallback onTap;

  const _WeightLossSpeedCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.gradient,
    required this.speed,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_WeightLossSpeedCard> createState() => _WeightLossSpeedCardState();
}

class _WeightLossSpeedCardState extends State<_WeightLossSpeedCard>
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
  void didUpdateWidget(_WeightLossSpeedCard oldWidget) {
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

                  // Speed Indicator
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: widget.isSelected
                          ? Colors.white.withOpacity(0.2)
                          : widget.color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: _buildSpeedIndicator(),
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

  Widget _buildSpeedIndicator() {
    final isSelected = widget.isSelected;
    final color = isSelected ? Colors.white : widget.color;

    // Create a visual indicator based on speed value
    if (widget.speed <= 0.1) {
      // Slow speed - single dot
      return Center(
        child: Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
          ),
        ),
      );
    } else if (widget.speed <= 0.8) {
      // Medium speed - two dots
      return Center(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color,
              ),
            ),
            const SizedBox(width: 4),
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color,
              ),
            ),
          ],
        ),
      );
    } else {
      // Fast speed - three dots
      return Center(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 5,
              height: 5,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color,
              ),
            ),
            const SizedBox(width: 3),
            Container(
              width: 5,
              height: 5,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color,
              ),
            ),
            const SizedBox(width: 3),
            Container(
              width: 5,
              height: 5,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color,
              ),
            ),
          ],
        ),
      );
    }
  }
}
