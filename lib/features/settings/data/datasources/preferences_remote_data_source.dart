import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../../services/api_service_provider.dart';
import '../../../../config/api_config.dart';

class PreferencesRemoteDataSource {
  final ProviderRef ref;
  PreferencesRemoteDataSource(this.ref);

  Future<Map<String, bool>> getUserPreferences() async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> response = await api.get<Map<String, dynamic>>(
      ApiConfig.preferences,
    );
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    return {
      'addBurnedCalories': data['addBurnedCalories'] as bool? ?? true,
      'rolloverCalories': data['rolloverCalories'] as bool? ?? true,
    };
  }

  Future<Map<String, bool>> updateUserPreferences({
    bool? addBurnedCalories,
    bool? rolloverCalories,
  }) async {
    final api = ref.read(apiServiceProvider);
    final Map<String, dynamic> requestData = {};

    if (addBurnedCalories != null) {
      requestData['addBurnedCalories'] = addBurnedCalories;
    }
    if (rolloverCalories != null) {
      requestData['rolloverCalories'] = rolloverCalories;
    }

    final Map<String, dynamic> response = await api.patch<Map<String, dynamic>>(
      ApiConfig.preferences,
      data: requestData,
    );
    final Map<String, dynamic> data =
        (response['data'] as Map<String, dynamic>? ?? response);
    return {
      'addBurnedCalories': data['addBurnedCalories'] as bool? ?? true,
      'rolloverCalories': data['rolloverCalories'] as bool? ?? true,
    };
  }
}

final preferencesRemoteDataSourceProvider =
    Provider<PreferencesRemoteDataSource>((ref) {
  return PreferencesRemoteDataSource(ref);
});
