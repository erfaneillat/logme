# Cafe Bazaar Subscription Status API Implementation

## Overview

This document describes the implementation of Cafe Bazaar's subscription status verification API (متد بررسی وضعیت اشتراک) for the Cal AI backend. This API allows checking the status of subscriptions and their renewal details.

## API Endpoint

**Cafe Bazaar Subscription Status Endpoint:**
```
GET https://pardakht.cafebazaar.ir/devapi/v2/api/applications/<package_name>/subscriptions/<subscription_id>/purchases/<purchase_token>
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| `package_name` | The package name of the app where the subscription is defined |
| `subscription_id` | The SKU of the subscription |
| `purchase_token` | The subscription token sent to the app when subscription started (can also use token from renewal charges) |
| `linkedSubscriptionToken` | A unique string value for each subscription (remains the same even after renewal) |

### Authentication

The API requires a valid token in the `CAFEBAZAAR-PISHKHAN-API-SECRET` header:
```
CAFEBAZAAR-PISHKHAN-API-SECRET: <your-token>
```

**Note:** The token is obtained from Cafe Bazaar Dashboard (پیشخان بازار).

## Response Format

### Success Response (200 OK)

```json
{
    "kind": "androidpublisher#subscriptionPurchase",
    "initiationTimestampMsec": 1414181378566,
    "validUntilTimestampMsec": 1435912745710,
    "autoRenewing": true,
    "linkedSubscriptionToken": "YYNaa3I0uquyEA8X"
}
```

#### Response Fields

| Field | Description |
|-------|-------------|
| `kind` | Always `"androidpublisher#subscriptionPurchase"` |
| `initiationTimestampMsec` | Subscription start time in milliseconds since 1970/1/1 |
| `validUntilTimestampMsec` | Next charge time or expiry time in milliseconds since 1970/1/1 |
| `autoRenewing` | Boolean indicating if subscription will auto-renew |
| `linkedSubscriptionToken` | Unique token for the subscription (persists across renewals) |

**Important Note:** The API returns expired subscriptions as well. A successful response doesn't necessarily mean the subscription is active. Compare `validUntilTimestampMsec` with current time to verify if subscription is still active.

### Error Response (40X)

```json
{
   "error": "not_found",
   "error_description": "The requested subscription is not found!"
}
```

#### Error Types

| Status Code | Error | Description |
|-------------|-------|-------------|
| 404 | `invalid_value` | Package name is invalid |
| 404 | `not_found` | Subscription not found |
| 401 | `unauthorized` | Invalid or expired access token |

## Implementation

### 1. Service Layer

**File:** `server/src/services/cafeBazaarApiService.ts`

Added `checkSubscriptionStatus` method to the `CafeBazaarApiService` class:

```typescript
const service = CafeBazaarApiService.fromEnvironment();
const result = await service.checkSubscriptionStatus(
    packageName,
    subscriptionId,
    purchaseToken
);
```

**Key Features:**
- Validates input parameters
- Makes authenticated requests to Cafe Bazaar API
- Automatically checks if subscription is active by comparing expiry time with current time
- Handles all error cases
- Returns structured subscription status results

**Response Interface:**
```typescript
interface SubscriptionStatusResult {
    valid: boolean;              // Whether API call was successful
    active: boolean;             // Whether subscription is currently active
    initiationTime?: number;     // Subscription start time
    expiryTime?: number;         // Subscription expiry/next charge time
    autoRenewing?: boolean;      // Auto-renewal status
    linkedSubscriptionToken?: string;  // Unique subscription identifier
    error?: string;              // Error code if validation failed
    errorDescription?: string;   // Human-readable error description
}
```

### 2. Controller Layer

**File:** `server/src/controllers/subscriptionController.ts`

The `checkCafeBazaarSubscriptionStatus` method provides the endpoint handler:

```typescript
async checkCafeBazaarSubscriptionStatus(req: AuthRequest, res: Response)
```

**Features:**
- Requires user authentication
- Validates request parameters
- Calls Cafe Bazaar API
- Returns detailed subscription information
- Automatically determines if subscription is active
- Handles all error scenarios

### 3. Route Configuration

**File:** `server/src/routes/subscriptionRoutes.ts`

**Endpoint:** `POST /api/subscription/check-subscription-status`

**Request Body:**
```json
{
    "subscriptionId": "monthly_subscription",
    "purchaseToken": "abc123xyz..."
}
```

**Response (Active Subscription):**
```json
{
    "success": true,
    "data": {
        "valid": true,
        "active": true,
        "initiationTime": 1414181378566,
        "expiryTime": 1435912745710,
        "autoRenewing": true,
        "linkedSubscriptionToken": "YYNaa3I0uquyEA8X"
    }
}
```

**Response (Expired Subscription):**
```json
{
    "success": true,
    "data": {
        "valid": true,
        "active": false,
        "initiationTime": 1414181378566,
        "expiryTime": 1435912745710,
        "autoRenewing": false,
        "linkedSubscriptionToken": "YYNaa3I0uquyEA8X"
    }
}
```

**Response (Subscription Not Found):**
```json
{
    "success": false,
    "message": "Subscription not found",
    "error": "not_found",
    "errorDescription": "The requested subscription is not found!"
}
```

## Usage Example

### From Flutter App

```dart
Future<SubscriptionStatus?> checkSubscriptionStatus(
  String subscriptionId,
  String purchaseToken,
) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/subscription/check-subscription-status'),
      headers: {
        'Authorization': 'Bearer $userToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'subscriptionId': subscriptionId,
        'purchaseToken': purchaseToken,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] && data['data']['valid']) {
        return SubscriptionStatus(
          active: data['data']['active'],
          expiryTime: DateTime.fromMillisecondsSinceEpoch(
            data['data']['expiryTime']
          ),
          autoRenewing: data['data']['autoRenewing'],
        );
      }
    }
    
    return null;
  } catch (e) {
    print('Check subscription status error: $e');
    return null;
  }
}
```

### From Backend Testing

```bash
curl -X POST http://localhost:3000/api/subscription/check-subscription-status \
  -H "Authorization: Bearer <user_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "monthly_subscription",
    "purchaseToken": "abc123xyz..."
  }'
