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

  Future<void> _goToAdditionalInfo(
      BuildContext context, WidgetRef ref, [AdditionalInfoStart? start]) async {
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
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('personal_details.title'.tr()),
        centerTitle: true,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(currentAdditionalInfoProvider);
            await ref.read(currentAdditionalInfoProvider.future);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Loading and error banners
              remoteInfo.when(
                data: (_) => const SizedBox.shrink(),
                loading: () => const LinearProgressIndicator(minHeight: 2),
                error: (e, __) => Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          e.toString(),
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Colors.redAccent),
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          ref.invalidate(currentAdditionalInfoProvider);
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            // Goal weight card
            Container(
              padding: const EdgeInsets.all(16),
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
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('personal_details.goal_weight'.tr(),
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: 6),
                        Text(
                          _formatWeight(info.targetWeight),
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                  OutlinedButton(
                    onPressed: () =>
                        _goToAdditionalInfo(context, ref, AdditionalInfoStart.goalWeight),
                    style: OutlinedButton.styleFrom(
                      shape: const StadiumBorder(),
                    ),
                    child: Text('personal_details.change_goal'.tr()),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Details list card
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
              child: Column(
                children: [
                  _ItemRow(
                    label: 'personal_details.current_weight'.tr(),
                    value: _formatWeight(info.weight),
                    onTap: () => _goToAdditionalInfo(
                        context, ref, AdditionalInfoStart.weightHeight),
                  ),
                  const _Divider(),
                  _ItemRow(
                    label: 'personal_details.height'.tr(),
                    value: _formatHeight(info.height),
                    onTap: () => _goToAdditionalInfo(
                        context, ref, AdditionalInfoStart.weightHeight),
                  ),
                  const _Divider(),
                  _ItemRow(
                    label: 'personal_details.dob'.tr(),
                    value: _formatBirth(info.birthDate),
                    onTap: () =>
                        _goToAdditionalInfo(context, ref, AdditionalInfoStart.birthDate),
                  ),
                  const _Divider(),
                  _ItemRow(
                    label: 'personal_details.gender'.tr(),
                    value: _formatGender(info.gender),
                    onTap: () =>
                        _goToAdditionalInfo(context, ref, AdditionalInfoStart.gender),
                  ),
                ],
              ),
            ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: Colors.black54)),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
            const Icon(Icons.edit_outlined, color: Colors.black45),
          ],
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      height: 1,
      color: Colors.grey.shade200,
    );
  }
}
