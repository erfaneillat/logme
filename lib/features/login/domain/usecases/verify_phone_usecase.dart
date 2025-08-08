import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class VerifyPhoneUseCase {
  final AuthRepository repository;

  VerifyPhoneUseCase(this.repository);

  Future<User> call(String phone, String verificationCode) async {
    return await repository.verifyPhone(phone, verificationCode);
  }
}
