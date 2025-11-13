# Token Expiration Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Flutter App                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │  UI Layer    │─────▶│ Data Layer   │─────▶│ API Service  │   │
│  │              │      │              │      │              │   │
│  └──────────────┘      └──────────────┘      └──────────────┘   │
│                                                      │            │
│                                                      ▼            │
│                                              ┌──────────────┐    │
│                                              │ Interceptors │    │
│                                              │  - Request   │    │
│                                              │  - Response  │    │
│                                              │  - Error     │    │
│                                              └──────────────┘    │
│                                                      │            │
└──────────────────────────────────────────────────────┼────────────┘
                                                       │
                        ┌──────────────────────────────▼────────────┐
                        │       HTTP Error Response                  │
                        │    403 Forbidden Status Code              │
                        │  "Invalid or expired token"               │
                        └──────────────────────────────┬────────────┘
                                                      │
```

## Error Handling Flow (New Implementation)

```
API Error Response
       │
       ▼
┌──────────────────────────┐
│ Check Status Code        │
│ Is it 403?               │
└────────────┬─────────────┘
             │
        YES  │  NO
             │   └──────────────────────────┐
             │                              │
             ▼                              │
    ┌─────────────────────┐                 │
    │ Check Response Data │                 │
    │ Contains:           │                 │
    │ - "expired token"   │                 │
    │ - "invalid token"   │                 │
    │ - "token expired"   │                 │
    └────────────┬────────┘                 │
                 │                          │
        YES      │    NO                    │
                 │     └──────────┐         │
                 │                │         │
                 ▼                ▼         ▼
        ┌─────────────────┐   ┌────────────────────┐
        │ TOKEN EXPIRED   │   │ Check if 401?      │
        │                 │   └────────────┬───────┘
        │ 1. Log message  │                │
        │ 2. Call onLogout│                ▼
        │ 3. Clear token  │        ┌──────────────────┐
        │ 4. Clear user   │        │ YES - Attempt    │
        │ 5. Clear phone  │        │ Token Refresh    │
        └────────┬────────┘        │                  │
                 │                 │ NO - Pass Error  │
                 │                 │ to Caller        │
                 │                 └────────┬─────────┘
                 │                          │
                 └──────────────┬───────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │ Error Handler Maps     │
                    │ to Translation Key:    │
                    │ 'common.token_expired' │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Display User Message   │
                    │ English/Farsi          │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Redirect to Login Page │
                    └────────────────────────┘
```

## Detailed Token Expiration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER SCENARIO: Session Expires While Using App                  │
└─────────────────────────────────────────────────────────────────┘

 1. User Action
    │
    └──▶ Make API Request (e.g., Check Subscription)
         │
         ▼
 2. API Service
    │
    └──▶ Adds Auth Header with Token
         │
         └──▶ Token is EXPIRED
              │
              ▼
 3. Server Response
    │
    ├──▶ HTTP 403 Forbidden
    │
    └──▶ Response Body:
         {
           "success": false,
           "message": "Invalid or expired token"
         }
         │
         ▼
 4. DIO Interceptor (Error)
    │
    ├──▶ Receives Error Response
    │
    ├──▶ Calls _isTokenExpired(403, responseData)
    │
    ├──▶ Checks:
    │   - statusCode == 403? ✓ YES
    │   - message.contains("expired token")? ✓ YES
    │
    ├──▶ Returns TRUE
    │
    └──▶ Token Expiration Detected!
         │
         ▼
 5. Logout Process
    │
    ├──▶ if (onLogout != null)
    │   │
    │   └──▶ await onLogout!()
    │       │
    │       ├──▶ await secureStorage.deleteToken()
    │       ├──▶ await secureStorage.deleteUserData()
    │       └──▶ await secureStorage.deletePhone()
    │
    ├──▶ Credentials Cleared ✓
    │
    └──▶ Return Error Response
         │
         ▼
 6. Error Handler
    │
    ├──▶ ErrorHandler.getErrorTranslationKey(error)
    │
    ├──▶ Checks error string:
    │   - Contains "expired token"? ✓ YES
    │
    ├──▶ Returns: 'common.token_expired'
    │
    └──▶ Maps to Translation
         │
         ▼
 7. UI Display
    │
    ├──▶ English:
    │   "Your session has expired. Please log in again."
    │
    ├──▶ Farsi:
    │   "جلسه کاری شما منقضی شده است. لطفاً دوباره وارد شوید."
    │
    └──▶ Show Error Dialog
         │
         ▼
 8. Navigation
    │
    ├──▶ Pop current screen/dialog
    │
    ├──▶ Navigate to Login Page
    │
    └──▶ User sees login screen
         │
         ▼
 9. Resolution
    │
    └──▶ User must login again with fresh token
```

## Comparison: Before vs After

### Before (Without Token Expiration Handling)

```
API Request ──▶ 403 Error ──▶ Display Error ──▶ User Stuck
               │                     │
               │                     └─ App still shows broken state
               │
               └─ Next API Request ──▶ Another 403 Error
                                           │
                                           └─ Cycle Repeats
                                              (User confused)
```

### After (With Token Expiration Handling)

