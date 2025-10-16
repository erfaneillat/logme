import 'package:cal_ai/features/app_version/domain/entities/app_version_check.dart';
import 'package:cal_ai/features/app_version/domain/repositories/app_version_repository.dart';
import 'package:cal_ai/features/app_version/data/datasources/app_version_remote_datasource.dart';

class AppVersionRepositoryImpl implements AppVersionRepository {
  final AppVersionRemoteDataSource remoteDataSource;

  AppVersionRepositoryImpl({required this.remoteDataSource});

  @override
  Future<AppVersionCheck> checkAppVersion({
    required String platform,
    required String version,
    required int buildNumber,
  }) async {
    return await remoteDataSource.checkAppVersion(
      platform: platform,
      version: version,
      buildNumber: buildNumber,
    );
  }
}
