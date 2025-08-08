import 'dart:convert';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/secure_storage.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final SecureStorage secureStorage;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.secureStorage,
  });

  @override
  Future<void> sendVerificationCode(String phone) async {
    try {
      await remoteDataSource.sendVerificationCode(phone);
      // Store phone temporarily for verification
      await secureStorage.storePhone(phone);
    } catch (e) {
      throw Exception('Failed to send verification code: ${e.toString()}');
    }
  }

  @override
  Future<User> verifyPhone(String phone, String verificationCode) async {
    try {
      final user = await remoteDataSource.verifyPhone(phone, verificationCode);

      // Store user data and token
      if (user.token != null) {
        await secureStorage.storeToken(user.token!);
      }
      await secureStorage.storeUserData(json.encode(user.toJson()));
      await secureStorage.deletePhone(); // Clean up temporary phone storage

      return user;
    } catch (e) {
      throw Exception('Phone verification failed: ${e.toString()}');
    }
  }

  @override
  Future<User?> getCurrentUser() async {
    final token = await secureStorage.getToken();
    if (token == null) return null;
    // Always try to refresh from server first to avoid stale flags
    try {
      final user = await remoteDataSource.getCurrentUser();
      await secureStorage.storeUserData(json.encode(user.toJson()));
      return user;
    } catch (_) {
      // Fallback to local cached user if network fails
      final userData = await secureStorage.getUserData();
      if (userData != null) {
        try {
          return User.fromJson({
            ...json.decode(userData),
            'token': token,
          });
        } catch (_) {
          // If cache is also corrupted, logout
        }
      }
      await logout();
      return null;
    }
  }

  @override
  Future<User> updateProfile(String? name, String? email) async {
    try {
      final user = await remoteDataSource.updateProfile(name, email);
      await secureStorage.storeUserData(json.encode(user.toJson()));
      return user;
    } catch (e) {
      throw Exception('Profile update failed: ${e.toString()}');
    }
  }

  @override
  Future<void> logout() async {
    await secureStorage.deleteToken();
    await secureStorage.deleteUserData();
    await secureStorage.deletePhone();
  }

  @override
  Future<String> refreshToken() async {
    try {
      final newToken = await remoteDataSource.refreshToken();
      await secureStorage.storeToken(newToken);
      return newToken;
    } catch (e) {
      await logout();
      throw Exception('Token refresh failed: ${e.toString()}');
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    final token = await secureStorage.getToken();
    return token != null;
  }

  @override
  Future<void> updateAdditionalInfoCompletion(bool hasCompleted) async {
    try {
      // Get current user data
      final userData = await secureStorage.getUserData();
      if (userData != null) {
        final user = User.fromJson({
          ...json.decode(userData),
          'hasCompletedAdditionalInfo': hasCompleted,
        });
        await secureStorage.storeUserData(json.encode(user.toJson()));
      }
    } catch (e) {
      throw Exception(
          'Failed to update additional info completion: ${e.toString()}');
    }
  }
}
