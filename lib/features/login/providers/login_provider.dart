import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../models/login_state.dart';
import '../domain/usecases/send_verification_code_usecase.dart';
import '../domain/usecases/verify_phone_usecase.dart';
import '../domain/entities/user.dart';
import '../presentation/providers/auth_provider.dart';
import '../../../../extensions/error_handler.dart';
import '../../../../services/fcm_service.dart';
import '../../../../services/api_service_provider.dart';

class LoginNotifier extends StateNotifier<LoginState> {
  final SendVerificationCodeUseCase sendVerificationCodeUseCase;
  final VerifyPhoneUseCase verifyPhoneUseCase;
  final Ref ref;

  LoginNotifier({
    required this.sendVerificationCodeUseCase,
    required this.verifyPhoneUseCase,
    required this.ref,
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
        error: ErrorHandler.getErrorTranslationKey(e),
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

      // Initialize FCM after successful login
      _initializeFCM();

      return user;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ErrorHandler.getErrorTranslationKey(e),
      );
      return null;
    }
  }

  void _initializeFCM() {
    try {
      final apiService = ref.read(apiServiceProvider);
      FCMService().initialize(apiService);
    } catch (e) {
      print('⚠️  Failed to initialize FCM: $e');
    }
  }

  void reset() {
    state = const LoginState();
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final loginProvider = StateNotifierProvider<LoginNotifier, LoginState>((ref) {
  final sendVerificationCodeUseCase =
      ref.watch(sendVerificationCodeUseCaseProvider);
  final verifyPhoneUseCase = ref.watch(verifyPhoneUseCaseProvider);

  return LoginNotifier(
    sendVerificationCodeUseCase: sendVerificationCodeUseCase,
    verifyPhoneUseCase: verifyPhoneUseCase,
    ref: ref,
  );
});
