import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:shamsi_date/shamsi_date.dart';

import '../../../extensions/context.dart';
import '../../../extensions/string.dart';
import '../../logs/data/datasources/logs_remote_data_source.dart';
import '../../logs/presentation/providers/daily_log_provider.dart';
import '../../settings/presentation/providers/settings_providers.dart';
import '../presentation/providers/home_date_provider.dart';

class AddExercisePage extends HookConsumerWidget {
  const AddExercisePage({super.key});

  String _toIsoFromJalali(Jalali d) {
    final g = d.toGregorian();
    final mm = g.month.toString().padLeft(2, '0');
    final dd = g.day.toString().padLeft(2, '0');
    return '${g.year}-$mm-$dd';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exerciseController = useTextEditingController();
    final caloriesController = useTextEditingController();
    final durationController = useTextEditingController();
    final isLoading = useState(false);
    final isAnalyzing = useState(false);
    final aiCalories = useState<int?>(null);
    final showManualCalories = useState(false);
    final exerciseTips = useState<List<String>>([]);
    final intensity = useState<String?>(null);
    final rebuildTrigger = useState(0); // Simple trigger to force rebuilds

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'home.add_burned_calories'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: Colors.black87,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Section
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Theme.of(context).primaryColor,
                      Theme.of(context).primaryColor.withOpacity(0.8),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Theme.of(context).primaryColor.withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.3),
                          width: 2,
                        ),
                      ),
                      child: const Icon(
                        Icons.fitness_center,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'home.add_burned_calories'.tr(),
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.2,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'home.add_exercise_desc'.tr(),
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: Colors.white.withOpacity(0.8),
                                  fontWeight: FontWeight.w500,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Form Section
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 15,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Exercise/Activity Input
                    Text(
                      'home.exercise_activity'.tr(),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: exerciseController,
                      onChanged: (_) =>
                          rebuildTrigger.value++, // Trigger rebuild
                      decoration: InputDecoration(
                        hintText: 'home.exercise_hint'.tr(),
                        hintStyle: TextStyle(color: Colors.grey),
                        prefixIcon: const Icon(Icons.directions_run),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide:
                              BorderSide(color: Theme.of(context).primaryColor),
                        ),
                        filled: true,
                        fillColor: Colors.grey.shade50,
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Duration Input
                    Text(
                      'home.duration_minutes'.tr(),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: durationController,
                      onChanged: (_) =>
                          rebuildTrigger.value++, // Trigger rebuild
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        hintText: 'home.duration_hint'.tr(),
                        hintStyle: TextStyle(color: Colors.grey),
                        prefixIcon: const Icon(Icons.access_time),
                        suffixText: 'home.unit_minutes'.tr(),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide:
                              BorderSide(color: Theme.of(context).primaryColor),
                        ),
                        filled: true,
                        fillColor: Colors.grey.shade50,
                      ),
                    ),

                    const SizedBox(height: 24),

                    // AI Analysis Button with hint
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Hint text
                        Padding(
                          padding: const EdgeInsets.only(left: 4, bottom: 8),
                          child: Row(
                            children: [
                              Icon(
                                Icons.lightbulb_outline,
                                size: 16,
                                color: Colors.amber.shade600,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'home.ai_analysis_hint'.tr(),
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: Colors.grey.shade600,
                                        fontStyle: FontStyle.italic,
                                      ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // AI Analysis Button
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton.icon(
                            onPressed: (isAnalyzing.value ||
                                    exerciseController.text.trim().isEmpty ||
                                    durationController.text.trim().isEmpty)
                                ? null
                                : () async {
                                    final duration = int.tryParse(
                                            durationController.text.trim()) ??
                                        0;
                                    if (duration <= 0) {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                          content: Text(
                                              'home.please_enter_valid_duration'
                                                  .tr()),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                      return;
                                    }

                                    isAnalyzing.value = true;
                                    try {
                                      final result = await ref
                                          .read(logsRemoteDataSourceProvider)
                                          .analyzeExercise(
                                            exercise:
                                                exerciseController.text.trim(),
                                            duration: duration,
                                          );

                                      aiCalories.value =
                                          result['caloriesBurned'] as int? ?? 0;
                                      intensity.value =
                                          result['intensity'] as String? ?? '';
                                      exerciseTips.value =
                                          (result['tips'] as List<dynamic>? ??
                                                  [])
                                              .map((e) => e.toString())
                                              .toList();

                                      caloriesController.text =
                                          aiCalories.value.toString();
                                    } catch (e) {
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          SnackBar(
                                            content: Text('home.error_prefix'
                                                .tr(args: [e.toString()])),
                                            backgroundColor: Colors.red,
                                          ),
                                        );
                                      }
                                    } finally {
                                      isAnalyzing.value = false;
                                    }
                                  },
                            icon: isAnalyzing.value
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                          Colors.white),
                                    ),
                                  )
                                : const Icon(
                                    Icons.psychology,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                            label: Text(
                              isAnalyzing.value
                                  ? 'home.calculating_calories'.tr()
                                  : 'home.analyze_exercise'.tr(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 16,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.deepPurple.shade600,
                              foregroundColor: Colors.white,
                              elevation: 2,
                              shadowColor: Colors.deepPurple.shade300,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              disabledBackgroundColor: Colors.grey.shade400,
                              disabledForegroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // AI Results Display
                    if (aiCalories.value != null) ...[
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color:
                                Theme.of(context).primaryColor.withOpacity(0.1),
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context)
                                        .primaryColor
                                        .withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(
                                    Icons.auto_awesome,
                                    color: Theme.of(context).primaryColor,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'home.ai_calculated_calories'.tr(args: [
                                          aiCalories.value.toString()
                                        ]),
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleMedium
                                            ?.copyWith(
                                              fontWeight: FontWeight.w700,
                                              color: Colors.black87,
                                            ),
                                      ),
                                      if (intensity.value?.isNotEmpty == true)
                                        Text(
                                          'home.intensity_level'
                                              .tr(args: [intensity.value!]),
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.copyWith(
                                                color: Colors.black54,
                                                fontWeight: FontWeight.w500,
                                              ),
                                        ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            if (exerciseTips.value.isNotEmpty) ...[
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'home.exercise_tips'.tr(),
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleSmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.w600,
                                            color: Colors.black87,
                                          ),
                                    ),
                                    const SizedBox(height: 8),
                                    ...exerciseTips.value.map((tip) => Padding(
                                          padding:
                                              const EdgeInsets.only(bottom: 4),
                                          child: Row(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Container(
                                                margin: const EdgeInsets.only(
                                                    top: 6),
                                                width: 4,
                                                height: 4,
                                                decoration: BoxDecoration(
                                                  color: Theme.of(context)
                                                      .primaryColor,
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  tip,
                                                  style: Theme.of(context)
                                                      .textTheme
                                                      .bodySmall
                                                      ?.copyWith(
                                                        color: Colors.black87,
                                                        height: 1.4,
                                                      ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        )),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Toggle for manual entry
                      Center(
                        child: TextButton.icon(
                          onPressed: () {
                            showManualCalories.value =
                                !showManualCalories.value;
                            if (!showManualCalories.value) {
                              caloriesController.text =
                                  aiCalories.value.toString();
                            }
                          },
                          icon: Icon(
                            showManualCalories.value
                                ? Icons.smart_toy
                                : Icons.edit,
                            size: 18,
                            color: Theme.of(context).primaryColor,
                          ),
                          label: Text(
                            showManualCalories.value
                                ? 'home.use_ai_calculation'.tr()
                                : 'home.manual_entry'.tr(),
                            style: TextStyle(
                              color: Theme.of(context).primaryColor,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          style: TextButton.styleFrom(
                            backgroundColor: Theme.of(context)
                                .primaryColor
                                .withOpacity(0.05),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],

                    // Calories Burned Input (conditional)
                    if (aiCalories.value == null ||
                        showManualCalories.value) ...[
                      Text(
                        'home.calories_burned'.tr(),
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black87,
                                ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: caloriesController,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly
                        ],
                        decoration: InputDecoration(
                          hintText: 'home.calories_hint'.tr(),
                          hintStyle: TextStyle(color: Colors.grey),
                          prefixIcon: const Icon(Icons.local_fire_department),
                          suffixText: 'home.unit_calories'.tr(),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(
                                color: Theme.of(context).primaryColor),
                          ),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],

                    // Save Button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: isLoading.value
                            ? null
                            : () async {
                                // Validate exercise input
                                if (exerciseController.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                          'home.please_enter_exercise'.tr()),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                  return;
                                }

                                // Validate duration input
                                if (durationController.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                          'home.please_enter_duration'.tr()),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                  return;
                                }

                                // Validate calories input
                                if (caloriesController.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                          'home.please_enter_calories'.tr()),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                  return;
                                }

                                final burnedCalories = int.tryParse(
                                        caloriesController.text.trim()) ??
                                    0;

                                if (burnedCalories <= 0) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                          'home.please_enter_valid_calories'
                                              .tr()),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                  return;
                                }

                                isLoading.value = true;

                                try {
                                  final selectedJalali =
                                      ref.read(selectedJalaliDateProvider);
                                  final targetDateIso =
                                      _toIsoFromJalali(selectedJalali);

                                  // Update burned calories for the selected date
                                  final result = await ref
                                      .read(logsRemoteDataSourceProvider)
                                      .updateBurnedCalories(
                                        dateIso: targetDateIso,
                                        burnedCalories: burnedCalories,
                                      );

                                  // Refresh the daily log and remaining data
                                  await ref
                                      .read(dailyLogControllerProvider.notifier)
                                      .refresh();
                                  ref.invalidate(dailyRemainingProvider);

                                  if (context.mounted) {
                                    // Show appropriate message based on server response
                                    String message;
                                    Color backgroundColor;

                                    if (result['preferenceDisabled'] == true) {
                                      message =
                                          'home.exercise_logged_no_goal'.tr();
                                      backgroundColor = Colors.orange;
                                    } else {
                                      message = 'home.exercise_added'.tr();
                                      backgroundColor = Colors.green;
                                    }

                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(message),
                                        backgroundColor: backgroundColor,
                                      ),
                                    );
                                    GoRouter.of(context).pop();
                                  }
                                } catch (e) {
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('home.error_prefix'
                                            .tr(args: [e.toString()])),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                  }
                                } finally {
                                  isLoading.value = false;
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).primaryColor,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          disabledBackgroundColor: Colors.grey.shade400,
                          disabledForegroundColor: Colors.white,
                        ),
                        child: isLoading.value
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.white),
                                ),
                              )
                            : Text(
                                'home.save_exercise'.tr(),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
