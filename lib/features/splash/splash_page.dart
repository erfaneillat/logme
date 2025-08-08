import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../features/login/presentation/providers/auth_provider.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  @override
  void initState() {
    super.initState();
    _checkAuthAndNavigate();
  }

  Future<void> _checkAuthAndNavigate() async {
    // Wait for 2 seconds to show splash screen
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    try {
      final isAuthenticatedUseCase = ref.read(isAuthenticatedUseCaseProvider);
      final isAuthenticated = await isAuthenticatedUseCase();

      if (mounted) {
        if (isAuthenticated) {
          // Check if user has completed additional information
          final getCurrentUserUseCase = ref.read(getCurrentUserUseCaseProvider);
          final user = await getCurrentUserUseCase.execute();

          if (user != null) {
            if (!user.hasCompletedAdditionalInfo) {
              context.go('/additional-info');
            } else if (!user.hasGeneratedPlan) {
              context.go('/plan-loading');
            } else {
              context.go('/home');
            }
          } else {
            context.go('/onboarding');
          }
        } else {
          context.go('/onboarding');
        }
      }
    } catch (e) {
      // If there's an error checking auth, go to onboarding
      if (mounted) {
        context.go('/onboarding');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // You can replace this with your app logo or animation
            Icon(Icons.flash_on,
                size: 80, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 24),
            Text(
              'Cal AI',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(fontWeight: FontWeight.bold, color: Colors.black),
            ),
          ],
        ),
      ),
    );
  }
}
