import 'dart:async';
import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../../services/api_service_provider.dart';
import '../../../../config/api_config.dart';

class PlanGenerationState {
  final int progressPercent;
  final String currentStepMessage;
  final Set<String> completedMetrics;
  final bool isGenerating;
  final String? errorMessage;

  const PlanGenerationState({
    required this.progressPercent,
    required this.currentStepMessage,
    required this.completedMetrics,
    required this.isGenerating,
    this.errorMessage,
  });

  PlanGenerationState copyWith({
    int? progressPercent,
    String? currentStepMessage,
    Set<String>? completedMetrics,
    bool? isGenerating,
    String? errorMessage,
  }) {
    return PlanGenerationState(
      progressPercent: progressPercent ?? this.progressPercent,
      currentStepMessage: currentStepMessage ?? this.currentStepMessage,
      completedMetrics: completedMetrics ?? this.completedMetrics,
      isGenerating: isGenerating ?? this.isGenerating,
      errorMessage: errorMessage,
    );
  }
}

class PlanGenerationNotifier extends StateNotifier<PlanGenerationState> {
  Timer? _timer;
  final Ref ref;

  PlanGenerationNotifier(this.ref)
      : super(const PlanGenerationState(
          progressPercent: 0,
          currentStepMessage: 'plan_generation.step_applying_bmr',
          completedMetrics: {},
          isGenerating: false,
        ));

  void start() {
    _timer?.cancel();
    state = state.copyWith(isGenerating: true, errorMessage: null);

    // Progress timer caps at 92% until API finishes
    _timer = Timer.periodic(const Duration(milliseconds: 80), (timer) {
      final int next = (state.progressPercent + 1).clamp(0, 100);
      final int capped = next > 92 && state.isGenerating ? 92 : next;

      // Step messages and completed metrics based on progress
      String message = state.currentStepMessage;
      final Set<String> completed = {...state.completedMetrics};

      if (capped >= 10) {
        message = 'plan_generation.step_applying_bmr';
      }
      if (capped >= 30) {
        message = 'plan_generation.step_calculating_tdee';
        completed.add('calories');
      }
      if (capped >= 55) {
        message = 'plan_generation.step_setting_macros';
        completed.add('carbs');
      }
      if (capped >= 80) {
        message = 'plan_generation.step_personalizing';
        completed.add('protein');
      }
      if (capped >= 90) {
        completed.add('fats');
      }
      if (capped >= 100) {
        completed.add('health_score');
        _timer?.cancel();
      }

      state = state.copyWith(
        progressPercent: capped,
        currentStepMessage: message,
        completedMetrics: completed,
      );
    });

    // Fire API request in parallel
    _generatePlan();
  }

  Future<void> _generatePlan() async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.post<Map<String, dynamic>>(ApiConfig.planGenerate);
      // Smoothly complete progress to 100%
      state = state.copyWith(isGenerating: false);
      // Update local cached user to reflect generated plan
      try {
        final storage = ref.read(secureStorageProvider);
        final cached = await storage.getUserData();
        if (cached != null) {
          final Map<String, dynamic> userMap =
              Map<String, dynamic>.from(json.decode(cached));
          userMap['hasGeneratedPlan'] = true;
          await storage.storeUserData(json.encode(userMap));
        }
      } catch (_) {
        // Silently ignore cache update errors
      }
      _finishProgress();
    } catch (e) {
      _timer?.cancel();
      state = state.copyWith(isGenerating: false, errorMessage: e.toString());
    }
  }

  void retry() {
    state = const PlanGenerationState(
      progressPercent: 0,
      currentStepMessage: 'plan_generation.step_applying_bmr',
      completedMetrics: {},
      isGenerating: false,
    );
    start();
  }

  void _finishProgress() {
    // Add remaining checklist item
    final completed = {...state.completedMetrics}..add('health_score');
    // Animate to 100
    Timer.periodic(const Duration(milliseconds: 40), (t) {
      if (state.progressPercent >= 100) {
        t.cancel();
        return;
      }
      state = state.copyWith(
        progressPercent: (state.progressPercent + 2).clamp(0, 100),
        completedMetrics: completed,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final planGenerationProvider = StateNotifierProvider.autoDispose<
    PlanGenerationNotifier, PlanGenerationState>((ref) {
  final notifier = PlanGenerationNotifier(ref);
  // Start immediately when the page/provider is used
  notifier.start();
  ref.onDispose(() => notifier.dispose());
  return notifier;
});
