import '../repositories/auth_repository.dart';

class UpdateAdditionalInfoCompletionUseCase {
  final AuthRepository repository;

  UpdateAdditionalInfoCompletionUseCase(this.repository);

  Future<void> execute(bool hasCompleted) async {
    await repository.updateAdditionalInfoCompletion(hasCompleted);
  }
}
