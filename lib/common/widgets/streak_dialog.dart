import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:shamsi_date/shamsi_date.dart';

Future<void> showStreakDialog(
  BuildContext context, {
  required int streakCount,
  required List<String> completedDatesIso, // YYYY-MM-DD (Gregorian local date)
}) async {
  await showDialog(
    context: context,
    barrierDismissible: true,
    builder: (ctx) {
      // Prepare last 7 days and their Jalali equivalents
      final now = DateTime.now();
      final last7Gregorian =
          List.generate(7, (i) => now.subtract(Duration(days: 6 - i)));
      final last7Jalali =
          last7Gregorian.map((d) => Jalali.fromDateTime(d)).toList();
      const jalaliWeekLetters = ['ج', 'پ', 'چ', 'س', 'د', 'ی', 'ش'];
      final completedSet = completedDatesIso.toSet();

      return Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Header row with app name and small streak chip
              Row(
                children: [
                  const Icon(Icons.apple, size: 20),
                  const SizedBox(width: 6),
                  Text('app_title'.tr(),
                      style: Theme.of(context).textTheme.labelLarge),
                  const Spacer(),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.local_fire_department,
                            color: Colors.orange, size: 14),
                        const SizedBox(width: 4),
                        Text('$streakCount',
                            style: Theme.of(context).textTheme.labelSmall),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Icon(Icons.local_fire_department, color: Colors.orange, size: 64),
              const SizedBox(height: 12),
              Text('home.streak_title'.tr(),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700, color: Colors.orange)),
              const SizedBox(height: 8),
              Text('home.streak_days'.tr(args: ['${streakCount}']),
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              // Real last-7-days Jalali week with streak highlights
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  for (var i = 0; i < 7; i++)
                    Builder(builder: (_) {
                      final j = last7Jalali[i];
                      final g = last7Gregorian[i];
                      // Completed if the date exists in the provided completion set
                      final mm = g.month.toString().padLeft(2, '0');
                      final dd = g.day.toString().padLeft(2, '0');
                      final iso = '${g.year}-$mm-$dd';
                      final completed = completedSet.contains(iso);
                      final isToday = g.year == now.year &&
                          g.month == now.month &&
                          g.day == now.day;
                      // Map Jalali week day to our array index
                      // Jalali weekDay: 1=Saturday, 2=Sunday, 3=Monday, 4=Tuesday, 5=Wednesday, 6=Thursday, 7=Friday
                      // Our array: ['ج', 'پ', 'چ', 'س', 'د', 'ی', 'ش'] (Friday, Thursday, Wednesday, Tuesday, Monday, Sunday, Saturday)
                      final weekDayIndex = (j.weekDay == 7)
                          ? 0
                          : j.weekDay; // Friday=0, Saturday=1, etc.
                      final letter = jalaliWeekLetters[weekDayIndex];
                      return Column(
                        children: [
                          Text(letter,
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(color: Colors.black54)),
                          const SizedBox(height: 6),
                          Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: completed
                                  ? Colors.orange
                                  : isToday
                                      ? Colors.orange.withOpacity(0.3)
                                      : Colors.grey.shade300,
                              shape: BoxShape.circle,
                              border: isToday && !completed
                                  ? Border.all(color: Colors.orange, width: 1)
                                  : null,
                            ),
                          ),
                        ],
                      );
                    }),
                ],
              ),
              const SizedBox(height: 16),
              Text('home.streak_message'.tr(),
                  textAlign: TextAlign.center,
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: Colors.black87)),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12))),
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text('home.continue'.tr()),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}
