import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class FoodDetailArgs {
  final String title;
  final String? imageUrl;
  final int calories;
  final int proteinGrams;
  final int fatGrams;
  final int carbsGrams;
  final int healthScore; // 0..10
  final int portions;
  final List<IngredientItem> ingredients;

  const FoodDetailArgs({
    required this.title,
    required this.calories,
    required this.proteinGrams,
    required this.fatGrams,
    required this.carbsGrams,
    this.healthScore = 0,
    this.portions = 1,
    this.imageUrl,
    this.ingredients = const [],
  });
}

class IngredientItem {
  final String name;
  final int calories;
  final int proteinGrams;
  final int fatGrams;
  final int carbsGrams;

  const IngredientItem({
    required this.name,
    required this.calories,
    required this.proteinGrams,
    required this.fatGrams,
    required this.carbsGrams,
  });
}

class FoodDetailPage extends HookConsumerWidget {
  final FoodDetailArgs args;
  const FoodDetailPage({super.key, required this.args});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final portions = useState<int>(args.portions);
    final String gramsUnit =
        (context.locale.languageCode.toLowerCase().startsWith('fa'))
            ? 'گرم'
            : 'g';
    final String kcalUnit =
        (context.locale.languageCode.toLowerCase().startsWith('fa'))
            ? 'کالری'
            : 'kcal';

    Widget metricBox({
      required String label,
      required String value,
      IconData? icon,
      Color? chipColor,
      bool editable = true,
    }) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: theme.textTheme.labelLarge
                    ?.copyWith(color: Colors.black54)),
            const SizedBox(height: 8),
            Row(
              children: [
                if (icon != null)
                  Container(
                    width: 20,
                    height: 20,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: (chipColor ?? Colors.black).withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child:
                        Icon(icon, size: 14, color: chipColor ?? Colors.black),
                  ),
                if (icon != null) const SizedBox(width: 8),
                Expanded(
                  child: Text(value,
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w800)),
                ),
                if (editable)
                  const Icon(Icons.edit, size: 18, color: Colors.black54),
              ],
            ),
          ],
        ),
      );
    }

    Widget portionsBox() {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('food_detail.portions'.tr(),
                style: theme.textTheme.labelLarge
                    ?.copyWith(color: Colors.black54)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  onPressed: () =>
                      portions.value = (portions.value - 1).clamp(1, 9999),
                  icon: const Icon(Icons.remove),
                ),
                Text('${portions.value}',
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800)),
                IconButton(
                  onPressed: () => portions.value = portions.value + 1,
                  icon: const Icon(Icons.add),
                ),
              ],
            ),
          ],
        ),
      );
    }

    Widget ingredientsSection() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('food_detail.ingredients'.tr(),
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          if (args.ingredients.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text('food_detail.no_ingredients'.tr(),
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(color: Colors.black54)),
            ),
          ...args.ingredients.map((ing) {
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(ing.name, style: theme.textTheme.titleMedium),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            _macroLetterChip(context, 'P', Colors.orange,
                                '${ing.proteinGrams} $gramsUnit'),
                            const SizedBox(width: 8),
                            _macroLetterChip(context, 'F', Colors.blueAccent,
                                '${ing.fatGrams} $gramsUnit'),
                            const SizedBox(width: 8),
                            _macroLetterChip(
                                context,
                                'C',
                                Colors.yellow.shade700,
                                '${ing.carbsGrams} $gramsUnit'),
                          ],
                        )
                      ],
                    ),
                  ),
                  Text('${ing.calories} $kcalUnit',
                      style: theme.textTheme.bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w700)),
                ],
              ),
            );
          }).toList(),
        ],
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 260,
            automaticallyImplyLeading: false,
            backgroundColor: Colors.white,
            foregroundColor: Colors.black,
            leading: IconButton(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back),
            ),
            actions: const [
              SizedBox(width: 8),
              _CircleIcon(icon: Icons.favorite_border),
              SizedBox(width: 8),
              _CircleIcon(icon: Icons.more_horiz),
              SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  args.imageUrl != null
                      ? Image.network(
                          args.imageUrl!,
                          fit: BoxFit.cover,
                          alignment: Alignment.topCenter,
                        )
                      : Container(color: Colors.black12),
                  SafeArea(
                    child: Align(
                      alignment: Alignment.topCenter,
                      child: Container(
                        margin: const EdgeInsets.only(top: 8),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          DateFormat('HH:mm').format(DateTime.now()),
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 44,
                        height: 5,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(args.title,
                        style: theme.textTheme.titleLarge
                            ?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: metricBox(
                            label: 'plan_generation.metric.calories'.tr(),
                            value: '${args.calories} $kcalUnit',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: portionsBox()),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: metricBox(
                            label: 'onboarding.protein'.tr(),
                            value: '${args.proteinGrams} $gramsUnit',
                            icon: Icons.bolt_outlined,
                            chipColor: Colors.orange,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: metricBox(
                            label: 'plan_generation.metric.fats'.tr(),
                            value: '${args.fatGrams} $gramsUnit',
                            icon: Icons.water_drop_outlined,
                            chipColor: Colors.blueAccent,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: metricBox(
                            label: 'onboarding.carbs'.tr(),
                            value: '${args.carbsGrams} $gramsUnit',
                            icon: Icons.spa_outlined,
                            chipColor: Colors.yellow.shade700,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: metricBox(
                            label: 'plan_generation.metric.health_score'.tr(),
                            value: '${args.healthScore}/10',
                            editable: false,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.auto_fix_high_outlined),
                        label: Text('food_detail.fix_result'.tr()),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.local_fire_department),
                        label: Text('food_detail.share'.tr()),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    ingredientsSection(),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _macroLetterChip(
      BuildContext context, String letter, Color color, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 10,
            backgroundColor: color,
            child: Text(
              letter,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 6),
          Text(text, style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    );
  }
}

class _CircleIcon extends StatelessWidget {
  final IconData icon;
  const _CircleIcon({required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration:
          const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
      child: Icon(icon, color: Colors.white),
    );
  }
}
