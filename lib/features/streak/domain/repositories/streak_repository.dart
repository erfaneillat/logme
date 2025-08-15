abstract class StreakRepository {
  Future<List<String>> getCompletionsRange({
    required String startIso,
    required String endIso,
  });
}
