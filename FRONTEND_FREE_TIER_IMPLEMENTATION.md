# Frontend Implementation Guide: Free User Daily Limit

## Overview
This guide explains how to integrate the free user daily image analysis limit feature into the Flutter frontend.

## Expected API Response

### Success Response (Under Limit)
```json
{
    "success": true,
    "data": { ... analysis data ... },
    "meta": { ... analysis metadata ... },
    "timestamp": "2024-10-17T18:45:32.123Z"
}
```

### Limit Reached Response (HTTP 403)
```json
{
    "success": false,
    "error": "free_tier_limit_reached",
    "message": "Free users can analyze 3 images daily. Your limit will reset tomorrow (2024-10-18). Please subscribe to get unlimited analyses.",
    "needsSubscription": true,
    "nextResetDate": "2024-10-18",
    "timestamp": "2024-10-17T18:45:32.123Z"
}
```

## Implementation Steps

### 1. Handle Error Response in Food Service

In your food analysis service/provider, add handling for the 403 error:

```dart
// Example: In your food analysis service
Future<FoodAnalysisResult?> analyzeImage(File imageFile) async {
    try {
        final response = await http.post(
            Uri.parse('$baseUrl/api/food/analyze'),
            headers: {'Authorization': 'Bearer $token'},
            body: FormData.fromMap({
                'image': await MultipartFile.fromFile(imageFile.path),
            }),
        );

        if (response.statusCode == 403) {
            // Handle free tier limit
            final data = jsonDecode(response.body);
            if (data['error'] == 'free_tier_limit_reached') {
                throw FreeTierLimitExceededException(
                    message: data['message'],
                    nextResetDate: data['nextResetDate'],
                );
            }
        }
        
        if (response.statusCode == 200) {
            return FoodAnalysisResult.fromJson(jsonDecode(response.body)['data']);
        }
        
        throw Exception('Failed to analyze image');
    } catch (e) {
        rethrow;
    }
}
```

### 2. Create Custom Exception

Create a custom exception class for handling the limit:

```dart
class FreeTierLimitExceededException implements Exception {
    final String message;
    final String nextResetDate;

    FreeTierLimitExceededException({
        required this.message,
        required this.nextResetDate,
    });

    @override
    String toString() => 'FreeTierLimitExceededException: $message';
}
```

### 3. Handle Exception in UI

In your food analysis page/screen, catch and handle the exception:

```dart
void analyzeFood() async {
    try {
        // Show loading indicator
        showLoadingDialog(context);

        final result = await foodService.analyzeImage(selectedImageFile);

        // Hide loading
        Navigator.pop(context);

        // Show result
        showFoodDetailDialog(result);

    } on FreeTierLimitExceededException catch (e) {
        // Hide loading
        Navigator.pop(context);

        // Show dialog with limit message
        showLimitReachedDialog(
            context: context,
            message: e.message,
            nextResetDate: e.nextResetDate,
        );

    } on Exception catch (e) {
        Navigator.pop(context);
        showErrorDialog(context, 'Error: ${e.toString()}');
    }
}
```

### 4. Create Limit Dialog Widget

Create a custom dialog to show when limit is reached:

```dart
void showLimitReachedDialog({
    required BuildContext context,
    required String message,
    required String nextResetDate,
}) {
    showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
            title: Text(AppLocalizations.of(context)!.translate('free_tier_limit', 'title')),
            content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                    Icon(
                        Icons.info_outline,
                        color: Colors.orange,
                        size: 48,
                    ),
                    SizedBox(height: 16),
                    Text(message),
                    SizedBox(height: 8),
                    Text(
                        'Resets: $nextResetDate',
                        style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                        ),
                    ),
                ],
            ),
            actions: [
                TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(AppLocalizations.of(context)!.translate('common', 'cancel')),
                ),
                ElevatedButton(
                    onPressed: () {
                        Navigator.pop(context);
                        // Navigate to subscription screen
                        Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => SubscriptionPage(),
                            ),
                        );
                    },
                    child: Text(
                        AppLocalizations.of(context)!.translate('free_tier_limit', 'upgrade_button'),
                    ),
                ),
            ],
        ),
    );
}
```

### 5. Using Translation Strings

Access the translation strings in your UI:

```dart
// English
AppLocalizations.of(context)!.translate('free_tier_limit', 'title')
// Output: "Free Tier Limit Reached"

AppLocalizations.of(context)!.translate('free_tier_limit', 'message')
// Output: "You've reached the free tier image analysis limit..."

AppLocalizations.of(context)!.translate('free_tier_limit', 'upgrade_button')
// Output: "Upgrade Now"

// Persian
AppLocalizations.of(context)!.translate('free_tier_limit', 'title')
// Output: "حد مجاز لایه رایگان رسیده‌است"
```

### 6. Optional: Auto-Navigate to Subscription

For better UX, auto-navigate after showing a brief message:

```dart
void showLimitReachedDialog({
    required BuildContext context,
    required String message,
    required String nextResetDate,
    bool autoNavigate = true,
}) {
    showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
            // ... dialog content ...
        ),
    );

    if (autoNavigate) {
        Future.delayed(Duration(seconds: 3), () {
            Navigator.pop(context); // Close dialog
            Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => SubscriptionPage()),
            );
        });
    }
}
```

### 7. Analytics/Logging (Optional)

Log when users hit the limit:

```dart
Future<void> _logLimitReached(String userId) async {
    await analyticsService.logEvent(
        name: 'free_tier_limit_reached',
        parameters: {
            'user_id': userId,
            'timestamp': DateTime.now().toIso8601String(),
        },
    );
}
```

## Testing Checklist

- [ ] Analyze 1st image: Should succeed
- [ ] Analyze 2nd image: Should succeed
- [ ] Analyze 3rd image: Should succeed
- [ ] Analyze 4th image: Should show limit dialog
- [ ] Close dialog and try again: Should still show dialog
- [ ] Click "Upgrade Now": Should navigate to subscription page
- [ ] Next day after 00:00: Should be able to analyze again
- [ ] Subscribed user: Can analyze unlimited images

## Error States to Handle

1. **Network Error:** Show retry dialog
2. **Limit Reached:** Show dialog with next reset date and upgrade button
3. **Non-Food Image:** Show existing "not food" error
4. **Server Error:** Show generic error dialog

## Configuration

If you need to change behavior based on the limit response:

```dart
const int FREE_TIER_DAILY_LIMIT = 3;
final DateTime nextResetDateTime = DateTime.parse(nextResetDate);
final Duration timeUntilReset = nextResetDateTime.difference(DateTime.now());

// Display countdown if less than 1 hour
if (timeUntilReset.inMinutes < 60) {
    showCountdownDialog(context, timeUntilReset);
}
```

## Key Points

1. **Error Code:** Check for `"error": "free_tier_limit_reached"`
2. **Status Code:** Response will be HTTP 403 Forbidden
3. **Next Reset Date:** Is provided as `"nextResetDate": "YYYY-MM-DD"`
4. **Subscription Check:** Subscribers will never receive this error
5. **Graceful Handling:** Always provide path to upgrade

## Related Files

- Frontend translation strings: `assets/translations/en-US.json` and `assets/translations/fa-IR.json`
- Backend service: `server/src/services/imageAnalysisLimitService.ts`
- Backend model: `server/src/models/DailyAnalysisLimit.ts`
- Backend controller: `server/src/controllers/foodController.ts`

## Support

For questions or issues, refer to the backend implementation document:
`FREE_USER_DAILY_LIMIT_IMPLEMENTATION.md`
