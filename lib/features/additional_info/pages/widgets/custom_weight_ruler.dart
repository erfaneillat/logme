import 'package:flutter/material.dart';

class CustomWeightRuler extends StatefulWidget {
  final List<int> weightValues;
  final double selectedWeight;
  final Color goalColor;
  final Function(double) onWeightChanged;

  const CustomWeightRuler({
    super.key,
    required this.weightValues,
    required this.selectedWeight,
    required this.goalColor,
    required this.onWeightChanged,
  });

  @override
  State<CustomWeightRuler> createState() => _CustomWeightRulerState();
}

class _CustomWeightRulerState extends State<CustomWeightRuler> {
  late final ScrollController _scrollController;
  late int _selectedIndex;
  bool _initializedScroll = false;
  bool _isSnapping = false;

  // Visual tuning
  static const double _itemWidth = 14.0; // width per kg
  static const double _tickThickness = 2.0;

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.weightValues.indexOf(widget.selectedWeight.round());
    if (_selectedIndex < 0) _selectedIndex = 0;
    _scrollController = ScrollController();
  }

  @override
  void didUpdateWidget(CustomWeightRuler oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedWeight != widget.selectedWeight) {
      final idx = widget.weightValues.indexOf(widget.selectedWeight.round());
      if (idx >= 0 && idx != _selectedIndex) {
        _selectedIndex = idx;
        if (_initializedScroll && _scrollController.hasClients) {
          final double target = _targetOffsetForIndex(_selectedIndex);
          if ((_scrollController.offset - target).abs() >= 0.5) {
            _isSnapping = true;
            _scrollController
                .animateTo(
                  target,
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeOut,
                )
                .whenComplete(() => _isSnapping = false);
          }
        }
      }
    }
  }

  double _targetOffsetForIndex(int index) => index * _itemWidth;

  void _handleScrollUpdate(double pixels) {
    if (_isSnapping) return;
    final int newIndex =
        (pixels / _itemWidth).round().clamp(0, widget.weightValues.length - 1);
    if (newIndex != _selectedIndex) {
      setState(() => _selectedIndex = newIndex);
      widget.onWeightChanged(widget.weightValues[newIndex].toDouble());
    }
  }

  void _handleScrollEnd() {
    if (_isSnapping || !_scrollController.hasClients) return;
    final double target = _targetOffsetForIndex(_selectedIndex);
    if ((_scrollController.offset - target).abs() < 0.5) return;
    _isSnapping = true;
    _scrollController
        .animateTo(
          target,
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
        )
        .whenComplete(() => _isSnapping = false);
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final double sidePadding =
            (constraints.maxWidth / 2) - (_itemWidth / 2);

        // Initialize initial jump once we know width
        if (!_initializedScroll) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _scrollController.jumpTo(_targetOffsetForIndex(_selectedIndex));
            setState(() => _initializedScroll = true);
          });
        }

        return Stack(
          children: [
            NotificationListener<ScrollNotification>(
              onNotification: (notification) {
                if (notification is ScrollUpdateNotification) {
                  _handleScrollUpdate(notification.metrics.pixels);
                } else if (notification is ScrollEndNotification) {
                  _handleScrollEnd();
                }
                return false;
              },
              child: ListView.builder(
                controller: _scrollController,
                physics: const BouncingScrollPhysics(),
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.symmetric(horizontal: sidePadding),
                itemCount: widget.weightValues.length,
                itemBuilder: (context, i) {
                  final int value = widget.weightValues[i];
                  final bool isSelected = i == _selectedIndex;
                  final bool isMajor = value % 10 == 0;
                  final double baseHeight = isMajor ? 42 : 26;
                  final double height =
                      isSelected ? baseHeight + 16 : baseHeight;
                  final Color lineColor = isSelected
                      ? widget.goalColor
                      : (isMajor ? Colors.grey.shade600 : Colors.grey.shade400);

                  return SizedBox(
                    width: _itemWidth,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        // Tick line
                        Container(
                          width: _tickThickness,
                          height: height,
                          decoration: BoxDecoration(
                            color: lineColor,
                            borderRadius: BorderRadius.circular(1),
                          ),
                        ),
                        const SizedBox(height: 6),
                        // Label every 10 kg
                        if (isMajor)
                          Text(
                            value.toString(),
                            style: TextStyle(
                              fontSize: isSelected ? 13 : 12,
                              fontWeight: isSelected
                                  ? FontWeight.w700
                                  : FontWeight.w600,
                              color: isSelected
                                  ? widget.goalColor
                                  : Colors.grey.shade700,
                            ),
                          )
                        else
                          const SizedBox(height: 18),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Center highlight track
            // Positioned(
            //   left: 20,
            //   right: 20,
            //   top: constraints.maxHeight / 2 - 19,
            //   child: Container(
            //     height: 38,
            //     decoration: BoxDecoration(
            //       color: widget.goalColor.withOpacity(0.08),
            //       borderRadius: BorderRadius.circular(12),
            //       border: Border.all(
            //         color: widget.goalColor.withOpacity(0.25),
            //         width: 1,
            //       ),
            //     ),
            //   ),
            // ),

            // Center indicator triangle
            // Positioned(
            //   top: (constraints.maxHeight / 2) - 40,
            //   left: constraints.maxWidth / 2 - 10,
            //   child: CustomPaint(
            //     size: const Size(20, 20),
            //     painter: TrianglePainter(color: widget.goalColor),
            //   ),
            // ),
          ],
        );
      },
    );
  }
}

class TrianglePainter extends CustomPainter {
  final Color color;
  TrianglePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    // Shadow
    final Paint shadowPaint = Paint()
      ..color = Colors.black.withOpacity(0.1)
      ..style = PaintingStyle.fill;

    final Path shadowPath = Path()
      ..moveTo(size.width / 2, 2)
      ..lineTo(2, size.height + 2)
      ..lineTo(size.width - 2, size.height + 2)
      ..close();
    canvas.drawPath(shadowPath, shadowPaint);

    // Triangle
    final Paint paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final Path path = Path()
      ..moveTo(size.width / 2, 0)
      ..lineTo(0, size.height)
      ..lineTo(size.width, size.height)
      ..close();
    canvas.drawPath(path, paint);

    // Border
    final Paint borderPaint = Paint()
      ..color = color.withOpacity(0.85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    canvas.drawPath(path, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
