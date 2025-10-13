# Cafe Bazaar Purchase Validation Troubleshooting

## Current Issue

The app is receiving a **404 "Purchase not found"** error when validating purchases with Cafe Bazaar API.

### Error Details
```
Status: 404 Not Found
Message: "Purchase not found"
Error: "not_found"
ErrorDescription: "The requested purchase is not found!"
```

### Request Details
```
Endpoint: POST /api/subscription/validate-cafebazaar
Body: {
  "productId": "yearly",
  "purchaseToken": "4ZaSGWaFsQvwU-OQ"
}
```

## Root Causes

### 1. Test/Sandbox Purchase Token
The purchase token `4ZaSGWaFsQvwU-OQ` appears to be from a test/sandbox environment. Cafe Bazaar's production API doesn't recognize test purchases.

**Solution:**
- Use real purchase tokens from actual Cafe Bazaar purchases
- For testing, you need to make actual test purchases through Cafe Bazaar
- Cafe Bazaar provides a test environment where you can make purchases without real money

### 2. Missing or Invalid Environment Configuration
The server needs proper Cafe Bazaar credentials to validate purchases.

**Required Environment Variables:**
```bash
CAFEBAZAAR_ACCESS_TOKEN=your-actual-pishkhan-api-secret-token
CAFEBAZAAR_PACKAGE_NAME=ir.loqmeapp.application
```

**How to Get Access Token:**
1. Go to https://pardakht.cafebazaar.ir/
2. Select your app
3. Navigate to "API پیشخان بازار" (Pishkhan API)
4. Click "دریافت توکن جدید" (Get New Token)
5. Copy the token and add it to your `.env` file

### 3. Package Name Mismatch
The package name in the environment must match your app's package name exactly.

**Your App Package:** `ir.loqmeapp.application`

Verify in:
- `android/app/build.gradle` → `applicationId`
- Cafe Bazaar dashboard → Your app settings

### 4. Product ID Configuration
The product ID must be registered in Cafe Bazaar dashboard.

**Current Product IDs:**
- `yearly` - Yearly subscription
- `monthly` - Monthly subscription (if applicable)

**Steps to Verify:**
1. Go to Cafe Bazaar Developer Console
2. Select your app
3. Navigate to "محصولات درون‌برنامه‌ای" (In-App Products)
4. Verify that `yearly` product exists and is active

## Testing Workflow

### Development Testing (Sandbox)

For development testing without real money:

1. **Enable Test Purchases in Cafe Bazaar:**
   - Add test accounts in Cafe Bazaar dashboard
   - Test accounts can make purchases without payment

2. **Use Cafe Bazaar Test Environment:**
   - Install your app from Cafe Bazaar (not directly)
   - Make purchases using test accounts
   - These purchases will generate real purchase tokens that can be validated

### Production Testing

For production validation:

1. **Make a Real Purchase:**
   - Install app from Cafe Bazaar
   - Complete a real purchase flow
   - Use the generated purchase token

2. **Validate the Purchase:**
   ```dart
   final isValid = await paymentService.validateWithCafeBazaar(
     productId: 'yearly',
     purchaseToken: 'real-purchase-token-from-cafebazaar',
   );
   ```

## Server Configuration Checklist

- [ ] `CAFEBAZAAR_ACCESS_TOKEN` is set in `.env`
- [ ] `CAFEBAZAAR_PACKAGE_NAME` matches app package name
- [ ] Access token is valid (not expired)
- [ ] Server can reach Cafe Bazaar API (no firewall blocking)
- [ ] Product IDs are registered in Cafe Bazaar dashboard

## Debugging Steps

### 1. Check Server Logs
The server now logs detailed information about Cafe Bazaar API calls:

```
🔍 Validating purchase with Cafe Bazaar: { packageName, productId, purchaseTokenPreview }
🌐 Calling Cafe Bazaar API: { url, productId, packageName, hasAccessToken }
✅ Cafe Bazaar API response: { status, data }
```

Or in case of errors:
```
❌ Cafe Bazaar 404 Error: { status, error, errorDescription, fullResponse }
⚠️ Purchase not found in Cafe Bazaar: { productId, userId, error }
```

