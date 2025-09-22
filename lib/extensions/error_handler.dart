/// Utility class for handling and converting technical errors to user-friendly messages
class ErrorHandler {
  /// Converts technical error messages to translation keys
  static String getErrorTranslationKey(dynamic error) {
    if (error == null) return 'login.unexpected_error';

    String errorString = error.toString().toLowerCase();

    // Handle Dio exceptions
    if (errorString.contains('dioexception')) {
      if (errorString.contains('bad response')) {
        return 'login.invalid_verification_code';
      }
      if (errorString.contains('connection timeout')) {
        return 'login.connection_timeout';
      }
      if (errorString.contains('network error')) {
        return 'login.network_error';
      }
      if (errorString.contains('socket exception')) {
        return 'login.network_error';
      }
      return 'login.network_error';
    }

    // Handle phone verification specific errors
    if (errorString.contains('phone verification failed')) {
      return 'login.invalid_verification_code';
    }

    if (errorString.contains('invalid verification code')) {
      return 'login.invalid_verification_code';
    }

    if (errorString.contains('expired verification code')) {
      return 'login.expired_verification_code';
    }

    if (errorString.contains('phone number not found')) {
      return 'login.phone_number_not_found';
    }

    if (errorString.contains('too many attempts')) {
      return 'login.too_many_attempts';
    }

    if (errorString.contains('phone number') &&
        errorString.contains('invalid')) {
      return 'login.invalid_phone_number';
    }

    if (errorString.contains('exception')) {
      // Extract meaningful part from exception messages
      final regex = RegExp(r'exception:\s*(.*?)(?:\n|$)', caseSensitive: false);
      final match = regex.firstMatch(errorString);
      if (match != null && match.group(1) != null) {
        final cleanMessage = match.group(1)!.trim();
        if (cleanMessage.isNotEmpty && !cleanMessage.contains('dioexception')) {
          // For now, return the extracted message as is
          // In a real app, you might want to map this to a translation key
          return 'login.unexpected_error';
        }
      }
    }

    // Handle timeout errors
    if (errorString.contains('timeout')) {
      return 'login.request_timeout';
    }

    // Handle server errors
    if (errorString.contains('500') || errorString.contains('server error')) {
      return 'login.server_error';
    }

    // Handle authentication errors
    if (errorString.contains('unauthorized') || errorString.contains('401')) {
      return 'login.authentication_failed';
    }

    // Default fallback
    return 'login.unexpected_error';
  }

  /// Checks if the error is related to network connectivity
  static bool isNetworkError(dynamic error) {
    if (error == null) return false;
    String errorString = error.toString().toLowerCase();
    return errorString.contains('dioexception') ||
        errorString.contains('network') ||
        errorString.contains('connection');
  }

  /// Checks if the error is related to invalid verification code
  static bool isInvalidCodeError(dynamic error) {
    if (error == null) return false;
    String errorString = error.toString().toLowerCase();
    return errorString.contains('invalid verification code') ||
        errorString.contains('bad response') ||
        errorString.contains('phone verification failed');
  }

  /// Checks if the error is related to expired code
  static bool isExpiredCodeError(dynamic error) {
    if (error == null) return false;
    String errorString = error.toString().toLowerCase();
    return errorString.contains('expired verification code');
  }
}
