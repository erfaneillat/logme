import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cal_ai/features/app_version/domain/entities/app_version_check.dart';
import 'package:cal_ai/features/app_version/domain/repositories/app_version_repository.dart';
import 'package:cal_ai/features/app_version/data/repositories/app_version_repository_impl.dart';
import 'package:cal_ai/features/app_version/data/datasources/app_version_remote_datasource.dart';
import 'package:cal_ai/services/api_service_provider.dart';
import 'package:package_info_plus/package_info_plus.dart';

// Repository Provider
final appVersionRepositoryProvider = Provider<AppVersionRepository>((ref) {
  final dio = ref.watch(dioProvider);
  final remoteDataSource = AppVersionRemoteDataSourceImpl(dio: dio);
  return AppVersionRepositoryImpl(remoteDataSource: remoteDataSource);
});

// Version Check Provider
final appVersionCheckProvider = FutureProvider<AppVersionCheck>((ref) async {
  final repository = ref.watch(appVersionRepositoryProvider);
  final packageInfo = await PackageInfo.fromPlatform();
  
  final platform = Platform.isIOS ? 'ios' : 'android';
  final version = packageInfo.version;
  final buildNumber = int.parse(packageInfo.buildNumber);

  return await repository.checkAppVersion(
    platform: platform,
    version: version,
    buildNumber: buildNumber,
  );
});