```
API Request ──▶ 403 Token Expired ──▶ Detect & Logout ──▶ Clear Data
                                             │
                                             ▼
                                      Show Message ──▶ Redirect Login
                                             │
                                             ▼
                                      User Logs In ──▶ Fresh Token
                                                          │
                                                          ▼
                                                   Smooth Experience
```

## State Transitions

```
┌──────────────────────────────────────────────────┐
│           User Authentication States              │
└──────────────────────────────────────────────────┘

         ┌─────────────────┐
         │  LOGGED OUT     │
         │  - No token     │
         │  - Login page   │
         └────────┬────────┘
                  │
         (User enters credentials)
                  │
                  ▼
         ┌─────────────────┐
         │  LOGGING IN     │
         │  - Sending auth │
         │  - Loading...   │
         └────────┬────────┘
                  │
         (Auth successful, token received)
                  │
                  ▼
         ┌─────────────────┐
         │  LOGGED IN      │◄──────────────┐
         │  - Valid token  │               │
         │  - App screens  │               │
         └────────┬────────┘               │
                  │                        │
    (Time passes, token ages)              │ (User login again)
                  │                        │
                  ▼                        │
         ┌─────────────────┐               │
         │  TOKEN EXPIRED  │               │
         │  (NEW: Detected)├───────────────┘
         │  - Logout called│
         │  - Data cleared │
         │  - Redirect to  │
         │    login        │
         └────────┬────────┘
                  │
         (Logout complete)
                  │
                  ▼
         ┌─────────────────┐
         │  LOGGED OUT     │
         │  - No token     │
         │  - Login page   │
         └─────────────────┘
```

## Code Execution Path

```
HttpErrorResponse(403)
    ║
    ╠═══════════════════════════════════╗
    ║   Error Interceptor Triggered     ║
    ╠═══════════════════════════════════╝
    ║
    ▼
┌─────────────────────────────┐
│ _isTokenExpired(            │
│   statusCode: 403,          │
│   responseData: {...}       │
│ )                           │
└─────────────────────────────┘
    ║
    ╠═ statusCode == 403? ✓
    ║
    ╠═ message.contains(      │
    │  'expired token'        ├─ TRUE
    │  'invalid token'        │
    │  'token expired'        │
    │ ) ✓                     │
    ║
    ╚═══════════════════════════════════╗
                                        ║ Returns: true
    ╔═══════════════════════════════════╝
    ║
    ▼
┌──────────────────────────────┐
│ if (isTokenExpired) {        │
│   await onLogout!()          │
│ }                            │
└──────────────────────────────┘
    ║
    ▼
┌──────────────────────────────┐
│ onLogout callback executes:  │
│ - deleteToken()              │
│ - deleteUserData()           │
│ - deletePhone()              │
└──────────────────────────────┘
    ║
    ▼
┌──────────────────────────────┐
│ return handler.reject(       │
│   errorResponse             │
│ )                            │
└──────────────────────────────┘
    ║
    ▼
┌──────────────────────────────┐
│ Error flows to caller        │
│ getErrorTranslationKey()     │
│ returns: 'common.token_      │
│ expired'                     │
└──────────────────────────────┘
    ║
    ▼
┌──────────────────────────────┐
│ UI displays translated msg   │
│ Redirects to login screen    │
└──────────────────────────────┘
```

## Timeline Example

```
T=0s:  User opens app
T=5s:  User logs in successfully
       Token stored: "abc123xyz"
       
T=10s: User navigates to home
T=15s: Server invalidates token after 10s
       (Token expiration logic on server)

T=20s: User clicks "Check Subscription"
       API Request made with token "abc123xyz"
       Server responds: 403 Forbidden
       Message: "Invalid or expired token"

T=20.1s: _isTokenExpired() detects expiration
T=20.2s: onLogout() called
T=20.3s: secureStorage.deleteToken() completes
T=20.4s: secureStorage.deleteUserData() completes
T=20.5s: secureStorage.deletePhone() completes

T=20.6s: Error message displayed:
         "Your session has expired. Please log in again."
         
T=21s:   User sees login screen
         Can attempt login again
```

## Decision Tree

```
                 Is Error Status 403?
                        │
        ┌───────────────┴────────────────┐
        NO                              YES
        │                                │
        ▼                                ▼
    Continue                    Extract Response Data
    Normal Error                        │
    Handling                            ▼
                           Contains "expired token"?
                           Contains "invalid token"?
                           Contains "token expired"?
                                    │
                    ┌───────────────┴────────────────┐
                    NO                              YES
                    │                                │
                    ▼                                ▼
                Continue               TOKEN EXPIRATION
                Normal Error           │
                Handling               ├─▶ Call onLogout()
                                       │
                                       ├─▶ Clear Token
                                       │
                                       ├─▶ Clear User Data
                                       │
                                       ├─▶ Clear Phone
                                       │
                                       ├─▶ Map to Translation
                                       │
                                       ├─▶ Show Message
                                       │
                                       └─▶ Redirect Login
```

This visual documentation helps understand:
- How token expiration is detected
- What actions are taken
- User experience flow
- System state changes
- Decision logic
- Timeline of events

