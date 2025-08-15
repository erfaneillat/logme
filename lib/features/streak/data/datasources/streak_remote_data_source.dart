import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../../services/api_service_provider.dart';
import '../../../../config/api_config.dart';

class StreakRemoteDataSource {
  final ProviderRef ref;
  StreakRemoteDataSource(this.ref);

  Future<List<String>> getCompletionsRange({
    required String startIso,
    required String endIso,
  }) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api.get<Map<String, dynamic>>(
      ApiConfig.streakCompletions,
      queryParameters: {
        'start': startIso,
        'end': endIso,
      },
    );
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    final List<dynamic> datesJson = data['dates'] as List<dynamic>? ?? const [];
    return datesJson.map((e) => e.toString()).toList();
  }
}

final streakRemoteDataSourceProvider = Provider<StreakRemoteDataSource>((ref) {
  return StreakRemoteDataSource(ref);
});
