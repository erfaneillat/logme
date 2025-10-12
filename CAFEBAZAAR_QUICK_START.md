# Cafe Bazaar Integration - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your Token from Cafe Bazaar

1. Go to https://pardakht.cafebazaar.ir/
2. Login and select your app
3. Click "API پیشخان بازار" in right menu
4. Click "دریافت توکن جدید" (Get New Token)
5. Copy the token

**📖 Detailed Guide:** See `CAFEBAZAAR_TOKEN_GUIDE.md`

### Step 2: Configure Backend

```bash
cd server

# Create .env file if it doesn't exist
cp .env.example .env

# Edit .env and add your token
nano .env
```

Add these lines to `.env`:
```bash
CAFEBAZAAR_ACCESS_TOKEN=your-token-from-step-1
CAFEBAZAAR_PACKAGE_NAME=com.yourapp.package
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Step 5: Test the API

```bash
# Get a user JWT token first by logging in
USER_TOKEN="your_jwt_token"

# Test purchase validation
curl -X POST http://localhost:3000/api/subscription/validate-cafebazaar \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "monthly_subscription",
    "purchaseToken": "test_token"
  }'

# Test subscription status
curl -X POST http://localhost:3000/api/subscription/check-subscription-status \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "monthly_subscription",
    "purchaseToken": "test_token"
  }'
```

## 📡 Available Endpoints

### 1. Validate In-App Purchase
**Endpoint:** `POST /api/subscription/validate-cafebazaar`

**Use for:** One-time purchases, fraud detection

**Request:**
```json
{
    "productId": "monthly_subscription",
    "purchaseToken": "abc123..."
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
        "purchaseTime": 1414181378566
    }
}
```

### 2. Check Subscription Status
**Endpoint:** `POST /api/subscription/check-subscription-status`

**Use for:** Recurring subscriptions, checking expiry

**Request:**
```json
{
    "subscriptionId": "monthly_subscription",
    "purchaseToken": "abc123..."
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "valid": true,
        "active": true,
        "expiryTime": 1435912745710,
        "autoRenewing": true
    }
}
```

## 🎯 When to Use Each Endpoint

| Scenario | Use Endpoint |
|----------|--------------|
| User just purchased subscription | `/validate-cafebazaar` |
| Check if subscription is still active | `/check-subscription-status` |
| Verify purchase wasn't refunded | `/validate-cafebazaar` |
| Get subscription expiry date | `/check-subscription-status` |
| Check auto-renewal status | `/check-subscription-status` |
| Fraud detection | `/validate-cafebazaar` |

## 📱 Flutter Integration

### Add to your payment service:

```dart
class PaymentService {
  final String baseUrl = 'https://your-api.com';
  
  // Validate purchase
  Future<bool> validatePurchase(String productId, String token) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/subscription/validate-cafebazaar'),
      headers: {
        'Authorization': 'Bearer $userToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'productId': productId,
        'purchaseToken': token,
      }),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['success'] && data['data']['valid'];
    }
    return false;
  }
  
  // Check subscription status
  Future<bool> isSubscriptionActive(String subscriptionId, String token) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/subscription/check-subscription-status'),
      headers: {
        'Authorization': 'Bearer $userToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'subscriptionId': subscriptionId,
        'purchaseToken': token,
      }),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['success'] && 
             data['data']['valid'] && 
             data['data']['active'];
    }
    return false;
  }
}
```

## 🔧 Troubleshooting

### "Server configuration error"
- ❌ Token not set in `.env`
- ✅ Add `CAFEBAZAAR_ACCESS_TOKEN` to `.env`
- ✅ Restart server

### "Server authentication error"
- ❌ Token is invalid or expired
- ✅ Generate new token from Cafe Bazaar dashboard
- ✅ Update `.env` and restart

### "Purchase/Subscription not found"
- ❌ Invalid purchase token
- ❌ Wrong product/subscription ID
- ❌ Wrong package name
- ✅ Verify all parameters match Cafe Bazaar console

### Server not reading .env file
- ✅ Make sure `.env` is in `server/` directory
- ✅ Restart server after editing `.env`
- ✅ Check file is not named `.env.txt` or similar

### Rate Limit Exceeded
- ❌ Made more than 50,000 requests in one day
- ✅ Implement caching to reduce API calls
- ✅ Wait until next day for limit reset

## 📚 Complete Documentation

| Document | Description |
|----------|-------------|
| `CAFEBAZAAR_TOKEN_GUIDE.md` | How to get and configure token |
| `CAFEBAZAAR_VERIFICATION_API.md` | Purchase validation details |
| `CAFEBAZAAR_SUBSCRIPTION_STATUS.md` | Subscription status details |
| `CAFEBAZAAR_COMPLETE_IMPLEMENTATION.md` | Full implementation overview |
| `CAFEBAZAAR_QUICK_START.md` | This file |

## ✅ Checklist

- [ ] Got token from Cafe Bazaar dashboard
- [ ] Added token to `.env` file
- [ ] Added package name to `.env` file
- [ ] Ran `npm install`
- [ ] Started server with `npm run dev`
- [ ] Tested both endpoints with curl
- [ ] Integrated endpoints in Flutter app
- [ ] Tested with real purchase tokens
- [ ] Deployed to production
- [ ] Set production environment variables

## 🔐 Security Reminders

- ✅ Never commit `.env` to git
- ✅ Use different tokens for dev/prod
- ✅ Rotate tokens every 3-6 months
- ✅ Monitor for suspicious activity
- ❌ Never hardcode tokens in code
- ❌ Never expose tokens in client-side code

## 🚨 Common Mistakes

1. **Using wrong header format**
   - ✅ Correct: `CAFEBAZAAR-PISHKHAN-API-SECRET: token`
   - ❌ Wrong: `Authorization: Bearer token` (old format)

2. **Forgetting to restart server**
   - After editing `.env`, always restart server

3. **Wrong package name**
   - Must match exactly with Cafe Bazaar console

4. **Testing with wrong tokens**
   - Purchase tokens are different from subscription tokens
   - Use correct token type for each endpoint

5. **Exceeding rate limit**
   - Maximum 50,000 requests per day per developer
   - Implement caching to reduce API calls

## 📞 Need Help?

1. Check the troubleshooting section above
2. Review detailed documentation files
3. Check server logs for error messages
4. Verify Cafe Bazaar dashboard settings

## 🎉 You're All Set!

Your Cafe Bazaar integration is ready. Start testing with real purchases and subscriptions!

**Next Steps:**
1. Test with real Cafe Bazaar purchases
2. Implement periodic subscription status checks in Flutter
3. Add subscription renewal reminders
4. Monitor API usage and performance
