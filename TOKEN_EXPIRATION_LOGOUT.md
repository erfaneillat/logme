# Token Expiration Logout Implementation

## Overview
This document explains the implementation of automatic logout when a user's authentication token expires on the Android platform.

## Problem
Previously, when the API returned a 403 Forbidden response with message "Invalid or expired token", the app would:
- Continue making API requests
- Show repeated 403 errors
- Not automatically log the user out

Example log output:
```
I/flutter: ╔╣ DioError ║ Status: 403 Forbidden ║ Time: 349 ms
I/flutter: ║  http://10.0.2.2:9000/api/fcm/register
I/flutter: ╚══════════════════════════════════════════════════════════════════════════════════════════╝
I/flutter: ╔ DioExceptionType.badResponse
I/flutter: ║    {
I/flutter: ║         "success": false,
I/flutter: ║         "message": "Invalid or expired token"
I/flutter: ║    }
```

## Solution

### 1. API Service Enhancement (`lib/services/api_service.dart`)

Added a new helper method `_isTokenExpired()` that detects token expiration:

```dart
/// Checks if the error indicates token expiration
bool _isTokenExpired(int? statusCode, dynamic responseData) {
  if (statusCode != 403) return false;
  
  // Check if response contains token expiration message
  if (responseData is Map<String, dynamic>) {
    final message = responseData['message']?.toString().toLowerCase() ?? '';
    return message.contains('expired token') || 
           message.contains('invalid token') ||
           message.contains('token expired');
  }
  
  return false;
}
```

Modified the error interceptor to:
1. Check for token expiration immediately on 403 responses
2. Call `onLogout()` callback to clear credentials
3. Stop making subsequent API calls
4. Present appropriate error message to user

**Key changes in error handling flow:**
- **Token Expiration (403 with expired/invalid message)**: Immediate logout
- **Unauthorized (401)**: Attempt token refresh
- **Other errors**: Pass through to caller

### 2. Error Handler Enhancement (`lib/extensions/error_handler.dart`)

Updated `getErrorTranslationKey()` to recognize token expiration errors and map them to the appropriate translation key:

```dart
// Handle token expiration/invalid token errors
if (errorString.contains('expired token') || 
    errorString.contains('invalid token') ||
    errorString.contains('token expired')) {
  return 'common.token_expired';
}
```

### 3. Translation Keys Added

**English (`assets/translations/en-US.json`):**
```json
"common": {
  "token_expired": "Your session has expired. Please log in again.",
  "token_invalid": "Your session is invalid. Please log in again."
}
```

**Farsi (`assets/translations/fa-IR.json`):**
```json
"common": {
  "token_expired": "جلسه کاری شما منقضی شده است. لطفاً دوباره وارد شوید.",
  "token_invalid": "جلسه کاری شما نامعتبر است. لطفاً دوباره وارد شوید."
}
```

## Implementation Flow

```
API Request
    ↓
401 Unauthorized? → YES → Attempt Token Refresh → Success? → Retry Request / Failure? → Logout
    ↓ NO
403 Forbidden + Token Expired? → YES → Logout immediately
    ↓ NO
Pass error to caller
```

## Logout Callback

The `onLogout` callback is configured in `api_service_provider.dart`:

```dart
onLogout: () async {
  await secureStorage.deleteToken();
  await secureStorage.deleteUserData();
  await secureStorage.deletePhone();
}
```

This ensures:
1. Authentication token is cleared
2. User data is cleared
3. Phone number is cleared
4. User is redirected to login screen

## Testing

To test this implementation:

1. **Simulate Expired Token:**
   - Set token to an expired/invalid value
   - Make an API request
   - Verify that 403 response with "Invalid or expired token" message triggers logout

2. **Expected Behavior:**
   - User sees "Your session has expired. Please log in again." message
   - User is redirected to login screen
   - No further API requests are made
   - Token, user data, and phone are cleared from secure storage

3. **No Disruption to Token Refresh:**
   - 401 responses still trigger token refresh attempt
   - Valid token refresh continues to work normally

## Files Modified

1. `lib/services/api_service.dart` - Added token expiration detection and handling
2. `lib/extensions/error_handler.dart` - Added token expiration error mapping
3. `assets/translations/en-US.json` - Added English translations
4. `assets/translations/fa-IR.json` - Added Farsi translations

## Error Messages

When token expires, users will see one of these messages based on their language:

| Scenario | English | Farsi |
|----------|---------|-------|
| Expired Token | "Your session has expired. Please log in again." | "جلسه کاری شما منقضی شده است. لطفاً دوباره وارد شوید." |
| Invalid Token | "Your session is invalid. Please log in again." | "جلسه کاری شما نامعتبر است. لطفاً دوباره وارد شوید." |

## Benefits

✅ Automatic logout on token expiration
✅ No repeated failed API calls
✅ User-friendly error messages
✅ Bilingual support (English & Farsi)
✅ Maintains token refresh functionality for 401 errors
✅ Cleans up all credentials on logout