### 2. Verify Environment Variables
Run on server:
```bash
cd server
node -e "require('dotenv').config(); console.log('Token:', process.env.CAFEBAZAAR_ACCESS_TOKEN ? 'SET' : 'NOT SET'); console.log('Package:', process.env.CAFEBAZAAR_PACKAGE_NAME);"
```

### 3. Test API Directly
Use curl to test the Cafe Bazaar API directly:

```bash
curl -X GET \
  "https://pardakht.cafebazaar.ir/devapi/v2/api/validate/ir.loqmeapp.application/inapp/yearly/purchases/YOUR_PURCHASE_TOKEN/" \
  -H "CAFEBAZAAR-PISHKHAN-API-SECRET: YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Check Purchase Token Format
Valid Cafe Bazaar purchase tokens:
- Are alphanumeric strings with hyphens
- Typically 20+ characters long
- Example: `abcdefghij1234567890-ABCDEFG`

The token `4ZaSGWaFsQvwU-OQ` is only 16 characters, which suggests it might be a test/mock token.

## Flutter App Configuration

### 1. Verify In-App Billing Setup

Check `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.android.billingclient:billing:5.0.0'
}
```

### 2. Verify Product IDs in Code

Check subscription configuration matches Cafe Bazaar:
```dart
// lib/features/subscription/domain/models/subscription_plan.dart
static const String yearlyProductId = 'yearly';
static const String monthlyProductId = 'monthly';
```

### 3. Handle Purchase Flow Correctly

Ensure the app properly handles the purchase flow:
```dart
// 1. Start purchase
final purchaseDetails = await InAppPurchase.instance.buyNonConsumable(
  purchaseParam: PurchaseParam(productDetails: productDetails),
);

// 2. Get purchase token from purchaseDetails
final purchaseToken = purchaseDetails.verificationData.serverVerificationData;

// 3. Validate with backend
final isValid = await paymentService.validateWithCafeBazaar(
  productId: productId,
  purchaseToken: purchaseToken,
);
```

## Common Errors and Solutions

### Error: "Server configuration error"
**Cause:** Missing `CAFEBAZAAR_ACCESS_TOKEN` or `CAFEBAZAAR_PACKAGE_NAME`
**Solution:** Add environment variables to server `.env` file

### Error: "Invalid or expired access token"
**Cause:** Cafe Bazaar access token is invalid or expired
**Solution:** Generate a new token from Cafe Bazaar dashboard

### Error: "Purchase not found"
**Cause:** 
- Using test/mock purchase token
- Purchase token doesn't exist in Cafe Bazaar
- Package name mismatch
**Solution:** Use real purchase tokens from actual Cafe Bazaar purchases

### Error: "Network error occurred"
**Cause:** Server can't reach Cafe Bazaar API
**Solution:** Check server internet connection and firewall settings

## Next Steps

1. **Verify Environment Configuration:**
   ```bash
   cd server
   cat .env | grep CAFEBAZAAR
   ```

2. **Check Server Logs:**
   - Restart the server to see initialization logs
   - Make a test purchase validation request
   - Review the detailed logs

3. **Make a Test Purchase:**
   - Install app from Cafe Bazaar
   - Use a test account
   - Complete purchase flow
   - Use the generated token for validation

4. **Contact Cafe Bazaar Support:**
   If issues persist, contact Cafe Bazaar support with:
   - Your app package name
   - Purchase token example
   - Error messages from logs

## Additional Resources

- [Cafe Bazaar Developer Documentation](https://developers.cafebazaar.ir/)
- [Cafe Bazaar In-App Billing Guide](https://developers.cafebazaar.ir/fa/docs/developer-api/purchase-api/)
- [Cafe Bazaar API Reference](https://developers.cafebazaar.ir/fa/docs/developer-api/api-reference/)

## Summary

The current error is expected behavior when using test/mock purchase tokens. To resolve:

1. **For Development:** Set up proper test accounts in Cafe Bazaar and make test purchases
2. **For Production:** Use real purchase tokens from actual Cafe Bazaar purchases
3. **Verify Configuration:** Ensure all environment variables are correctly set
4. **Monitor Logs:** Use the enhanced logging to debug any issues

The server-side validation is working correctly - it's properly communicating with Cafe Bazaar API and returning the appropriate error when a purchase is not found.
