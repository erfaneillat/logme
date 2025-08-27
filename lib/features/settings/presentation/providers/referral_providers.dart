import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../data/referral_repository.dart';

/// User's shareable referral code
final referralCodeProvider = FutureProvider<String>((ref) async {
  final repo = ref.watch(referralRepositoryProvider);
  return repo.getMyCode();
});

/// Referral summary (count, earnings, reward per referral)
final referralSummaryProvider = FutureProvider<ReferralSummaryDto>((ref) async {
  final repo = ref.watch(referralRepositoryProvider);
  return repo.getSummary();
});

/// Number of successful referrals
final referralSuccessCountProvider = FutureProvider<int>((ref) async {
  final summary = await ref.watch(referralSummaryProvider.future);
  return summary.count;
});

/// Reward amount (in toman) per successful referral.
final rewardPerReferralProvider = Provider<int>((ref) {
  final summary = ref.watch(referralSummaryProvider).maybeWhen(
        data: (s) => s.rewardPerReferral,
        orElse: () => 25000,
      );
  return summary;
});

/// Total earnings in toman
final referralEarningsProvider = FutureProvider<int>((ref) async {
  final summary = await ref.watch(referralSummaryProvider.future);
  return summary.earnings;
});
