import '../repositories/auth_repository.dart';

class RefreshTokenUseCase {
  final AuthRepository repository;

  RefreshTokenUseCase(this.repository);

  Future<String> execute() async {
    return await repository.refreshToken();
  }

  // Backward-compatible alias
  Future<String> call() async {
    return await execute();
  }
}
