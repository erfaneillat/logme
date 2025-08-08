import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../../services/api_service_provider.dart';
import '../datasources/additional_info_remote_data_source.dart';
import '../repositories/additional_info_repository_impl.dart';

// Data Source Provider
final additionalInfoRemoteDataSourceProvider =
    Provider<AdditionalInfoRemoteDataSource>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AdditionalInfoRemoteDataSourceImpl(apiService: apiService);
});

// Repository Implementation Provider
final additionalInfoRepositoryImplProvider =
    Provider<AdditionalInfoRepositoryImpl>((ref) {
  final remoteDataSource = ref.watch(additionalInfoRemoteDataSourceProvider);
  return AdditionalInfoRepositoryImpl(remoteDataSource: remoteDataSource);
});
