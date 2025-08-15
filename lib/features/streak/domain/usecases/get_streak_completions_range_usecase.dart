import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../repositories/streak_repository.dart';
import '../../data/repositories/streak_repository_impl.dart';

class GetStreakCompletionsRangeUseCase {
  final StreakRepository repository;
  GetStreakCompletionsRangeUseCase(this.repository);

  Future<List<String>> call({
    required String startIso,
    required String endIso,
  }) {
    return repository.getCompletionsRange(startIso: startIso, endIso: endIso);
  }
}

final getStreakCompletionsRangeUseCaseProvider =
    Provider<GetStreakCompletionsRangeUseCase>((ref) {
  final repo = ref.read(streakRepositoryProvider);
  return GetStreakCompletionsRangeUseCase(repo);
});
