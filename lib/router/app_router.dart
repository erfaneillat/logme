import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../features/onboarding/pages/onboarding_page.dart';
import '../features/splash/splash_page.dart';
import '../features/login/pages/login_page.dart';
import '../features/home/pages/home_page.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../features/additional_info/pages/additional_info_page.dart';
import '../features/plan/pages/plan_generation_page.dart';
import '../features/plan/pages/plan_summary_page.dart';
import '../features/food_recognition/pages/food_detail_page.dart';
import '../features/food_recognition/pages/fix_result_page.dart';
import '../features/food_recognition/pages/describe_food_page.dart';
import '../features/home/pages/favorites_page.dart';
import '../features/analytics/pages/analytics_page.dart';
import '../features/settings/pages/settings_page.dart';
import '../features/settings/pages/refer_friend_page.dart';
import '../features/settings/pages/personal_details_page.dart';
import '../features/settings/pages/adjust_macros_page.dart';
import '../features/settings/pages/weight_history_page.dart';
import '../features/settings/pages/terms_page.dart';
import '../features/settings/pages/privacy_policy_page.dart';
import '../features/settings/pages/support_email_page.dart';
import '../features/settings/pages/delete_account_page.dart';
import '../features/settings/pages/language_selection_page.dart';
import '../features/home/pages/add_exercise_page.dart';
import '../features/subscription/pages/subscription_page.dart';
import '../features/tickets/pages/tickets_list_page.dart';
import '../features/tickets/pages/create_ticket_page.dart';
import '../features/tickets/pages/ticket_detail_page.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        name: 'splash',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/onboarding',
        name: 'onboarding',
        builder: (context, state) => const OnboardingPage(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                name: 'home',
                builder: (context, state) => const HomePage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/analytics',
                name: 'analytics',
                builder: (context, state) => const AnalyticsPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/settings',
                name: 'settings',
                builder: (context, state) => const SettingsPage(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/favorites',
        name: 'favorites',
        builder: (context, state) => const FavoritesPage(),
      ),
      GoRoute(
        path: '/personal-details',
        name: 'personal-details',
        builder: (context, state) => const PersonalDetailsPage(),
      ),
      GoRoute(
        path: '/adjust-macros',
        name: 'adjust-macros',
        builder: (context, state) => const AdjustMacrosPage(),
      ),
      GoRoute(
        path: '/weight-history',
        name: 'weight-history',
        builder: (context, state) => const WeightHistoryPage(),
      ),
      GoRoute(
        path: '/refer-friend',
        name: 'refer-friend',
        builder: (context, state) => const ReferFriendPage(),
      ),
      GoRoute(
        path: '/additional-info',
        name: 'additional-info',
        builder: (context, state) {
          final extra = state.extra;
          if (extra is AdditionalInfoArgs) {
            return AdditionalInfoPage(
              startAt: extra.startAt,
              restrictedForAutoGenerate: extra.restrictedForAutoGenerate,
            );
          }
          return AdditionalInfoPage(startAt: extra as AdditionalInfoStart?);
        },
      ),
      GoRoute(
        path: '/plan-loading',
        name: 'plan-loading',
        builder: (context, state) => const PlanGenerationPage(),
      ),
      GoRoute(
        path: '/plan-summary',
        name: 'plan-summary',
        builder: (context, state) => const PlanSummaryPage(),
      ),
      GoRoute(
        path: '/food-detail',
        name: 'food-detail',
        builder: (context, state) {
          final args = state.extra as FoodDetailArgs? ??
              const FoodDetailArgs(
                dateIso: '1970-01-01',
                title: '',
                calories: 0,
                proteinGrams: 0,
                fatGrams: 0,
                carbsGrams: 0,
              );
          return FoodDetailPage(args: args);
        },
      ),
      GoRoute(
        path: '/fix-result',
        name: 'fix-result',
        builder: (context, state) {
          final args = state.extra as FixResultArgs? ??
              const FixResultArgs(
                dateIso: '1970-01-01',
                title: '',
                calories: 0,
                proteinGrams: 0,
                fatGrams: 0,
                carbsGrams: 0,
              );
          return FixResultPage(args: args);
        },
      ),
      GoRoute(
        path: '/describe-food',
        name: 'describe-food',
        builder: (context, state) {
          final args =
              state.extra as DescribeFoodArgs? ?? const DescribeFoodArgs();
          return DescribeFoodPage(args: args);
        },
      ),
      GoRoute(
        path: '/add-exercise',
        name: 'add-exercise',
        builder: (context, state) => const AddExercisePage(),
      ),
      GoRoute(
        path: '/terms',
        name: 'terms',
        builder: (context, state) => const TermsPage(),
      ),
      GoRoute(
        path: '/privacy-policy',
        name: 'privacy-policy',
        builder: (context, state) => const PrivacyPolicyPage(),
      ),
      GoRoute(
        path: '/support-email',
        name: 'support-email',
        builder: (context, state) => const SupportEmailPage(),
      ),
      GoRoute(
        path: '/delete-account',
        name: 'delete-account',
        builder: (context, state) => const DeleteAccountPage(),
      ),
      GoRoute(
        path: '/language-selection',
        name: 'language-selection',
        builder: (context, state) => const LanguageSelectionPage(),
      ),
      GoRoute(
        path: '/subscription',
        name: 'subscription',
        builder: (context, state) => const SubscriptionPage(),
      ),
      GoRoute(
        path: '/tickets',
        name: 'tickets',
        builder: (context, state) => const TicketsListPage(),
      ),
      GoRoute(
        path: '/tickets/create',
        name: 'create-ticket',
        builder: (context, state) => const CreateTicketPage(),
      ),
      GoRoute(
        path: '/tickets/:id',
        name: 'ticket-detail',
        builder: (context, state) {
          final ticketId = state.pathParameters['id']!;
          return TicketDetailPage(ticketId: ticketId);
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'page_not_found'.tr(),
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'page_not_found_message'.tr(),
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: Text('go_home'.tr()),
            ),
          ],
        ),
      ),
    ),
  );
}

class AppShell extends HookConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  void _goBranch(int index, BuildContext context) {
    navigationShell.goBranch(index,
        initialLocation: index == navigationShell.currentIndex);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (i) => _goBranch(i, context),
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.home_outlined),
            label: 'home.title'.tr(),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.bar_chart_outlined),
            label: 'home.analytics'.tr(),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.settings_outlined),
            label: 'home.settings'.tr(),
          ),
        ],
      ),
    );
  }
}
