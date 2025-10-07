import 'dart:async';
import 'dart:math';

import 'package:cal_ai/features/subscription/presentation/providers/subscription_provider.dart';
import 'package:cal_ai/services/lucky_wheel_service.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SubscriptionPage extends HookConsumerWidget {
  const SubscriptionPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subscriptionState = ref.watch(subscriptionNotifierProvider);
    final subscriptionNotifier =
        ref.read(subscriptionNotifierProvider.notifier);

    useEffect(() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showLuckyWheelDialog(context, subscriptionNotifier);
      });
      return null;
    }, const []);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('assets/images/subscription_bg.png'),
            fit: BoxFit.cover,
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // Black overlay from bottom to center
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
                child: Container(
                  // height: MediaQuery.of(context).size.height * 0.5,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        Colors.black,
                        Colors.black,
                        Colors.transparent,
                      ],
                      stops: [0.0, 0.3, 1.0],
                    ),
                  ),
                ),
              ),

              Column(
                children: [
                  // Top status bar and close button
                  _buildTopBar(context),

                  // Title and subtitle
                  _buildTitleSection(),

                  // Pricing options
                  _buildPricingOptions(subscriptionNotifier, subscriptionState),

                  // Continue button
                  _buildContinueButton(subscriptionState),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, right: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
            ),
            child: IconButton(
              padding: EdgeInsets.zero,
              icon: const Icon(
                Icons.close,
                size: 18,
                color: Colors.black,
              ),
              onPressed: () => context.pop(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTitleSection() {
    return Expanded(
      child: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 20),
            Text(
              'subscription.title'.tr(),
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'subscription.subtitle'.tr(),
              style: const TextStyle(
                fontSize: 16,
                color: Colors.white70,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            // Countdown timer for the special offer
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: CountdownTimer(
                endTime: DateTime.now().add(const Duration(days: 2)),
                textStyle: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
                backgroundColor: Colors.transparent,
                padding: EdgeInsets.zero,
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildPricingOptions(
      SubscriptionNotifier notifier, SubscriptionState state) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        children: [
          // Selection state
          // Highlight the selected plan and dim the other
          // so the user can clearly see which plan is active

          // Yearly plan
          GestureDetector(
            onTap: () => notifier.selectPlan(SubscriptionPlan.yearly),
            child: Stack(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: (state.selectedPlan == SubscriptionPlan.yearly)
                      ? BoxDecoration(
                          border: Border.all(
                            color: Colors.green,
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(32),
                          color: const Color(0xFF1B2E1B),
                        )
                      : BoxDecoration(
                          border: Border.all(
                            color: Colors.grey.withOpacity(0.3),
                            width: 1,
                          ),
                          borderRadius: BorderRadius.circular(32),
                          color: Colors.black.withOpacity(0.3),
                        ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'subscription.yearly_plan'.tr(),
                            style: TextStyle(
                              color: (state.selectedPlan ==
                                      SubscriptionPlan.yearly)
                                  ? Colors.white
                                  : Colors.grey,
                              fontSize: 20,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'subscription.yearly_price'.tr(),
                            style: TextStyle(
                              color: (state.selectedPlan ==
                                      SubscriptionPlan.yearly)
                                  ? Colors.white
                                  : Colors.grey,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        'subscription.yearly_per_month'.tr(),
                        style: TextStyle(
                          color: (state.selectedPlan == SubscriptionPlan.yearly)
                              ? Colors.white
                              : Colors.grey,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                // Sale badge
                Positioned(
                  right: 16,
                  top: -8,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Colors.orange, Colors.pink],
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      'subscription.sale_60'.tr(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Monthly plan
          GestureDetector(
            onTap: () => notifier.selectPlan(SubscriptionPlan.monthly),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              decoration: (state.selectedPlan == SubscriptionPlan.monthly)
                  ? BoxDecoration(
                      border: Border.all(
                        color: Colors.green,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(32),
                      color: const Color(0xFF1B2E1B),
                    )
                  : BoxDecoration(
                      border: Border.all(
                        color: Colors.grey.withOpacity(0.3),
                        width: 1,
                      ),
                      borderRadius: BorderRadius.circular(32),
                      color: Colors.black.withOpacity(0.3),
                    ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'subscription.monthly_plan'.tr(),
                    style: TextStyle(
                      color: (state.selectedPlan == SubscriptionPlan.monthly)
                          ? Colors.white
                          : Colors.grey,
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    'subscription.monthly_price'.tr(),
                    style: TextStyle(
                      color: (state.selectedPlan == SubscriptionPlan.monthly)
                          ? Colors.white
                          : Colors.grey,
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Footer links removed by request

  Widget _buildContinueButton(SubscriptionState state) {
    return Padding(
      padding: const EdgeInsets.only(left: 32, right: 32, top: 32, bottom: 32),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: () {
            // Handle subscription logic here
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: Colors.black,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(28),
            ),
            elevation: 0,
          ),
          child: Text(
            'subscription.continue'.tr(),
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  void _showLuckyWheelDialog(
      BuildContext context, SubscriptionNotifier notifier) {
    // Log the lucky wheel view to the server
    _logLuckyWheelView(context);

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return _LuckyWheelDialog(
          onClaim: () {
            notifier.selectPlan(SubscriptionPlan.yearly);
            Navigator.of(dialogContext).pop();
          },
        );
      },
    );
  }

  void _logLuckyWheelView(BuildContext context) {
    // Get the lucky wheel service from the provider
    final container = ProviderScope.containerOf(context);
    final luckyWheelService = container.read(luckyWheelServiceProvider);

    // Call the API to log the lucky wheel view
    luckyWheelService.logLuckyWheelView().catchError((error) {
      // Log error but don't show to user as this is not critical
      debugPrint('Failed to log lucky wheel view: $error');
      return <String, dynamic>{}; // Return empty map to satisfy return type
    });
  }
}

class _LuckyWheelDialog extends StatefulWidget {
  const _LuckyWheelDialog({required this.onClaim});

  final VoidCallback onClaim;

  @override
  State<_LuckyWheelDialog> createState() => _LuckyWheelDialogState();
}

class _LuckyWheelDialogState extends State<_LuckyWheelDialog>
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
                  // Title with gradient text
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

                  // Animated hurry badge
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
                            Icon(
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

                  // Subtitle with better typography
                  Text(
                    'subscription.lucky_wheel.subtitle'.tr(),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: Colors.grey[800],
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),

                  // Description with improved styling
                  Text(
                    'subscription.lucky_wheel.description'.tr(),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                          height: 1.5,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),

                  // Enhanced wheel container with glow effect
                  AnimatedBuilder(
                    animation: _bounceAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _bounceAnimation.value,
                        child: Container(
                          height: 280,
                          width: 280,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.purple.withOpacity(0.2),
                                blurRadius: 20,
                                spreadRadius: 5,
                              ),
                              BoxShadow(
                                color: Colors.pink.withOpacity(0.1),
                                blurRadius: 40,
                                spreadRadius: 10,
                              ),
                            ],
                          ),
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
                              Positioned(
                                top: -16,
                                child:
                                    _PointerIndicator(isSpinning: _isSpinning),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 32),

                  // Enhanced button with gradient and animation
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
                                    SizedBox(
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
                                      Icon(
                                        Icons.check_circle,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                    ] else ...[
                                      Icon(
                                        Icons.casino,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                    ],
                                    Expanded(
                                      child: Text(
                                        _hasSpun
                                            ? 'subscription.lucky_wheel.result_cta'
                                                .tr()
                                            : 'subscription.lucky_wheel.spin_button'
                                                .tr(),
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
      // Always land on the 70% slice (index 0)
      const totalSlices = 6;
      const targetSlice = 0;

      final currentFraction = _turns - _turns.floorToDouble();
      final randomFullTurns = 4 + Random().nextInt(3); // 4-6 full turns

      // Align pointer (top) with the center of the target slice
      final targetFraction = 1 - ((targetSlice + 0.5) / totalSlices);

      double additionalTurns =
          randomFullTurns + (targetFraction - currentFraction);

      _turns += additionalTurns;
    });

    // Start glow animation
    _glowController.repeat(reverse: true);

    // Stop glow animation when spinning ends
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
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.red.withOpacity(0.3),
              blurRadius: 8,
              spreadRadius: 2,
            ),
          ],
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

    // Outer glow effect
    if (isSpinning) {
      final glowPaint = Paint()
        ..color = Colors.red.withOpacity(0.3)
        ..style = PaintingStyle.fill;

      canvas.drawCircle(center, radius * 1.2, glowPaint);
    }

    // Main pointer body with gradient
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

    // Create arrow shape
    final path = Path()
      ..moveTo(center.dx, center.dy + radius * 0.8)
      ..lineTo(center.dx + radius * 0.6, center.dy - radius * 0.4)
      ..lineTo(center.dx - radius * 0.6, center.dy - radius * 0.4)
      ..close();

    canvas.drawPath(path, paint);

    // Inner highlight
    final highlightPaint = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..style = PaintingStyle.fill;

    final highlightPath = Path()
      ..moveTo(center.dx, center.dy + radius * 0.6)
      ..lineTo(center.dx + radius * 0.3, center.dy - radius * 0.2)
      ..lineTo(center.dx - radius * 0.3, center.dy - radius * 0.2)
      ..close();

    canvas.drawPath(highlightPath, highlightPaint);

    // Border
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawPath(path, borderPaint);

    // Center dot
    final dotPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    canvas.drawCircle(center, 3, dotPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return oldDelegate is _PointerPainter &&
        oldDelegate.isSpinning != isSpinning;
  }
}

class CountdownTimer extends StatefulWidget {
  final DateTime endTime;
  final TextStyle? textStyle;
  final Color? backgroundColor;
  final EdgeInsets? padding;

  const CountdownTimer({
    super.key,
    required this.endTime,
    this.textStyle,
    this.backgroundColor,
    this.padding,
  });

  @override
  State<CountdownTimer> createState() => _CountdownTimerState();
}

class _CountdownTimerState extends State<CountdownTimer>
    with TickerProviderStateMixin {
  late Timer _timer;
  Duration _remainingTime = Duration.zero;

  // Animation controllers
  late AnimationController _pulseController;
  late AnimationController _glowController;

  // Animations
  late Animation<double> _pulseAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _updateRemainingTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        _updateRemainingTime();
      }
    });
  }

  void _setupAnimations() {
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _glowController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _glowAnimation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    _pulseController.repeat(reverse: true);
    _glowController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _timer.cancel();
    _pulseController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  void _updateRemainingTime() {
    final now = DateTime.now();
    final difference = widget.endTime.difference(now);

    if (difference.isNegative) {
      setState(() {
        _remainingTime = Duration.zero;
      });
    } else {
      final newTime = difference;

      setState(() {
        _remainingTime = newTime;
      });
    }
  }

  String _formatTime(int value) {
    return value.toString().padLeft(2, '0');
  }

  Widget _buildAnimatedTimeCard(
      String value, String label, bool isHighlighted) {
    return AnimatedBuilder(
      animation: Listenable.merge([_pulseAnimation, _glowAnimation]),
      builder: (context, child) {
        return Transform.scale(
          scale: isHighlighted ? _pulseAnimation.value : 1.0,
          child: Container(
            constraints: const BoxConstraints(
              minWidth: 50,
              maxWidth: 70,
            ),
            height: 80,
            margin: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withOpacity(0.15 + (0.1 * _glowAnimation.value)),
                  Colors.white
                      .withOpacity(0.05 + (0.05 * _glowAnimation.value)),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white
                    .withOpacity(0.2 + (0.1 * _glowAnimation.value)),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black
                      .withOpacity(0.1 + (0.05 * _glowAnimation.value)),
                  blurRadius: 10 + (5 * _glowAnimation.value),
                  spreadRadius: 0,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: Colors.white.withOpacity(0.1 * _glowAnimation.value),
                  blurRadius: 8 + (4 * _glowAnimation.value),
                  spreadRadius: 0,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                    shadows: [
                      Shadow(
                        color: Colors.black26,
                        offset: Offset(0, 2),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  label,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.8,
                    shadows: [
                      Shadow(
                        color: Colors.black26,
                        offset: Offset(0, 1),
                        blurRadius: 2,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isExpired = _remainingTime == Duration.zero;

    if (isExpired) {
      return AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _pulseAnimation.value,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.red.withOpacity(0.8), Colors.redAccent],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.red.withOpacity(0.3),
                    blurRadius: 10,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Text(
                'subscription.countdown_expired'.tr(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          );
        },
      );
    }

    final days = _remainingTime.inDays;
    final hours = _remainingTime.inHours % 24;
    final minutes = _remainingTime.inMinutes % 60;
    final seconds = _remainingTime.inSeconds % 60;

    return AnimatedBuilder(
      animation: Listenable.merge([_pulseAnimation, _glowAnimation]),
      builder: (context, child) {
        return Transform.scale(
          scale: _pulseAnimation.value,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withOpacity(0.1 + (0.05 * _glowAnimation.value)),
                  Colors.white
                      .withOpacity(0.05 + (0.03 * _glowAnimation.value)),
                ],
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: Colors.white
                    .withOpacity(0.2 + (0.1 * _glowAnimation.value)),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black
                      .withOpacity(0.1 + (0.05 * _glowAnimation.value)),
                  blurRadius: 20 + (10 * _glowAnimation.value),
                  spreadRadius: 0,
                  offset: const Offset(0, 8),
                ),
                BoxShadow(
                  color: Colors.white.withOpacity(0.1 * _glowAnimation.value),
                  blurRadius: 15 + (5 * _glowAnimation.value),
                  spreadRadius: 0,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              children: [
                Text(
                  'subscription.limited_time_offer'.tr(),
                  style: TextStyle(
                    color: Colors.white
                        .withOpacity(0.9 + (0.1 * _glowAnimation.value)),
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                    shadows: [
                      Shadow(
                        color: Colors.black.withOpacity(0.3),
                        offset: const Offset(0, 2),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (days > 0) ...[
                      Flexible(
                        fit: FlexFit.loose,
                        child: _buildAnimatedTimeCard(
                          _formatTime(days),
                          'subscription.countdown_days'.tr(),
                          false,
                        ),
                      ),
                    ],
                    if (hours > 0 || days > 0) ...[
                      Flexible(
                        fit: FlexFit.loose,
                        child: _buildAnimatedTimeCard(
                          _formatTime(hours),
                          'subscription.countdown_hours'.tr(),
                          false,
                        ),
                      ),
                    ],
                    Flexible(
                      fit: FlexFit.loose,
                      child: _buildAnimatedTimeCard(
                        _formatTime(minutes),
                        'subscription.countdown_minutes'.tr(),
                        true,
                      ),
                    ),
                    Flexible(
                      fit: FlexFit.loose,
                      child: _buildAnimatedTimeCard(
                        _formatTime(seconds),
                        'subscription.countdown_seconds'.tr(),
                        true,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // 70% off description and remaining time
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.red.withOpacity(0.1),
                        Colors.orange.withOpacity(0.1),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.red.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'subscription.sale_70_description'.tr(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          height: 1.4,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
