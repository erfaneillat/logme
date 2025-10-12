# Cafe Bazaar Complete Implementation Summary

## Overview

Complete implementation of Cafe Bazaar Developer API integration for Cal AI, including both in-app purchase validation and subscription status checking.

## Implemented Features

### 1. In-App Purchase Validation (متد بررسی وضعیت خرید درون برنامه‌ای)

**Endpoint:** `POST /api/subscription/validate-cafebazaar`

**Purpose:** Validate one-time in-app purchases with Cafe Bazaar API

**Request:**
```json
{
    "productId": "monthly_subscription",
    "purchaseToken": "abc123xyz..."
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "valid": true,
        "purchaseState": "purchased",
        "consumptionState": "not_consumed",
        "purchaseTime": 1414181378566,
        "developerPayload": "custom_data"
    }
}
```

**Documentation:** See `CAFEBAZAAR_VERIFICATION_API.md`

### 2. Subscription Status Check (متد بررسی وضعیت اشتراک)

**Endpoint:** `POST /api/subscription/check-subscription-status`

**Purpose:** Check subscription status and get renewal information

**Request:**
```json
{
    "subscriptionId": "monthly_subscription",
    "purchaseToken": "abc123xyz..."
}
```

**Response:**
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

**Documentation:** See `CAFEBAZAAR_SUBSCRIPTION_STATUS.md`

## Architecture

### Service Layer

**File:** `server/src/services/cafeBazaarApiService.ts`

```typescript
class CafeBazaarApiService {
    // In-app purchase validation
    async validateInAppPurchase(
        packageName: string,
        productId: string,
        purchaseToken: string
    ): Promise<PurchaseValidationResult>

    // Subscription status check
    async checkSubscriptionStatus(
        packageName: string,
        subscriptionId: string,
        purchaseToken: string
    ): Promise<SubscriptionStatusResult>

    // Factory method
    static fromEnvironment(): CafeBazaarApiService
}
```

### Controller Layer

**File:** `server/src/controllers/subscriptionController.ts`

```typescript
class SubscriptionController {
    // Validate in-app purchase
    async validateCafeBazaarPurchase(req: AuthRequest, res: Response)

    // Check subscription status
    async checkCafeBazaarSubscriptionStatus(req: AuthRequest, res: Response)
}
```

### Routes

**File:** `server/src/routes/subscriptionRoutes.ts`

- `POST /api/subscription/validate-cafebazaar` - Validate purchase
- `POST /api/subscription/check-subscription-status` - Check subscription

## Configuration

### Getting Access Token from Cafe Bazaar Dashboard

Before using the API, you need to obtain an access token for your app from Cafe Bazaar's dashboard (پیشخان بازار):

#### Steps to Get Token:

