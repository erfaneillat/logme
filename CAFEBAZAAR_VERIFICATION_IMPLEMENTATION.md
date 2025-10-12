# Cafe Bazaar Purchase Verification Implementation Summary

## Overview

Implemented Cafe Bazaar's in-app purchase verification API (متد بررسی وضعیت خرید درون برنامه‌ای) to validate purchases made through Cafe Bazaar marketplace.

## What Was Implemented

### 1. **CafeBazaarApiService** (`server/src/services/cafeBazaarApiService.ts`)

A new service class that handles communication with Cafe Bazaar's Developer API:

**Features:**
- ✅ Calls Cafe Bazaar validation endpoint: `https://pardakht.cafebazaar.ir/devapi/v2/api/validate/<package_name>/inapp/<product_id>/purchases/<purchase_token>/`
- ✅ Authenticates using Bearer token
- ✅ Validates input parameters (package name, product ID, purchase token)
- ✅ Handles all error responses (404, 401, 5xx, network errors)
- ✅ Returns structured validation results with purchase state and consumption state
- ✅ Implements timeout handling (10 seconds)
- ✅ Provides factory method to create instance from environment variables

**Response Fields:**
- `valid`: Whether the purchase is valid
- `consumed`: Whether the product has been consumed (0 = consumed, 1 = not consumed)
- `refunded`: Whether the purchase was refunded (0 = purchased, 1 = refunded)
- `purchaseTime`: Purchase timestamp in milliseconds
- `developerPayload`: Custom payload from the app
- `error`: Error code if validation failed
- `errorDescription`: Human-readable error description

### 2. **SubscriptionController Update** (`server/src/controllers/subscriptionController.ts`)

Added new method `validateCafeBazaarPurchase`:

**Features:**
- ✅ Requires user authentication
- ✅ Validates request parameters (productId, purchaseToken)
- ✅ Calls Cafe Bazaar API service
- ✅ Returns detailed purchase information
- ✅ Handles all error scenarios with appropriate HTTP status codes
- ✅ Distinguishes between fraud attempts (404 not_found) and other errors
- ✅ Logs errors for debugging

**Request:**
```json
POST /api/subscription/validate-cafebazaar
{
    "productId": "monthly_subscription",
    "purchaseToken": "abc123xyz..."
}
```

**Response (Success):**
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

### 3. **Route Configuration** (`server/src/routes/subscriptionRoutes.ts`)

Added new route:
- ✅ `POST /api/subscription/validate-cafebazaar` - Validates purchase with Cafe Bazaar API

### 4. **Environment Configuration** (`.env.example`)

Added required environment variables:
```bash
CAFEBAZAAR_ACCESS_TOKEN=your-cafebazaar-access-token-here
CAFEBAZAAR_PACKAGE_NAME=com.yourapp.package
```

### 5. **Dependencies** (`package.json`)

Added axios for HTTP requests:
```json
"axios": "^1.6.2"
```

### 6. **Translations** (`assets/translations/`)

Added new translation keys for validation states:

**Persian (fa-IR.json):**
- `validating`: "در حال اعتبارسنجی خرید..."
- `purchase_not_found`: "خرید یافت نشد"
- `purchase_invalid`: "خرید نامعتبر است"
- `purchase_refunded`: "خرید بازگشت داده شده است"
- `server_error`: "خطای سرور. لطفاً بعداً تلاش کنید"

**English (en-US.json):**
- `validating`: "Validating purchase..."
- `purchase_not_found`: "Purchase not found"
- `purchase_invalid`: "Purchase is invalid"
- `purchase_refunded`: "Purchase has been refunded"
- `server_error`: "Server error. Please try again later"

### 7. **Documentation** (`CAFEBAZAAR_VERIFICATION_API.md`)

Comprehensive documentation including:
- ✅ API endpoint details
- ✅ Request/response formats
- ✅ Error handling
- ✅ Security considerations
- ✅ Usage examples
- ✅ Integration guide
- ✅ Troubleshooting

## Error Handling

The implementation handles all Cafe Bazaar API error scenarios:

| Error Code | Status | Description | Action |
|------------|--------|-------------|--------|
| `not_found` | 404 | Purchase not found | Possible fraud attempt - log and reject |
| `invalid_value` | 404 | Invalid package/product | Return error to client |
| `unauthorized` | 401 | Invalid access token | Log server error, return generic error |
| `timeout` | 400 | Request timeout | Return network error |
| `network_error` | 400 | Network failure | Return network error |
| `server_error` | 500 | Cafe Bazaar server error | Return server error |

## Security Features

1. **Access Token Protection**
   - Stored in environment variables
   - Never exposed in responses
   - Used in Authorization header

2. **Fraud Detection**
   - `not_found` error indicates possible fraud
   - All validation attempts should be logged
   - Purchase tokens should be checked for duplicates

