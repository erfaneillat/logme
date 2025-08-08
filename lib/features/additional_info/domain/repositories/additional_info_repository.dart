import '../entities/additional_info.dart';

abstract class AdditionalInfoRepository {
  Future<void> saveAdditionalInfo(AdditionalInfo additionalInfo);
  Future<AdditionalInfo?> getAdditionalInfo();
  Future<void> markAdditionalInfoCompleted();
}
