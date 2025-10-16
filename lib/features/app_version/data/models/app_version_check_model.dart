import 'package:cal_ai/features/app_version/domain/entities/app_version_check.dart';

class AppVersionCheckModel extends AppVersionCheck {
  AppVersionCheckModel({
    required super.isForceUpdate,
    required super.isOptionalUpdate,
    super.updateTitle,
    super.updateMessage,
    super.storeUrl,
    super.latestVersion,
    super.latestBuildNumber,
  });

  factory AppVersionCheckModel.fromJson(Map<String, dynamic> json) {
    return AppVersionCheckModel(
      isForceUpdate: json['isForceUpdate'] ?? false,
      isOptionalUpdate: json['isOptionalUpdate'] ?? false,
      updateTitle: json['updateTitle'],
      updateMessage: json['updateMessage'],
      storeUrl: json['storeUrl'],
      latestVersion: json['latestVersion'],
      latestBuildNumber: json['latestBuildNumber'],
    );
  }
}
