import '../repositories/additional_info_repository.dart';

class MarkAdditionalInfoCompletedUseCase {
  final AdditionalInfoRepository repository;

  MarkAdditionalInfoCompletedUseCase(this.repository);

  Future<void> execute() async {
    await repository.markAdditionalInfoCompleted();
  }
}
