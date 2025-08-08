import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_service.dart';
import '../config/api_config.dart';
import '../features/login/data/datasources/secure_storage.dart';

// Provider for SecureStorage
final secureStorageProvider = Provider<SecureStorage>((ref) {
  return SecureStorageImpl();
});

// Provider for API Service
final apiServiceProvider = Provider<ApiService>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);

  return ApiService(
    baseUrl: ApiConfig.baseUrl,
    getToken: () async {
      return await secureStorage.getToken();
    },
  );
});
