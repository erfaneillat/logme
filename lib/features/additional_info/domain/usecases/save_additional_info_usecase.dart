import '../entities/additional_info.dart';
import '../repositories/additional_info_repository.dart';

class SaveAdditionalInfoUseCase {
  final AdditionalInfoRepository repository;

  SaveAdditionalInfoUseCase(this.repository);

  Future<void> execute(AdditionalInfo additionalInfo) async {
    await repository.saveAdditionalInfo(additionalInfo);
  }
}
