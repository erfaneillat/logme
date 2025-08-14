import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../common/widgets/progress_ring.dart';
import 'package:cal_ai/features/logs/data/datasources/logs_remote_data_source.dart';
import 'package:cal_ai/features/logs/domain/usecases/update_log_item_usecase.dart';
import 'package:cal_ai/features/logs/domain/usecases/add_log_item_usecase.dart';
import 'package:cal_ai/features/logs/presentation/providers/daily_log_provider.dart';
import 'package:cal_ai/features/food_recognition/domain/entities/food_analysis.dart';

class FoodDetailArgs {
  final String? id;
  final String dateIso; // YYYY-MM-DD for the log date
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

  const FoodDetailArgs({
    this.id,
    required this.dateIso,
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
    final liked = useState<bool>(args.initialLiked);
    final itemIdState = useState<String?>(args.id);
    final caloriesState = useState<int>(args.calories);
    final proteinGramsState = useState<int>(args.proteinGrams);
    final fatGramsState = useState<int>(args.fatGrams);
    final carbsGramsState = useState<int>(args.carbsGrams);
    final healthScoreState = useState<int>(args.healthScore);
    final ingredientsState =
        useState<List<IngredientItem>>(List.of(args.ingredients));
    const double boxHeight = 96;
    final String gramsUnit =
        (context.locale.languageCode.toLowerCase().startsWith('fa'))
            ? 'گرم'
            : 'g';
    final String kcalUnit =
        (context.locale.languageCode.toLowerCase().startsWith('fa'))
            ? 'کالری'
            : 'kcal';

    int computeHealthScoreFallback() {
      final int calories =
          (caloriesState.value * portions.value).clamp(0, 5000);
      final int protein =
          (proteinGramsState.value * portions.value).clamp(0, 500);
      final int fats = (fatGramsState.value * portions.value).clamp(0, 500);
      final int carbs = (carbsGramsState.value * portions.value).clamp(0, 1000);

      final int energyFromMacros = protein * 4 + carbs * 4 + fats * 9;
      final int totalEnergy =
          energyFromMacros > 0 ? energyFromMacros : calories;
      final double pPct = totalEnergy > 0 ? (protein * 4) / totalEnergy : 0;
      final double fPct = totalEnergy > 0 ? (fats * 9) / totalEnergy : 0;
      final double cPct = totalEnergy > 0 ? (carbs * 4) / totalEnergy : 0;
      final double diff =
          (pPct - 0.25).abs() + (fPct - 0.30).abs() + (cPct - 0.45).abs();
      final double macroScore = (8 * (1 - diff / 1.5)).clamp(0.0, 8.0);
      double kcalScore;
      if (calories <= 0) {
        kcalScore = 0.5;
      } else if (calories > 900) {
        kcalScore = 0.2;
      } else if (calories > 750) {
        kcalScore = 0.6;
      } else if (calories < 250) {
        kcalScore = 1.2;
      } else {
        kcalScore = 1.6;
      }
      final double proteinPer100 =
          calories > 0 ? (protein / (calories / 100)) : 0;
      final double proteinBonus = ((proteinPer100 - 2) * 0.5).clamp(0.0, 1.5);
      final double varietyBonus =
          (ingredientsState.value.length * 0.1).clamp(0.0, 0.5);
      final double raw = macroScore + kcalScore + proteinBonus + varietyBonus;
      return raw.clamp(0.0, 10.0).round();
    }

    final int derivedHealthScore = healthScoreState.value > 0
        ? healthScoreState.value
        : computeHealthScoreFallback();

    useEffect(() {
      // On open, fetch current like status from server if we have an item id
      Future.microtask(() async {
        if (itemIdState.value != null && itemIdState.value!.isNotEmpty) {
          try {
            final log = await ref
                .read(logsRemoteDataSourceProvider)
                .getDailyLog(args.dateIso);
            try {
              final item =
                  log.items.firstWhere((it) => it.id == itemIdState.value);
              // ignore: invalid_use_of_visible_for_testing_member, invalid_use_of_protected_member
              // set directly to avoid unwanted rebuilds if unchanged
              // but useState handles equality so simple assignment is fine
              // Only update if different
              // useState provided setter
              if (item.liked != liked.value) {
                liked.value = item.liked;
              }
            } catch (_) {
              // Item not found for today; keep existing like state
            }
          } catch (_) {
            // Network error; keep existing like state
          }
        }
      });
      return null;
    }, const []);

    Future<void> _persist() async {
      try {
        final effectiveCalories = caloriesState.value * portions.value;
        final effectiveProtein = proteinGramsState.value * portions.value;
        final effectiveFats = fatGramsState.value * portions.value;
        final effectiveCarbs = carbsGramsState.value * portions.value;

        if (itemIdState.value != null && itemIdState.value!.isNotEmpty) {
          await ref.read(updateLogItemUseCaseProvider).call(
                UpdateLogItemParams(
                  dateIso: args.dateIso,
                  itemId: itemIdState.value!,
                  title: args.title,
                  calories: effectiveCalories,
                  carbsGrams: effectiveCarbs,
                  proteinGrams: effectiveProtein,
                  fatsGrams: effectiveFats,
                  healthScore: healthScoreState.value > 0
                      ? healthScoreState.value
                      : null,
                  imageUrl: args.imageUrl,
                  ingredients: ingredientsState.value
                      .map((e) => IngredientEntity(
                            name: e.name,
                            calories: e.calories,
                            proteinGrams: e.proteinGrams,
                            fatGrams: e.fatGrams,
                            carbsGrams: e.carbsGrams,
                          ))
                      .toList(),
                  liked: liked.value,
                  portions: portions.value,
                ),
              );
        } else {
          final created = await ref.read(addLogItemUseCaseProvider).call(
                AddLogItemParams(
                  dateIso: args.dateIso,
                  title: args.title,
                  calories: effectiveCalories,
                  carbsGrams: effectiveCarbs,
                  proteinGrams: effectiveProtein,
                  fatsGrams: effectiveFats,
                  healthScore: healthScoreState.value > 0
                      ? healthScoreState.value
                      : null,
                  imageUrl: args.imageUrl,
                  ingredients: ingredientsState.value
                      .map((e) => IngredientEntity(
                            name: e.name,
                            calories: e.calories,
                            proteinGrams: e.proteinGrams,
                            fatGrams: e.fatGrams,
                            carbsGrams: e.carbsGrams,
                          ))
                      .toList(),
                  liked: liked.value,
                  portions: portions.value,
                ),
              );
          itemIdState.value = created.id;
        }

        await ref.read(dailyLogControllerProvider.notifier).refresh();
      } catch (_) {}
    }

    Future<void> _editNumberDialog({
      required String title,
      required int current,
      required void Function(int) onSave,
    }) async {
      final controller = TextEditingController(text: current.toString());
      final result = await showDialog<int>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(title),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text('common.cancel'.tr()),
            ),
            TextButton(
              onPressed: () {
                final parsed = int.tryParse(controller.text.trim());
                Navigator.of(ctx).pop((parsed ?? current).clamp(0, 100000));
              },
              child: Text('common.add'.tr()),
            ),
          ],
        ),
      );
      if (result != null) {
        onSave(result);
        await _persist();
      }
    }

    Future<void> _editIngredientDialog({
      IngredientItem? initial,
      required void Function(IngredientItem) onSave,
    }) async {
      final nameController = TextEditingController(text: initial?.name ?? '');
      final caloriesController =
          TextEditingController(text: (initial?.calories ?? 0).toString());
      final proteinController =
          TextEditingController(text: (initial?.proteinGrams ?? 0).toString());
      final fatController =
          TextEditingController(text: (initial?.fatGrams ?? 0).toString());
      final carbsController =
          TextEditingController(text: (initial?.carbsGrams ?? 0).toString());

      final saved = await showDialog<IngredientItem>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(initial == null
              ? 'food_detail.add_ingredient'.tr()
              : 'food_detail.edit_ingredient'.tr()),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration:
                      InputDecoration(labelText: 'food_detail.name'.tr()),
                ),
                TextField(
                  controller: caloriesController,
                  keyboardType: TextInputType.number,
                  decoration:
                      InputDecoration(labelText: 'food_detail.calories'.tr()),
                ),
                TextField(
                  controller: proteinController,
                  keyboardType: TextInputType.number,
                  decoration:
                      InputDecoration(labelText: 'onboarding.protein'.tr()),
                ),
                TextField(
                  controller: fatController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                      labelText: 'plan_generation.metric.fats'.tr()),
                ),
                TextField(
                  controller: carbsController,
                  keyboardType: TextInputType.number,
                  decoration:
                      InputDecoration(labelText: 'onboarding.carbs'.tr()),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text('common.cancel'.tr()),
            ),
            TextButton(
              onPressed: () {
                IngredientItem item = IngredientItem(
                  name: nameController.text.trim(),
                  calories: int.tryParse(caloriesController.text.trim()) ?? 0,
                  proteinGrams:
                      int.tryParse(proteinController.text.trim()) ?? 0,
                  fatGrams: int.tryParse(fatController.text.trim()) ?? 0,
                  carbsGrams: int.tryParse(carbsController.text.trim()) ?? 0,
                );
                Navigator.of(ctx).pop(item);
              },
              child: Text('common.add'.tr()),
            ),
          ],
        ),
      );
      if (saved != null) {
        onSave(saved);
        await _persist();
      }
    }

    Widget metricBox({
      required String label,
      required String value,
      IconData? icon,
      Color? chipColor,
      bool editable = true,
      VoidCallback? onEdit,
    }) {
      return SizedBox(
        height: boxHeight,
        child: Container(
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
                      child: Icon(icon,
                          size: 14, color: chipColor ?? Colors.black),
                    ),
                  if (icon != null) const SizedBox(width: 8),
                  Expanded(
                    child: Text(value,
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800)),
                  ),
                  if (editable)
                    GestureDetector(
                      onTap: onEdit,
                      child: const Icon(Icons.edit,
                          size: 18, color: Colors.black54),
                    ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    Widget healthScoreBox(int score) {
      final int clamped = score.clamp(0, 10);
      Color color;
      if (clamped >= 8) {
        color = Colors.green;
      } else if (clamped >= 5) {
        color = Colors.orange;
      } else {
        color = Colors.redAccent;
      }

      return SizedBox(
        height: boxHeight,
        child: Container(
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
              Text('plan_generation.metric.health_score'.tr(),
                  style: theme.textTheme.labelLarge
                      ?.copyWith(color: Colors.black54)),
              const SizedBox(height: 8),
              Row(
                children: [
                  SizedBox(
                    width: 38,
                    height: 38,
                    child: AnimatedProgressRing(
                      progress: clamped / 10.0,
                      color: color,
                      backgroundColor: Colors.black12,
                      strokeWidth: 6,
                      child: Text(
                        '$clamped',
                        style: theme.textTheme.labelLarge
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '$clamped/10',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    Widget portionsBox() {
      return SizedBox(
        height: boxHeight,
        child: Container(
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
                    onPressed: () async {
                      portions.value = (portions.value - 1).clamp(1, 9999);
                      await _persist();
                    },
                    icon: const Icon(Icons.remove),
                    padding: EdgeInsets.zero,
                    constraints:
                        const BoxConstraints(minWidth: 36, minHeight: 36),
                    visualDensity: VisualDensity.compact,
                  ),
                  Text('${portions.value}',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w800)),
                  IconButton(
                    onPressed: () async {
                      portions.value = portions.value + 1;
                      await _persist();
                    },
                    icon: const Icon(Icons.add),
                    padding: EdgeInsets.zero,
                    constraints:
                        const BoxConstraints(minWidth: 36, minHeight: 36),
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
            ],
          ),
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
          if (ingredientsState.value.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text('food_detail.no_ingredients'.tr(),
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(color: Colors.black54)),
            ),
          ...ingredientsState.value.map((ing) {
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
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('${ing.calories} $kcalUnit',
                          style: theme.textTheme.bodyMedium
                              ?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit, size: 18),
                            onPressed: () async {
                              await _editIngredientDialog(
                                initial: ing,
                                onSave: (updated) {
                                  final list = [...ingredientsState.value];
                                  final idx = list.indexOf(ing);
                                  if (idx >= 0) {
                                    list[idx] = updated;
                                    ingredientsState.value = list;
                                  }
                                },
                              );
                            },
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            visualDensity: VisualDensity.compact,
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(Icons.delete_outline,
                                size: 18, color: Colors.redAccent),
                            onPressed: () async {
                              final list = [...ingredientsState.value];
                              list.remove(ing);
                              ingredientsState.value = list;
                              await _persist();
                            },
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            visualDensity: VisualDensity.compact,
                          ),
                        ],
                      )
                    ],
                  )
                ],
              ),
            );
          }).toList(),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () async {
                await _editIngredientDialog(onSave: (newIng) {
                  ingredientsState.value = [...ingredientsState.value, newIng];
                });
              },
              icon: const Icon(Icons.add),
              label: Text('food_detail.add_ingredient'.tr()),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                side: BorderSide(color: Colors.grey.shade300),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
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
            actions: [
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () async {
                  final newLiked = !liked.value;
                  liked.value = newLiked;
                  try {
                    if (itemIdState.value != null) {
                      await _toggleLikeOnServer(
                        ref,
                        dateIso: args.dateIso,
                        itemId: itemIdState.value!,
                        liked: newLiked,
                      );
                    }
                  } catch (_) {
                    liked.value = !newLiked;
                  }
                },
                child: _CircleIcon(
                  icon: liked.value ? Icons.favorite : Icons.favorite_border,
                ),
              ),
              const SizedBox(width: 8),
              if (itemIdState.value != null && itemIdState.value!.isNotEmpty)
                PopupMenuButton<String>(
                  padding: EdgeInsets.zero,
                  itemBuilder: (ctx) => [
                    PopupMenuItem<String>(
                      value: 'delete',
                      child: Row(
                        children: [
                          const Icon(Icons.delete_outline,
                              color: Colors.redAccent),
                          const SizedBox(width: 8),
                          Text(
                            'food_detail.delete'.tr(),
                            style: const TextStyle(
                              color: Colors.redAccent,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  onSelected: (value) async {
                    if (value == 'delete') {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (dctx) {
                          return AlertDialog(
                            title:
                                Text('food_detail.delete_confirm_title'.tr()),
                            content:
                                Text('food_detail.delete_confirm_desc'.tr()),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.of(dctx).pop(false),
                                child: Text('common.cancel'.tr()),
                              ),
                              TextButton(
                                onPressed: () => Navigator.of(dctx).pop(true),
                                child: Text('food_detail.delete'.tr()),
                              ),
                            ],
                          );
                        },
                      );
                      if (confirm == true) {
                        try {
                          await _deleteItemOnServer(
                            ref,
                            dateIso: args.dateIso,
                            itemId: itemIdState.value!,
                          );
                          itemIdState.value = null;
                          // Refresh the list on Home/Logs
                          await ref
                              .read(dailyLogControllerProvider.notifier)
                              .refresh();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                  content: Text('food_detail.deleted'.tr())),
                            );
                            Navigator.of(context).maybePop();
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(e.toString())),
                            );
                          }
                        }
                      }
                    }
                  },
                  child: const _CircleIcon(icon: Icons.more_horiz),
                )
              else
                const _CircleIcon(icon: Icons.more_horiz),
              const SizedBox(width: 8),
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
                            value:
                                '${caloriesState.value * portions.value} $kcalUnit',
                            onEdit: () async {
                              await _editNumberDialog(
                                title: 'plan_generation.metric.calories'.tr(),
                                current: caloriesState.value,
                                onSave: (v) => caloriesState.value = v,
                              );
                            },
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
                            value:
                                '${proteinGramsState.value * portions.value} $gramsUnit',
                            icon: Icons.bolt_outlined,
                            chipColor: Colors.orange,
                            onEdit: () async {
                              await _editNumberDialog(
                                title: 'onboarding.protein'.tr(),
                                current: proteinGramsState.value,
                                onSave: (v) => proteinGramsState.value = v,
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: metricBox(
                            label: 'plan_generation.metric.fats'.tr(),
                            value:
                                '${fatGramsState.value * portions.value} $gramsUnit',
                            icon: Icons.water_drop_outlined,
                            chipColor: Colors.blueAccent,
                            onEdit: () async {
                              await _editNumberDialog(
                                title: 'plan_generation.metric.fats'.tr(),
                                current: fatGramsState.value,
                                onSave: (v) => fatGramsState.value = v,
                              );
                            },
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
                            value:
                                '${carbsGramsState.value * portions.value} $gramsUnit',
                            icon: Icons.spa_outlined,
                            chipColor: Colors.yellow.shade700,
                            onEdit: () async {
                              await _editNumberDialog(
                                title: 'onboarding.carbs'.tr(),
                                current: carbsGramsState.value,
                                onSave: (v) => carbsGramsState.value = v,
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: healthScoreBox(derivedHealthScore),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          try {
                            final effectiveCalories =
                                caloriesState.value * portions.value;
                            final effectiveProtein =
                                proteinGramsState.value * portions.value;
                            final effectiveFats =
                                fatGramsState.value * portions.value;
                            final effectiveCarbs =
                                carbsGramsState.value * portions.value;

                            if (args.id != null && args.id!.isNotEmpty) {
                              await ref
                                  .read(updateLogItemUseCaseProvider)
                                  .call(UpdateLogItemParams(
                                    dateIso: args.dateIso,
                                    itemId: args.id!,
                                    title: args.title,
                                    calories: effectiveCalories,
                                    carbsGrams: effectiveCarbs,
                                    proteinGrams: effectiveProtein,
                                    fatsGrams: effectiveFats,
                                    healthScore: healthScoreState.value > 0
                                        ? healthScoreState.value
                                        : null,
                                    imageUrl: args.imageUrl,
                                    ingredients: ingredientsState.value
                                        .map((e) => IngredientEntity(
                                              name: e.name,
                                              calories: e.calories,
                                              proteinGrams: e.proteinGrams,
                                              fatGrams: e.fatGrams,
                                              carbsGrams: e.carbsGrams,
                                            ))
                                        .toList(),
                                    liked: liked.value,
                                    portions: portions.value,
                                  ));
                            } else {
                              await ref
                                  .read(logsRemoteDataSourceProvider)
                                  .addItem(
                                    dateIso: args.dateIso,
                                    title: args.title,
                                    calories: effectiveCalories,
                                    carbsGrams: effectiveCarbs,
                                    proteinGrams: effectiveProtein,
                                    fatsGrams: effectiveFats,
                                    healthScore: healthScoreState.value > 0
                                        ? healthScoreState.value
                                        : null,
                                    imageUrl: args.imageUrl,
                                    ingredients: ingredientsState.value
                                        .map((e) => IngredientEntity(
                                              name: e.name,
                                              calories: e.calories,
                                              proteinGrams: e.proteinGrams,
                                              fatGrams: e.fatGrams,
                                              carbsGrams: e.carbsGrams,
                                            ))
                                        .toList(),
                                    liked: liked.value,
                                    portions: portions.value,
                                  );
                            }

                            await ref
                                .read(dailyLogControllerProvider.notifier)
                                .refresh();
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                      args.id != null && args.id!.isNotEmpty
                                          ? 'food_detail.updated'.tr()
                                          : 'home.added_to_log'.tr()),
                                ),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(e.toString())),
                              );
                            }
                          }
                        },
                        icon: const Icon(Icons.auto_fix_high_outlined),
                        label: Text('food_detail.update_item'.tr()),
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

// Removed helper _resolveDateIso; FoodDetailPage now requires explicit dateIso.

Future<void> _toggleLikeOnServer(
  WidgetRef ref, {
  required String dateIso,
  required String itemId,
  required bool liked,
}) async {
  final logsRemote = ref.read(logsRemoteDataSourceProvider);
  await logsRemote.toggleItemLike(
    dateIso: dateIso,
    itemId: itemId,
    liked: liked,
  );
}

Future<void> _deleteItemOnServer(
  WidgetRef ref, {
  required String dateIso,
  required String itemId,
}) async {
  final logsRemote = ref.read(logsRemoteDataSourceProvider);
  await logsRemote.deleteItem(dateIso: dateIso, itemId: itemId);
}

// Bottom sheet menu removed in favor of popup menu

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
