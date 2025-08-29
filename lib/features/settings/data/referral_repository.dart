import 'package:dio/dio.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../config/api_config.dart';
import '../../../services/api_service.dart';
import '../../../services/api_service_provider.dart';

class ReferralSummaryDto {
  final int count;
  final int earnings;
  final int rewardPerReferral;

  ReferralSummaryDto(
      {required this.count,
      required this.earnings,
      required this.rewardPerReferral});

  factory ReferralSummaryDto.fromJson(Map<String, dynamic> json) {
    return ReferralSummaryDto(
      count: (json['count'] ?? 0) as int,
      earnings: (json['earnings'] ?? 0) as int,
      rewardPerReferral: (json['rewardPerReferral'] ?? 25000) as int,
    );
  }
}

class ReferralRepository {
  final ApiService _api;
  ReferralRepository(this._api);

  Future<String> getMyCode() async {
    final res = await _api.get<Map<String, dynamic>>(ApiConfig.referralMyCode);
    if ((res['success'] ?? false) == true && res['code'] is String) {
      return res['code'] as String;
    }
    throw DioException(
        requestOptions: RequestOptions(path: ApiConfig.referralMyCode),
        error: res['message'] ?? 'Failed to get referral code');
  }

  Future<bool> validateCode(String code) async {
    if (code.trim().isEmpty) return false;
    final res = await _api
        .get<Map<String, dynamic>>("${ApiConfig.referralValidate}/$code");
    return (res['valid'] ?? false) as bool;
  }

  Future<void> submitCode(String code) async {
    final res = await _api.post<Map<String, dynamic>>(ApiConfig.referralSubmit,
        data: {'code': code});
    if ((res['success'] ?? false) != true) {
      throw DioException(
          requestOptions: RequestOptions(path: ApiConfig.referralSubmit),
          error: res['message'] ?? 'Failed to submit referral code');
    }
  }

  Future<ReferralSummaryDto> getSummary() async {
    final res = await _api.get<Map<String, dynamic>>(ApiConfig.referralSummary);
    if ((res['success'] ?? false) == true) {
      return ReferralSummaryDto.fromJson(res);
    }
    throw DioException(
        requestOptions: RequestOptions(path: ApiConfig.referralSummary),
        error: res['message'] ?? 'Failed to get referral summary');
  }

  Future<String> updateCode(String newCode) async {
    final res = await _api.put<Map<String, dynamic>>(
        ApiConfig.referralUpdateCode,
        data: {'code': newCode});
    if ((res['success'] ?? false) == true && res['code'] is String) {
      return res['code'] as String;
    }
    throw DioException(
        requestOptions: RequestOptions(path: ApiConfig.referralUpdateCode),
        error: res['message'] ?? 'Failed to update referral code');
  }
}

final referralRepositoryProvider = Provider<ReferralRepository>((ref) {
  final api = ref.watch(apiServiceProvider);
  return ReferralRepository(api);
});
