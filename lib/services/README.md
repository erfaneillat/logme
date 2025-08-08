# API Service Documentation

This directory contains the API service implementation using Dio for HTTP requests with proper error handling and interceptors.

## Components

### 1. ApiService (`api_service.dart`)
A comprehensive HTTP client built with Dio that provides:

- **Automatic token management**: Automatically adds Bearer tokens to requests
- **Error handling**: Comprehensive error handling with meaningful messages
- **Pretty logging**: Beautiful, formatted logging for requests, responses, and errors using PrettyDioLogger
- **Timeout management**: Configurable timeouts for different operations
- **File upload/download**: Support for file operations
- **Request cancellation**: Ability to cancel ongoing requests

#### Features:
- Generic HTTP methods (GET, POST, PUT, DELETE, PATCH)
- File upload and download capabilities
- Request/response interceptors
- Automatic error handling and transformation
- Pretty logging in development mode with formatted output

### 2. ApiResponse (`api_service.dart`)
A wrapper class for consistent API response handling:

```dart
class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final Map<String, dynamic>? errors;
}
```

### 3. ApiConfig (`../config/api_config.dart`)
Configuration file for API settings:

- Environment-specific base URLs
- API endpoints constants
- Timeout configurations
- Logging settings (PrettyDioLogger enable/disable)

## Usage

### Basic Setup

1. **Configure the API service provider**:
```dart
final apiServiceProvider = Provider<ApiService>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);
  
  return ApiService(
    baseUrl: ApiConfig.baseUrl,
    getToken: () async {
      return await secureStorage.getToken();
    },
  );
});
```

2. **Use in data sources**:
```dart
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiService apiService;

  AuthRemoteDataSourceImpl({required this.apiService});

  @override
  Future<User> verifyPhone(String phone, String code) async {
    try {
      final response = await apiService.post<Map<String, dynamic>>(
        ApiConfig.authVerifyPhone,
        data: {
          'phone': phone,
          'verificationCode': code,
        },
      );

      final userData = response['data']['user'] as Map<String, dynamic>;
      return User.fromJson(userData);
    } catch (e) {
      throw Exception('Phone verification failed: ${e.toString()}');
    }
  }
}
```

### HTTP Methods

#### GET Request
```dart
final data = await apiService.get<Map<String, dynamic>>('/api/users');
```

#### POST Request
```dart
final response = await apiService.post<Map<String, dynamic>>(
  '/api/users',
  data: {
    'name': 'John Doe',
    'email': 'john@example.com',
  },
);
```

#### PUT Request
```dart
final response = await apiService.put<Map<String, dynamic>>(
  '/api/users/1',
  data: {
    'name': 'Jane Doe',
  },
);
```

#### DELETE Request
```dart
await apiService.delete('/api/users/1');
```

#### File Upload
```dart
final response = await apiService.uploadFile<Map<String, dynamic>>(
  '/api/upload',
  filePath: '/path/to/file.jpg',
  fileName: 'profile.jpg',
  formData: {
    'userId': '123',
  },
  onSendProgress: (sent, total) {
    print('Upload progress: ${(sent / total * 100).toStringAsFixed(0)}%');
  },
);
```

#### File Download
```dart
await apiService.downloadFile(
  'https://example.com/file.pdf',
  '/local/path/file.pdf',
  onReceiveProgress: (received, total) {
    print('Download progress: ${(received / total * 100).toStringAsFixed(0)}%');
  },
);
```

### Error Handling

The API service automatically handles common HTTP errors and provides meaningful error messages:

- **400**: Bad request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not found
- **422**: Validation error
- **500**: Server error
- **Connection errors**: Network connectivity issues
- **Timeout errors**: Request timeout issues

### Pretty Logging

The API service uses PrettyDioLogger to provide beautiful, formatted logs in development mode:

- **Request logs**: Shows method, URL, headers, and body
- **Response logs**: Shows status code, headers, and formatted response body
- **Error logs**: Shows detailed error information with formatting
- **Configurable**: Can be enabled/disabled via `ApiConfig.enablePrettyLogging`

Example log output:
```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────
│ 🌐 REQUEST
├───────────────────────────────────────────────────────────────────────────────────────────────────────
│ GET /api/auth/profile
├───────────────────────────────────────────────────────────────────────────────────────────────────────
│ Headers:
│ {
│   "Content-Type": "application/json",
│   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
│ }
├───────────────────────────────────────────────────────────────────────────────────────────────────────
│ Response:
│ {
│   "success": true,
│   "data": {
│     "user": {
│       "id": "123",
│       "name": "John Doe",
│       "email": "john@example.com"
│     }
│   }
│ }
└───────────────────────────────────────────────────────────────────────────────────────────────────────
```

### Configuration

Update the `ApiConfig` class to match your API endpoints:

```dart
class ApiConfig {
  static const String devBaseUrl = 'http://localhost:3000';
  static const String prodBaseUrl = 'https://your-production-api.com';
  
  // API Endpoints
  static const String authSendCode = '/api/auth/send-code';
  static const String authVerifyPhone = '/api/auth/verify-phone';
  // ... add more endpoints
  
  // Logging
  static const bool enablePrettyLogging = true; // Set to false to disable pretty logging
}
```

### Environment Configuration

To use different environments, set the `ENVIRONMENT` flag when building:

```bash
# Development
flutter run --dart-define=ENVIRONMENT=dev

# Production
flutter run --dart-define=ENVIRONMENT=prod
```

## Integration with Clean Architecture

The API service is designed to work seamlessly with Clean Architecture:

1. **Data Layer**: Use in remote data sources
2. **Domain Layer**: Keep domain entities and repositories clean
3. **Presentation Layer**: Use through providers and use cases

### Example Integration

```dart
// Data Layer
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiService apiService;
  
  // Implementation using ApiService
}

// Repository Layer
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final SecureStorage secureStorage;
  
  // Implementation using data sources
}

// Presentation Layer
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return ref.watch(authRepositoryImplProvider);
});
```

## Best Practices

1. **Always use try-catch blocks** in data sources to handle API errors
2. **Use the ApiConfig constants** for endpoint URLs to maintain consistency
3. **Handle token refresh** automatically through the interceptor
4. **Use proper error messages** that can be displayed to users
5. **Test API calls** with different network conditions
6. **Monitor API performance** using the built-in logging

## Testing

The API service can be easily mocked for testing:

```dart
class MockApiService extends Mock implements ApiService {}

final mockApiService = MockApiService();
when(mockApiService.post(any, data: anyNamed('data')))
    .thenAnswer((_) async => {'success': true});
``` 