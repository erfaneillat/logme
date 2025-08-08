import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'loading_size.dart';

class CustomLoadingWidget extends HookWidget {
  const CustomLoadingWidget({
    super.key,
    this.color,
    this.size = LoadingSize.medium,
  });

  const CustomLoadingWidget.small({
    super.key,
    this.color,
  }) : size = LoadingSize.small;

  const CustomLoadingWidget.large({
    super.key,
    this.color,
  }) : size = LoadingSize.large;

  final Color? color;
  final LoadingSize size;

  @override
  Widget build(BuildContext context) {
    final animationController = useAnimationController(
      duration: const Duration(milliseconds: 1200),
    );

    useEffect(() {
      animationController.repeat();
      return null;
    }, []);

    double dotSize;
    double spacing;

    switch (size) {
      case LoadingSize.small:
        dotSize = 6;
        spacing = 8;
        break;
      case LoadingSize.medium:
        dotSize = 8;
        spacing = 12;
        break;
      case LoadingSize.large:
        dotSize = 12;
        spacing = 16;
        break;
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return AnimatedBuilder(
          animation: animationController,
          builder: (context, child) {
            final delay = index * 0.2;
            final animation = Tween<double>(begin: 0.0, end: 1.0).animate(
              CurvedAnimation(
                parent: animationController,
                curve: Interval(
                  delay,
                  delay + 0.6,
                  curve: Curves.easeInOut,
                ),
              ),
            );

            // Create smooth back-and-forth motion
            final waveValue = (animation.value * 2 - 1).abs();
            final opacityValue = 0.3 + (0.7 * waveValue);

            return Container(
              margin: EdgeInsets.symmetric(horizontal: spacing / 2),
              child: Transform.translate(
                offset: Offset(0, -8 * waveValue),
                child: Container(
                  width: dotSize,
                  height: dotSize,
                  decoration: BoxDecoration(
                    color: (color ?? Theme.of(context).colorScheme.primary)
                        .withValues(alpha: opacityValue),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: (color ?? Theme.of(context).colorScheme.primary)
                            .withValues(alpha: 0.3 * waveValue),
                        blurRadius: 4 * waveValue,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      }),
    );
  }
}



class CenteredCustomLoadingWidget extends StatelessWidget {
  final Color? color;
  final LoadingSize size;

  const CenteredCustomLoadingWidget({
    super.key,
    this.color,
    this.size = LoadingSize.medium,
  });

  const CenteredCustomLoadingWidget.small({
    super.key,
    this.color,
  }) : size = LoadingSize.small;

  const CenteredCustomLoadingWidget.large({
    super.key,
    this.color,
  }) : size = LoadingSize.large;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: CustomLoadingWidget(
        color: color,
        size: size,
      ),
    );
  }
}

class LoadingStateWidget extends StatelessWidget {
  final bool isLoading;
  final Widget child;
  final Color? loadingColor;
  final LoadingSize? loadingSize;

  const LoadingStateWidget({
    super.key,
    required this.isLoading,
    required this.child,
    this.loadingColor,
    this.loadingSize,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return CenteredCustomLoadingWidget(
        size: loadingSize ?? LoadingSize.medium,
        color: loadingColor,
      );
    }
    return child;
  }
}

extension LoadingWidgetExtension on Widget {
  Widget withLoadingState({
    required bool isLoading,
    Color? loadingColor,
    LoadingSize? loadingSize,
  }) {
    return LoadingStateWidget(
      isLoading: isLoading,
      loadingColor: loadingColor,
      loadingSize: loadingSize,
      child: this,
    );
  }
}

class ShimmerLoadingWidget extends StatelessWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const ShimmerLoadingWidget({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius,
  });

  const ShimmerLoadingWidget.circular({
    super.key,
    required this.width,
    required this.height,
  }) : borderRadius = const BorderRadius.all(Radius.circular(100));

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final effectiveBorderRadius = borderRadius ?? BorderRadius.circular(4);

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
        borderRadius: effectiveBorderRadius,
      ),
      child: const Center(
        child: CustomLoadingWidget.small(),
      ),
    );
  }
}
