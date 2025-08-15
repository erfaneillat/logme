import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:cal_ai/common/widgets/index.dart';
import 'package:image_picker/image_picker.dart';
// import 'package:cal_ai/services/api_service_provider.dart';
// import 'package:cal_ai/config/api_config.dart';
// import 'package:dio/dio.dart';
import 'package:cal_ai/features/home/presentation/providers/home_date_provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cal_ai/features/food_recognition/pages/food_detail_page.dart';

import 'package:cal_ai/services/image_picker_service.dart';
import 'package:cal_ai/features/food_recognition/domain/usecases/analyze_food_image_usecase.dart';
import 'package:cal_ai/features/logs/presentation/providers/daily_log_provider.dart';
import 'package:cal_ai/features/food_recognition/domain/entities/food_analysis.dart';
import 'package:shamsi_date/shamsi_date.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({super.key});

  String _toIsoFromJalali(Jalali d) {
    final g = d.toGregorian();
    final mm = g.month.toString().padLeft(2, '0');
    final dd = g.day.toString().padLeft(2, '0');
    return '${g.year}-$mm-$dd';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Horizontal date strip controller and initial scroll to today
    final dateScrollController = useScrollController();
    final dateRange = ref.watch(jalaliDateRangeProvider);
    final today = ref.watch(todayJalaliProvider);

    useEffect(() {
      final int index = dateRange.indexWhere((d) => isSameJalaliDate(d, today));
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (index >= 0) {
          const double itemExtent = 56; // 44 circle + ~12 spacing
          final double offset = (index * itemExtent).toDouble();
          if (dateScrollController.hasClients) {
            dateScrollController.jumpTo(offset);
          }
        }
      });
      return null;
    }, const []);
    return Scaffold(
      extendBody: true,
      floatingActionButtonLocation: FloatingActionButtonLocation.startFloat,
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          final parentContext = context; // preserve a valid context
          showModalBottomSheet(
            context: parentContext,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            builder: (sheetContext) {
              return SafeArea(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      Text(
                        'home.quick_add'.tr(),
                        style: Theme.of(parentContext).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      ListTile(
                        leading: const Icon(Icons.camera_alt_outlined),
                        title: Text('home.camera'.tr()),
                        onTap: () async {
                          Navigator.of(sheetContext).pop();
                          await _pickAndUpload(
                              parentContext, ref, ImageSource.camera);
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.photo_library_outlined),
                        title: Text('home.gallery'.tr()),
                        onTap: () async {
                          Navigator.of(sheetContext).pop();
                          await _pickAndUpload(
                              parentContext, ref, ImageSource.gallery);
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.edit_note_outlined),
                        title: Text('home.describe_food'.tr()),
                        onTap: () {
                          Navigator.of(sheetContext).pop();
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.favorite_outline),
                        title: Text('home.favorites'.tr()),
                        onTap: () {
                          Navigator.of(sheetContext).pop();
                          context.pushNamed('favorites');
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
        tooltip: 'home.add'.tr(),
        backgroundColor: Colors.black,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Stack(
        children: [
          _buildTopGradientBackground(context),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(context),
                  const SizedBox(height: 16),
                  _buildDateStrip(context, ref, dateScrollController),
                  const SizedBox(height: 16),
                  _buildCaloriesCard(context, ref),
                  const SizedBox(height: 12),
                  _buildMacrosRow(context, ref),
                  const SizedBox(height: 16),
                  _buildRecentlyEatenPlaceholder(context),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickAndUpload(
      BuildContext context, WidgetRef ref, ImageSource source) async {
    final picker = ref.read(imagePickerServiceProvider);
    final XFile? file =
        await picker.pickImage(source: source, imageQuality: 90);
    if (file == null) return;

    // Add a pending placeholder item to recent list
    ref.read(dailyLogControllerProvider.notifier).addPendingPlaceholder();

    try {
      // Convert selected Jalali date to ISO YYYY-MM-DD for backend
      final selectedJalali = ref.read(selectedJalaliDateProvider);
      final targetDateIso = _toIsoFromJalali(selectedJalali);
      await ref.read(analyzeFoodImageUseCaseProvider).call(
          filePath: file.path,
          fileName: file.name,
          targetDateIso: targetDateIso);
      // Refresh daily remaining and daily log, clear pending placeholders
      await ref.read(dailyLogControllerProvider.notifier).refresh();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('common.saving'.tr())),
        );
      }
      // Force refresh of dailyRemainingProvider
      // ignore: unused_result
      ref.refresh(dailyRemainingProvider);
    } catch (e) {
      // On error, clear pending placeholders
      ref.read(dailyLogControllerProvider.notifier).clearPendingPlaceholders();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Widget _buildTopGradientBackground(BuildContext context) {
    return Container(
      height: 240,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFF7F7FA),
            Color(0xFFF9FAFB),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.apple, size: 28),
        const SizedBox(width: 8),
        Text(
          'app_title'.tr(),
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: const [
              Icon(Icons.local_fire_department, color: Colors.orange, size: 18),
              SizedBox(width: 4),
              Text('0'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDateStrip(
      BuildContext context, WidgetRef ref, ScrollController controller) {
    final dates = ref.watch(jalaliDateRangeProvider);
    final selected = ref.watch(selectedJalaliDateProvider);
    final today = ref.watch(todayJalaliProvider);

    String dayLetter(BuildContext context, int weekDay) {
      final isFa = context.locale.languageCode.toLowerCase() == 'fa' ||
          context.locale.languageCode.toLowerCase() == 'ps' ||
          context.locale.toString().toLowerCase().startsWith('fa');
      if (isFa) {
        // Saturday=1 → Friday=7
        switch (weekDay) {
          case 1:
            return 'ش';
          case 2:
            return 'ی';
          case 3:
            return 'د';
          case 4:
            return 'س';
          case 5:
            return 'چ';
          case 6:
            return 'پ';
          case 7:
            return 'ج';
          default:
            return '';
        }
      } else {
        // English letters: S M T W T F S (Sat→Fri)
        switch (weekDay) {
          case 1:
            return 'S';
          case 2:
            return 'S';
          case 3:
            return 'M';
          case 4:
            return 'T';
          case 5:
            return 'W';
          case 6:
            return 'T';
          case 7:
            return 'F';
          default:
            return '';
        }
      }
    }

    return SizedBox(
      height: 74,
      child: ListView.separated(
        controller: controller,
        scrollDirection: Axis.horizontal,
        itemBuilder: (context, index) {
          final d = dates[index];
          return Column(
            children: [
              GestureDetector(
                onTap: () {
                  ref.read(selectedJalaliDateProvider.notifier).state = d;
                },
                child: Container(
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  decoration: () {
                    final bool isSelected = isSameJalaliDate(d, selected);
                    final bool isToday = isSameJalaliDate(d, today);
                    return BoxDecoration(
                      color: isSelected ? Colors.black : Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: isSelected
                            ? Colors.black
                            : (isToday
                                ? Colors.grey.shade600
                                : Colors.grey.shade300),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    );
                  }(),
                  child: Text(
                    dayLetter(context, d.weekDay),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: isSameJalaliDate(d, selected)
                              ? Colors.white
                              : Colors.black,
                        ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                NumberFormat('00', context.locale.toString()).format(d.day),
                style: Theme.of(context)
                    .textTheme
                    .labelMedium
                    ?.copyWith(color: Colors.black54),
              ),
            ],
          );
        },
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemCount: dates.length,
      ),
    );
  }

  Widget _buildCaloriesCard(BuildContext context, WidgetRef ref) {
    final remainingAsync = ref.watch(dailyRemainingProvider);
    return remainingAsync.when(
      loading: () => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            const Expanded(
              child: _CaloriesCardSkeleton(),
            ),
            const SizedBox(width: 16),
            const _CaloriesRingSkeleton(),
          ],
        ),
      ),
      error: (e, st) => Container(
        padding: const EdgeInsets.all(16),
        child: Text('Error: $e'),
      ),
      data: (remaining) {
        final left = remaining.caloriesRemaining;
        final total = remaining.totalCalories.toDouble();
        final consumed =
            (remaining.totalCalories - remaining.caloriesRemaining).toDouble();
        final progress = total <= 0 ? 0.0 : (consumed / total).clamp(0.0, 1.0);
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$left',
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Text('home.calories_left'.tr()),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(
                width: 120,
                height: 120,
                child: AnimatedProgressRing(
                  progress: progress,
                  color: Colors.black,
                  backgroundColor: Colors.grey.shade300,
                  strokeWidth: 10,
                  child: const Icon(
                    Icons.local_fire_department,
                    color: Colors.black,
                    size: 32,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMacrosRow(BuildContext context, WidgetRef ref) {
    final remainingAsync = ref.watch(dailyRemainingProvider);
    final String gramsUnit =
        (context.locale.languageCode.toLowerCase() == 'fa' ||
                context.locale.toString().toLowerCase().startsWith('fa'))
            ? 'گرم'
            : 'g';
    Widget box(String value, String label, IconData icon, double progress,
        Color ringColor) {
      return Expanded(
        child: Container(
          height: 190,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Colors.black54),
              ),
              const Spacer(),
              Align(
                alignment: Alignment.centerLeft,
                child: SizedBox(
                  width: 80,
                  height: 80,
                  child: AnimatedProgressRing(
                    progress: progress,
                    color: ringColor,
                    backgroundColor: Colors.grey.shade200,
                    strokeWidth: 8,
                    child: CircleAvatar(
                      backgroundColor: Colors.grey.shade100,
                      radius: 28,
                      child: Icon(
                        icon,
                        color: ringColor,
                        size: 28,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return remainingAsync.when(
      loading: () => Row(
        children: const [
          Expanded(child: _MacroBoxSkeleton()),
          SizedBox(width: 12),
          Expanded(child: _MacroBoxSkeleton()),
          SizedBox(width: 12),
          Expanded(child: _MacroBoxSkeleton()),
        ],
      ),
      error: (e, st) => Row(
        children: [Expanded(child: Text('Error: $e'))],
      ),
      data: (r) {
        final proteinConsumed = r.totalProtein - r.proteinRemaining;
        final carbsConsumed = r.totalCarbs - r.carbsRemaining;
        final fatsConsumed = r.totalFats - r.fatsRemaining;
        double pct(int consumed, int total) =>
            total <= 0 ? 0.0 : (consumed / total).clamp(0.0, 1.0);

        return Row(
          children: [
            box(
                '${r.proteinRemaining} $gramsUnit',
                'home.protein_left'.tr(),
                Icons.bolt_outlined,
                pct(proteinConsumed, r.totalProtein),
                Colors.orange),
            const SizedBox(width: 12),
            box(
                '${r.carbsRemaining} $gramsUnit',
                'home.carbs_left'.tr(),
                Icons.spa_outlined,
                pct(carbsConsumed, r.totalCarbs),
                Colors.yellow.shade700),
            const SizedBox(width: 12),
            box(
                '${r.fatsRemaining} $gramsUnit',
                'home.fats_left'.tr(),
                Icons.water_drop_outlined,
                pct(fatsConsumed, r.totalFats),
                Colors.blueAccent),
          ],
        );
      },
    );
  }

  // Removed dynamic color mapping; each macro uses its own assigned color.

  Widget _buildRecentlyEatenPlaceholder(BuildContext context) {
    return _buildRecentList(context);
  }

  Widget _buildRecentList(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final theme = Theme.of(context);
      final state = ref.watch(dailyLogControllerProvider);
      final String gramsUnit =
          (context.locale.languageCode.toLowerCase() == 'fa' ||
                  context.locale.toString().toLowerCase().startsWith('fa'))
              ? 'گرم'
              : 'g';
      final String kcalUnit =
          (context.locale.languageCode.toLowerCase() == 'fa' ||
                  context.locale.toString().toLowerCase().startsWith('fa'))
              ? 'کالری'
              : 'kcal';
      void openDetail({
        required String id,
        required String title,
        required int calories,
        required int protein,
        required int carbs,
        required int fats,
        required double portions,
        String? imageUrl,
        List<IngredientEntity> ingredients = const [],
        bool initialLiked = false,
        required String timeIso, // ISO timestamp when item was created
      }) {
        // Log the currently selected date
        final selectedJalali = ref.read(selectedJalaliDateProvider);

        // Use currently selected day for the log date (not the item's timeIso)
        final dateIso = _toIsoFromJalali(selectedJalali);

        context.pushNamed(
          'food-detail',
          extra: FoodDetailArgs(
            id: id,
            dateIso: dateIso,
            title: title,
            calories: calories,
            proteinGrams: protein,
            fatGrams: fats,
            carbsGrams: carbs,
            imageUrl: imageUrl,
            portions: portions,
            ingredients: ingredients
                .map((ing) => IngredientItem(
                      name: ing.name,
                      calories: ing.calories,
                      proteinGrams: ing.proteinGrams,
                      fatGrams: ing.fatGrams,
                      carbsGrams: ing.carbsGrams,
                    ))
                .toList(),
            initialLiked: initialLiked,
          ),
        );
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('home.recently_eaten'.tr(), style: theme.textTheme.titleLarge),
          const SizedBox(height: 12),
          state.log.when(
            loading: () => const RecentListSkeleton(),
            error: (e, _) => Text('Error: $e'),
            data: (log) {
              final List<Widget> children = [];

              // Pending shimmer items
              if (state.pendingCount > 0) {
                children.add(ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: state.pendingCount,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, __) => const ShimmerLoadingWidget(
                    width: double.infinity,
                    height: 80,
                  ),
                ));
                children.add(const SizedBox(height: 8));
              }

              if (log.items.isEmpty) {
                children.add(
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text('home.no_food_title'.tr(),
                            style: theme.textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700),
                            textAlign: TextAlign.center),
                        const SizedBox(height: 8),
                        Text('home.no_food_desc'.tr(),
                            style: theme.textTheme.bodyMedium
                                ?.copyWith(color: Colors.black87),
                            textAlign: TextAlign.center),
                      ],
                    ),
                  ),
                );
              } else {
                children.add(ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: log.items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final it = log.items[i];
                    final time = DateTime.tryParse(it.timeIso)?.toLocal();
                    final hh = time != null
                        ? time.hour.toString().padLeft(2, '0')
                        : '--';
                    final mm = time != null
                        ? time.minute.toString().padLeft(2, '0')
                        : '--';

                    // Debug logging for each item

                    return InkWell(
                      onTap: () {
                        openDetail(
                          id: it.id,
                          title: it.title,
                          calories: it.calories,
                          protein: it.proteinGrams,
                          carbs: it.carbsGrams,
                          fats: it.fatsGrams,
                          portions: it.portions,
                          imageUrl: it.imageUrl,
                          ingredients: it.ingredients,
                          initialLiked: it.liked,
                          timeIso: it.timeIso,
                        );
                      },
                      child: Container(
                        decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2)),
                            ]),
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                width: 64,
                                height: 64,
                                color: Colors.grey.shade200,
                                child: it.imageUrl != null
                                    ? Image.network(
                                        it.imageUrl!,
                                        fit: BoxFit.cover,
                                      )
                                    : const Icon(Icons.fastfood,
                                        color: Colors.black54),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                          child: Text(it.title,
                                              style:
                                                  theme.textTheme.titleMedium)),
                                      Text('$hh:$mm',
                                          style: theme.textTheme.bodySmall
                                              ?.copyWith(
                                                  color: Colors.black54)),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text('${it.calories} $kcalUnit',
                                      style: theme.textTheme.titleLarge
                                          ?.copyWith(
                                              fontSize: 20,
                                              fontWeight: FontWeight.w800)),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      _macroChip(
                                          context,
                                          Icons.bolt_outlined,
                                          Colors.orange,
                                          '${it.proteinGrams} $gramsUnit'),
                                      const SizedBox(width: 8),
                                      _macroChip(
                                          context,
                                          Icons.spa_outlined,
                                          Colors.yellow.shade700,
                                          '${it.carbsGrams} $gramsUnit'),
                                      const SizedBox(width: 8),
                                      _macroChip(
                                          context,
                                          Icons.water_drop_outlined,
                                          Colors.blueAccent,
                                          '${it.fatsGrams} $gramsUnit'),
                                    ],
                                  )
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ));
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: children,
              );
            },
          ),
        ],
      );
    });
  }

  Widget _macroChip(
      BuildContext context, IconData icon, Color color, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20)),
      child: Row(children: [
        Icon(icon, color: color, size: 14),
        const SizedBox(width: 4),
        Text(text, style: Theme.of(context).textTheme.labelSmall)
      ]),
    );
  }
}

class RecentListSkeleton extends StatelessWidget {
  const RecentListSkeleton({super.key});
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      ShimmerLoadingWidget(width: double.infinity, height: 80),
      const SizedBox(height: 8),
      ShimmerLoadingWidget(width: double.infinity, height: 80),
    ]);
  }
}

class _CaloriesCardSkeleton extends StatelessWidget {
  const _CaloriesCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: const [
        ShimmerLoadingWidget(width: 90, height: 28),
        SizedBox(height: 8),
        ShimmerLoadingWidget(width: 120, height: 16),
      ],
    );
  }
}

class _CaloriesRingSkeleton extends StatelessWidget {
  const _CaloriesRingSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      width: 120,
      height: 120,
      child: ShimmerLoadingWidget.circular(width: 120, height: 120),
    );
  }
}

class _MacroBoxSkeleton extends StatelessWidget {
  const _MacroBoxSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 190,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          ShimmerLoadingWidget(width: 70, height: 22),
          SizedBox(height: 6),
          ShimmerLoadingWidget(width: 90, height: 14),
          Spacer(),
          SizedBox(
            width: 80,
            height: 80,
            child: ShimmerLoadingWidget.circular(width: 80, height: 80),
          ),
        ],
      ),
    );
  }
}
