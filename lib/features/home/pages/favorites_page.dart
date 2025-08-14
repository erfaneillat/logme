import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:shamsi_date/shamsi_date.dart';

import 'package:cal_ai/features/logs/data/datasources/logs_remote_data_source.dart';
import 'package:cal_ai/features/logs/domain/entities/daily_log.dart';
import 'package:cal_ai/features/home/presentation/providers/home_date_provider.dart';
import 'package:cal_ai/features/logs/presentation/providers/daily_log_provider.dart';

final favoritesProvider =
    FutureProvider.autoDispose<List<DailyLogItemEntity>>((ref) async {
  // Build a reasonable range (e.g., last 60 days) and gather liked items
  String toIso(Jalali d) {
    final g = d.toGregorian();
    final mm = g.month.toString().padLeft(2, '0');
    final dd = g.day.toString().padLeft(2, '0');
    return '${g.year}-$mm-$dd';
  }

  final todayJ = ref.read(todayJalaliProvider);
  final startJ = todayJ.addDays(-60);
  final startIso = toIso(startJ);
  final endIso = toIso(todayJ);

  final logs = await ref.read(logsRemoteDataSourceProvider).getLogsRange(
        startIso: startIso,
        endIso: endIso,
      );
  final likedItems = <DailyLogItemEntity>[];
  for (final log in logs) {
    for (final item in log.items) {
      if (item.liked) likedItems.add(item);
    }
  }
  // Sort by most recent first
  likedItems.sort((a, b) => b.timeIso.compareTo(a.timeIso));
  return likedItems;
});

class FavoritesPage extends ConsumerWidget {
  const FavoritesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favoritesAsync = ref.watch(favoritesProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('home.favorites'.tr()),
      ),
      body: favoritesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child:
                  Text('home.no_favorites'.tr(), textAlign: TextAlign.center),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final it = items[i];
              return InkWell(
                onTap: () async {
                  final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (ctx) {
                          return AlertDialog(
                            title: Text('home.add_favorite_confirm_title'.tr()),
                            content: Text('home.add_favorite_confirm_desc'
                                .tr(args: [it.title])),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.of(ctx).pop(false),
                                child: Text('common.cancel'.tr()),
                              ),
                              TextButton(
                                onPressed: () => Navigator.of(ctx).pop(true),
                                child: Text('common.add'.tr()),
                              ),
                            ],
                          );
                        },
                      ) ??
                      false;
                  if (!confirmed) return;

                  // Use current selected date
                  String toIsoFromJalali(Jalali d) {
                    final g = d.toGregorian();
                    final mm = g.month.toString().padLeft(2, '0');
                    final dd = g.day.toString().padLeft(2, '0');
                    return '${g.year}-$mm-$dd';
                  }

                  final selectedJ = ref.read(selectedJalaliDateProvider);
                  final targetDateIso = toIsoFromJalali(selectedJ);

                  try {
                    await ref.read(logsRemoteDataSourceProvider).addItem(
                          dateIso: targetDateIso,
                          title: it.title,
                          calories: it.calories,
                          carbsGrams: it.carbsGrams,
                          proteinGrams: it.proteinGrams,
                          fatsGrams: it.fatsGrams,
                          healthScore: null,
                          imageUrl: it.imageUrl,
                          ingredients: it.ingredients,
                          liked: false,
                          portions: it.portions,
                        );
                    // Refresh Home aggregates and list
                    await ref
                        .read(dailyLogControllerProvider.notifier)
                        .refresh();
                    // ignore: unused_result
                    ref.refresh(dailyRemainingProvider);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('home.added_to_log'.tr())),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: $e')),
                      );
                    }
                  }
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          width: 56,
                          height: 56,
                          color: Colors.grey.shade200,
                          child: it.imageUrl != null
                              ? Image.network(it.imageUrl!, fit: BoxFit.cover)
                              : const Icon(Icons.fastfood,
                                  color: Colors.black54),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(it.title,
                                style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 4),
                            Text('${it.calories} kcal',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(color: Colors.black87)),
                          ],
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            tooltip: 'home.add'.tr(),
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () async {
                              final confirmed = await showDialog<bool>(
                                    context: context,
                                    builder: (ctx) {
                                      return AlertDialog(
                                        title: Text(
                                            'home.add_favorite_confirm_title'
                                                .tr()),
                                        content: Text(
                                            'home.add_favorite_confirm_desc'
                                                .tr(args: [it.title])),
                                        actions: [
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.of(ctx).pop(false),
                                            child: Text('common.cancel'.tr()),
                                          ),
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.of(ctx).pop(true),
                                            child: Text('common.add'.tr()),
                                          ),
                                        ],
                                      );
                                    },
                                  ) ??
                                  false;
                              if (!confirmed) return;

                              String toIsoFromJalali(Jalali d) {
                                final g = d.toGregorian();
                                final mm = g.month.toString().padLeft(2, '0');
                                final dd = g.day.toString().padLeft(2, '0');
                                return '${g.year}-$mm-$dd';
                              }

                              final selectedJ =
                                  ref.read(selectedJalaliDateProvider);
                              final targetDateIso = toIsoFromJalali(selectedJ);

                              try {
                                await ref
                                    .read(logsRemoteDataSourceProvider)
                                    .addItem(
                                      dateIso: targetDateIso,
                                      title: it.title,
                                      calories: it.calories,
                                      carbsGrams: it.carbsGrams,
                                      proteinGrams: it.proteinGrams,
                                      fatsGrams: it.fatsGrams,
                                      healthScore: null,
                                      imageUrl: it.imageUrl,
                                      ingredients: it.ingredients,
                                      liked: false,
                                      portions: it.portions,
                                    );
                                await ref
                                    .read(dailyLogControllerProvider.notifier)
                                    .refresh();
                                // ignore: unused_result
                                ref.refresh(dailyRemainingProvider);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                        content:
                                            Text('home.added_to_log'.tr())),
                                  );
                                }
                              } catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Error: $e')),
                                  );
                                }
                              }
                            },
                          ),
                          IconButton(
                            tooltip: 'home.remove_favorite'.tr(),
                            icon: const Icon(Icons.favorite),
                            color: Colors.redAccent,
                            onPressed: () async {
                              final remove = await showDialog<bool>(
                                    context: context,
                                    builder: (ctx) => AlertDialog(
                                      title: Text(
                                          'home.remove_favorite_title'.tr()),
                                      content: Text('home.remove_favorite_desc'
                                          .tr(args: [it.title])),
                                      actions: [
                                        TextButton(
                                          onPressed: () =>
                                              Navigator.of(ctx).pop(false),
                                          child: Text('common.cancel'.tr()),
                                        ),
                                        TextButton(
                                          onPressed: () =>
                                              Navigator.of(ctx).pop(true),
                                          child: Text('home.remove'.tr()),
                                        ),
                                      ],
                                    ),
                                  ) ??
                                  false;
                              if (!remove) return;
                              try {
                                await ref
                                    .read(logsRemoteDataSourceProvider)
                                    .removeItemFromFavorites(itemId: it.id);
                                // Refresh list
                                // ignore: unused_result
                                ref.refresh(favoritesProvider);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                        content: Text(
                                            'home.removed_from_favorites'
                                                .tr())),
                                  );
                                }
                              } catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Error: $e')),
                                  );
                                }
                              }
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
