import '../../domain/entities/additional_info.dart';
import '../../domain/repositories/additional_info_repository.dart';
import '../datasources/additional_info_remote_data_source.dart';

class AdditionalInfoRepositoryImpl implements AdditionalInfoRepository {
  final AdditionalInfoRemoteDataSource remoteDataSource;

  AdditionalInfoRepositoryImpl({required this.remoteDataSource});

  @override
  Future<void> saveAdditionalInfo(AdditionalInfo additionalInfo) async {
    await remoteDataSource.saveAdditionalInfo(additionalInfo);
  }

  @override
  Future<AdditionalInfo?> getAdditionalInfo() async {
    return await remoteDataSource.getAdditionalInfo();
  }

  @override
  Future<void> markAdditionalInfoCompleted() async {
    await remoteDataSource.markAdditionalInfoCompleted();
  }
}
