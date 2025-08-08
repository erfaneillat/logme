import 'package:cal_ai/extensions/context.dart';
import 'package:cal_ai/gen/assets.gen.dart';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final PageController _controller = PageController();
  int _currentPage = 0;

  late final List<_OnboardingData> _pages;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _pages = [
      _OnboardingData(
        image: Assets.imagesManOnboarding.path,
        overlay: _WeightGoalOverlay(goal: '60 Kg'),
        title: 'onboarding.page1_title'.tr(),
        subtitle: 'onboarding.page1_subtitle'.tr(),
      ),
      _OnboardingData(
        image: Assets.imagesFoodOnboarding.path,
        overlay: _CameraOverlay(),
        title: 'onboarding.page2_title'.tr(),
        subtitle: 'onboarding.page2_subtitle'.tr(),
      ),
      _OnboardingData(
        image: Assets.imagesFoodOnboarding.path,
        overlay: _NutritionOverlay(),
        title: 'onboarding.page3_title'.tr(),
        subtitle: 'onboarding.page3_subtitle'.tr(),
      ),
    ];
  }

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _controller.nextPage(
          duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _pages.length,
                onPageChanged: (index) => setState(() => _currentPage = index),
                itemBuilder: (context, index) {
                  final data = _pages[index];
                  return _OnboardingScreen(data: data);
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children:
                  List.generate(_pages.length, (index) => _buildDot(index)),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _nextPage,
                  child: Text(
                    _currentPage == _pages.length - 1
                        ? 'finish'.tr()
                        : 'next'.tr(),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDot(int index) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 16),
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: _currentPage == index ? Colors.black : Colors.grey[300],
      ),
    );
  }
}

class _OnboardingScreen extends StatelessWidget {
  final _OnboardingData data;
  const _OnboardingScreen({required this.data});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          bottom: context.height * 0.28,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(data.image, fit: BoxFit.cover),
              if (data.overlay != null) data.overlay!,
            ],
          ),
        ),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            width: double.infinity,
            height: context.height * 0.3,
            decoration: const BoxDecoration(
              color: Color(0xFFF9F8FC),
              borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    data.title,
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(fontWeight: FontWeight.bold, fontSize: 26),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    data.subtitle,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _OnboardingData {
  final String image;
  final Widget? overlay;
  final String title;
  final String subtitle;
  const _OnboardingData(
      {required this.image,
      this.overlay,
      required this.title,
      required this.subtitle});
}

class _WeightGoalOverlay extends StatelessWidget {
  final String goal;
  const _WeightGoalOverlay({required this.goal});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: 16,
      top: 32,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.6),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('onboarding.weight_goal'.tr(),
                style: const TextStyle(color: Colors.white, fontSize: 16)),
            Text(goal,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}

class _CameraOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Positioned.fill(
      child: Center(
        child: Icon(Icons.crop_free, color: Colors.white, size: 100),
      ),
    );
  }
}

class _NutritionOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          left: 24,
          top: 32,
          child: _NutritionCircle(
              label: 'onboarding.protein'.tr(),
              value: '35g',
              color: Colors.red),
        ),
        Positioned(
          left: 120,
          top: 80,
          child: _NutritionCircle(
              label: 'onboarding.carbs'.tr(),
              value: '35g',
              color: Colors.orange),
        ),
        Positioned(
          right: 24,
          top: 32,
          child: _NutritionCircle(
              label: 'onboarding.fat'.tr(), value: '35g', color: Colors.blue),
        ),
      ],
    );
  }
}

class _NutritionCircle extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _NutritionCircle(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.6),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(label,
              style: TextStyle(color: color, fontWeight: FontWeight.bold)),
          Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
