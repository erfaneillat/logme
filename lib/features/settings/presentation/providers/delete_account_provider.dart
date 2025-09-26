import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:dio/dio.dart';
import '../../../../config/api_config.dart';
import '../../../../services/api_service_provider.dart';
import '../../../../extensions/error_handler.dart';

part 'delete_account_provider.g.dart';

@riverpod
class DeleteAccount extends _$DeleteAccount {
  @override
  DeleteAccountState build() {
    return const DeleteAccountState();
  }

  Future<bool> deleteAccount({String? reason}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final apiService = ref.read(apiServiceProvider);

      final response = await apiService.delete(
        ApiConfig.authDeleteAccount,
        data: reason != null ? {'reason': reason} : null,
      );

      print('DeleteAccount: Response received - $response');
      print('DeleteAccount: Response success value - ${response['success']}');
      print(
          'DeleteAccount: Response success type - ${response['success'].runtimeType}');

      if (response['success'] == true) {
        print('DeleteAccount: Success response received, updating state');
        state = state.copyWith(
          isLoading: false,
          isDeleted: true,
          error: null,
        );
        print(
            'DeleteAccount: New state - isLoading: ${state.isLoading}, isDeleted: ${state.isDeleted}, error: ${state.error}');
        return true;
      } else {
        throw Exception(response['message'] ?? 'Failed to delete account');
      }
    } on DioException catch (e) {
      print('DeleteAccount: DioException caught - $e');
      final errorMessage = ErrorHandler.getErrorTranslationKey(e);
      print('DeleteAccount: Error message - $errorMessage');
      state = state.copyWith(
        isLoading: false,
        error: errorMessage,
      );
      return false;
    } catch (e) {
      print('DeleteAccount: General exception caught - $e');
      final errorMessage = ErrorHandler.getErrorTranslationKey(e);
      print('DeleteAccount: Error message - $errorMessage');
      state = state.copyWith(
        isLoading: false,
        error: errorMessage,
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
      error: error,
    );
  }
}
