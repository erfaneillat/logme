import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:shamsi_date/shamsi_date.dart';

import '../../additional_info/presentation/providers/additional_info_provider.dart';
import '../../additional_info/pages/additional_info_page.dart';

class PersonalDetailsPage extends HookConsumerWidget {
  const PersonalDetailsPage({super.key});

  Future<void> _goToAdditionalInfo(BuildContext context, WidgetRef ref,
      [AdditionalInfoStart? start]) async {
    // Seed the local additional info with the freshest available data
    final localInfo = ref.read(additionalInfoProvider);
    final remoteInfo = ref.read(currentAdditionalInfoProvider);
    final infoToSeed = remoteInfo.maybeWhen(
      data: (value) => value ?? localInfo,
      orElse: () => localInfo,
    );
    ref.read(additionalInfoProvider.notifier).setAll(infoToSeed);

    // Navigate to the existing AdditionalInfo flow and wait for result
    await GoRouter.of(context).push('/additional-info', extra: start);
    // On return, refresh remote additional info
    ref.invalidate(currentAdditionalInfoProvider);
    await ref.read(currentAdditionalInfoProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localInfo = ref.watch(additionalInfoProvider);
    final remoteInfo = ref.watch(currentAdditionalInfoProvider);

    // Prefer remote data if available; otherwise fallback to local
    final info = remoteInfo.maybeWhen(
      data: (value) => value ?? localInfo,
      orElse: () => localInfo,
    );

    String _formatHeight(double? cm) {
      if (cm == null) return '—';
      // Show in cm for simplicity
      return '${cm.toStringAsFixed(0)} cm';
    }

    String _formatWeight(double? kg) {
      if (kg == null) return '—';
      return '${kg.toStringAsFixed(0)} kg';
    }

    String _formatBirth(DateTime? d) {
      if (d == null) return '—';
      final isFa = context.locale.languageCode.toLowerCase().startsWith('fa');
      if (isFa) {
        final j = Jalali.fromDateTime(d);
        final mm = j.month.toString().padLeft(2, '0');
        final dd = j.day.toString().padLeft(2, '0');
        return '${j.year}/$mm/$dd';
      }
      return DateFormat('MM/dd/yyyy').format(d);
    }

    String _formatGender(String? g) {
      switch (g) {
        case 'male':
          return 'additional_info.male'.tr();
        case 'female':
          return 'additional_info.female'.tr();
        case 'other':
          return 'additional_info.other'.tr();
        default:
          return '—';
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(Icons.arrow_back_ios, size: 18),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'personal_details.title'.tr(),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(currentAdditionalInfoProvider);
            await ref.read(currentAdditionalInfoProvider.future);
          },
          strokeWidth: 2.5,
          displacement: 60,
          color: Theme.of(context).primaryColor,
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Loading and error banners
                    remoteInfo.when(
                      data: (_) => const SizedBox.shrink(),
                      loading: () => Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color:
                                Theme.of(context).primaryColor.withOpacity(0.1),
                          ),
                        ),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Theme.of(context).primaryColor,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'personal_details.sync_data'.tr(),
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    color: Colors.black87,
                                    fontWeight: FontWeight.w500,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      error: (e, __) => Container(
                        padding: const EdgeInsets.all(16),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border:
                              Border.all(color: Colors.red.withOpacity(0.2)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.red.withOpacity(0.05),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.error_outline,
                                color: Colors.red,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'personal_details.sync_failed'.tr(),
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color: Colors.red,
                                          fontWeight: FontWeight.w600,
                                        ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'personal_details.sync_failed_desc'.tr(),
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(
                                          color: Colors.red.withOpacity(0.8),
                                        ),
                                  ),
                                ],
                              ),
                            ),
                            TextButton(
                              onPressed: () {
                                ref.invalidate(currentAdditionalInfoProvider);
                              },
                              style: TextButton.styleFrom(
                                foregroundColor: Colors.red,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                              ),
                              child: Text(
                                'personal_details.retry'.tr(),
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    // Header section
                    Container(
                      margin: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'personal_details.profile_header'.tr(),
                            style: Theme.of(context)
                                .textTheme
                                .headlineMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: Colors.black87,
                                  letterSpacing: -0.5,
                                ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'personal_details.profile_subtitle'.tr(),
                            style:
                                Theme.of(context).textTheme.bodyLarge?.copyWith(
                                      color: Colors.black54,
                                      height: 1.4,
                                    ),
                          ),
                        ],
                      ),
                    ),
                    // Goal weight card
                    Container(
                      padding: const EdgeInsets.all(24),
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Theme.of(context).primaryColor,
                            Theme.of(context).primaryColor.withOpacity(0.8),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color:
                                Theme.of(context).primaryColor.withOpacity(0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                            spreadRadius: 0,
                          ),
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.3),
                                    width: 1,
                                  ),
                                ),
                                child: const Icon(
                                  Icons.track_changes,
                                  color: Colors.white,
                                  size: 28,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'personal_details.goal_weight'.tr(),
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyLarge
                                          ?.copyWith(
                                            color:
                                                Colors.white.withOpacity(0.9),
                                            fontWeight: FontWeight.w500,
                                            letterSpacing: 0.2,
                                          ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      _formatWeight(info.targetWeight),
                                      style: Theme.of(context)
                                          .textTheme
                                          .headlineLarge
                                          ?.copyWith(
                                            fontWeight: FontWeight.w800,
                                            color: Colors.white,
                                            letterSpacing: -0.5,
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () => _goToAdditionalInfo(
                                  context, ref, AdditionalInfoStart.goalWeight),
                              icon: const Icon(
                                Icons.edit_outlined,
                                size: 18,
                                color: Colors.black87,
                              ),
                              label: Text(
                                'personal_details.change_goal'.tr(),
                                style: const TextStyle(
                                  color: Colors.black87,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: Colors.black87,
                                elevation: 0,
                                shadowColor: Colors.transparent,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 24, vertical: 16),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Health metrics grid
                    Row(
                      children: [
                        Expanded(
                          child: _MetricCard(
                            icon: Icons.monitor_weight_outlined,
                            label: 'personal_details.current_weight'.tr(),
                            value: _formatWeight(info.weight),
                            onTap: () => _goToAdditionalInfo(
                                context, ref, AdditionalInfoStart.weightHeight),
                            color: const Color(0xFF4F46E5),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _MetricCard(
                            icon: Icons.height,
                            label: 'personal_details.height'.tr(),
                            value: _formatHeight(info.height),
                            onTap: () => _goToAdditionalInfo(
                                context, ref, AdditionalInfoStart.weightHeight),
                            color: const Color(0xFF059669),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _MetricCard(
                            icon: Icons.calendar_today_outlined,
                            label: 'personal_details.dob'.tr(),
                            value: _formatBirth(info.birthDate),
                            onTap: () => _goToAdditionalInfo(
                                context, ref, AdditionalInfoStart.birthDate),
                            color: const Color(0xFFDC2626),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _MetricCard(
                            icon: Icons.person_outline,
                            label: 'personal_details.gender'.tr(),
                            value: _formatGender(info.gender),
                            onTap: () => _goToAdditionalInfo(
                                context, ref, AdditionalInfoStart.gender),
                            color: const Color(0xFF7C3AED),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          splashColor: color.withOpacity(0.1),
          highlightColor: color.withOpacity(0.05),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: color.withOpacity(0.1),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                  spreadRadius: 0,
                ),
                BoxShadow(
                  color: color.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
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
                    Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.grey.shade400,
                      size: 16,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey.shade600,
                        fontWeight: FontWeight.w500,
                      ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Text(
                  value,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: Colors.black87,
                        letterSpacing: -0.2,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
