import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../data/providers/data_providers.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/usecases/send_verification_code_usecase.dart';
import '../../domain/usecases/verify_phone_usecase.dart';
import '../../domain/usecases/get_current_user_usecase.dart';
import '../../domain/usecases/update_profile_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/refresh_token_usecase.dart';
import '../../domain/usecases/is_authenticated_usecase.dart';
import '../../domain/usecases/update_additional_info_completion_usecase.dart';
import '../../domain/entities/user.dart';

// Repository Provider - using the new data providers
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return ref.watch(authRepositoryImplProvider);
});

// Use Case Providers
final sendVerificationCodeUseCaseProvider =
    Provider<SendVerificationCodeUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return SendVerificationCodeUseCase(repository);
});

final verifyPhoneUseCaseProvider = Provider<VerifyPhoneUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return VerifyPhoneUseCase(repository);
});

final getCurrentUserUseCaseProvider = Provider<GetCurrentUserUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return GetCurrentUserUseCase(repository);
});

final updateProfileUseCaseProvider = Provider<UpdateProfileUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return UpdateProfileUseCase(repository);
});

final logoutUseCaseProvider = Provider<LogoutUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return LogoutUseCase(repository);
});

final refreshTokenUseCaseProvider = Provider<RefreshTokenUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return RefreshTokenUseCase(repository);
});

final isAuthenticatedUseCaseProvider = Provider<IsAuthenticatedUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return IsAuthenticatedUseCase(repository);
});

final updateAdditionalInfoCompletionUseCaseProvider =
    Provider<UpdateAdditionalInfoCompletionUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return UpdateAdditionalInfoCompletionUseCase(repository);
});

// Current user provider that returns AsyncValue
final currentUserProvider = FutureProvider<User?>((ref) async {
  final useCase = ref.watch(getCurrentUserUseCaseProvider);
  return await useCase.execute();
});
