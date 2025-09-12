import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:cal_ai/common/widgets/progress_ring.dart';
import 'package:cal_ai/common/widgets/custom_loading_widget.dart';

class FoodAnalyzingPlaceholder extends StatefulWidget {
  const FoodAnalyzingPlaceholder({super.key});

  @override
  State<FoodAnalyzingPlaceholder> createState() =>
      _FoodAnalyzingPlaceholderState();
}

class _FoodAnalyzingPlaceholderState extends State<FoodAnalyzingPlaceholder>
    with TickerProviderStateMixin {
  late AnimationController _progressController;
  late Animation<double> _progressAnimation;

  @override
  void initState() {
    super.initState();

    // Create animation controller for the progress ring
    _progressController = AnimationController(
      duration: const Duration(seconds: 6), // Slower animation
      vsync: this,
    );

    // Create a smooth progress animation that goes from 0 to 85%
    _progressAnimation = Tween<double>(
      begin: 0.0,
      end: 0.85, // End at 85% for a more realistic feel (not quite complete)
    ).animate(CurvedAnimation(
      parent: _progressController,
      curve: Curves.easeInOut,
    ));

    // Start the animation when the widget is created
    _progressController.forward();
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Image square placeholder with analyzing ring
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 64,
              height: 64,
              color: Colors.grey.shade300,
              child: Center(
                child: SizedBox(
                  width: 36,
                  height: 36,
                  child: AnimatedBuilder(
                    animation: _progressAnimation,
                    builder: (context, child) {
                      return ProgressRing(
                        progress: _progressAnimation.value,
                        color: Colors.black87,
                        backgroundColor: Colors.grey.shade400,
                        strokeWidth: 4,
                        child: const Icon(
                          Icons.fastfood,
                          size: 18,
                          color: Colors.black87,
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Text skeletons
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'home.analyzing'.tr(),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: const [
                    Expanded(
                      flex: 6,
                      child: ShimmerLoadingWidget(
                          width: double.infinity, height: 10),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      flex: 4,
                      child: ShimmerLoadingWidget(
                          width: double.infinity, height: 10),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: const [
                    Expanded(
                      flex: 5,
                      child: ShimmerLoadingWidget(
                          width: double.infinity, height: 10),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      flex: 3,
                      child: ShimmerLoadingWidget(
                          width: double.infinity, height: 10),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // trailing spacing removed (no cancel button)
        ],
      ),
    );
  }
}
