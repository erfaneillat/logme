import '../repositories/auth_repository.dart';

class SendVerificationCodeUseCase {
  final AuthRepository repository;

  SendVerificationCodeUseCase(this.repository);

  Future<void> call(String phone) async {
    return await repository.sendVerificationCode(phone);
  }
}
