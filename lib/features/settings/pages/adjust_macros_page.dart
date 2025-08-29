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
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // circular progress ring style to match Home macros
            SizedBox(
              width: 56,
              height: 56,
              child: AnimatedProgressRing(
                progress: 1.0,
                color: color,
                backgroundColor: Colors.grey.shade200,
                strokeWidth: 8,
                child: CircleAvatar(
                  backgroundColor: Colors.grey.shade100,
                  radius: 20,
                  child: Icon(icon, color: color, size: 22),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 4),
                  TextField(
                    controller: controller,
                    keyboardType: TextInputType.number,
                    onChanged: (_) => onChanged(),
                    decoration: InputDecoration(
                      isDense: true,
                      hintText: tr('adjust_macros.value_hint'),
                      filled: true,
                      fillColor: const Color(0xFFF6F7FB),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding:
                          const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('adjust_macros.title'.tr()),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('adjust_macros.heading'.tr(),
                  style: Theme.of(context)
                      .textTheme
                      .headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),

              goalTile(
                icon: Icons.local_fire_department_outlined,
                color: Colors.black,
                title: 'adjust_macros.calorie_goal'.tr(),
                controller: calCtrl,
              ),
              const SizedBox(height: 12),
              goalTile(
                icon: Icons.bolt_outlined,
                color: Colors.orange,
                title: 'adjust_macros.protein_goal'.tr(),
                controller: proteinCtrl,
              ),
              const SizedBox(height: 12),
              goalTile(
                icon: Icons.spa_outlined,
                color: Colors.yellowAccent.shade700,
                title: 'adjust_macros.carb_goal'.tr(),
                controller: carbsCtrl,
              ),
              const SizedBox(height: 12),
              goalTile(
                icon: Icons.water_drop_outlined,
                color: Colors.blueAccent,
                title: 'adjust_macros.fat_goal'.tr(),
                controller: fatCtrl,
              ),

              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    context.pushNamed(
                      'additional-info',
                      extra: const AdditionalInfoArgs(
                        restrictedForAutoGenerate: true,
                      ),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    shape: const StadiumBorder(),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text('adjust_macros.auto_generate'.tr(),
                      style: context.textTheme.titleMedium),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isSaving.value
                      ? null
                      : () async {
                          isSaving.value = true;
                          final ok = await ref.read(macrosProvider.notifier).saveToBackend();
                          isSaving.value = false;
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                ok ? 'adjust_macros.saved_success'.tr() : 'common.error'.tr(),
                              ),
                            ),
                          );
                        },
                  style: ElevatedButton.styleFrom(
                    shape: const StadiumBorder(),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: isSaving.value
                      ? SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).colorScheme.onPrimary),
                          ),
                        )
                      : Text('adjust_macros.save'.tr(),
                          style: context.textTheme.titleMedium?.copyWith(color: Theme.of(context).colorScheme.onPrimary)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
