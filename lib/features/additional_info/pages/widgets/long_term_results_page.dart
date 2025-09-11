import 'package:cal_ai/extensions/context.dart';
import 'package:cal_ai/gen/assets.gen.dart';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'common_next_button.dart';
import 'package:fl_chart/fl_chart.dart';

class LongTermResultsPage extends StatefulWidget {
  final VoidCallback? onNext;
  final String? weightGoal; // Add weight goal parameter

  const LongTermResultsPage({
    super.key,
    this.onNext,
    this.weightGoal, // Add this parameter
  });

  @override
  State<LongTermResultsPage> createState() => _LongTermResultsPageState();
}

class _LongTermResultsPageState extends State<LongTermResultsPage>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _chartAnimation;

  @override
  void initState() {
    super.initState();

    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.0, 0.6, curve: Curves.easeInOut),
    ));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.0, 0.6, curve: Curves.easeOutCubic),
    ));

    _chartAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.3, 1.0, curve: Curves.easeInOut),
    ));

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  // Get chart data based on weight goal
  Map<String, dynamic> _getChartData() {
    print('DEBUG: Weight Goal = ${widget.weightGoal}');
    switch (widget.weightGoal) {
      case 'lose_weight':
        return {
          'appLine': [
            FlSpot(0, 20), // Start at 20% of chart height
            FlSpot(1, 15), // Steady decrease
            FlSpot(2, 10),
            FlSpot(3, 5),
            FlSpot(4, 2),
            FlSpot(5, 0), // End at 0% (goal achieved)
          ],
          'traditionalLine': [
            FlSpot(0, 20), // Start at same point
            FlSpot(1, 25), // Yo-yo effect - goes up
            FlSpot(2, 15), // Then down
            FlSpot(3, 30), // Up again
            FlSpot(4, 10), // Down
            FlSpot(5, 25), // Ends higher than started
          ],
          'appColor': Colors.green,
          'traditionalColor': const Color(0xFFE57373),
          'successRate': '95%',
          'title': 'additional_info.weight_loss_title'.tr(),
          'subtitle': 'additional_info.weight_loss_subtitle'.tr(),
        };

      case 'gain_weight':
        return {
          'appLine': [
            FlSpot(0, 20), // Start at 20% of chart height
            FlSpot(1, 25), // Steady increase
            FlSpot(2, 30),
            FlSpot(3, 35),
            FlSpot(4, 40),
            FlSpot(5, 45), // End at 45% (goal achieved)
          ],
          'traditionalLine': [
            FlSpot(0, 20), // Start at same point
            FlSpot(1, 15), // Inconsistent - goes down
            FlSpot(2, 25), // Then up
            FlSpot(3, 10), // Down again
            FlSpot(4, 30), // Up
            FlSpot(5, 15), // Ends lower than started
          ],
          'appColor': Colors.blue,
          'traditionalColor': const Color(0xFFE57373),
          'successRate': '92%',
          'title': 'additional_info.weight_gain_title'.tr(),
          'subtitle': 'additional_info.weight_gain_subtitle'.tr(),
        };

      case 'maintain_weight':
      default:
        return {
          'appLine': [
            FlSpot(0, 20), // Start at 20% of chart height
            FlSpot(1, 21), // Very stable line
            FlSpot(2, 19),
            FlSpot(3, 20),
            FlSpot(4, 21),
            FlSpot(5, 20), // Ends at same level
          ],
          'traditionalLine': [
            FlSpot(0, 20), // Start at same point
            FlSpot(1, 30), // Unstable - goes up
            FlSpot(2, 10), // Then down
            FlSpot(3, 35), // Up again
            FlSpot(4, 5), // Down
            FlSpot(5, 25), // Ends unstable
          ],
          'appColor': Colors.orange,
          'traditionalColor': const Color(0xFFE57373),
          'successRate': '98%',
          'title': 'additional_info.weight_maintain_title'.tr(),
          'subtitle': 'additional_info.weight_maintain_subtitle'.tr(),
        };
    }
  }

  @override
  Widget build(BuildContext context) {
    final chartData = _getChartData();

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
              _buildHeader(chartData),

              const SizedBox(height: 40),

              // Chart Card
              Expanded(
                child: _buildChartCard(chartData),
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

  Widget _buildHeader(Map<String, dynamic> chartData) {
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
            Icons.trending_up,
            size: 40,
            color: Colors.white,
          ),
        ),

        const SizedBox(height: 24),

        // Title
        Text(
          chartData['title'] ?? 'additional_info.long_term_results_title'.tr(),
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
          chartData['subtitle'] ??
              'additional_info.long_term_results_subtitle'.tr(),
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

  Widget _buildChartCard(Map<String, dynamic> chartData) {
    return AnimatedBuilder(
      animation: _chartAnimation,
      builder: (context, child) {
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.grey.withOpacity(0.1),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Card Title
              Text(
                'additional_info.your_weight'.tr(),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
              ),

              const SizedBox(height: 24),

              // Chart
              Expanded(
                child: _buildChart(chartData),
              ),

              const SizedBox(height: 20),

              // Success Rate Text
              Text(
                'additional_info.success_rate_with_value'
                    .tr(args: [chartData['successRate']]),
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontSize: 16,
                      height: 1.4,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildChart(Map<String, dynamic> chartData) {
    return AnimatedBuilder(
      animation: _chartAnimation,
      builder: (context, child) {
        return Column(
          children: [
            // Legend
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Assets.imagesLoqmeLogoPNG
                        .image(width: 16, height: 16, fit: BoxFit.cover),
                    // Icon(Icons.apple, color: chartData['appColor'], size: 16),
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: chartData['appColor'],
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        'additional_info.our_app'.tr(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                Text(
                  'additional_info.traditional_diet'.tr(),
                  style: TextStyle(
                    color: chartData['traditionalColor'],
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // FL Chart
            Expanded(
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: true,
                    horizontalInterval: 10,
                    verticalInterval: 1,
                    getDrawingHorizontalLine: (value) {
                      return FlLine(
                        color: Colors.grey.withOpacity(0.3),
                        strokeWidth: 1,
                      );
                    },
                    getDrawingVerticalLine: (value) {
                      return FlLine(
                        color: Colors.grey.withOpacity(0.3),
                        strokeWidth: 1,
                      );
                    },
                  ),
                  titlesData: FlTitlesData(
                    show: true,
                    rightTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 30,
                        interval: 1,
                        getTitlesWidget: (double value, TitleMeta meta) {
                          if (value == 0) {
                            return Text(
                              'additional_info.month_1'.tr(),
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            );
                          } else if (value == 5) {
                            return Text(
                              'additional_info.month_6'.tr(),
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        interval: 10,
                        getTitlesWidget: (double value, TitleMeta meta) {
                          return Text(
                            '${value.toInt()}%',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          );
                        },
                        reservedSize: 42,
                      ),
                    ),
                  ),
                  borderData: FlBorderData(
                    show: true,
                    border: Border.all(color: Colors.grey.withOpacity(0.3)),
                  ),
                  minX: 0,
                  maxX: 5,
                  minY: 0,
                  maxY: 50,
                  lineBarsData: [
                    // App line (our method - steady progress)
                    LineChartBarData(
                      spots: (chartData['appLine'] as List<FlSpot>)
                          .map((spot) => FlSpot(
                                spot.x,
                                spot.y * _chartAnimation.value,
                              ))
                          .toList(),
                      isCurved: true,
                      gradient: LinearGradient(
                        colors: [
                          chartData['appColor'],
                          chartData['appColor'].withOpacity(0.8),
                        ],
                      ),
                      barWidth: 3,
                      isStrokeCapRound: true,
                      dotData: FlDotData(
                        show: true,
                        getDotPainter: (spot, percent, barData, index) {
                          return FlDotCirclePainter(
                            radius: 4,
                            color: chartData['appColor'],
                            strokeWidth: 2,
                            strokeColor: Colors.white,
                          );
                        },
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        gradient: LinearGradient(
                          colors: [
                            chartData['appColor'].withOpacity(0.3),
                            chartData['appColor'].withOpacity(0.1),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                    // Traditional diet line (unstable - yo-yo effect)
                    LineChartBarData(
                      spots: (chartData['traditionalLine'] as List<FlSpot>)
                          .map((spot) => FlSpot(
                                spot.x,
                                spot.y * _chartAnimation.value,
                              ))
                          .toList(),
                      isCurved: true,
                      color: chartData['traditionalColor'],
                      barWidth: 3,
                      isStrokeCapRound: true,
                      dotData: FlDotData(
                        show: true,
                        getDotPainter: (spot, percent, barData, index) {
                          return FlDotCirclePainter(
                            radius: 4,
                            color: chartData['traditionalColor'],
                            strokeWidth: 2,
                            strokeColor: Colors.white,
                          );
                        },
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        color: chartData['traditionalColor'].withOpacity(0.2),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildNextButton() {
    return CommonNextButton(
      onPressed: widget.onNext,
      text: 'additional_info.continue',
    );
  }
}
