import '../entities/additional_info.dart';
import '../repositories/additional_info_repository.dart';

class GetAdditionalInfoUseCase {
  final AdditionalInfoRepository repository;
  GetAdditionalInfoUseCase(this.repository);

  Future<AdditionalInfo?> execute() {
    return repository.getAdditionalInfo();
  }
}
