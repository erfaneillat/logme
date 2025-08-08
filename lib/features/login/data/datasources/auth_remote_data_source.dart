import 'dart:convert';
import '../../../../services/api_service.dart';
import '../../../../config/api_config.dart';
import '../../domain/entities/user.dart';

abstract class AuthRemoteDataSource {
  Future<void> sendVerificationCode(String phone);
  Future<User> verifyPhone(String phone, String verificationCode);
  Future<User> getCurrentUser();
  Future<User> updateProfile(String? name, String? email);
  Future<String> refreshToken();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiService apiService;

  AuthRemoteDataSourceImpl({required this.apiService});

  @override
  Future<void> sendVerificationCode(String phone) async {
    try {
      await apiService.post<Map<String, dynamic>>(
        ApiConfig.authSendCode,
        data: {
          'phone': phone,
        },
      );
    } catch (e) {
      throw Exception('Failed to send verification code: ${e.toString()}');
    }
  }

  @override
  Future<User> verifyPhone(String phone, String verificationCode) async {
    try {
      final response = await apiService.post<Map<String, dynamic>>(
        ApiConfig.authVerifyPhone,
        data: {
          'phone': phone,
          'verificationCode': verificationCode,
        },
      );

      final userData = response['data']['user'] as Map<String, dynamic>;
      final token = response['data']['token'] as String;

      return User.fromJson({
        ...userData,
        'token': token,
      });
    } catch (e) {
      throw Exception('Phone verification failed: ${e.toString()}');
    }
  }

  @override
  Future<User> getCurrentUser() async {
    try {
      final response = await apiService.get<Map<String, dynamic>>(
        ApiConfig.authProfile,
      );

      final userData = response['data']['user'] as Map<String, dynamic>;

      return User.fromJson(userData);
    } catch (e) {
      throw Exception('Failed to get current user: ${e.toString()}');
    }
  }

  @override
  Future<User> updateProfile(String? name, String? email) async {
    try {
      final response = await apiService.put<Map<String, dynamic>>(
        ApiConfig.authProfile,
        data: {
          if (name != null) 'name': name,
          if (email != null) 'email': email,
        },
      );

      final userData = response['data']['user'] as Map<String, dynamic>;

      return User.fromJson(userData);
    } catch (e) {
      throw Exception('Profile update failed: ${e.toString()}');
    }
  }

  @override
  Future<String> refreshToken() async {
    try {
      final response = await apiService.post<Map<String, dynamic>>(
        ApiConfig.authRefreshToken,
      );

      return response['data']['token'] as String;
    } catch (e) {
      throw Exception('Token refresh failed: ${e.toString()}');
    }
  }
}
