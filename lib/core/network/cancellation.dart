import 'package:dio/dio.dart';

/// Clean-architecture friendly cancellation token wrapper
/// Presentation/UI layers can hold onto this and request cancellation
/// without exposing Dio types to domain/features.
class CancellationToken {
  final CancelToken _dioToken = CancelToken();

  void cancel([String? reason]) {
    if (!_dioToken.isCancelled) {
      _dioToken.cancel(reason);
    }
  }

  bool get isCancelled => _dioToken.isCancelled;

  // Public accessor for data layer (repositories/datasources)
  CancelToken get dioToken => _dioToken;
}
