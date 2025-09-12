import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';

class ErrorHandler {
  /// Get a user-friendly error message from a DioException
  static String getErrorMessage(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'common.connection_timeout'.tr();

      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final data = error.response?.data;

        String message = 'common.error'.tr();

        if (data is Map<String, dynamic>) {
          message = data['message'] ?? data['error'] ?? message;
        } else if (data is String) {
          message = data;
        }

        switch (statusCode) {
          case 400:
            // Check if it's a non-food image error
            if (data is Map<String, dynamic>) {
              final serverError = data['error']?.toString().toLowerCase() ?? '';
              if (serverError.contains('does not contain food') ||
                  serverError.contains('not contain food')) {
                return 'home.not_food_image'.tr();
              }
            }
            return 'common.bad_request'.tr();
          case 401:
            return 'common.unauthorized'.tr();
          case 403:
            return 'common.forbidden'.tr();
          case 404:
            return 'common.not_found'.tr();
          case 422:
            return 'common.validation_error'.tr();
          case 500:
            return 'common.server_error'.tr();
          default:
            return 'common.error_prefix'
                .tr(args: ['HTTP $statusCode: $message']);
        }

      case DioExceptionType.cancel:
        return 'common.request_cancelled'.tr();

      case DioExceptionType.connectionError:
        return 'common.no_internet'.tr();

      case DioExceptionType.badCertificate:
        return 'common.ssl_error'.tr();

      case DioExceptionType.unknown:
        return 'common.unexpected_error'.tr();
    }
  }

  /// Get a user-friendly error message from any exception
  static String getGenericErrorMessage(dynamic error) {
    if (error is DioException) {
      return getErrorMessage(error);
    }

    if (error is String) {
      return error;
    }

    return 'common.unknown_error'.tr();
  }

  /// Check if an error is a network-related error
  static bool isNetworkError(DioException error) {
    return error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.connectionError;
  }

  /// Check if an error is a server error (5xx status codes)
  static bool isServerError(DioException error) {
    if (error.type != DioExceptionType.badResponse) return false;
    final statusCode = error.response?.statusCode;
    return statusCode != null && statusCode >= 500 && statusCode < 600;
  }

  /// Check if an error is a client error (4xx status codes)
  static bool isClientError(DioException error) {
    if (error.type != DioExceptionType.badResponse) return false;
    final statusCode = error.response?.statusCode;
    return statusCode != null && statusCode >= 400 && statusCode < 500;
  }
}
