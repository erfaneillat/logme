import 'package:cal_ai/extensions/context.dart';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'dart:ui' as ui;

class ChatPage extends StatelessWidget {
  const ChatPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Top section with "Coming Soon" text
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Text(
                  'COMING SOON',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w300,
                        letterSpacing: 2.5,
                        color: Colors.black87,
                      ),
                ),
              ),
              const SizedBox(height: 32),
              // Middle section with layered images
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: _buildStackedImages(context),
              ),
              const SizedBox(height: 32),
              // Bottom text section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    Text(
                      'home.trainer_title'.tr(),
                      textAlign: TextAlign.center,
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: Colors.black87,
                                height: 1.4,
                              ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'home.trainer_subtitle'.tr(),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.black54,
                            height: 1.6,
                            fontWeight: FontWeight.w400,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),
              // Send message button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // TODO: Implement send message functionality
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('home.coming_soon'.tr()),
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28),
                      ),
                      elevation: 0,
                    ),
                    icon: const Icon(Icons.message_rounded, size: 20),
                    label: Text(
                      'home.send_message_trainer'.tr(),
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                            color: context.colorScheme.onPrimary,
                          ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStackedImages(BuildContext context) {
    const String imagePath = 'assets/images/food-onboarding.jpg';
    const double border = 26;
    // The total height should accommodate the negative offsets of back layers
    return SizedBox(
      height: 420,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          // Back-most image (lighter + more blur)
          Positioned(
            top: -38,
            left: 0,
            right: 0,
            child: _ImageCard(
              imagePath: imagePath,
              borderRadius: border,
              overlayOpacity: 0.55,
              blurSigma: 4,
            ),
          ),
          // Middle image (slightly lighter)
          Positioned(
            top: -18,
            left: 0,
            right: 0,
            child: _ImageCard(
              imagePath: imagePath,
              borderRadius: border,
              overlayOpacity: 0.25,
              blurSigma: 1.5,
            ),
          ),
          // Front image (full color + shadow)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _ImageCard(
              imagePath: imagePath,
              borderRadius: border,
              overlayOpacity: 0.0,
              blurSigma: 0,
              addShadow: true,
            ),
          ),
        ],
      ),
    );
  }
}

class _ImageCard extends StatelessWidget {
  const _ImageCard({
    required this.imagePath,
    required this.borderRadius,
    this.overlayOpacity = 0.0,
    this.blurSigma = 0.0,
    this.addShadow = false,
  });

  final String imagePath;
  final double borderRadius;
  final double overlayOpacity;
  final double blurSigma;
  final bool addShadow;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 320,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: addShadow
            ? [
                BoxShadow(
                  color: Colors.black.withOpacity(0.15),
                  blurRadius: 16,
                  offset: const Offset(6, 6),
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (blurSigma > 0)
              ImageFiltered(
                imageFilter: ui.ImageFilter.blur(
                  sigmaX: blurSigma,
                  sigmaY: blurSigma,
                ),
                child: Image.asset(imagePath, fit: BoxFit.cover),
              )
            else
              Image.asset(imagePath, fit: BoxFit.cover),
            if (overlayOpacity > 0)
              Container(
                color: Colors.white.withOpacity(overlayOpacity),
              ),
          ],
        ),
      ),
    );
  }
}
