# Token Expiration Logout - Integration Guide

## What's Implemented

This implementation ensures that when a user's authentication token expires, the app automatically logs them out and presents a user-friendly message in both English and Farsi.

## Files Modified

### 1. `lib/services/api_service.dart`
**Changes:** Added automatic token expiration detection and logout handling

**Key Addition - New Helper Method:**
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

**Error Interceptor Enhancement:**
- Detects 403 Forbidden with token expiration keywords
- Calls `onLogout()` callback immediately
- Prevents cascading failed requests

### 2. `lib/extensions/error_handler.dart`
**Changes:** Added recognition of token expiration error messages

**Addition:**
```dart
// Handle token expiration/invalid token errors
if (errorString.contains('expired token') || 
    errorString.contains('invalid token') ||
    errorString.contains('token expired')) {
  return 'common.token_expired';
}
```

### 3. `assets/translations/en-US.json`
**Added:**
```json
"token_expired": "Your session has expired. Please log in again.",
"token_invalid": "Your session is invalid. Please log in again."
```

### 4. `assets/translations/fa-IR.json`
**Added:**
```json
"token_expired": "جلسه کاری شما منقضی شده است. لطفاً دوباره وارد شوید.",
"token_invalid": "جلسه کاری شما نامعتبر است. لطفاً دوباره وارد شوید."
```

## How to Test

### Test Scenario 1: Manual Token Expiration
1. Open app and log in successfully
2. Manually delete/expire the token in secure storage
3. Make any API call (e.g., navigate to subscription page)
4. Expected: User sees expiration message and is redirected to login

### Test Scenario 2: Server-Side Token Expiration
1. Configure your backend to return 403 after token expires
2. Let user stay in app past token expiration time
3. Any API call should trigger logout
4. Expected: Smooth logout with appropriate message

### Test Scenario 3: Bilingual Testing
1. Switch app language to Farsi
2. Repeat test scenarios
3. Expected: Error message appears in Farsi

## Implementation Details

### Token Expiration Detection
The system detects token expiration by checking:
1. **HTTP Status:** 403 Forbidden
2. **Response Message:** Contains keywords (case-insensitive):
   - "expired token"
   - "invalid token"
   - "token expired"

### Logout Flow
When token expiration is detected:
```
1. _isTokenExpired() returns true
2. onLogout callback is invoked
3. Callback clears: token, user data, phone
4. ErrorHandler maps to 'common.token_expired'
5. UI shows localized message
6. User redirected to login screen
```

### Secure Storage Cleanup
```dart
onLogout: () async {
  await secureStorage.deleteToken();
  await secureStorage.deleteUserData();
  await secureStorage.deletePhone();
}
```

## Existing Functionality Preserved

✅ **Token Refresh (401)** - Still works normally
- 401 responses attempt token refresh
- Successful refresh retries the original request
- Failed refresh logs out user

✅ **Other Error Handling** - Unchanged
- Network errors
- Server errors (5xx)
- Client errors (4xx except 403 with token keywords)

## Message Display

The error messages are displayed through the standard error handling pipeline:

```dart
// Gets called when error occurs
final errorMessage = ErrorHandler.getErrorTranslationKey(error);
// Returns: 'common.token_expired'
// UI renders: localized message
```

## Platform Compatibility

| Platform | Status |
|----------|--------|
| Android | ✅ Full Support |
| iOS | ✅ Full Support |
| Web | ✅ Full Support |
| Linux | ✅ Full Support |
| Windows | ✅ Full Support |
| macOS | ✅ Full Support |

## Debugging

### Enable Debug Logging
The implementation respects `kDebugMode` from Flutter:
```dart
if (kDebugMode) {
  print('Token expiration detected - logging out');
}
```

### Check Logs
Watch for patterns in Android logcat:
```
I/flutter: 403 Forbidden
I/flutter: "message": "Invalid or expired token"
I/flutter: ║ Detected token expiration
```

## Performance Impact

- **Minimal:** One additional string comparison per 403 error
- **Efficient:** Early detection prevents cascading failed requests
- **Safe:** Prevents unnecessary API calls when token is expired

## Error Messages

### English
| Scenario | Message |
|----------|---------|
| Expired Token | "Your session has expired. Please log in again." |
| Invalid Token | "Your session is invalid. Please log in again." |

### Farsi
| Scenario | Message |
|----------|---------|
| Token Expired | "جلسه کاری شما منقضی شده است. لطفاً دوباره وارد شوید." |
| Invalid Token | "جلسه کاری شما نامعتبر است. لطفاً دوباره وارد شوید." |

## Future Enhancements

Potential improvements:
- [ ] Silent refresh before showing error to user
- [ ] Store last refresh attempt to prevent retry loops
- [ ] Track token expiration time and proactive refresh
- [ ] Show "Session ending soon" warning before expiration
- [ ] Add analytics for token expiration events
- [ ] Custom logout completion callbacks

## Rollback Instructions

If you need to revert:
1. Restore `api_service.dart` to previous version
2. Restore `error_handler.dart` to previous version
3. Remove token translation keys from both JSON files
4. App will return to original behavior (no auto-logout on 403)

## Support

For issues or questions:
1. Check TOKEN_EXPIRATION_LOGOUT.md for detailed documentation
2. Review TOKEN_EXPIRATION_QUICK_REFERENCE.md for quick answers
3. Check implementation in api_service.dart
4. Review error handler mapping in error_handler.dart

## Verification Checklist

- [ ] Files are modified correctly
- [ ] No linting errors present
- [ ] Translations added to both JSON files
- [ ] Can build and run app successfully
- [ ] Token expiration triggers logout
- [ ] Login works after logout
- [ ] Bilingual messages display correctly
- [ ] No regression in 401 refresh flow

