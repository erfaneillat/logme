import 'package:cal_ai/features/app_version/domain/entities/app_version_check.dart';

abstract class AppVersionRepository {
  Future<AppVersionCheck> checkAppVersion({
    required String platform,
    required String version,
    required int buildNumber,
  });
}
