import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:cal_ai/common/widgets/index.dart';
import 'package:cal_ai/features/home/presentation/providers/home_date_provider.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({super.key});

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
                  _buildCaloriesCard(context),
                  const SizedBox(height: 12),
                  _buildMacrosRow(context),
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

  Widget _buildCaloriesCard(BuildContext context) {
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
                  '1725',
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
              progress: 0.35,
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
  }

  Widget _buildMacrosRow(BuildContext context) {
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

    return Row(
      children: [
        box('116g', 'home.protein_left'.tr(), Icons.bolt_outlined, 0.6,
            Colors.orange),
        const SizedBox(width: 12),
        box('207g', 'home.carbs_left'.tr(), Icons.spa_outlined, 0.45,
            Colors.yellow.shade700),
        const SizedBox(width: 12),
        box('47g', 'home.fats_left'.tr(), Icons.water_drop_outlined, 0.3,
            Colors.blueAccent),
      ],
    );
  }

  // Removed dynamic color mapping; each macro uses its own assigned color.

  Widget _buildRecentlyEatenPlaceholder(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'home.recently_eaten'.tr(),
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
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
              Text(
                'home.no_food_title'.tr(),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'home.no_food_desc'.tr(),
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: Colors.black87),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
