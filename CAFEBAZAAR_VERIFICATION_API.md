# Cafe Bazaar In-App Purchase Verification API

This document describes the implementation of Cafe Bazaar's in-app purchase verification API for the Cal AI backend.

## Overview

The verification API allows the backend to validate purchases made through Cafe Bazaar by calling their Developer API endpoint. This ensures that purchases are legitimate and prevents fraud.

## API Endpoint

**Cafe Bazaar Validation Endpoint:**
```
GET https://pardakht.cafebazaar.ir/devapi/v2/api/validate/<package_name>/inapp/<product_id>/purchases/<purchase_token>/
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| `package_name` | The package name of the app where the product was purchased |
| `product_id` | The SKU of the purchased product |
| `purchase_token` | The purchase token sent to the app after purchase |

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
   "consumptionState": 1,
   "purchaseState": 0,
   "kind": "androidpublisher#inappPurchase",
   "developerPayload": "something",
   "purchaseTime": 1414181378566
}
```

#### Response Fields

| Field | Description |
|-------|-------------|
| `consumptionState` | `0` = consumed, `1` = not consumed |
| `purchaseState` | `0` = purchased, `1` = refunded |
| `kind` | Always `"androidpublisher#inappPurchase"` |
| `developerPayload` | The payload sent by the app during purchase |
| `purchaseTime` | Purchase time in milliseconds since 1970/1/1 |

### Error Response (40X)

```json
{
   "error": "not_found",
   "error_description": "The requested purchase is not found!"
}
```

#### Error Types

| Status Code | Error | Description |
|-------------|-------|-------------|
| 404 | `invalid_value` | Package name is invalid |
| 404 | `invalid_value` | Product is not found |
| 404 | `not_found` | Purchase not found (possible fraud attempt) |
| 401 | `unauthorized` | Invalid or expired access token |

## Implementation

### 1. Service Layer

**File:** `server/src/services/cafeBazaarApiService.ts`

The `CafeBazaarApiService` class handles all communication with the Cafe Bazaar API:

```typescript
const service = CafeBazaarApiService.fromEnvironment();
const result = await service.validateInAppPurchase(
    packageName,
    productId,
    purchaseToken
);
```

**Key Features:**
- Validates input parameters
- Makes authenticated requests to Cafe Bazaar API
- Handles all error cases
- Returns structured validation results

### 2. Controller Layer

**File:** `server/src/controllers/subscriptionController.ts`

The `validateCafeBazaarPurchase` method provides the endpoint handler:

```typescript
async validateCafeBazaarPurchase(req: AuthRequest, res: Response)
```

**Features:**
- Requires user authentication
- Validates request parameters
- Calls Cafe Bazaar API
- Returns detailed purchase information
- Handles all error scenarios

### 3. Route Configuration

**File:** `server/src/routes/subscriptionRoutes.ts`

**Endpoint:** `POST /api/subscription/validate-cafebazaar`

**Request Body:**
```json
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
        "developerPayload": "timestamp_or_custom_data"
    }
}
```

**Response (Purchase Not Found):**
```json
{
    "success": false,
    "message": "Purchase not found",
    "error": "not_found",
    "errorDescription": "The requested purchase is not found!"
}
```

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Cafe Bazaar Configuration
CAFEBAZAAR_ACCESS_TOKEN=your-cafebazaar-access-token-here
CAFEBAZAAR_PACKAGE_NAME=com.yourapp.package
```

### Getting Access Token

**Detailed Guide:** See `CAFEBAZAAR_TOKEN_GUIDE.md` for complete instructions.

**Quick Steps:**
1. Log in to [Cafe Bazaar Dashboard](https://pardakht.cafebazaar.ir/) (پیشخان بازار)
2. Select your application
3. Click on "API پیشخان بازار" from the right menu
4. Click "دریافت توکن جدید" (Get New Token)
5. Copy the generated token

**Important:** 
- Each token is specific to one application
- If you have a payment processor (کارپرداز), obtain token through publisher account (حساب ناشر)
- Token is sent as `CAFEBAZAAR-PISHKHAN-API-SECRET: <token>` in API requests
- **Rate Limit:** 50,000 requests per day per developer

## Usage Example

### From Flutter App

```dart
// After successful purchase from Poolakey
final response = await http.post(
  Uri.parse('$baseUrl/api/subscription/validate-cafebazaar'),
  headers: {
    'Authorization': 'Bearer $userToken',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'productId': 'monthly_subscription',
    'purchaseToken': purchaseData.purchaseToken,
  }),
);

