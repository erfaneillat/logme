class ApiConfig {
  // Development
  static const String devBaseUrl = 'http://localhost:8000';

  // Production
  static const String prodBaseUrl = 'http://10.0.2.2:8000';

  // Staging
  static const String stagingBaseUrl = 'http://10.0.2.2:8000';

  // Get the appropriate base URL based on environment
  static String get baseUrl {
    // You can use different approaches to determine the environment
    // For now, we'll use a simple const, but you can make this dynamic
    const environment =
        String.fromEnvironment('ENVIRONMENT', defaultValue: 'dev');

    switch (environment) {
      case 'prod':
        return prodBaseUrl;
      case 'staging':
        return stagingBaseUrl;
      case 'dev':
      default:
        return devBaseUrl;
    }
  }

  // API Endpoints
  static const String authSendCode = '/api/auth/send-code';
  static const String authVerifyPhone = '/api/auth/verify-phone';
  static const String authProfile = '/api/auth/profile';
  static const String authRefreshToken = '/api/auth/refresh-token';

  // Additional Information Endpoints
  static const String additionalInfo = '/api/user/additional-info';
  static const String markAdditionalInfoCompleted =
      '/api/user/mark-additional-info-completed';
  static const String planGenerate = '/api/plan/generate';
  static const String planLatest = '/api/plan/latest';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 60);
  static const Duration receiveTimeout = Duration(seconds: 60);
  static const Duration sendTimeout = Duration(seconds: 60);

  // Logging
  static const bool enablePrettyLogging = true;
}
