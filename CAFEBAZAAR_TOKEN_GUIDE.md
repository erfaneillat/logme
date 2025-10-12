# Cafe Bazaar Token and Authentication Guide

## Overview

This guide explains how to obtain and use the Cafe Bazaar API token for the Cal AI backend implementation.

## Two Different APIs

Cafe Bazaar provides two different APIs with different authentication methods:

### Cafe Bazaar Developer API (Used in Our Implementation)
- **Purpose:** Validate purchases and check subscription status
- **Endpoints:**
  - `/devapi/v2/api/validate/...` (Purchase validation)
  - `/devapi/v2/api/applications/...` (Subscription status)
- **Authentication:** `CAFEBAZAAR-PISHKHAN-API-SECRET: <token>`
- **Token Type:** Pishkhan API Secret Token from Dashboard

**Important:** As of the latest Cafe Bazaar API documentation, all Developer API endpoints use the `CAFEBAZAAR-PISHKHAN-API-SECRET` header key (not `Authorization: Bearer`).

## Getting the Access Token

### Step-by-Step Guide (دریافت توکن در پیشخان بازار)

1. **Login to Cafe Bazaar Dashboard (پیشخان بازار)**
   - URL: https://pardakht.cafebazaar.ir/
   - Login with your developer account credentials

2. **Select Your Application**
   - From the dashboard, click on your application
   - You'll see your app's details and menu

3. **Navigate to API Section**
   - From the right-side menu (منوی سمت راست), click on:
   - **"API پیشخان بازار"** (Cafe Bazaar Dashboard API)