if (response.statusCode == 200) {
  final data = jsonDecode(response.body);
  if (data['data']['valid'] && data['data']['purchaseState'] == 'purchased') {
    // Purchase is valid
    print('Purchase verified successfully');
  }
}
```

### From Backend Testing

```bash
curl -X POST http://localhost:3000/api/subscription/validate-cafebazaar \
  -H "Authorization: Bearer <user_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "monthly_subscription",
    "purchaseToken": "abc123xyz..."
  }'
```

## Security Considerations

1. **Access Token Security**
   - Store access token in environment variables
   - Never commit access token to version control
   - Rotate access token periodically

2. **Purchase Token Validation**
   - Each purchase token should be used only once
   - Check for duplicate tokens in your database
   - Log all validation attempts for audit

3. **Error Handling**
   - `not_found` error indicates possible fraud attempt
   - Log suspicious activities
   - Implement rate limiting on validation endpoint

4. **Network Security**
   - All API calls use HTTPS
   - Implement request timeouts (10 seconds)
   - Handle network failures gracefully

## Integration with Existing Flow

The new validation endpoint complements the existing `/verify-purchase` endpoint:

1. **Client-side flow:**
   - User initiates purchase via Poolakey
   - Poolakey returns purchase data
   - App can optionally call `/validate-cafebazaar` to verify with Cafe Bazaar
   - App calls `/verify-purchase` to activate subscription in backend

2. **Server-side flow:**
   - `/validate-cafebazaar`: Validates with Cafe Bazaar API (doesn't create subscription)
   - `/verify-purchase`: Creates/activates subscription in database

## Error Handling

The service handles various error scenarios:

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| Missing parameters | 400 | `Missing required fields` |
| Purchase not found | 404 | `Purchase not found` |
| Invalid access token | 500 | `Server authentication error` |
| Network timeout | 400 | `Request timeout` |
| Server error | 500 | `Internal server error` |

## Testing

### Install Dependencies

```bash
cd server
npm install
```

### Run Tests

```bash
# Start development server
npm run dev

# Test validation endpoint
curl -X POST http://localhost:3000/api/subscription/validate-cafebazaar \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test_product",
    "purchaseToken": "test_token"
  }'
```

## Troubleshooting

### Common Issues

1. **"Server configuration error"**
   - Check that `CAFEBAZAAR_ACCESS_TOKEN` is set in `.env`
   - Verify access token is valid

2. **"Purchase not found"**
   - Verify the purchase token is correct
   - Check that the product ID matches Cafe Bazaar console
   - Ensure package name is correct

3. **"Server authentication error"**
   - Access token may be expired
   - Generate new access token from Cafe Bazaar console

4. **Network timeout**
   - Check internet connectivity
   - Verify Cafe Bazaar API is accessible
   - Check firewall settings

## Next Steps

1. **Install axios dependency:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Cafe Bazaar access token
   - Set your package name

3. **Build and deploy:**
   ```bash
   npm run build
   npm start
   ```

4. **Update Flutter app:**
   - Integrate the new validation endpoint
   - Handle validation responses
   - Update error handling

## References

- [Cafe Bazaar Developer API Documentation](https://developers.cafebazaar.ir/)
- [In-App Purchase Validation Guide](https://developers.cafebazaar.ir/fa/docs/developer-api/iap-validation/)
