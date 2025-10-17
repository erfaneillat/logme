# Free User Daily Image Analysis Limit Implementation

## Overview
This document describes the implementation of a daily image analysis limit for free users. Free users can analyze up to **3 images per day**. When they reach this limit, they receive a message prompting them to upgrade their subscription.

## Files Modified

### 1. **New Service: `imageAnalysisLimitService.ts`**
Location: `server/src/services/imageAnalysisLimitService.ts`

**Functionality:**
- `checkAndTrackAnalysis(userId, todayDate)` - Checks if a user has an active subscription and if not, verifies they haven't exceeded the daily limit
- `incrementAnalysisCount(userId, todayDate)` - Increments the analysis count for the day after a successful analysis
- Helper functions for formatting dates and getting tier limits

**Key Logic:**
- If user has an active subscription: Allow unlimited analyses
- If user is free tier: Check `DailyAnalysisLimit` table for today's count
- Return: `canAnalyze` boolean, `remaining` count, and `nextResetTime`

### 2. **New Model: `DailyAnalysisLimit.ts`**
Location: `server/src/models/DailyAnalysisLimit.ts`

**Schema:**
```typescript
{
    userId: ObjectId,        // Reference to user
    date: string,            // YYYY-MM-DD format
    analysisCount: number,   // Times analyzed today
    createdAt: Date,
    updatedAt: Date
}
```

**Indexes:**
- Compound unique index on `userId` and `date` for efficient daily tracking

### 3. **Updated: `foodController.ts`**
Location: `server/src/controllers/foodController.ts`

**Changes:**
- Added limit check in `analyzeImage()` method before analysis
- Added limit check in `analyzeDescription()` method before analysis
- Both methods increment the analysis count upon successful completion
- Returns 403 status code when limit is reached

**Response Format (Limit Reached):**
```json
{
    "success": false,
    "error": "free_tier_limit_reached",
    "message": "Free users can analyze 3 images daily. Your limit will reset tomorrow (YYYY-MM-DD). Please subscribe to get unlimited analyses.",
    "needsSubscription": true,
    "nextResetDate": "YYYY-MM-DD",
    "timestamp": "ISO-8601"
}
```

### 4. **Translation Strings Added**

#### English (`en-US.json`)
```json
"free_tier_limit": {
    "title": "Free Tier Limit Reached",
    "message": "You've reached the free tier image analysis limit. Please upgrade to the premium plan to continue using this feature.",
    "upgrade_button": "Upgrade Now",
    "learn_more": "Learn More"
}
```

#### Persian (`fa-IR.json`)
```json
"free_tier_limit": {
    "title": "حد مجاز لایه رایگان رسیده‌است",
    "message": "شما به حد مجاز تجزیه تصاویر لایه رایگان رسیده‌اید. لطفاً برای ادامه استفاده از این قابلیت به طرح پریمیوم ارتقا دهید.",
    "upgrade_button": "ارتقا فوری",
    "learn_more": "بیشتر بدانید"
}
```

## How It Works

### 1. **Image Analysis Request**
User attempts to analyze a food image:

```
POST /api/food/analyze
```

### 2. **Subscription Check**
- Service queries `Subscription` table for active subscription
- If found and not expired: Allow unlimited analyses (return)
- If not found: Continue to daily limit check

### 3. **Daily Limit Check**
- Get or create `DailyAnalysisLimit` record for today (YYYY-MM-DD)
- Calculate: `remaining = 3 - analysisCount`
- If `remaining <= 0`: Return 403 error with message
- If `remaining > 0`: Continue with analysis

### 4. **Successful Analysis**
- Perform food analysis via OpenAI
- Save to `DailyLog`
- **Increment** `DailyAnalysisLimit.analysisCount`
- Return 200 with analysis data

## Frontend Implementation (Expected)

The frontend should:

1. **Handle 403 Response:**
```typescript
if (response.status === 403 && response.data.error === 'free_tier_limit_reached') {
    // Show dialog with message
    // Display nextResetDate
    // Offer subscription upgrade button
}
```

2. **Navigation to Subscription Screen:**
- When user clicks "Upgrade" or "Subscribe", navigate to subscription screen
- Can use `needsSubscription` flag to auto-navigate

3. **Error Message Display:**
```
"Free users can analyze 3 images daily. Your limit will reset tomorrow (2024-10-18). 
Please subscribe to get unlimited analyses."
```

## Database Schema

### DailyAnalysisLimit Collection
```javascript
db.dailyanalysislimits.createIndex({ "userId": 1, "date": 1 }, { unique: true })
```

Sample Document:
```json
{
    "_id": ObjectId("..."),
    "userId": ObjectId("user_id"),
    "date": "2024-10-17",
    "analysisCount": 3,
    "createdAt": "2024-10-17T00:00:00Z",
    "updatedAt": "2024-10-17T18:45:32Z"
}
```

## Configuration

### FREE_USER_DAILY_LIMIT
Currently set to **3** in `imageAnalysisLimitService.ts`:

```typescript
const FREE_USER_DAILY_LIMIT = 3;
```

To change this limit, modify the constant and redeploy.

## API Behavior Summary

| Scenario | Status | Response |
|----------|--------|----------|
| Subscribed user | 200 | Analysis result |
| Free user, < 3 analyses today | 200 | Analysis result |
| Free user, >= 3 analyses today | 403 | Limit reached message |
| Invalid image (not food) | 400 | "Not food" error |

## Future Enhancements

1. **Admin Dashboard:** Track usage by user and tier
2. **Custom Limits:** Different limits per subscription tier
3. **Reset Schedule:** Allow different reset times (midnight UTC vs local)
4. **Usage Analytics:** Monitor daily analysis trends
5. **Notifications:** Send notification before limit reset

## Testing

### Test Cases

1. **Test 1:** New user, first analysis - Should succeed
2. **Test 2:** Same user, 2nd analysis - Should succeed
3. **Test 3:** Same user, 3rd analysis - Should succeed
4. **Test 4:** Same user, 4th analysis same day - Should fail with 403
5. **Test 5:** Next day, same user - Counter should reset
6. **Test 6:** Subscribed user - All analyses should succeed

### Example cURL Requests

```bash
# Analyze image (form-data with image file)
curl -X POST http://localhost:3000/api/food/analyze \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@/path/to/image.jpg"

# Expected response when limit reached:
{
  "success": false,
  "error": "free_tier_limit_reached",
  "message": "Free users can analyze 3 images daily. Your limit will reset tomorrow (2024-10-18). Please subscribe to get unlimited analyses.",
  "needsSubscription": true,
  "nextResetDate": "2024-10-18"
}
```

## Notes

- Limit resets daily at **midnight (00:00)** in server timezone
- **Subscribers unlimited:** No limit checking for active subscriptions
- **Date format:** Uses `YYYY-MM-DD` for consistency with `DailyLog` model
- **Non-blocking:** If limit service fails, analysis proceeds (fail-open strategy)
- **Atomic operations:** Uses MongoDB upsert for thread-safety
