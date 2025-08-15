import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../domain/repositories/streak_repository.dart';
import '../datasources/streak_remote_data_source.dart';

class StreakRepositoryImpl implements StreakRepository {
  final StreakRemoteDataSource remote;
  StreakRepositoryImpl(this.remote);

  @override
  Future<List<String>> getCompletionsRange({
    required String startIso,
    required String endIso,
  }) async {
    return remote.getCompletionsRange(startIso: startIso, endIso: endIso);
  }
}

final streakRepositoryProvider = Provider<StreakRepository>((ref) {
  final ds = ref.read(streakRemoteDataSourceProvider);
  return StreakRepositoryImpl(ds);
});