4. **Generate New Token**
   - Click on **"دریافت توکن جدید"** (Get New Token) button
   - Your new token will be generated and displayed
   - Copy this token immediately (you won't be able to see it again)

5. **Manage Tokens**
   - From this page, you can also:
     - View your current token (partially masked)
     - Delete previous tokens
     - Generate new tokens

### Visual Guide

```
پیشخان بازار (Dashboard)
  └── برنامه‌های من (My Apps)
      └── [Your App Name]
          └── منوی سمت راست (Right Menu)
              └── API پیشخان بازار (Dashboard API)
                  └── دریافت توکن جدید (Get New Token)
```

## Important Notes

### 1. Token Specificity
- Each token is specific to one application
- If you have defined a payment processor (کارپرداز) for your dashboard, you must obtain the token through the publisher account (حساب ناشر) to avoid issues
- The token must be sent in request headers with the key: `CAFEBAZAAR-PISHKHAN-API-SECRET`
- **Rate Limit:** Each developer can make up to 50,000 API requests per day
- **Never commit tokens to version control**
- Store tokens in environment variables (`.env` file)
- Add `.env` to `.gitignore`
- Use different tokens for development and production

### 2. Payment Processor (کارپرداز)
- If you have defined a payment processor (کارپرداز) for your dashboard
- You **must** obtain the token through the **publisher account** (حساب ناشر)
- This prevents payment-related issues

### 3. Token Security
- **Never commit tokens to version control**
- Store tokens in environment variables (`.env` file)
- Add `.env` to `.gitignore`
- Use different tokens for development and production

### 4. Token Rotation
- Regularly rotate your tokens for security
- Update your `.env` file when rotating
- Delete old tokens from the dashboard

## Configuration in Cal AI Backend

### 1. Add Token to Environment Variables

Edit your `.env` file:

```bash
# Cafe Bazaar Configuration
CAFEBAZAAR_ACCESS_TOKEN=your-actual-token-from-dashboard
CAFEBAZAAR_PACKAGE_NAME=com.yourapp.package
```

**Example:**
```bash
CAFEBAZAAR_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CAFEBAZAAR_PACKAGE_NAME=com.loqme.calai
```

### 2. Verify Configuration

The backend automatically reads the token from environment variables:

```typescript
// In cafeBazaarApiService.ts
static fromEnvironment(): CafeBazaarApiService {
    const accessToken = process.env.CAFEBAZAAR_ACCESS_TOKEN;
    
    if (!accessToken) {
        throw new Error('CAFEBAZAAR_ACCESS_TOKEN environment variable is not set');
    }

    return new CafeBazaarApiService(accessToken);
}
```

### 3. How the Token is Used

The token is sent in the `CAFEBAZAAR-PISHKHAN-API-SECRET` header for Developer API calls:

```typescript
const response = await axios.get(url, {
    headers: {
        'CAFEBAZAAR-PISHKHAN-API-SECRET': this.accessToken,
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});
```

## Testing Token Configuration

### 1. Check if Token is Set

```bash
# In your server directory
cd server

# Check if token is in .env
grep CAFEBAZAAR_ACCESS_TOKEN .env
```

### 2. Test API Connection

Start your development server:

```bash
npm run dev
```

Then test the validation endpoint:

```bash
curl -X POST http://localhost:3000/api/subscription/validate-cafebazaar \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test_product",
    "purchaseToken": "test_token"
  }'
```

### 3. Expected Responses

**If token is valid:**
- You'll get a response from Cafe Bazaar API (success or error based on purchase token)

**If token is invalid:**
- HTTP 401 Unauthorized
- Error: "Invalid or expired access token"

**If token is missing:**
- HTTP 500 Internal Server Error
- Error: "Server configuration error"

## Troubleshooting

### Problem: "Server configuration error"

**Cause:** Token not set in environment variables

**Solution:**
1. Check `.env` file exists in `server/` directory
2. Verify `CAFEBAZAAR_ACCESS_TOKEN` is set
3. Restart the server after adding token

### Problem: "Server authentication error"

**Cause:** Token is invalid or expired

**Solution:**
1. Go to Cafe Bazaar Dashboard
2. Generate a new token
3. Update `.env` file with new token
4. Restart the server

### Problem: Token not working after adding to .env

**Cause:** Server not restarted or .env not loaded

**Solution:**
1. Stop the server (Ctrl+C)
2. Restart with `npm run dev`
3. Verify token is loaded: `console.log(process.env.CAFEBAZAAR_ACCESS_TOKEN)`

### Problem: Different behavior in production

**Cause:** Production server using different environment variables

**Solution:**
1. Set environment variables on production server
2. Don't rely on `.env` file in production
3. Use your hosting platform's environment variable settings

## Security Best Practices

### 1. Environment Variables
```bash
# ✅ Good - Use environment variables
CAFEBAZAAR_ACCESS_TOKEN=your-token

# ❌ Bad - Don't hardcode in code
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### 2. Git Ignore
```bash
# .gitignore
.env
.env.local
.env.production
```

### 3. Token Rotation
- Rotate tokens every 3-6 months
- Immediately rotate if token is compromised
- Keep track of token rotation dates

### 4. Access Control
- Only give dashboard access to trusted team members
- Use separate accounts for different team members
- Monitor token usage in Cafe Bazaar dashboard

## Production Deployment

### 1. Set Environment Variables

**On your server:**
```bash
export CAFEBAZAAR_ACCESS_TOKEN="your-production-token"
export CAFEBAZAAR_PACKAGE_NAME="com.yourapp.package"
```

**Or use your hosting platform's environment variable settings:**
- Heroku: Settings → Config Vars
- AWS: Environment variables in service configuration
- Docker: Pass via `-e` flag or docker-compose.yml
- PM2: Use ecosystem.config.json

### 2. Verify in Production

```bash
# SSH into your production server
ssh your-server

# Check environment variables
echo $CAFEBAZAAR_ACCESS_TOKEN

# Test API
curl http://localhost:3000/api/subscription/validate-cafebazaar \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"test","purchaseToken":"test"}'
```

## API Information

| Feature | Details |
|---------|--------|
| **Header Key** | `CAFEBAZAAR-PISHKHAN-API-SECRET` |
| **Use Case** | Purchase validation, subscription status |
| **Endpoint Base** | `/devapi/v2/api/` |
| **Where to Get Token** | Dashboard → API پیشخان بازار → دریافت توکن جدید |
| **Rate Limit** | 50,000 requests per day per developer |

## Summary

1. **Get Token:**
   - Login to https://pardakht.cafebazaar.ir/
   - Select your app
   - Go to "API پیشخان بازار"
   - Click "دریافت توکن جدید"

2. **Configure:**
   - Add to `.env`: `CAFEBAZAAR_ACCESS_TOKEN=your-token`
   - Add package name: `CAFEBAZAAR_PACKAGE_NAME=com.yourapp.package`

3. **Use:**
   - Backend automatically uses token for API calls
   - Token sent as `CAFEBAZAAR-PISHKHAN-API-SECRET: <token>`

4. **Secure:**
   - Never commit to git
   - Rotate regularly
   - Use environment variables

## References

- [Cafe Bazaar Dashboard](https://pardakht.cafebazaar.ir/)
- [Developer API Documentation](https://developers.cafebazaar.ir/)
- Implementation docs: `CAFEBAZAAR_COMPLETE_IMPLEMENTATION.md`
