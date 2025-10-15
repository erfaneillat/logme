import 'dart:math';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class LuckyWheelDialog extends StatefulWidget {
  const LuckyWheelDialog({super.key, required this.onClaim});

  final VoidCallback onClaim;

  @override
  State<LuckyWheelDialog> createState() => _LuckyWheelDialogState();
}

class _LuckyWheelDialogState extends State<LuckyWheelDialog>
    with TickerProviderStateMixin {
  double _turns = 0;
  bool _isSpinning = false;
  bool _hasSpun = false;
  late AnimationController _bounceController;
  late AnimationController _glowController;
  late Animation<double> _bounceAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _bounceController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _glowController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    _bounceAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _bounceController, curve: Curves.elasticOut),
    );
    _glowAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _bounceController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async => false,
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        elevation: 20,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(32),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Colors.white,
                Colors.grey[50]!,
              ],
            ),
          ),
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ShaderMask(
                    shaderCallback: (bounds) => LinearGradient(
                      colors: [Colors.purple[600]!, Colors.pink[600]!],
                    ).createShader(bounds),
                    child: Text(
                      'subscription.lucky_wheel.title'.tr(),
                      style:
                          Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                                color: Colors.white,
                              ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 16),
                  AnimatedBuilder(
                    animation: _glowAnimation,
                    builder: (context, child) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.red[400]!,
                              Colors.red[600]!,
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.red
                                  .withOpacity(0.3 * _glowAnimation.value),
                              blurRadius: 8 + (4 * _glowAnimation.value),
                              spreadRadius: 2 * _glowAnimation.value,
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.flash_on,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'subscription.lucky_wheel.hurry_badge'.tr(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'subscription.lucky_wheel.subtitle'.tr(),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: Colors.grey[800],
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'subscription.lucky_wheel.description'.tr(),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                          height: 1.5,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  AnimatedBuilder(
                    animation: _bounceAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _bounceAnimation.value,
                        child: SizedBox(
                          height: 280,
                          width: 280,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              AnimatedRotation(
                                turns: _turns,
                                duration: const Duration(milliseconds: 3500),
                                curve: Curves.easeOutQuart,
                                onEnd: () {
                                  if (mounted) {
                                    setState(() {
                                      _isSpinning = false;
                                      _hasSpun = true;
                                    });
                                    _bounceController.forward().then((_) {
                                      _bounceController.reverse();
                                    });
                                  }
                                },
                                child: _buildWheel(),
                              ),
                              const Positioned(
                                top: -16,
                                child: _PointerIndicator(isSpinning: false),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 32),
                  AnimatedBuilder(
                    animation: _glowAnimation,
                    builder: (context, child) {
                      return Container(
                        width: double.infinity,
                        height: 56,
                        decoration: BoxDecoration(
                          gradient: _hasSpun
                              ? LinearGradient(
                                  colors: [
                                    Colors.green[400]!,
                                    Colors.green[600]!
                                  ],
                                )
                              : LinearGradient(
                                  colors: [
                                    Colors.purple[600]!,
                                    Colors.pink[600]!
                                  ],
                                ),
                          borderRadius: BorderRadius.circular(28),
                          boxShadow: [
                            BoxShadow(
                              color: (_hasSpun ? Colors.green : Colors.purple)
                                  .withOpacity(
                                      0.3 + (0.2 * _glowAnimation.value)),
                              blurRadius: 12 + (4 * _glowAnimation.value),
                              spreadRadius: 2 * _glowAnimation.value,
                            ),
                          ],
                        ),
                        child: ElevatedButton(
                          onPressed: _isSpinning
                              ? null
                              : _hasSpun
                                  ? widget.onClaim
                                  : _spinWheel,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(28),
                            ),
                          ),
                          child: _isSpinning
                              ? Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      'subscription.lucky_wheel.spinning'.tr(),
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (_hasSpun) ...[
                                      const Icon(
                                        Icons.check_circle,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                    ] else ...[
                                      const Icon(
                                        Icons.casino,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                    ],
                                    Expanded(
                                      child: Text(
                                        _hasSpun
                                            ? 'subscription.lucky_wheel.result_cta'.tr()
                                            : 'subscription.lucky_wheel.spin_button'.tr(),
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                        textAlign: TextAlign.center,
                                        overflow: TextOverflow.ellipsis,
                                        maxLines: 1,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWheel() {
    final wheelItems = [
      _WheelItem(
        colors: [Colors.red[400]!, Colors.red[600]!],
        label: '۷۰٪\nتخفیف',
        isSpecial: true,
      ),
      _WheelItem(
        colors: [Colors.green[400]!, Colors.green[600]!],
        label: '۵۰٪\nتخفیف',
      ),
      _WheelItem(
        colors: [Colors.orange[400]!, Colors.orange[500]!],
        label: '۳۰٪\nتخفیف',
      ),
      _WheelItem(
        colors: [Colors.blue[400]!, Colors.blue[600]!],
        label: '۲۰٪\nتخفیف',
      ),
      _WheelItem(
        colors: [Colors.purple[400]!, Colors.purple[600]!],
        label: '۱۰٪\nتخفیف',
      ),
      _WheelItem(
        colors: [Colors.grey[400]!, Colors.grey[600]!],
        label: 'پوچ',
      ),
    ];

    return Stack(
      alignment: Alignment.center,
      children: [
        SizedBox.expand(
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  Colors.white,
                  Colors.grey[100]!,
                  Colors.grey[200]!,
                ],
                stops: const [0.0, 0.7, 1.0],
              ),
              border: Border.all(
                color: Colors.grey[300]!,
                width: 3,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.15),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
                BoxShadow(
                  color: Colors.white.withOpacity(0.8),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
          ),
        ),
        for (int i = 0; i < wheelItems.length; i++)
          Positioned.fill(
            child: CustomPaint(
              painter: _SlicePainter(
                colors: wheelItems[i].colors,
                startAngle: -pi / 2 + i * (2 * pi / wheelItems.length),
                sweepAngle: 2 * pi / wheelItems.length,
              ),
            ),
          ),
        Positioned.fill(
          child: _WheelLabelsLayer(items: wheelItems),
        ),
        Center(
          child: Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white,
                  Colors.grey[50]!,
                ],
              ),
              border: Border.all(
                color: Colors.grey[400]!,
                width: 3,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: _hasSpun
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '70%',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.red[600],
                          height: 1,
                        ),
                      ),
                      Text(
                        'OFF',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.red[600],
                          height: 1,
                        ),
                      ),
                    ],
                  )
                : Icon(
                    Icons.casino,
                    size: 36,
                    color: Colors.grey[600],
                  ),
          ),
        ),
      ],
    );
  }

  void _spinWheel() {
    setState(() {
      _isSpinning = true;
      const totalSlices = 6;
      const targetSlice = 0; // 70%

      final currentFraction = _turns - _turns.floorToDouble();
      final randomFullTurns = 4 + Random().nextInt(3);
      final targetFraction = 1 - ((targetSlice + 0.5) / totalSlices);

      final additionalTurns = randomFullTurns + (targetFraction - currentFraction);
      _turns += additionalTurns;
    });

    _glowController.repeat(reverse: true);

    Future.delayed(const Duration(milliseconds: 3500), () {
      if (mounted) {
        _glowController.stop();
        _glowController.reset();
      }
    });
  }
}

class _WheelItem {
  const _WheelItem({
    required this.colors,
    required this.label,
    this.isSpecial = false,
  });

  final List<Color> colors;
  final String label;
  final bool isSpecial;
}

class _SlicePainter extends CustomPainter {
  _SlicePainter({
    required this.colors,
    required this.startAngle,
    required this.sweepAngle,
  });

  final List<Color> colors;
  final double startAngle;
  final double sweepAngle;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final paint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: colors,
      ).createShader(Rect.fromCircle(center: center, radius: radius));

    final path = Path()
      ..moveTo(center.dx, center.dy)
      ..arcTo(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
      )
      ..close();

    canvas.drawPath(path, paint);

    final borderPaint = Paint()
      ..color = Colors.white.withOpacity(0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    canvas.drawPath(path, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _SliceLabel extends StatelessWidget {
  const _SliceLabel({required this.item});

  final _WheelItem item;

  @override
  Widget build(BuildContext context) {
    final isNone = item.label.contains('پوچ');

    BoxDecoration decoration;
    Color textColor;

    if (item.isSpecial) {
      decoration = BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.orangeAccent.withOpacity(0.95),
            Colors.redAccent,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.redAccent.withOpacity(0.45),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(color: Colors.white.withOpacity(0.85), width: 1.2),
      );
      textColor = Colors.white;
    } else if (isNone) {
      decoration = BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withOpacity(0.4), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      );
      textColor = Colors.grey[800]!;
    } else {
      decoration = BoxDecoration(
        color: Colors.black.withOpacity(0.3),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.4), width: 0.8),
      );
      textColor = Colors.white;
    }

    return Container(
      width: 60,
      height: 40,
      decoration: decoration,
      child: Center(
        child: Text(
          item.label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: textColor,
            letterSpacing: 0.3,
            height: 1.1,
          ),
        ),
      ),
    );
  }
}

