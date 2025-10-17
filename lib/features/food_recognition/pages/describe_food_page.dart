import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../domain/usecases/analyze_food_text_usecase.dart';
import '../../../features/logs/presentation/providers/daily_log_provider.dart';
import '../../../features/home/presentation/providers/home_date_provider.dart';
import '../../../features/login/presentation/providers/auth_provider.dart';
import '../../../features/streak/presentation/providers/streak_providers.dart';
import '../../../common/widgets/streak_dialog.dart';
import 'package:shamsi_date/shamsi_date.dart';
import 'package:cal_ai/utils/error_handler.dart';
import '../data/exceptions/free_tier_exceptions.dart';

class DescribeFoodArgs {
  final String? targetDateIso;

  const DescribeFoodArgs({
    this.targetDateIso,
  });
}

class DescribeFoodPage extends HookConsumerWidget {
  final DescribeFoodArgs args;

  const DescribeFoodPage({super.key, required this.args});

  String _toIsoFromJalali(Jalali d) {
    final g = d.toGregorian();
    final mm = g.month.toString().padLeft(2, '0');
    final dd = g.day.toString().padLeft(2, '0');
    return '${g.year}-$mm-$dd';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final textController = useTextEditingController();
    final isLoading = useState<bool>(false);

    Future<void> _analyzeDescription() async {
      if (textController.text.trim().isEmpty) return;

      isLoading.value = true;

      // Create a pending token (increments pending count) for this request
      final token =
          ref.read(dailyLogControllerProvider.notifier).createPendingToken();

      try {
        // Capture previous streak before analysis
        int prevStreak = 0;
        try {
          final user = await ref.read(currentUserProvider.future);
          prevStreak = user?.streakCount ?? 0;
        } catch (_) {}

        // Convert selected Jalali date to ISO YYYY-MM-DD for backend
        final selectedJalali = ref.read(selectedJalaliDateProvider);
        final targetDateIso =
            args.targetDateIso ?? _toIsoFromJalali(selectedJalali);

        final usecase = ref.read(analyzeFoodTextUseCaseProvider);
        await usecase(
          description: textController.text.trim(),
          targetDateIso: targetDateIso,
          cancellationToken: token,
        );

        // Remove token from controller storage
        ref.read(dailyLogControllerProvider.notifier).removeToken(token);

        // After success, remove one pending placeholder
        ref
            .read(dailyLogControllerProvider.notifier)
            .removeOnePendingPlaceholder();

        // Refresh the log to include new item
        await ref.read(dailyLogControllerProvider.notifier).refresh();
        // Force refresh of dailyRemainingProvider
        // ignore: unused_result
        ref.refresh(dailyRemainingProvider);

        // Refresh user profile to get updated streak
        ref.invalidate(currentUserProvider);
        final newUser = await ref.read(currentUserProvider.future);
        final newStreak = newUser?.streakCount ?? prevStreak;

        // If streak increased, show dialog with weekly completions
        if (newStreak > prevStreak && context.mounted) {
          final completions =
              await ref.read(streakWeeklyCompletionsProvider.future);
          await showStreakDialog(
            context,
            streakCount: newStreak,
            completedDatesIso: completions,
          );
        }

        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('describe_food.success'.tr())),
          );

          // Navigate back to home
          context.pop();
        }
      } catch (e) {
        // Remove token from controller storage on error/cancel
        ref.read(dailyLogControllerProvider.notifier).removeToken(token);
        // On error or cancellation, remove only one pending placeholder
        ref
            .read(dailyLogControllerProvider.notifier)
            .removeOnePendingPlaceholder();

        if (context.mounted) {
          if (e is DioException && e.type == DioExceptionType.cancel) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('describe_food.canceled'.tr())),
            );
          } else if (e is FreeTierLimitExceededException) {
            // Show snackbar with message and navigate to subscription
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(e.message),
                duration: const Duration(seconds: 3),
              ),
            );
            // Auto-navigate to subscription screen
            context.push('/subscription');
          } else {
            final errorMessage = ErrorHandler.getGenericErrorMessage(e);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(errorMessage)),
            );
          }
        }
      } finally {
        isLoading.value = false;
      }
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back, color: Colors.black),
        ),
        title: Text(
          'describe_food.title'.tr(),
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
            color: Colors.black,
          ),
        ),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 20),

            // Header section
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.edit_note,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'describe_food.subtitle'.tr(),
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'describe_food.description'.tr(),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.black54,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Input field
            Container(
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: TextField(
                controller: textController,
                maxLines: 8,
                decoration: InputDecoration(
                  hintText: 'describe_food.placeholder'.tr(),
                  hintStyle: TextStyle(
                    color: Colors.grey.shade400,
                    fontSize: 16,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.all(16),
                ),
                style: const TextStyle(
                  fontSize: 16,
                  height: 1.5,
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Tips section
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.lightbulb_outline,
                        color: Colors.blue.shade700,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'describe_food.tips_title'.tr(),
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'describe_food.tips'.tr(),
                    style: TextStyle(
                      color: Colors.blue.shade600,
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),

            const Spacer(),

            // Analyze button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isLoading.value ? null : _analyzeDescription,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (isLoading.value) ...[
                      const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'describe_food.analyzing'.tr(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ] else ...[
                      const Icon(Icons.auto_awesome, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'describe_food.analyze_button'.tr(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
