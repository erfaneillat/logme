import 'dart:math' as math;

import 'package:flutter/material.dart';

/// A reusable circular progress ring with a configurable stroke and a center child.
///
/// This draws a circular track and a progress arc on top of it. The [child]
/// widget is placed at the center of the ring (commonly an [Icon] or text).
class ProgressRing extends StatelessWidget {
  const ProgressRing({
    super.key,
    required this.progress,
    required this.color,
    this.backgroundColor,
    this.strokeWidth = 8.0,
    this.child,
    this.startAngle = -math.pi / 2,
  });

  /// Progress value from 0.0 to 1.0.
  final double progress;

  /// Color of the progress arc.
  final Color color;

  /// Background track color. If null, falls back to [Theme.of].dividerColor.
  final Color? backgroundColor;

  /// Stroke width of the ring.
  final double strokeWidth;

  /// Optional widget to render in the middle of the ring.
  final Widget? child;

  /// Angle where the progress arc starts. Defaults to top (-pi/2).
  final double startAngle;

  @override
  Widget build(BuildContext context) {
    final Color trackColor = backgroundColor ?? Theme.of(context).dividerColor;
    return CustomPaint(
      painter: _RingPainter(
        progress: progress.clamp(0.0, 1.0),
        color: color,
        backgroundColor: trackColor,
        strokeWidth: strokeWidth,
        startAngle: startAngle,
      ),
      child: child == null
          ? const SizedBox.expand()
          : Center(child: child),
    );
  }
}

/// Animated variant that smoothly animates to [progress].
class AnimatedProgressRing extends StatelessWidget {
  const AnimatedProgressRing({
    super.key,
    required this.progress,
    required this.color,
    this.backgroundColor,
    this.strokeWidth = 8.0,
    this.child,
    this.duration = const Duration(milliseconds: 800),
    this.curve = Curves.easeOutCubic,
    this.startAngle = -math.pi / 2,
  });

  final double progress;
  final Color color;
  final Color? backgroundColor;
  final double strokeWidth;
  final Widget? child;
  final Duration duration;
  final Curve curve;
  final double startAngle;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: progress.clamp(0.0, 1.0)),
      duration: duration,
      curve: curve,
      builder: (context, value, _) {
        return ProgressRing(
          progress: value,
          color: color,
          backgroundColor: backgroundColor,
          strokeWidth: strokeWidth,
          child: child,
          startAngle: startAngle,
        );
      },
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({
    required this.progress,
    required this.color,
    required this.backgroundColor,
    required this.strokeWidth,
    required this.startAngle,
  });

  final double progress;
  final Color color;
  final Color backgroundColor;
  final double strokeWidth;
  final double startAngle;

  @override
  void paint(Canvas canvas, Size size) {
    final Offset center = size.center(Offset.zero);
    final double radius = (size.shortestSide - strokeWidth) / 2;
    final Rect rect = Rect.fromCircle(center: center, radius: radius);

    final Paint basePaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final Paint progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    // Track
    canvas.drawArc(rect, startAngle, 2 * math.pi, false, basePaint);

    // Progress
    final double sweep = 2 * math.pi * progress.clamp(0.0, 1.0);
    if (sweep > 0) {
      canvas.drawArc(rect, startAngle, sweep, false, progressPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.color != color ||
        oldDelegate.backgroundColor != backgroundColor ||
        oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.startAngle != startAngle;
  }
}






