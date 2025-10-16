import 'package:dio/dio.dart';
import 'package:cal_ai/features/app_version/data/models/app_version_check_model.dart';

abstract class AppVersionRemoteDataSource {
  Future<AppVersionCheckModel> checkAppVersion({
    required String platform,
    required String version,
    required int buildNumber,
  });
}

class AppVersionRemoteDataSourceImpl implements AppVersionRemoteDataSource {
  final Dio dio;

  AppVersionRemoteDataSourceImpl({required this.dio});

  @override
  Future<AppVersionCheckModel> checkAppVersion({
    required String platform,
    required String version,
    required int buildNumber,
  }) async {
    try {
      final response = await dio.get(
        '/api/app-version/check',
        queryParameters: {
          'platform': platform,
          'version': version,
          'buildNumber': buildNumber,
        },
      );

      if (response.data['success'] == true && response.data['data'] != null) {
        return AppVersionCheckModel.fromJson(response.data['data']);
      } else {
        // If no active version config, return default (no update needed)
        return AppVersionCheckModel(
          isForceUpdate: false,
          isOptionalUpdate: false,
        );
      }
    } catch (e) {
      // On error, don't block the app - return no update needed
      return AppVersionCheckModel(
        isForceUpdate: false,
        isOptionalUpdate: false,
      );
    }
  }
}
