import 'dart:io';
import 'package:flutter/foundation.dart';
import 'environment.dart';

class ApiConfig {
  // Development
  static const String devBaseUrl = 'http://10.0.2.2:9000';
  static const String devBaseUrlLocalhost = 'http://localhost:9000';

  // Production
  static const String prodBaseUrl = 'https://loqmeapp.ir';

  // Staging
  static const String stagingBaseUrl = 'http://10.0.2.2:9000';

  // Get the appropriate base URL based on environment and platform
  static String get baseUrl {
    if (kDebugMode) {
      if (kIsWeb) {
        return devBaseUrlLocalhost;
      } else {
        return devBaseUrl;
      }
    } else {
      return prodBaseUrl;
    }
  }

  // Debug method to check current configuration
  static void debugConfig() {
    if (kDebugMode) {
      print('Platform: ${kIsWeb ? 'Web' : Platform.operatingSystem}');
      print('Base URL: $baseUrl');
      print(
          'Environment: ${String.fromEnvironment('ENVIRONMENT', defaultValue: 'dev')}');
      if (kIsWeb) {
        print('Web Environment API URL: ${Environment.apiBaseUrl}');
        print('Is Development: ${Environment.isDevelopment}');
        print('Is Production: ${Environment.isProduction}');
      }
    }
  }

  // API Endpoints
  static const String authSendCode = '/api/auth/send-code';
  static const String authVerifyPhone = '/api/auth/verify-phone';
  static const String authProfile = '/api/auth/profile';
  static const String authRefreshToken = '/api/auth/refresh-token';
  static const String authDeleteAccount = '/api/auth/account';

  // Additional Information Endpoints
  static const String additionalInfo = '/api/user/additional-info';
  static const String markAdditionalInfoCompleted =
      '/api/user/mark-additional-info-completed';
  static const String planGenerate = '/api/plan/generate';
  static const String planLatest = '/api/plan/latest';
  static const String planUpdateManual = '/api/plan/manual';
  // Logs Endpoints
  static const String logsDaily = '/api/logs';

  // Weight endpoints
  static const String weightBase = '/api/weight';
  static const String weightLatest = '/api/weight/latest';
  static const String weightRange = '/api/weight/range';

  // Food analysis
  static const String foodAnalyze = '/api/food/analyze';
  static const String foodAnalyzeDescription = '/api/food/analyze-description';
  static const String foodFixResult = '/api/food/fix-result';

  // Streak endpoints
  static const String streakCompletions = '/api/streak/completions';

  // Referral endpoints
  static const String referralMyCode = '/api/referral/my-code';
  static const String referralUpdateCode = '/api/referral/update-code';
  static const String referralValidate =
      '/api/referral/validate'; // use "$referralValidate/<code>"
  static const String referralSubmit = '/api/referral/submit';
  static const String referralSummary = '/api/referral/summary';

  // Preferences endpoints
  static const String preferences = '/api/preferences';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 60);
  static const Duration receiveTimeout = Duration(seconds: 60);
  static const Duration sendTimeout = Duration(seconds: 60);

  // Logging
  static const bool enablePrettyLogging = true;
}
