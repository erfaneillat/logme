import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import '../presentation/providers/additional_info_provider.dart';
import 'widgets/gender_selection_page.dart';
import 'widgets/birth_date_selection_page.dart';
import 'widgets/weight_height_page.dart';
import 'widgets/workout_frequency_page.dart';
import 'widgets/weight_goal_page.dart';
import 'widgets/goal_selection_page.dart';
import 'widgets/long_term_results_page.dart';
import 'widgets/motivational_page.dart';
import 'widgets/weight_loss_speed_page.dart';
import 'widgets/barriers_selection_page.dart';
import 'widgets/diet_selection_page.dart';
import 'widgets/accomplishment_selection_page.dart';
import 'widgets/goal_transition_chart_page.dart';
import 'widgets/referral_code_page.dart';
import 'widgets/trust_intro_page.dart';

class AdditionalInfoPage extends HookConsumerWidget {
  const AdditionalInfoPage({super.key});

  // Calculate target weight loss based on current and target weight
  double _calculateTargetWeightLoss(
      double? currentWeight, double? targetWeight) {
    if (currentWeight == null || targetWeight == null) {
      return 4.1; // Default value
    }
    return (currentWeight - targetWeight).abs();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pageController = usePageController();
    final currentPage = useState(0);
    final formKey = useMemoized(() => GlobalKey<FormBuilderState>());
    final additionalInfoNotifier = ref.watch(additionalInfoProvider.notifier);
    final additionalInfo = ref.watch(additionalInfoProvider);

    // Initialize form data from existing additional info
    final initialFormData = useMemoized(() {
      return {
        'gender': additionalInfo.gender,
        'birthDate': additionalInfo.birthDate,
        'weight': additionalInfo.weight,
        'height': additionalInfo.height,
        'activityLevel': additionalInfo.activityLevel,
        'weightGoal': additionalInfo.weightGoal,
        'workoutFrequency': additionalInfo.workoutFrequency,
        'targetWeight': additionalInfo.targetWeight,
        'weightLossSpeed': additionalInfo.weightLossSpeed,
        'diet': additionalInfo.diet,
        'accomplishment': additionalInfo.accomplishment,
        'referralCode': additionalInfo.referralCode,
      };
    }, [additionalInfo]);

    final pages = [
      // Intro trust page

      GenderSelectionPage(
        formKey: formKey,
        initialValue: additionalInfo.gender,
        onGenderSelected: (gender) {
          additionalInfoNotifier.updateGender(gender);
        },
        onNext: () {
          if (additionalInfo.gender != null) {
            pageController.nextPage(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          }
        },
      ),

      BirthDateSelectionPage(
        formKey: formKey,
        initialValue: additionalInfo.birthDate,
        onNext: () {
          final formState = formKey.currentState;
          if (formState?.saveAndValidate() ?? false) {
            final formData = formState!.value;
            final DateTime birthDate = formData['birthDate'];
            additionalInfoNotifier.updateBirthDate(birthDate);
            // Also compute and store age immediately so it's not null later
            final now = DateTime.now();
            int age = now.year - birthDate.year;
            final hasHadBirthdayThisYear = (now.month > birthDate.month) ||
                (now.month == birthDate.month && now.day >= birthDate.day);
            if (!hasHadBirthdayThisYear) {
              age -= 1;
            }
            additionalInfoNotifier.updateAge(age);
            pageController.nextPage(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          }
        },
      ),
      WorkoutFrequencyPage(
        formKey: formKey,
        initialValue: additionalInfo.workoutFrequency,
        onSelectionChanged: (frequency) {
          additionalInfoNotifier.updateWorkoutFrequency(frequency);
        },
        onNext: () {
          // The button will only be enabled if a value is selected
          pageController.nextPage(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        },
      ),
      // Move Weight & Height to be the 4th page
      WeightHeightPage(
        formKey: formKey,
        initialWeight: additionalInfo.weight,
        initialHeight: additionalInfo.height,
        onNext: () {
          final formState = formKey.currentState;
          if (formState?.saveAndValidate() ?? false) {
            final formData = formState!.value;
            additionalInfoNotifier.updateWeight(formData['weight']);
            additionalInfoNotifier.updateHeight(formData['height']);
            pageController.nextPage(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          }
        },
      ),
      // Goal Selection Page (new page before long term results)
      GoalSelectionPage(
        formKey: formKey,
        initialValue: additionalInfo.weightGoal,
        onSelectionChanged: (weightGoal) {
          additionalInfoNotifier.updateWeightGoal(weightGoal);
        },
        onNext: () {
          if (additionalInfo.weightGoal != null) {
            pageController.nextPage(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          }
        },
      ),
      LongTermResultsPage(
        weightGoal: additionalInfo.weightGoal,
        onNext: () {
          pageController.nextPage(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        },
      ),
      WeightGoalPage(
        initialValue: additionalInfo.weightGoal,
        currentWeight: additionalInfo.weight,
        onSelectionChanged: (weightGoal) {
          additionalInfoNotifier.updateWeightGoal(weightGoal);
        },
        onNext: () {
          final formState = formKey.currentState;
          if (formState?.saveAndValidate() ?? false) {
            final formData = formState!.value;
            additionalInfoNotifier.updateTargetWeight(formData['targetWeight']);
            pageController.nextPage(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          }
        },
      ),
      MotivationalPage(
        targetWeightLoss: _calculateTargetWeightLoss(
            additionalInfo.weight, additionalInfo.targetWeight),
        goal: additionalInfo.weightGoal,
        onNext: () {
          pageController.nextPage(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        },
      ),
      if (additionalInfo.weightGoal == 'lose_weight' ||
          additionalInfo.weightGoal == 'gain_weight')
        WeightLossSpeedPage(
          formKey: formKey,
          initialValue: additionalInfo.weightLossSpeed,
          goal: additionalInfo.weightGoal,
          onSelectionChanged: (weightLossSpeed) {
            additionalInfoNotifier.updateWeightLossSpeed(weightLossSpeed);
          },
          onNext: () {
            if (additionalInfo.weightLossSpeed != null) {
              pageController.nextPage(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
              );
            }
          },
        ),
      // New barriers selection page
      BarriersSelectionPage(
        formKey: formKey,
        onSelectionChanged: (_) {},
        onNext: () {
          pageController.nextPage(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        },
      ),
      // Diet selection page
      DietSelectionPage(
        formKey: formKey,
        initialValue: additionalInfo.diet,
        onSelectionChanged: (diet) {
          additionalInfoNotifier.updateDiet(diet);
        },
        onNext: () {
          if (additionalInfo.diet != null) {
            pageController.nextPage(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          }
        },
      ),
      // Accomplishment Selection Page
      AccomplishmentSelectionPage(
        formKey: formKey,
        initialValue: additionalInfo.accomplishment,
        onSelectionChanged: (accomplishment) {
          additionalInfoNotifier.updateAccomplishment(accomplishment);
        },
        onNext: () {
          if (additionalInfo.accomplishment != null) {
            // Move to final chart/summary page
            pageController.nextPage(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          }
        },
      ),
      // Final goal transition chart page (shows image-like chart based on goal)
      GoalTransitionChartPage(
        goal: additionalInfo.weightGoal,
        onNext: () {
          pageController.nextPage(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        },
      ),
      // Referral code page
      ReferralCodePage(
        formKey: formKey,
        initialValue: additionalInfo.referralCode,
        onReferralCodeChanged: (referralCode) {
          additionalInfoNotifier.updateReferralCode(referralCode);
        },
        onNext: () {
          pageController.nextPage(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        },
      ),
      TrustIntroPage(
        onNext: () async {
          final formState = formKey.currentState;
          // Ensure latest values are captured from form
          formState?.save();
          try {
            await additionalInfoNotifier.saveAdditionalInfo();
            await additionalInfoNotifier.markCompleted();
            if (context.mounted) {
              // Go to plan generation loading page
              Navigator.of(context)
                  .pushNamedAndRemoveUntil('/plan-loading', (route) => false);
            }
          } catch (_) {}
        },
      ),
    ];

    // Keep PageView index valid when pages length changes (e.g., conditional pages)
    final int pagesLength = pages.length;
    useEffect(() {
      if (currentPage.value >= pagesLength) {
        currentPage.value = pagesLength - 1;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (pageController.hasClients && pagesLength > 0) {
            pageController.jumpToPage(currentPage.value);
          }
        });
      }
      return null;
    }, [pagesLength]);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      body: SafeArea(
        child: FormBuilder(
          key: formKey,
          initialValue: initialFormData,
          child: Column(
            children: [
              // Progress indicator
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 24.0, vertical: 16.0),
                child: Row(
                  children: [
                    // Back button
                    if (currentPage.value > 0)
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: IconButton(
                          icon: Icon(
                            Icons.arrow_back,
                            color: Colors.grey[700],
                            size: 20,
                          ),
                          onPressed: () {
                            pageController.previousPage(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                            );
                          },
                          padding: EdgeInsets.zero,
                        ),
                      ),

                    const SizedBox(width: 16),

                    // Progress bar
                    Expanded(
                      child: Container(
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: ((currentPage.value + 1) / pages.length)
                              .clamp(0.0, 1.0),
                          child: Container(
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // PageView
              Expanded(
                child: PageView(
                  controller: pageController,
                  onPageChanged: (index) {
                    currentPage.value = index;
                  },
                  children:
                      pages.map((p) => SizedBox.expand(child: p)).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
