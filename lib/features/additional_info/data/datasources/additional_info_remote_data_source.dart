import '../../../../services/api_service.dart';
import '../../../../config/api_config.dart';
import '../../domain/entities/additional_info.dart';

abstract class AdditionalInfoRemoteDataSource {
  Future<void> saveAdditionalInfo(AdditionalInfo additionalInfo);
  Future<AdditionalInfo?> getAdditionalInfo();
  Future<void> markAdditionalInfoCompleted();
}

class AdditionalInfoRemoteDataSourceImpl
    implements AdditionalInfoRemoteDataSource {
  final ApiService apiService;

  AdditionalInfoRemoteDataSourceImpl({required this.apiService});

  @override
  Future<void> saveAdditionalInfo(AdditionalInfo additionalInfo) async {
    try {
      await apiService.post<Map<String, dynamic>>(
        ApiConfig.additionalInfo,
        data: additionalInfo.toJson(),
      );
    } catch (e) {
      throw Exception('Failed to save additional info: ${e.toString()}');
    }
  }

  @override
  Future<AdditionalInfo?> getAdditionalInfo() async {
    try {
      final response = await apiService.get<Map<String, dynamic>>(
        ApiConfig.additionalInfo,
      );

      // Server returns { success, data: { additionalInfo: { ... } } }
      final data = response['data'];
      if (data == null) return null;
      final info = data['additionalInfo'];
      if (info == null) return null;
      return AdditionalInfo.fromJson(info as Map<String, dynamic>);
    } catch (e) {
      throw Exception('Failed to get additional info: ${e.toString()}');
    }
  }

  @override
  Future<void> markAdditionalInfoCompleted() async {
    try {
      await apiService.post<Map<String, dynamic>>(
        ApiConfig.markAdditionalInfoCompleted,
      );
    } catch (e) {
      throw Exception(
          'Failed to mark additional info completed: ${e.toString()}');
    }
  }
}