```

## Key Differences from Purchase Validation

| Feature | `/validate-cafebazaar` | `/check-subscription-status` |
|---------|------------------------|------------------------------|
| Purpose | Validate in-app purchase | Check subscription status |
| API Endpoint | `/validate/.../inapp/...` | `/applications/.../subscriptions/...` |
| Returns | Purchase state, consumption state | Subscription active status, expiry time |
| Use Case | One-time purchases | Recurring subscriptions |
| Auto-renewal Info | ❌ No | ✅ Yes |
| Expiry Time | ❌ No | ✅ Yes |
| Linked Token | ❌ No | ✅ Yes (persists across renewals) |

## Important Considerations

### 1. Active vs Valid Subscription

- **Valid:** API call succeeded and subscription exists in Cafe Bazaar
- **Active:** Subscription is valid AND not expired (validUntilTimestampMsec > current time)

Always check both `valid` and `active` fields:

```typescript
if (data.valid && data.active) {
    // Subscription is currently active
} else if (data.valid && !data.active) {
    // Subscription exists but has expired
} else {
    // Subscription not found or error occurred
}
```

### 2. Expired Subscriptions

The API returns expired subscriptions with `valid: true` but `active: false`. This is useful for:
- Showing subscription history
- Offering renewal options
- Tracking subscription lifecycle

### 3. Auto-Renewal Status

The `autoRenewing` field indicates whether the subscription will automatically renew:
- `true`: Subscription will auto-renew at expiry time
- `false`: Subscription will expire and not renew

### 4. Linked Subscription Token

The `linkedSubscriptionToken` is a unique identifier that:
- Remains the same across subscription renewals
- Can be used to track the same subscription over time
- Useful for subscription analytics and user identification

## Translations

### Persian (fa-IR.json)

```json
{
    "checking_status": "در حال بررسی وضعیت اشتراک...",
    "subscription_not_found": "اشتراک یافت نشد",
    "subscription_expired": "اشتراک منقضی شده است",
    "subscription_active": "اشتراک فعال است",
    "auto_renewing": "تمدید خودکار فعال است",
    "not_auto_renewing": "تمدید خودکار غیرفعال است"
}
```

### English (en-US.json)

```json
{
    "checking_status": "Checking subscription status...",
    "subscription_not_found": "Subscription not found",
    "subscription_expired": "Subscription has expired",
    "subscription_active": "Subscription is active",
    "auto_renewing": "Auto-renewal is enabled",
    "not_auto_renewing": "Auto-renewal is disabled"
}
```

## Use Cases

### 1. Check if User Has Active Subscription

```typescript
const result = await checkSubscriptionStatus(subscriptionId, purchaseToken);
if (result?.active) {
    // Grant premium features
} else {
    // Show upgrade prompt
}
```

### 2. Display Subscription Expiry Date

```typescript
const result = await checkSubscriptionStatus(subscriptionId, purchaseToken);
if (result?.active && result.expiryTime) {
    const expiryDate = new Date(result.expiryTime);
    print('Your subscription expires on: ${expiryDate}');
}
```

### 3. Check Auto-Renewal Status

```typescript
const result = await checkSubscriptionStatus(subscriptionId, purchaseToken);
if (result?.active && !result.autoRenewing) {
    // Warn user that subscription won't auto-renew
    showRenewalReminder();
}
```

### 4. Track Subscription Lifecycle

```typescript
const result = await checkSubscriptionStatus(subscriptionId, purchaseToken);
if (result?.linkedSubscriptionToken) {
    // Use linkedSubscriptionToken to track this subscription
    // across renewals and identify the same user
    await trackSubscription(result.linkedSubscriptionToken);
}
```

## Integration Flow

### Recommended Flow for Subscription Management

```
1. User purchases subscription via Poolakey
   ↓
2. App receives purchase token
   ↓
3. Call /verify-purchase to activate in backend
   ↓
