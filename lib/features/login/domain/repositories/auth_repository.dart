import '../entities/user.dart';

abstract class AuthRepository {
  Future<void> sendVerificationCode(String phone);
  Future<User> verifyPhone(String phone, String verificationCode);
  Future<User?> getCurrentUser();
  Future<User> updateProfile(String? name, String? email);
  Future<void> logout();
  Future<String> refreshToken();
  Future<bool> isAuthenticated();
  Future<void> updateAdditionalInfoCompletion(bool hasCompleted);
}