class _WheelLabelsLayer extends StatelessWidget {
  const _WheelLabelsLayer({required this.items});

  final List<_WheelItem> items;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = constraints.biggest.shortestSide;
        final radius = size / 2;
        final sweep = 2 * pi / items.length;

        return Stack(
          children: List.generate(items.length, (index) {
            final startAngle = -pi / 2 + index * sweep;
            final labelAngle = startAngle + sweep / 2;
            final labelRadius = radius * 0.65;

            final x = radius + (labelRadius * cos(labelAngle)) - 25;
            final y = radius + (labelRadius * sin(labelAngle)) - 15;

            return Positioned(
              left: x,
              top: y,
              child: Transform.rotate(
                angle: labelAngle + pi / 2,
                child: _SliceLabel(item: items[index]),
              ),
            );
          }),
        );
      },
    );
  }
}

class _PointerIndicator extends StatelessWidget {
  const _PointerIndicator({required this.isSpinning});

  final bool isSpinning;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      duration: const Duration(milliseconds: 400),
      scale: isSpinning ? 1.2 : 1.0,
      child: Container(
        width: 32,
        height: 32,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
        ),
        child: CustomPaint(
          size: const Size(32, 32),
          painter: _PointerPainter(isSpinning: isSpinning),
        ),
      ),
    );
  }
}