1. **Login to Cafe Bazaar Dashboard**
   - Go to [Cafe Bazaar Dashboard](https://pardakht.cafebazaar.ir/)
   - Login with your developer account

2. **Select Your App**
   - Click on your application from the list

3. **Navigate to API Section**
   - From the right-side menu, click on "API پیشخان بازار" (Cafe Bazaar Dashboard API)

4. **Generate Token**
   - Click on "دریافت توکن جدید" (Get New Token) button
   - Your token will be generated
   - You can also delete previous tokens from this page

**Important Notes:**
- Each token is specific to one application
- If you have defined a payment processor (کارپرداز) for your dashboard, you must obtain the token through the publisher account (حساب ناشر) to avoid issues
- The token must be sent in request headers with the key: `CAFEBAZAAR-PISHKHAN-API-SECRET`
- **Rate Limit:** Each developer can make up to 50,000 API requests per day

### Environment Variables

Add to `.env`:

```bash
# Cafe Bazaar Configuration
CAFEBAZAAR_ACCESS_TOKEN=your-cafebazaar-access-token-here
CAFEBAZAAR_PACKAGE_NAME=com.yourapp.package
```

**Note:** The `CAFEBAZAAR_ACCESS_TOKEN` is the token you obtained from the dashboard in the steps above.

### Dependencies

Added to `package.json`:

```json
{
    "dependencies": {
        "axios": "^1.6.2"
    }
}
```

## API Comparison

| Feature | Purchase Validation | Subscription Status |
|---------|-------------------|---------------------|
| **Endpoint** | `/validate-cafebazaar` | `/check-subscription-status` |
| **Cafe Bazaar API** | `/validate/.../inapp/...` | `/applications/.../subscriptions/...` |
| **Use Case** | One-time purchases | Recurring subscriptions |
| **Returns Purchase State** | ✅ Yes (purchased/refunded) | ❌ No |
| **Returns Consumption State** | ✅ Yes (consumed/not_consumed) | ❌ No |
| **Returns Active Status** | ❌ No | ✅ Yes |
| **Returns Expiry Time** | ❌ No | ✅ Yes |
| **Returns Auto-Renewal** | ❌ No | ✅ Yes |
| **Returns Linked Token** | ❌ No | ✅ Yes |
| **Developer Payload** | ✅ Yes | ❌ No |
| **Purchase Time** | ✅ Yes | ❌ No |
| **Initiation Time** | ❌ No | ✅ Yes |

## When to Use Each Endpoint

### Use `/validate-cafebazaar` when:
- Validating one-time in-app purchases
- Checking if a purchase was refunded
- Verifying purchase consumption state
- Need developer payload data
- Fraud detection for purchases

### Use `/check-subscription-status` when:
- Checking if subscription is active
- Getting subscription expiry date
- Checking auto-renewal status
- Tracking subscription across renewals (linkedSubscriptionToken)
- Displaying subscription details to user

## Complete Integration Flow

### Initial Purchase Flow

```
1. User initiates purchase via Poolakey (Flutter)
   ↓
2. Poolakey returns purchase data
   ↓
3. App calls /validate-cafebazaar (optional - for fraud detection)
   ↓
4. App calls /verify-purchase (creates subscription in DB)
   ↓
5. Subscription activated
```

### Ongoing Subscription Management

```
1. App launches
   ↓
2. Call /check-subscription-status
   ↓
3. If active=true: Grant premium features
   ↓
4. If active=false && autoRenewing=true: Show "renewing soon"
   ↓
5. If active=false && autoRenewing=false: Show upgrade prompt
```

## Error Handling

Both endpoints handle the same error types:

| Error | Status | Description |
|-------|--------|-------------|
| `not_found` | 404 | Purchase/subscription not found |
| `invalid_value` | 404 | Invalid package name or product ID |
| `unauthorized` | 401 | Invalid access token |
| `timeout` | 400 | Request timeout |
| `network_error` | 400 | Network failure |
| `server_error` | 500 | Cafe Bazaar server error |

## Translations

### Persian (fa-IR.json)

```json
{
    "subscription.payment": {
        // Purchase validation
        "validating": "در حال اعتبارسنجی خرید...",
        "purchase_not_found": "خرید یافت نشد",
        "purchase_invalid": "خرید نامعتبر است",
        "purchase_refunded": "خرید بازگشت داده شده است",
        
        // Subscription status
        "checking_status": "در حال بررسی وضعیت اشتراک...",
        "subscription_not_found": "اشتراک یافت نشد",
        "subscription_expired": "اشتراک منقضی شده است",
        "subscription_active": "اشتراک فعال است",
        "auto_renewing": "تمدید خودکار فعال است",
        "not_auto_renewing": "تمدید خودکار غیرفعال است",
        
        // Common
        "server_error": "خطای سرور. لطفاً بعداً تلاش کنید"
    }
}
```

### English (en-US.json)

```json
{
    "subscription.payment": {
        // Purchase validation
        "validating": "Validating purchase...",
        "purchase_not_found": "Purchase not found",
        "purchase_invalid": "Purchase is invalid",
        "purchase_refunded": "Purchase has been refunded",
        
        // Subscription status
        "checking_status": "Checking subscription status...",
        "subscription_not_found": "Subscription not found",
        "subscription_expired": "Subscription has expired",
        "subscription_active": "Subscription is active",
        "auto_renewing": "Auto-renewal is enabled",
        "not_auto_renewing": "Auto-renewal is disabled",
        
        // Common
        "server_error": "Server error. Please try again later"
    }
}
```

## Security Best Practices

1. **Access Token Management**
   - Store in environment variables only
   - Never commit to version control
   - Rotate periodically
   - Monitor for unauthorized access

2. **Rate Limiting**
   - Implement rate limiting on both endpoints
   - Prevent API abuse
   - Log suspicious activity

3. **Input Validation**
   - Validate all parameters before API calls
   - Check token formats
   - Prevent injection attacks

4. **Error Handling**
   - Don't expose sensitive information in errors
   - Log errors securely
   - Monitor for fraud attempts (not_found errors)

5. **Caching**
   - Cache subscription status (5-10 minutes)
   - Reduce API calls
   - Update cache on user actions

## Testing

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your Cafe Bazaar credentials
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Test Purchase Validation

```bash
curl -X POST http://localhost:3000/api/subscription/validate-cafebazaar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "monthly_subscription",
    "purchaseToken": "test_token"
  }'
```

### 5. Test Subscription Status

```bash
curl -X POST http://localhost:3000/api/subscription/check-subscription-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "monthly_subscription",
    "purchaseToken": "test_token"
  }'
```

## Flutter Integration Example

### Payment Service Update

```dart
class PaymentService {
  // Validate purchase with Cafe Bazaar
  Future<bool> validatePurchase(
    String productId,
    String purchaseToken,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/subscription/validate-cafebazaar'),
      headers: {
        'Authorization': 'Bearer $userToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'productId': productId,
        'purchaseToken': purchaseToken,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['success'] && 
             data['data']['valid'] && 
             data['data']['purchaseState'] == 'purchased';
    }
    return false;
  }

  // Check subscription status
  Future<SubscriptionStatus?> checkSubscriptionStatus(
    String subscriptionId,
    String purchaseToken,
  ) async {
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
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
// Cache subscription status for 5 minutes
const subscriptionCache = new Map<string, {
    result: SubscriptionStatusResult;
    timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
    subscriptionCache.set(cacheKey, { result, timestamp: Date.now() });
    
    return result;
}
```

## Files Modified/Created

### Created:
1. `server/src/services/cafeBazaarApiService.ts` - API service
2. `CAFEBAZAAR_VERIFICATION_API.md` - Purchase validation docs
3. `CAFEBAZAAR_SUBSCRIPTION_STATUS.md` - Subscription status docs
4. `CAFEBAZAAR_VERIFICATION_IMPLEMENTATION.md` - Purchase implementation summary
5. `CAFEBAZAAR_COMPLETE_IMPLEMENTATION.md` - This file

### Modified:
1. `server/src/controllers/subscriptionController.ts` - Added both methods
2. `server/src/routes/subscriptionRoutes.ts` - Added both routes
3. `server/.env.example` - Added Cafe Bazaar config
4. `server/package.json` - Added axios dependency
5. `assets/translations/fa-IR.json` - Added Persian translations
6. `assets/translations/en-US.json` - Added English translations

## Deployment Checklist

- [ ] Install dependencies: `npm install`
- [ ] Configure environment variables in `.env`
- [ ] Get Cafe Bazaar access token from developer console
- [ ] Test both endpoints locally
- [ ] Build production: `npm run build`
- [ ] Deploy to production server
- [ ] Update Flutter app with new endpoints
- [ ] Test with real Cafe Bazaar purchases
- [ ] Monitor API usage and errors
- [ ] Set up alerts for failed validations
- [ ] Implement caching if needed
- [ ] Add rate limiting if needed

## Monitoring and Maintenance

### Metrics to Track

1. **API Success Rate**
   - Track successful vs failed validations
   - Monitor error types

2. **Response Times**
   - Monitor Cafe Bazaar API latency
   - Track endpoint performance

3. **Subscription Status**
   - Active subscriptions count
   - Expired subscriptions
   - Auto-renewal rate

4. **Fraud Detection**
   - `not_found` error frequency
   - Suspicious patterns

### Logs to Monitor

```typescript
// Successful validation
console.log('✅ Purchase validated:', { userId, productId, valid: true });

// Failed validation
console.error('❌ Purchase validation failed:', { 
    userId, 
    productId, 
    error: 'not_found' 
});

// Subscription status check
console.log('📊 Subscription status:', { 
    userId, 
    subscriptionId, 
    active: true,
    expiryTime 
});
```

## Troubleshooting

### Common Issues

1. **"Server configuration error"**
   - Check `CAFEBAZAAR_ACCESS_TOKEN` in `.env`
   - Verify `CAFEBAZAAR_PACKAGE_NAME` is correct

2. **"Purchase/Subscription not found"**
   - Verify token is correct
   - Check product/subscription ID matches Cafe Bazaar console
   - Ensure package name is correct

3. **"Server authentication error"**
   - Access token may be expired
   - Generate new token from Cafe Bazaar console

4. **Network timeouts**
   - Check internet connectivity
   - Verify Cafe Bazaar API is accessible
   - Check firewall settings

## Support Resources

- **Cafe Bazaar Developer Console:** https://pardakht.cafebazaar.ir/
- **API Documentation:** https://developers.cafebazaar.ir/
- **Implementation Docs:**
  - `CAFEBAZAAR_VERIFICATION_API.md`
  - `CAFEBAZAAR_SUBSCRIPTION_STATUS.md`
  - `CAFEBAZAAR_VERIFICATION_IMPLEMENTATION.md`

## Next Steps

1. ✅ Backend implementation complete
2. 🔲 Test with real Cafe Bazaar credentials
3. 🔲 Update Flutter app to use new endpoints
4. 🔲 Implement caching strategy
5. 🔲 Add monitoring and alerts
6. 🔲 Deploy to production
7. 🔲 Test end-to-end flow
8. 🔲 Monitor and optimize performance
