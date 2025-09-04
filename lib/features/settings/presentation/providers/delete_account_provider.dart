import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'delete_account_provider.g.dart';

@riverpod
class DeleteAccount extends _$DeleteAccount {
  @override
  DeleteAccountState build() {
    return const DeleteAccountState();
  }

  Future<bool> deleteAccount() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // TODO: Implement actual delete account API call
      // For now, simulate the API call
      await Future.delayed(const Duration(seconds: 2));

      // Simulate success
      state = state.copyWith(isLoading: false, isDeleted: true);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to delete account. Please try again.',
      );
      return false;
    }
  }
}

class DeleteAccountState {
  const DeleteAccountState({
    this.isLoading = false,
    this.isDeleted = false,
    this.error,
  });

  final bool isLoading;
  final bool isDeleted;
  final String? error;

  DeleteAccountState copyWith({
    bool? isLoading,
    bool? isDeleted,
    String? error,
  }) {
    return DeleteAccountState(
      isLoading: isLoading ?? this.isLoading,
      isDeleted: isDeleted ?? this.isDeleted,
      error: error ?? this.error,
    );
  }
}
