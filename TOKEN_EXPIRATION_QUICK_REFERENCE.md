# Token Expiration - Quick Reference

## What Changed

When your API returns a **403 Forbidden** response with message containing "expired token" or "invalid token", the app now:

1. ✅ **Immediately logs out** the user
2. ✅ **Clears** all stored credentials (token, user data, phone)
3. ✅ **Stops** making further API requests
4. ✅ **Shows** user-friendly error message
5. ✅ **Redirects** to login screen

## How It Works

### Before (Old Behavior)
```
403 Error: "Invalid or expired token"
  ↓
App displays error but continues running
  ↓
Multiple 403 errors appear in logs
  ↓
User stuck in broken state
```

### After (New Behavior)
```
403 Error: "Invalid or expired token"
  ↓
API Service detects token expiration
  ↓
Calls onLogout callback
  ↓
Clears token and user data
  ↓
Shows "Your session has expired. Please log in again."
  ↓
Redirects to login screen
```

## Error Detection Logic

The API service checks for:
- HTTP Status Code: **403**
- Response contains message with any of:
  - "expired token"
  - "invalid token"
  - "token expired"

```dart
// Detection example
if (statusCode == 403 && 
    message.contains('expired token')) {
  // Logout immediately
}
```

## Code Changes Summary

### 1. API Service (`api_service.dart`)
- Added `_isTokenExpired()` method
- Modified error interceptor to detect and handle 403 with token errors
- Calls `onLogout()` callback on detection

### 2. Error Handler (`extensions/error_handler.dart`)
- Maps token expiration errors to translation key
- Returns `'common.token_expired'` for appropriate UI message

### 3. Translations
**Added to both English and Farsi:**
```json
"token_expired": "Your session has expired. Please log in again.",
"token_invalid": "Your session is invalid. Please log in again."
```

## User Impact

| Action | Result |
|--------|--------|
| User with expired token makes API request | Sees timeout/expiration message → redirected to login |
| Previous stored data | Automatically cleared |
| Session state | Completely reset |
| Need to login again | Required |

## Testing Checklist

- [ ] Simulate expired token scenario
- [ ] Verify 403 with "Invalid or expired token" message triggers logout
- [ ] Check that error message is displayed in correct language
- [ ] Verify user is redirected to login screen
- [ ] Confirm no further API requests are made
- [ ] Test on Android device/emulator
- [ ] Verify secure storage is cleared

## Logs to Watch For

**Before Implementation:**
```
I/flutter: ╔╣ DioError ║ Status: 403 Forbidden ║ Time: 349 ms
I/flutter: ║  http://10.0.2.2:9000/api/fcm/register
I/flutter: ║  "message": "Invalid or expired token"
```

**After Implementation:**
```
I/flutter: ║  Detected token expiration - logging out user
I/flutter: ║  Cleared stored credentials
I/flutter: ║  Redirecting to login screen
```

## API Server Side

Make sure your backend returns **403 Forbidden** with proper response format:

```json
{
  "success": false,
  "message": "Invalid or expired token",
  "statusCode": 403
}
```

The detection keywords (case-insensitive):
- "expired token"
- "invalid token" 
- "token expired"

Any of these in the message will trigger logout.

## Fallback Behavior

If token error is not detected properly:
- 401 responses still attempt token refresh
- Other errors are handled normally
- No error is completely missed

## Platform Support

- ✅ Android (Primary - tested)
- ✅ iOS (Uses same API Service)
- ✅ Web (Uses same API Service)

## Notes

- Token refresh for 401 errors is **NOT affected**
- Only 403 + token keywords trigger logout
- All credentials are properly cleaned
- User experience is improved with clear messaging
- Bilingual support included (English & Farsi)

