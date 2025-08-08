# Phone Authentication Feature

This feature implements phone number-based authentication using OTP (One-Time Password) verification following Clean Architecture principles.

## Architecture Overview

### Domain Layer
- **Entities**: `User` - Core business object representing a user
- **Repositories**: `AuthRepository` - Abstract interface for authentication operations
- **Use Cases**: 
  - `SendVerificationCodeUseCase` - Sends OTP to phone number
  - `VerifyPhoneUseCase` - Verifies OTP and authenticates user
  - `GetCurrentUserUseCase` - Retrieves current authenticated user
  - `UpdateProfileUseCase` - Updates user profile information
  - `LogoutUseCase` - Logs out user
  - `RefreshTokenUseCase` - Refreshes authentication token
  - `IsAuthenticatedUseCase` - Checks if user is authenticated

### Data Layer
- **Repository Implementation**: `AuthRepositoryImpl` - Concrete implementation of auth repository
- **Data Sources**: `SecureStorage` - Secure storage for tokens and user data
- **Models**: API response models and data transfer objects

### Presentation Layer
- **Providers**: 
  - `loginProvider` - Manages login state and operations
  - `authProvider` - Dependency injection for auth-related providers
- **State Management**: `LoginState` - Represents the current state of login process
- **Pages**: Login and verification UI components

## API Endpoints

### Server-side Routes
- `POST /api/auth/send-code` - Send verification code to phone number
- `POST /api/auth/verify-phone` - Verify phone number with OTP
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/refresh-token` - Refresh authentication token

### Request/Response Examples

#### Send Verification Code
```json
POST /api/auth/send-code
{
  "phone": "+1234567890"
}

Response:
{
  "success": true,
  "message": "Verification code sent successfully",
  "data": {
    "phone": "+1234567890"
  }
}
```

#### Verify Phone
```json
POST /api/auth/verify-phone
{
  "phone": "+1234567890",
  "verificationCode": "123456"
}

Response:
{
  "success": true,
  "message": "Phone verified successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "phone": "+1234567890",
      "name": "User Name",
      "email": "user@example.com",
      "isPhoneVerified": true
    }
  }
}
```

## Usage

### Flutter Implementation

1. **Send Verification Code**:
```dart
final loginNotifier = ref.read(loginProvider.notifier);
await loginNotifier.sendCode('+1234567890');
```

2. **Verify Code**:
```dart
final user = await loginNotifier.verifyCode('123456');
if (user != null) {
  // User is authenticated
}
```

3. **Check Authentication Status**:
```dart
final isAuthenticated = await ref.read(isAuthenticatedUseCaseProvider).call();
```

4. **Get Current User**:
```dart
final user = await ref.read(getCurrentUserUseCaseProvider).call();
```

5. **Update Profile**:
```dart
final updatedUser = await ref.read(updateProfileUseCaseProvider).call('New Name', 'new@email.com');
```

6. **Logout**:
```dart
await ref.read(logoutUseCaseProvider).call();
```

## State Management

The login state is managed using Riverpod with the following states:

- `isLoading`: Whether an operation is in progress
- `isCodeSent`: Whether verification code has been sent
- `phoneNumber`: The phone number being verified
- `error`: Any error message
- `isLoggedIn`: Whether user is successfully logged in

## Security Features

1. **Secure Storage**: All sensitive data (tokens, user data) are stored securely using `flutter_secure_storage`
2. **JWT Tokens**: Authentication uses JWT tokens with expiration
3. **OTP Expiration**: Verification codes expire after 10 minutes
4. **Input Validation**: All inputs are validated on both client and server side

## Error Handling

The system handles various error scenarios:

- Invalid phone numbers
- Expired verification codes
- Network errors
- Server errors
- Authentication failures

## Testing

Run the tests using:
```bash
flutter test test/phone_auth_test.dart
```

## Dependencies

- `hooks_riverpod` - State management
- `flutter_secure_storage` - Secure data storage
- `http` - HTTP client for API calls
- `easy_localization` - Internationalization

## Future Enhancements

1. **SMS Integration**: Integrate with actual SMS service (Twilio, AWS SNS, etc.)
2. **Rate Limiting**: Implement rate limiting for OTP requests
3. **Biometric Authentication**: Add fingerprint/face ID support
4. **Multi-factor Authentication**: Support for additional verification methods
5. **Offline Support**: Handle offline scenarios gracefully 