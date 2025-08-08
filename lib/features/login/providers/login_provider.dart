import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../models/login_state.dart';
import '../domain/usecases/send_verification_code_usecase.dart';
import '../domain/usecases/verify_phone_usecase.dart';
import '../domain/entities/user.dart';
import '../presentation/providers/auth_provider.dart';

class LoginNotifier extends StateNotifier<LoginState> {
  final SendVerificationCodeUseCase sendVerificationCodeUseCase;
  final VerifyPhoneUseCase verifyPhoneUseCase;

  LoginNotifier({
    required this.sendVerificationCodeUseCase,
    required this.verifyPhoneUseCase,
  }) : super(const LoginState());

  Future<void> sendCode(String phoneNumber) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await sendVerificationCodeUseCase(phoneNumber);

      state = state.copyWith(
        isLoading: false,
        isCodeSent: true,
        phoneNumber: phoneNumber,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<User?> verifyCode(String code) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      if (state.phoneNumber == null) {
        throw Exception('Phone number not found');
      }

      final user = await verifyPhoneUseCase(state.phoneNumber!, code);

      state = state.copyWith(
        isLoading: false,
        isLoggedIn: true,
      );

      return user;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return null;
    }
  }

  void reset() {
    state = const LoginState();
  }
}

final loginProvider = StateNotifierProvider<LoginNotifier, LoginState>((ref) {
  final sendVerificationCodeUseCase =
      ref.watch(sendVerificationCodeUseCaseProvider);
  final verifyPhoneUseCase = ref.watch(verifyPhoneUseCaseProvider);

  return LoginNotifier(
    sendVerificationCodeUseCase: sendVerificationCodeUseCase,
    verifyPhoneUseCase: verifyPhoneUseCase,
  );
});
