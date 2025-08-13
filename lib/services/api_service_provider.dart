import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_service.dart';
import '../config/api_config.dart';
import '../features/login/data/datasources/secure_storage.dart';
import 'package:dio/dio.dart';

// Provider for SecureStorage
final secureStorageProvider = Provider<SecureStorage>((ref) {
  return SecureStorageImpl();
});

// Provider for API Service
final Provider<ApiService> apiServiceProvider = Provider<ApiService>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);

  return ApiService(
    baseUrl: ApiConfig.baseUrl,
    getToken: () async {
      return await secureStorage.getToken();
    },
    refreshToken: () async {
      final existing = await secureStorage.getToken();
      if (existing == null) {
        throw Exception('No token to refresh');
      }
      final dio = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl, headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $existing',
      }));
      final response = await dio.post(ApiConfig.authRefreshToken);
      final data = response.data as Map<String, dynamic>;
      final token = (data['data']?['token'] ?? data['token']) as String?;
      if (token == null) {
        throw Exception('Invalid refresh response');
      }
      await secureStorage.storeToken(token);
      return token;
    },
    onLogout: () async {
      await secureStorage.deleteToken();
      await secureStorage.deleteUserData();
      await secureStorage.deletePhone();
    },
  );
});
