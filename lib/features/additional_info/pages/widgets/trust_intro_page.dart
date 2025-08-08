import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'common_next_button.dart';

class TrustIntroPage extends StatefulWidget {
  final VoidCallback? onNext;

  const TrustIntroPage({super.key, this.onNext});

  @override
  State<TrustIntroPage> createState() => _TrustIntroPageState();
}

class _TrustIntroPageState extends State<TrustIntroPage>
    with TickerProviderStateMixin {
  late AnimationController _ringController;
  late AnimationController _fadeController;
  late Animation<double> _ringAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _ringController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _ringAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _ringController,
      curve: Curves.easeInOut,
    ));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    ));

    _ringController.repeat();
    _fadeController.forward();
  }

  @override
  void dispose() {
    _ringController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Color ringStart =
        Theme.of(context).colorScheme.primary.withOpacity(0.3);
    final Color ringEnd =
        Theme.of(context).colorScheme.secondary.withOpacity(0.3);

    return FadeTransition(
      opacity: _fadeAnimation,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: Column(
          children: [
            const SizedBox(height: 40),

            // Illustration with animated gradient ring
            _buildAnimatedRingIllustration(ringStart, ringEnd, context),

            const SizedBox(height: 32),

            // Title with improved typography
            _buildTitle(context),

            const SizedBox(height: 12),

            // Subtitle with better spacing
            _buildSubtitle(context),

            const SizedBox(height: 40),

            // Enhanced privacy card
            _buildEnhancedPrivacyCard(context),

            const Spacer(),

            // Improved next button
            CommonNextButton(
              onPressed: widget.onNext,
              text: 'additional_info.continue',
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildAnimatedRingIllustration(
      Color start, Color end, BuildContext context) {
    return Center(
      child: SizedBox(
        width: 240,
        height: 240,
        child: AnimatedBuilder(
          animation: _ringAnimation,
          builder: (context, child) {
            return Stack(
              alignment: Alignment.center,
              children: [
                // Animated outer gradient ring
                Transform.rotate(
                  angle: _ringAnimation.value * 2 * 3.14159,
                  child: Container(
                    width: 240,
                    height: 240,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: SweepGradient(
                        colors: [start, end, start],
                        stops: const [0.0, 0.5, 1.0],
                      ),
                    ),
                  ),
                ),
                // Inner white circle with subtle shadow
                Container(
                  width: 220,
                  height: 220,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                ),
                // Center icon with enhanced styling
                Container(
                  width: 160,
                  height: 160,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Theme.of(context)
                          .colorScheme
                          .outline
                          .withOpacity(0.1),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Theme.of(context)
                            .colorScheme
                            .primary
                            .withOpacity(0.1),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.handshake_outlined,
                    size: 80,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildTitle(BuildContext context) {
    return Text(
      'additional_info.trust_title'.tr(),
      textAlign: TextAlign.center,
      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.w700,
            height: 1.3,
            color: Theme.of(context).colorScheme.onSurface,
          ),
    );
  }

  Widget _buildSubtitle(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Text(
        'additional_info.trust_subtitle'.tr(args: [tr('app_title')]),
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              height: 1.4,
              fontSize: 16,
            ),
      ),
    );
  }

  Widget _buildEnhancedPrivacyCard(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.03),
            blurRadius: 40,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        children: [
          // Enhanced lock icon with better styling
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.12),
              shape: BoxShape.circle,
              border: Border.all(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                width: 1,
              ),
            ),
            child: Icon(
              Icons.lock_outline_rounded,
              color: Theme.of(context).colorScheme.primary,
              size: 24,
            ),
          ),
          const SizedBox(height: 16),

          // Enhanced title
          Text(
            'additional_info.privacy_title'.tr(),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.onSurface,
                  height: 1.3,
                ),
          ),
          const SizedBox(height: 12),

          // Enhanced subtitle
          Text(
            'additional_info.privacy_subtitle'.tr(),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  height: 1.4,
                  fontSize: 14,
                ),
          ),
        ],
      ),
    );
  }
}