4. Periodically call /check-subscription-status to verify active status
   ↓
5. If expired and autoRenewing=true, wait for renewal
   ↓
6. If expired and autoRenewing=false, prompt user to renew
```

### Periodic Status Checks

Implement periodic checks to keep subscription status up-to-date:

```dart
// Check subscription status on app launch
void initState() {
  super.initState();
  checkAndUpdateSubscriptionStatus();
}

// Check subscription status periodically (e.g., daily)
Timer.periodic(Duration(days: 1), (timer) {
  checkAndUpdateSubscriptionStatus();
});
```

## Error Handling

| Scenario | HTTP Status | Response | Action |
|----------|-------------|----------|--------|
| Missing parameters | 400 | `Missing required fields` | Validate input |
| Subscription not found | 404 | `Subscription not found` | Subscription never existed or was cancelled |
| Invalid access token | 500 | `Server authentication error` | Check server configuration |
| Network timeout | 400 | `Request timeout` | Retry request |
| Server error | 500 | `Internal server error` | Log and notify admin |

## Testing

### Test Active Subscription

```bash
curl -X POST http://localhost:3000/api/subscription/check-subscription-status \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "monthly_subscription",
    "purchaseToken": "valid_active_token"
  }'
```

Expected response: `active: true`

### Test Expired Subscription

Use a purchase token from an expired subscription. Expected response: `valid: true, active: false`

### Test Non-existent Subscription

Use an invalid purchase token. Expected response: `404 Subscription not found`

## Security Considerations

1. **Access Token Protection**
   - Store in environment variables
   - Never expose in client-side code
   - Rotate periodically

2. **Rate Limiting**
   - Implement rate limiting for status checks
   - Prevent abuse of API endpoint

3. **Caching**
   - Cache subscription status for short periods (e.g., 5 minutes)
   - Reduce API calls to Cafe Bazaar
   - Update cache on user actions

4. **Token Validation**
   - Validate purchase token format before API call
   - Log suspicious activity

## Performance Optimization

### Caching Strategy

```typescript
// Cache subscription status for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
const subscriptionCache = new Map<string, {
    result: SubscriptionStatusResult;
    timestamp: number;
}>();

async function getCachedSubscriptionStatus(
    subscriptionId: string,
    purchaseToken: string
): Promise<SubscriptionStatusResult> {
    const cacheKey = `${subscriptionId}:${purchaseToken}`;
    const cached = subscriptionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.result;
    }
    
    const result = await checkSubscriptionStatus(subscriptionId, purchaseToken);
    subscriptionCache.set(cacheKey, {
        result,
        timestamp: Date.now()
    });
    
    return result;
}
```

## Getting Access Token

**Complete Guide:** See `CAFEBAZAAR_TOKEN_GUIDE.md` for detailed instructions on obtaining and configuring your Cafe Bazaar API token.

**Quick Summary:**
1. Login to [Cafe Bazaar Dashboard](https://pardakht.cafebazaar.ir/)
2. Select your app → "API پیشخان بازار"
3. Click "دریافت توکن جدید" (Get New Token)
4. Add token to `.env` file as `CAFEBAZAAR_ACCESS_TOKEN`

## Troubleshooting

### Common Issues

1. **"Subscription not found" for valid subscription**
   - Verify subscription ID matches Cafe Bazaar console
   - Check that purchase token is from a subscription (not one-time purchase)
   - Ensure package name is correct

2. **Subscription shows as expired but should be active**
   - Check server time synchronization
   - Verify `validUntilTimestampMsec` value
   - Consider timezone differences

3. **Auto-renewal not working**
   - User may have disabled auto-renewal in Cafe Bazaar
   - Payment method may have failed
   - Check `autoRenewing` field in response

4. **"Server authentication error"**
   - Access token may be invalid or expired
   - See `CAFEBAZAAR_TOKEN_GUIDE.md` for token troubleshooting

## Files Modified/Created

### Modified:
- `server/src/services/cafeBazaarApiService.ts` - Added subscription status method
- `server/src/controllers/subscriptionController.ts` - Added controller method
- `server/src/routes/subscriptionRoutes.ts` - Added route
- `assets/translations/fa-IR.json` - Added Persian translations
- `assets/translations/en-US.json` - Added English translations

### Created:
- `CAFEBAZAAR_SUBSCRIPTION_STATUS.md` - This documentation file

## Next Steps

1. ✅ Implementation complete
2. 🔲 Test with real Cafe Bazaar subscriptions
3. 🔲 Implement caching strategy
4. 🔲 Add periodic status checks in Flutter app
5. 🔲 Monitor API usage and performance
6. 🔲 Set up alerts for expired subscriptions
7. 🔲 Implement subscription renewal reminders

## References

- [Cafe Bazaar Developer API Documentation](https://developers.cafebazaar.ir/)
- [Subscription Status API Guide](https://developers.cafebazaar.ir/fa/docs/developer-api/subscription-status/)
- Previous implementation: `CAFEBAZAAR_VERIFICATION_API.md`
