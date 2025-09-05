/// Environment configuration for the Cal AI app
/// This file contains API endpoints and configuration based on build environment

class Environment {
  static const String _prodApiUrl = 'https://logme.yadbanapp.com/api';
  static const String _devApiUrl = 'https://dev-logme.yadbanapp.com/api';

  /// Get the API base URL based on build configuration
  static String get apiBaseUrl {
    // This will be replaced during build time by the CI/CD pipeline
    const String buildApiUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: _prodApiUrl,
    );
    return buildApiUrl;
  }

  /// Check if running in development mode
  static bool get isDevelopment => apiBaseUrl.contains('dev-');

  /// Check if running in production mode
  static bool get isProduction => !isDevelopment;

  /// App version
  static const String appVersion = '1.0.0';

  /// API timeout duration
  static const Duration apiTimeout = Duration(seconds: 30);
}
