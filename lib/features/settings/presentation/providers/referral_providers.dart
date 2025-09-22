import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../data/referral_repository.dart';

/// State for referral code update
class ReferralCodeUpdateState {
  final bool isLoading;
  final String? error;
  final String? successMessage;

  const ReferralCodeUpdateState({
    this.isLoading = false,
    this.error,
    this.successMessage,
  });

  ReferralCodeUpdateState copyWith({
    bool? isLoading,
    String? error,
    String? successMessage,
  }) {
    return ReferralCodeUpdateState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      successMessage: successMessage,
    );
  }
}

/// StateNotifier for managing referral code updates
class ReferralCodeUpdateNotifier
    extends StateNotifier<ReferralCodeUpdateState> {
  final ReferralRepository _repository;

  ReferralCodeUpdateNotifier(this._repository)
      : super(const ReferralCodeUpdateState());

  Future<String?> updateCode(String newCode) async {
    state = state.copyWith(isLoading: true, error: null, successMessage: null);

    try {
      final updatedCode = await _repository.updateCode(newCode);
      state = state.copyWith(
        isLoading: false,
        successMessage: 'refer.code_updated_success'.tr(),
      );
      return updatedCode;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return null;
    }
  }

  void clearMessages() {
    state = state.copyWith(error: null, successMessage: null);
  }
}

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
  final rewardAmount = ref.watch(referralSummaryProvider).maybeWhen(
        data: (s) => s.rewardPerReferral,
        orElse: () => 25000,
      );
  return rewardAmount;
});

/// Total earnings in toman
final referralEarningsProvider = FutureProvider<int>((ref) async {
  final summary = await ref.watch(referralSummaryProvider.future);
  return summary.earnings;
});

/// Provider for managing referral code updates
final referralCodeUpdateProvider =
    StateNotifierProvider<ReferralCodeUpdateNotifier, ReferralCodeUpdateState>(
        (ref) {
  final repository = ref.watch(referralRepositoryProvider);
  return ReferralCodeUpdateNotifier(repository);
});