class _PointerPainter extends CustomPainter {
  const _PointerPainter({required this.isSpinning});

  final bool isSpinning;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    if (isSpinning) {
      final glowPaint = Paint()
        ..color = Colors.red.withOpacity(0.3)
        ..style = PaintingStyle.fill;

      canvas.drawCircle(center, radius * 1.2, glowPaint);
    }

    final gradient = RadialGradient(
      colors: [
        Colors.red[400]!,
        Colors.red[600]!,
        Colors.red[800]!,
      ],
      stops: const [0.0, 0.7, 1.0],
    );

    final paint = Paint()
      ..shader =
          gradient.createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(center.dx, center.dy + radius * 0.8)
      ..lineTo(center.dx + radius * 0.6, center.dy - radius * 0.4)
      ..lineTo(center.dx - radius * 0.6, center.dy - radius * 0.4)
      ..close();

    canvas.drawPath(path, paint);

    final highlightPaint = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..style = PaintingStyle.fill;

    final highlightPath = Path()
      ..moveTo(center.dx, center.dy + radius * 0.6)
      ..lineTo(center.dx + radius * 0.3, center.dy - radius * 0.2)
      ..lineTo(center.dx - radius * 0.3, center.dy - radius * 0.2)
      ..close();

    canvas.drawPath(highlightPath, highlightPaint);

    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawPath(path, borderPaint);

    final dotPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    canvas.drawCircle(center, 3, dotPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return oldDelegate is _PointerPainter && oldDelegate.isSpinning != isSpinning;
  }
}
