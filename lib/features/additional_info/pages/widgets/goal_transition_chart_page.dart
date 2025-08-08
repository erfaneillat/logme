import 'package:easy_localization/easy_localization.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'common_next_button.dart';

class GoalTransitionChartPage extends StatefulWidget {
  final String? goal; // 'lose_weight' | 'gain_weight' | 'maintain_weight'
  final VoidCallback? onNext;

  const GoalTransitionChartPage({
    super.key,
    required this.goal,
    this.onNext,
  });

  @override
  State<GoalTransitionChartPage> createState() =>
      _GoalTransitionChartPageState();
}

class _GoalTransitionChartPageState extends State<GoalTransitionChartPage>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1200));
    _anim = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
    // Delay the animation slightly to ensure the widget is fully built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _controller.forward();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  ({List<FlSpot> spots, Color color, String description}) _configForGoal() {
    switch (widget.goal) {
      case 'gain_weight':
        return (
          spots: const [FlSpot(0, 2), FlSpot(1, 4), FlSpot(2, 7.5)],
          color: const Color(0xFF4A90E2),
          description: 'additional_info.weight_transition_desc_gain'.tr(),
        );
      case 'lose_weight':
        return (
          spots: const [FlSpot(0, 2.5), FlSpot(1, 3.0), FlSpot(2, 9.0)],
          color: const Color(0xFFF5A45B),
          description: 'additional_info.weight_transition_desc_lose'.tr(),
        );
      default:
        return (
          spots: const [FlSpot(0, 3.5), FlSpot(1, 3.6), FlSpot(2, 3.7)],
          color: const Color(0xFF7E57C2),
          description: 'additional_info.weight_transition_desc_maintain'.tr(),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cfg = _configForGoal();
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 20),
            // Header with gradient background
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Theme.of(context).colorScheme.primary.withOpacity(0.1),
                    Theme.of(context).colorScheme.primary.withOpacity(0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'additional_info.goal_crush_title'.tr(),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 28,
                      height: 1.2,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 32),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
                border: Border.all(
                  color: Colors.grey.withOpacity(0.1),
                  width: 1,
                ),
              ),
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                height: 340,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 4,
                          height: 24,
                          decoration: BoxDecoration(
                            color: cfg.color,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'additional_info.weight_transition_title'.tr(),
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: Stack(
                        children: [
                          // background gradient bands to mimic the screenshot
                          Positioned.fill(
                            child: Row(
                              children: [
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          Colors.black12.withOpacity(0.06),
                                          Colors.transparent
                                        ],
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          Colors.black12.withOpacity(0.06),
                                          Colors.transparent
                                        ],
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          cfg.color.withOpacity(0.08),
                                          Colors.transparent
                                        ],
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          AnimatedBuilder(
                            animation: _anim,
                            builder: (context, child) {
                              return LineChart(
                                LineChartData(
                                  minX: 0,
                                  maxX: 2,
                                  minY: 0,
                                  maxY: 10,
                                  gridData: FlGridData(
                                    show: true,
                                    drawVerticalLine: false,
                                    horizontalInterval: 2,
                                    getDrawingHorizontalLine: (v) => FlLine(
                                        color: Colors.black12, strokeWidth: 1),
                                  ),
                                  titlesData: FlTitlesData(
                                    topTitles: const AxisTitles(
                                        sideTitles:
                                            SideTitles(showTitles: false)),
                                    rightTitles: const AxisTitles(
                                        sideTitles:
                                            SideTitles(showTitles: false)),
                                    leftTitles: const AxisTitles(
                                        sideTitles:
                                            SideTitles(showTitles: false)),
                                    bottomTitles: AxisTitles(
                                      sideTitles: SideTitles(
                                        showTitles: true,
                                        interval: 1,
                                        getTitlesWidget: (value, meta) {
                                          String t = '';
                                          if (value == 0)
                                            t = 'additional_info.days_3'.tr();
                                          if (value == 1)
                                            t = 'additional_info.days_7'.tr();
                                          if (value == 2)
                                            t = 'additional_info.days_30'.tr();
                                          return Padding(
                                            padding:
                                                const EdgeInsets.only(top: 8.0),
                                            child: Text(t,
                                                style: TextStyle(
                                                    color: Colors.grey[700],
                                                    fontSize: 12,
                                                    fontWeight:
                                                        FontWeight.w600)),
                                          );
                                        },
                                      ),
                                    ),
                                  ),
                                  borderData: FlBorderData(
                                    show: true,
                                    border: Border(
                                      bottom: BorderSide(
                                          color: Colors.black.withOpacity(0.6),
                                          width: 1),
                                      left:
                                          BorderSide(color: Colors.transparent),
                                      right:
                                          BorderSide(color: Colors.transparent),
                                      top:
                                          BorderSide(color: Colors.transparent),
                                    ),
                                  ),
                                  lineBarsData: [
                                    LineChartBarData(
                                      spots: cfg.spots
                                          .map((s) =>
                                              FlSpot(s.x, s.y * _anim.value))
                                          .toList(),
                                      isCurved: true,
                                      barWidth: 3,
                                      color: cfg.color,
                                      dotData: FlDotData(
                                        show: true,
                                        getDotPainter:
                                            (spot, percent, barData, index) {
                                          return FlDotCirclePainter(
                                            radius: 4,
                                            color: cfg.color,
                                            strokeWidth: 2,
                                            strokeColor: Colors.white,
                                          );
                                        },
                                      ),
                                      belowBarData: BarAreaData(
                                        show: true,
                                        gradient: LinearGradient(
                                          colors: [
                                            cfg.color.withOpacity(0.25),
                                            cfg.color.withOpacity(0.05)
                                          ],
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: cfg.color.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: cfg.color.withOpacity(0.1),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        cfg.description,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Theme.of(context).colorScheme.onSurface,
                              height: 1.5,
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                            ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            CommonNextButton(
              onPressed: widget.onNext,
              text: 'additional_info.continue',
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}
