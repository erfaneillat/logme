import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/features/food_recognition/data/datasources/food_remote_data_source.dart';

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

class FoodDetailArgs {
  final String? id; // backend id when available
  final String title;
  final String? imageUrl;
  final int calories;
  final int proteinGrams;
  final int fatGrams;
  final int carbsGrams;
  final int healthScore; // 0..10
  final int portions;
  final List<IngredientItem> ingredients;
  final bool initialLiked;
  final String? logDateIso; // YYYY-MM-DD for server toggle

  const FoodDetailArgs({
    this.id,
    required this.title,
    required this.calories,
    required this.proteinGrams,
    required this.fatGrams,
    required this.carbsGrams,
    this.healthScore = 0,
    this.portions = 1,
    this.imageUrl,
    this.ingredients = const [],
    this.initialLiked = false,
    this.logDateIso,
  });
}

class FoodDetailPage extends HookConsumerWidget {
  final FoodDetailArgs args;
  const FoodDetailPage({super.key, required this.args});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final liked = useState<bool>(args.initialLiked);

    final String gramsUnit =
        (context.locale.languageCode.toLowerCase().startsWith('fa'))
            ? 'گرم'
            : 'g';
    final String kcalUnit =
        (context.locale.languageCode.toLowerCase().startsWith('fa'))
            ? 'کالری'
            : 'kcal';

    return Scaffold(
      appBar: AppBar(
        title: Text(args.title,
            style: theme.textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: Icon(liked.value ? Icons.favorite : Icons.favorite_border),
            onPressed: () async {
              final newLiked = !liked.value;
              liked.value = newLiked;
              try {
                if (args.id != null) {
                  await _toggleLikeOnServer(ref,
                      dateIso: _resolveDateIso(),
                      itemId: args.id!,
                      liked: newLiked);
                }
              } catch (_) {
                liked.value = !newLiked;
              }
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (args.imageUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child:
                  Image.network(args.imageUrl!, height: 200, fit: BoxFit.cover),
            ),
          const SizedBox(height: 16),
          _metricRow(
            context,
            kcal: '${args.calories} $kcalUnit',
            protein: '${args.proteinGrams} $gramsUnit',
            fats: '${args.fatGrams} $gramsUnit',
            carbs: '${args.carbsGrams} $gramsUnit',
          ),
          const SizedBox(height: 16),
          Text('food_detail.ingredients'.tr(),
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (args.ingredients.isEmpty)
            Text('food_detail.no_ingredients'.tr(),
                style: theme.textTheme.bodyMedium
                    ?.copyWith(color: Colors.black54)),
          ...args.ingredients.map((ing) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(ing.name),
                subtitle: Text(
                    'P: ${ing.proteinGrams} $gramsUnit • F: ${ing.fatGrams} $gramsUnit • C: ${ing.carbsGrams} $gramsUnit'),
                trailing: Text('${ing.calories} $kcalUnit'),
              )),
        ],
      ),
    );
  }

  String _resolveDateIso() {
    if (args.logDateIso != null && args.logDateIso!.length >= 10) {
      return args.logDateIso!.substring(0, 10);
    }
    final now = DateTime.now();
    final yyyy = now.year.toString().padLeft(4, '0');
    final mm = now.month.toString().padLeft(2, '0');
    final dd = now.day.toString().padLeft(2, '0');
    return '$yyyy-$mm-$dd';
  }

  Future<void> _toggleLikeOnServer(WidgetRef ref,
      {required String dateIso,
      required String itemId,
      required bool liked}) async {}

  Widget _metricRow(BuildContext context,
      {required String kcal,
      required String protein,
      required String fats,
      required String carbs}) {
    final theme = Theme.of(context);
    Widget box(String label, String value, IconData icon) {
      return Expanded(
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Icon(icon, size: 16),
                const SizedBox(width: 6),
                Text(label)
              ]),
              const SizedBox(height: 8),
              Text(value,
                  style: theme.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w800)),
            ],
          ),
        ),
      );
    }

    return Row(children: [
      box('plan_generation.metric.calories'.tr(), kcal,
          Icons.local_fire_department),
      const SizedBox(width: 8),
      box('onboarding.protein'.tr(), protein, Icons.bolt_outlined),
      const SizedBox(width: 8),
      box('plan_generation.metric.fats'.tr(), fats, Icons.water_drop_outlined),
      const SizedBox(width: 8),
      box('onboarding.carbs'.tr(), carbs, Icons.spa_outlined),
    ]);
  }
}
