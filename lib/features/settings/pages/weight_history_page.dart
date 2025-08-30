import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/extensions/string.dart';
import 'package:shamsi_date/shamsi_date.dart';

import '../../analytics/domain/entities/weight_entry.dart';
import '../../analytics/presentation/providers/analytics_providers.dart';

class WeightHistoryPage extends HookConsumerWidget {
  const WeightHistoryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'weight_history.title'.tr(),
          style: const TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: FutureBuilder<List<WeightEntryEntity>>(
          future: _fetchAllWeightHistory(ref),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            }

            if (snapshot.hasError) {
              return _buildErrorState(context);
            }

            final weightEntries = snapshot.data ?? [];

            if (weightEntries.isEmpty) {
              return _buildEmptyState(context);
            }

            return _buildWeightHistoryList(context, weightEntries);
          },
        ),
      ),
    );
  }

  Future<List<WeightEntryEntity>> _fetchAllWeightHistory(WidgetRef ref) async {
    final useCase = ref.read(getWeightRangeUseCaseProvider);
    final now = DateTime.now();
    final twoYearsAgo = now.subtract(const Duration(days: 730));

    final startIso = _ymd(twoYearsAgo);
    final endIso = _ymd(now);

    final entries = await useCase.execute(startIso: startIso, endIso: endIso);
    // Sort by date descending (newest first)
    entries.sort((a, b) => b.date.compareTo(a.date));
    return entries;
  }

  String _ymd(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Widget _buildErrorState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              'weight_history.error_loading'.tr(),
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'weight_history.error_loading_desc'.tr(),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade600,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                Icons.scale_outlined,
                size: 64,
                color: Colors.grey.shade400,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'weight_history.no_data_title'.tr(),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'weight_history.no_data_desc'.tr(),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade600,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWeightHistoryList(
      BuildContext context, List<WeightEntryEntity> entries) {
    return Column(
      children: [
        // Header with stats
        _buildHeaderStats(context, entries),

        const SizedBox(height: 8),

        // Weight entries list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            itemCount: entries.length,
            itemBuilder: (context, index) {
              final entry = entries[index];
              final previousEntry =
                  index < entries.length - 1 ? entries[index + 1] : null;

              return _buildWeightEntryCard(context, entry, previousEntry);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildHeaderStats(
      BuildContext context, List<WeightEntryEntity> entries) {
    if (entries.isEmpty) return const SizedBox.shrink();

    final latestWeight = entries.first.weightKg;
    final oldestWeight = entries.last.weightKg;
    final totalChange = latestWeight - oldestWeight;
    final isGain = totalChange > 0;

    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withValues(alpha: 0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).primaryColor.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'weight_history.total_entries'
                      .tr(namedArgs: {'count': entries.length.toString()}),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontWeight: FontWeight.w500,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'weight_history.current_weight'.tr(),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                ),
                Text(
                  '${_formatWeight(latestWeight)} ${'analytics.weight_unit'.tr()}'
                      .toPersianNumbers(context),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Icon(
                  isGain ? Icons.trending_up : Icons.trending_down,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(height: 4),
                Text(
                  '${isGain ? '+' : ''}${_formatWeight(totalChange.abs())} ${'analytics.weight_unit'.tr()}'
                      .toPersianNumbers(context),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWeightEntryCard(BuildContext context, WeightEntryEntity entry,
      WeightEntryEntity? previousEntry) {
    final date = DateTime.parse('${entry.date}T00:00:00');
    final jalaliDate = Jalali.fromDateTime(date);
    final formattedDate = _formatJalaliDate(context, jalaliDate);
    final relativeDate = _getRelativeDate(context, date);

    double? change;
    if (previousEntry != null) {
      change = entry.weightKg - previousEntry.weightKg;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Weight icon and change indicator
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _getChangeColor(change).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.monitor_weight_outlined,
              color: _getChangeColor(change),
              size: 24,
            ),
          ),
          const SizedBox(width: 16),

          // Weight and date info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${_formatWeight(entry.weightKg)} ${'analytics.weight_unit'.tr()}'
                          .toPersianNumbers(context),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: Colors.black87,
                          ),
                    ),
                    if (change != null) _buildChangeChip(context, change),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  relativeDate,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).primaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                Text(
                  formattedDate,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChangeChip(BuildContext context, double change) {
    final isGain = change > 0;
    final isNoChange = change.abs() < 0.1;

    if (isNoChange) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          'weight_history.no_change'.tr(),
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
                fontSize: 11,
              ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isGain ? Colors.orange.shade50 : Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isGain ? Icons.arrow_upward : Icons.arrow_downward,
            size: 12,
            color: isGain ? Colors.orange.shade700 : Colors.green.shade700,
          ),
          const SizedBox(width: 2),
          Text(
            '${_formatWeight(change.abs())} ${'analytics.weight_unit'.tr()}'
                .toPersianNumbers(context),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color:
                      isGain ? Colors.orange.shade700 : Colors.green.shade700,
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                ),
          ),
        ],
      ),
    );
  }

  Color _getChangeColor(double? change) {
    if (change == null || change.abs() < 0.1) {
      return Colors.grey.shade500;
    }
    return change > 0 ? Colors.orange : Colors.green;
  }

  String _getRelativeDate(BuildContext context, DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final targetDate = DateTime(date.year, date.month, date.day);
    final difference = today.difference(targetDate).inDays;

    if (difference == 0) {
      return 'weight_history.today'.tr();
    } else if (difference == 1) {
      return 'weight_history.yesterday'.tr();
    } else if (difference < 7) {
      return 'weight_history.days_ago'
          .tr(namedArgs: {'days': difference.toString()});
    } else if (difference < 30) {
      final weeks = (difference / 7).round();
      return weeks == 1
          ? 'weight_history.week_ago'.tr()
          : 'weight_history.weeks_ago'
              .tr(namedArgs: {'weeks': weeks.toString()});
    } else if (difference < 365) {
      final months = (difference / 30).round();
      return months == 1
          ? 'weight_history.month_ago'.tr()
          : 'weight_history.months_ago'
              .tr(namedArgs: {'months': months.toString()});
    } else {
      final years = (difference / 365).round();
      return years == 1
          ? 'weight_history.year_ago'.tr()
          : 'weight_history.years_ago'
              .tr(namedArgs: {'years': years.toString()});
    }
  }

  String _formatJalaliDate(BuildContext context, Jalali jalaliDate) {
    final List<String> monthNames = [
      'additional_info.jalali_months.farvardin'.tr(),
      'additional_info.jalali_months.ordibehesht'.tr(),
      'additional_info.jalali_months.khordad'.tr(),
      'additional_info.jalali_months.tir'.tr(),
      'additional_info.jalali_months.mordad'.tr(),
      'additional_info.jalali_months.shahrivar'.tr(),
      'additional_info.jalali_months.mehr'.tr(),
      'additional_info.jalali_months.aban'.tr(),
      'additional_info.jalali_months.azar'.tr(),
      'additional_info.jalali_months.dey'.tr(),
      'additional_info.jalali_months.bahman'.tr(),
      'additional_info.jalali_months.esfand'.tr(),
    ];

    final monthName = monthNames[jalaliDate.month - 1];
    final day = jalaliDate.day.toString().toPersianNumbers(context);
    final year = jalaliDate.year.toString().toPersianNumbers(context);

    return '$day $monthName $year';
  }

  String _formatWeight(double weight) {
    // If the weight is a whole number, show without decimal
    if (weight == weight.toInt()) {
      return weight.toInt().toString();
    }
    // Otherwise show with one decimal place
    return weight.toStringAsFixed(1);
  }
}
