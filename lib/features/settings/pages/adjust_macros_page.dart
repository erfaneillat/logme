import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:cal_ai/extensions/context.dart';
import 'package:cal_ai/common/widgets/index.dart';
import '../presentation/providers/settings_providers.dart';
import 'package:cal_ai/features/additional_info/pages/additional_info_page.dart';

class AdjustMacrosPage extends HookConsumerWidget {
  const AdjustMacrosPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final macros = ref.watch(macrosProvider);
    final isSaving = useState(false);

    final calCtrl = useTextEditingController(text: macros.calories.toString());
    final proteinCtrl =
        useTextEditingController(text: macros.protein.toString());
    final carbsCtrl = useTextEditingController(text: macros.carbs.toString());
    final fatCtrl = useTextEditingController(text: macros.fat.toString());

    useEffect(() {
      // keep controllers in sync when provider updates (e.g., auto-generate)
      calCtrl.text = macros.calories.toString();
      proteinCtrl.text = macros.protein.toString();
      carbsCtrl.text = macros.carbs.toString();
      fatCtrl.text = macros.fat.toString();
      return null;
    }, [macros]);

    void onChanged() {
      final notifier = ref.read(macrosProvider.notifier);
      int parse(TextEditingController c) => int.tryParse(c.text) ?? 0;
      notifier.update(
        calories: parse(calCtrl),
        protein: parse(proteinCtrl),
        carbs: parse(carbsCtrl),
        fat: parse(fatCtrl),
      );
    }

    Widget goalTile({
      required IconData icon,
      required Color color,
      required String title,
      required TextEditingController controller,
    }) {
      return Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: Colors.grey.shade100,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
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
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    icon,
                    color: color,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade800,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              onChanged: (_) => onChanged(),
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: Colors.grey.shade900,
                  ),
              decoration: InputDecoration(
                isDense: false,
                hintText: tr('adjust_macros.value_hint'),
                hintStyle: TextStyle(
                  color: Colors.grey.shade400,
                  fontWeight: FontWeight.w500,
                ),
                filled: true,
                fillColor: Colors.grey.shade50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(
                    color: color.withOpacity(0.3),
                    width: 2,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 16,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'adjust_macros.title'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
      ),
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Section
              Text(
                'adjust_macros.heading'.tr(),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: Colors.grey.shade900,
                      letterSpacing: -0.5,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'adjust_macros.subtitle'.tr(),
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.grey.shade600,
                      height: 1.4,
                    ),
              ),
              const SizedBox(height: 32),

              // Macro Goals Grid
              goalTile(
                icon: Icons.local_fire_department_rounded,
                color: const Color(0xFF2563EB),
                title: 'adjust_macros.calorie_goal'.tr(),
                controller: calCtrl,
              ),
              goalTile(
                icon: Icons.fitness_center_rounded,
                color: const Color(0xFFDC2626),
                title: 'adjust_macros.protein_goal'.tr(),
                controller: proteinCtrl,
              ),
              goalTile(
                icon: Icons.grain_rounded,
                color: const Color(0xFFEAB308),
                title: 'adjust_macros.carb_goal'.tr(),
                controller: carbsCtrl,
              ),
              goalTile(
                icon: Icons.water_drop_rounded,
                color: const Color(0xFF059669),
                title: 'adjust_macros.fat_goal'.tr(),
                controller: fatCtrl,
              ),

              const SizedBox(height: 24),

              // Action Buttons
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.grey.shade100,
                    width: 1,
                  ),
                ),
                child: Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          context.pushNamed(
                            'additional-info',
                            extra: const AdditionalInfoArgs(
                              restrictedForAutoGenerate: true,
                            ),
                          );
                        },
                        icon: const Icon(Icons.auto_awesome_rounded, size: 20),
                        label: Text(
                          'adjust_macros.auto_generate'.tr(),
                          style: context.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.grey.shade50,
                          foregroundColor: Colors.grey.shade700,
                          side: BorderSide(
                            color: Colors.grey.shade200,
                            width: 1.5,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton.icon(
                        onPressed: isSaving.value
                            ? null
                            : () async {
                                isSaving.value = true;
                                final ok = await ref
                                    .read(macrosProvider.notifier)
                                    .saveToBackend();
                                isSaving.value = false;
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      ok
                                          ? 'adjust_macros.saved_success'.tr()
                                          : 'common.error'.tr(),
                                    ),
                                    backgroundColor:
                                        ok ? Colors.green : Colors.red,
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                );
                              },
                        icon: isSaving.value
                            ? SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Theme.of(context).colorScheme.onPrimary,
                                  ),
                                ),
                              )
                            : const Icon(Icons.check_rounded, size: 20),
                        label: Text(
                          'adjust_macros.save'.tr(),
                          style: context.textTheme.titleMedium?.copyWith(
                            color: Theme.of(context).colorScheme.onPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).primaryColor,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
