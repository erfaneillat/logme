import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../services/api_service_provider.dart';
import '../datasources/auth_remote_data_source.dart';
import '../datasources/secure_storage.dart';
import '../repositories/auth_repository_impl.dart';

// Provider for AuthRemoteDataSource
final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AuthRemoteDataSourceImpl(apiService: apiService);
});

// Provider for AuthRepository Implementation
final authRepositoryImplProvider = Provider<AuthRepositoryImpl>((ref) {
  final remoteDataSource = ref.watch(authRemoteDataSourceProvider);
  final secureStorage = ref.watch(secureStorageProvider);
  final apiService = ref.watch(apiServiceProvider);

  return AuthRepositoryImpl(
    remoteDataSource: remoteDataSource,
    secureStorage: secureStorage,
    apiService: apiService,
  );
});
