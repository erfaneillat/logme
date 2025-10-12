# Cafe Bazaar API Header Update

## Important Change

Based on the latest Cafe Bazaar API documentation, the authentication header has been updated.

## What Changed

### ❌ Old Implementation (Incorrect)
```typescript
headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
}
```

### ✅ New Implementation (Correct)
```typescript
headers: {
    'CAFEBAZAAR-PISHKHAN-API-SECRET': token,
    'Content-Type': 'application/json',
}
```

## Why This Change?

According to the official Cafe Bazaar documentation:
- The token obtained from "API پیشخان بازار" section must be sent with the header key: `CAFEBAZAAR-PISHKHAN-API-SECRET`
- This applies to all Developer API endpoints including:
  - Purchase validation: `/devapi/v2/api/validate/...`
  - Subscription status: `/devapi/v2/api/applications/.../subscriptions/...`

## Files Updated

### 1. Service Layer
**File:** `server/src/services/cafeBazaarApiService.ts`

Both methods updated:
- `validateInAppPurchase()` - Now uses `CAFEBAZAAR-PISHKHAN-API-SECRET` header
- `checkSubscriptionStatus()` - Now uses `CAFEBAZAAR-PISHKHAN-API-SECRET` header

### 2. Environment Configuration
**File:** `server/.env.example`

Added clarifying comments:
```bash
# Cafe Bazaar Configuration
# Get token from: https://pardakht.cafebazaar.ir/ → Your App → API پیشخان بازار → دریافت توکن جدید
# Token is sent as header: CAFEBAZAAR-PISHKHAN-API-SECRET
CAFEBAZAAR_ACCESS_TOKEN=your-cafebazaar-pishkhan-api-secret-token-here
CAFEBAZAAR_PACKAGE_NAME=com.yourapp.package
```

### 3. Documentation Files Updated

All documentation files have been updated with the correct header format:

- ✅ `CAFEBAZAAR_TOKEN_GUIDE.md` - Complete token guide
- ✅ `CAFEBAZAAR_VERIFICATION_API.md` - Purchase validation docs
- ✅ `CAFEBAZAAR_SUBSCRIPTION_STATUS.md` - Subscription status docs
- ✅ `CAFEBAZAAR_COMPLETE_IMPLEMENTATION.md` - Complete overview
- ✅ `CAFEBAZAAR_QUICK_START.md` - Quick start guide

## Additional Information Added

### Rate Limiting
- **Limit:** 50,000 requests per day per developer
- Documented in all relevant files
- Added troubleshooting for rate limit exceeded

### Token Source Clarification
- Token must be obtained from "API پیشخان بازار" section in dashboard
- If you have a payment processor (کارپرداز), obtain token through publisher account (حساب ناشر)

## Testing the Update

### Before Testing
1. Make sure you have the correct token from Cafe Bazaar dashboard
2. Update your `.env` file with the token
3. Restart your server

### Test Commands

```bash
# Test purchase validation
curl -X POST http://localhost:3000/api/subscription/validate-cafebazaar \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "monthly_subscription",
    "purchaseToken": "test_token"
  }'

# Test subscription status
curl -X POST http://localhost:3000/api/subscription/check-subscription-status \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "monthly_subscription",
    "purchaseToken": "test_token"
  }'
```

**Note:** The `Authorization: Bearer` in the curl commands above is for **user authentication** to your backend, not for Cafe Bazaar API. The backend internally uses `CAFEBAZAAR-PISHKHAN-API-SECRET` when calling Cafe Bazaar.

## Migration Steps

If you were using the old implementation:

### Step 1: Update Code
✅ Already done - `cafeBazaarApiService.ts` has been updated

### Step 2: Verify Token
- Login to https://pardakht.cafebazaar.ir/
- Go to your app → "API پیشخان بازار"
- Verify your token is still valid
- Generate new token if needed

### Step 3: Update Environment
```bash
# Your .env file should have:
CAFEBAZAAR_ACCESS_TOKEN=your-token-here
CAFEBAZAAR_PACKAGE_NAME=com.yourapp.package
```

### Step 4: Restart Server
```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

### Step 5: Test
- Test both endpoints with real purchase tokens
- Verify responses are correct
- Check server logs for any errors

## Common Issues After Update

### Issue: "Server authentication error"
**Cause:** Token format or header might be incorrect

**Solution:**
1. Verify token is from "API پیشخان بازار" section
2. Check `.env` file has correct token
3. Restart server
4. Check server logs for detailed error

### Issue: Still getting 401 Unauthorized
**Possible Causes:**
1. Token is expired - Generate new token
2. Token is for wrong app - Verify app selection in dashboard
3. Token not loaded from `.env` - Check environment variables

**Solution:**
```bash
# Check if token is loaded
cd server
node -e "require('dotenv').config(); console.log(process.env.CAFEBAZAAR_ACCESS_TOKEN)"
```

### Issue: Rate limit exceeded
**Cause:** Made more than 50,000 requests in one day

**Solution:**
1. Implement caching (5-10 minutes for subscription status)
2. Reduce unnecessary API calls
3. Wait until next day for limit reset

## API Endpoints Reference

### Purchase Validation
```
GET https://pardakht.cafebazaar.ir/devapi/v2/api/validate/{package_name}/inapp/{product_id}/purchases/{purchase_token}/

Header: CAFEBAZAAR-PISHKHAN-API-SECRET: <token>
```

### Subscription Status
```
GET https://pardakht.cafebazaar.ir/devapi/v2/api/applications/{package_name}/subscriptions/{subscription_id}/purchases/{purchase_token}

Header: CAFEBAZAAR-PISHKHAN-API-SECRET: <token>
```

## Important Notes

1. **Token Specificity**
   - Each token is specific to one application
   - Don't share tokens between apps

2. **Token Security**
   - Never commit tokens to version control
   - Store in environment variables
   - Rotate regularly (every 3-6 months)

3. **Rate Limiting**
   - 50,000 requests per day per developer
   - Implement caching to stay within limits
   - Monitor usage in production

4. **Payment Processor**
   - If you have کارپرداز defined, get token through حساب ناشر
   - This prevents payment-related issues

## Verification Checklist

- [ ] Code updated to use `CAFEBAZAAR-PISHKHAN-API-SECRET` header
- [ ] `.env` file has correct token
- [ ] Server restarted after changes
- [ ] Tested purchase validation endpoint
- [ ] Tested subscription status endpoint
- [ ] Verified responses are correct
- [ ] Checked server logs for errors
- [ ] Documentation reviewed
- [ ] Team notified of changes

## Summary

✅ **Updated:** Authentication header from `Authorization: Bearer` to `CAFEBAZAAR-PISHKHAN-API-SECRET`

✅ **Reason:** Compliance with latest Cafe Bazaar API documentation

✅ **Impact:** All API calls to Cafe Bazaar now use correct header format

✅ **Action Required:** Verify your token and restart server

✅ **Documentation:** All docs updated with correct information

## References

- [Cafe Bazaar Dashboard](https://pardakht.cafebazaar.ir/)
- [Developer API Documentation](https://developers.cafebazaar.ir/)
- `CAFEBAZAAR_TOKEN_GUIDE.md` - Complete token guide
- `CAFEBAZAAR_QUICK_START.md` - Quick start guide