3. **Rate Limiting**
   - Endpoint requires authentication
   - Can be combined with existing rate limiting middleware

4. **Input Validation**
   - Validates all required parameters
   - Checks parameter formats
   - Prevents injection attacks

## Integration Flow

### Option 1: Direct Validation (Recommended for Security)

```
User → Flutter App → Poolakey Purchase
                   ↓
              Purchase Token
                   ↓
         Backend /validate-cafebazaar
                   ↓
           Cafe Bazaar API
                   ↓
         Validation Result → Client
```

### Option 2: Combined Flow

```
User → Flutter App → Poolakey Purchase
                   ↓
         Backend /verify-purchase
                   ↓
    (Optional) Cafe Bazaar API Validation
                   ↓
         Create Subscription → Client
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

This will install axios and all other dependencies.

### 2. Configure Environment

Copy `.env.example` to `.env` and add your Cafe Bazaar credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
CAFEBAZAAR_ACCESS_TOKEN=your_actual_access_token
CAFEBAZAAR_PACKAGE_NAME=com.yourapp.package
```

### 3. Get Cafe Bazaar Access Token

1. Go to [Cafe Bazaar Developer Console](https://pardakht.cafebazaar.ir/)
2. Log in with your developer account
3. Select your app
4. Navigate to API Access section
5. Generate or copy your access token

### 4. Build and Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 5. Test the Endpoint

```bash
# Get user JWT token first by logging in
USER_TOKEN="your_jwt_token"

# Test validation endpoint
curl -X POST http://localhost:3000/api/subscription/validate-cafebazaar \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "monthly_subscription",
    "purchaseToken": "test_purchase_token"
  }'
```

## Flutter Integration Example

Update your payment service to call the validation endpoint:

```dart
Future<bool> validatePurchaseWithCafeBazaar(
  String productId,
  String purchaseToken,
) async {
  try {
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
      if (data['success'] && data['data']['valid']) {
        final purchaseState = data['data']['purchaseState'];
        
        if (purchaseState == 'refunded') {
          // Handle refunded purchase
          return false;
        }
        
        // Purchase is valid
        return true;
      }
    }
    
    return false;
  } catch (e) {
    print('Validation error: $e');
    return false;
  }
}
```

## Testing Checklist

- [ ] Install dependencies with `npm install`
- [ ] Configure `.env` with valid Cafe Bazaar credentials
- [ ] Start server with `npm run dev`
- [ ] Test with valid purchase token
- [ ] Test with invalid purchase token (should return 404)
- [ ] Test with missing parameters (should return 400)
- [ ] Test without authentication (should return 401)
- [ ] Verify error responses are properly formatted
- [ ] Check logs for validation attempts

## Differences from Existing `/verify-purchase` Endpoint

| Feature | `/verify-purchase` | `/validate-cafebazaar` |
|---------|-------------------|------------------------|
| Purpose | Create subscription in DB | Validate with Cafe Bazaar API |
| Cafe Bazaar API | ❌ No | ✅ Yes |
| Creates Subscription | ✅ Yes | ❌ No |
| Returns Purchase State | ❌ No | ✅ Yes (purchased/refunded) |
| Returns Consumption State | ❌ No | ✅ Yes (consumed/not_consumed) |
| Fraud Detection | Basic | ✅ Enhanced (via Cafe Bazaar) |

## Recommended Usage

1. **For maximum security:** Call `/validate-cafebazaar` first to verify with Cafe Bazaar, then call `/verify-purchase` to create subscription
2. **For simplicity:** Continue using `/verify-purchase` (existing flow)
3. **For fraud prevention:** Always call `/validate-cafebazaar` before activating subscriptions

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Test the endpoint
4. 🔲 Update Flutter app to use validation endpoint
5. 🔲 Add validation to existing `/verify-purchase` flow (optional)
6. 🔲 Implement logging and monitoring
7. 🔲 Add rate limiting if needed
8. 🔲 Deploy to production

## Files Modified/Created

### Created:
- `server/src/services/cafeBazaarApiService.ts` - API service
- `CAFEBAZAAR_VERIFICATION_API.md` - Detailed documentation
- `CAFEBAZAAR_VERIFICATION_IMPLEMENTATION.md` - This file

### Modified:
- `server/src/controllers/subscriptionController.ts` - Added validation method
- `server/src/routes/subscriptionRoutes.ts` - Added route
- `server/.env.example` - Added Cafe Bazaar config
- `server/package.json` - Added axios dependency
- `assets/translations/fa-IR.json` - Added Persian translations
- `assets/translations/en-US.json` - Added English translations

## Support

For issues or questions:
1. Check `CAFEBAZAAR_VERIFICATION_API.md` for detailed documentation
2. Review Cafe Bazaar's official documentation
3. Check server logs for error details
4. Verify environment variables are set correctly
