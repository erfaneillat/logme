# CafeBazaar Payment Implementation with Poolakey

This document describes the implementation of CafeBazaar in-app purchases using the Poolakey library for the Cal AI app.

## Overview

The payment system allows users to purchase monthly and yearly subscriptions through CafeBazaar (Iranian app marketplace). The implementation includes:

1. **Frontend (Flutter)**: Payment service using Poolakey
2. **Backend (Node.js)**: Purchase verification and subscription management
3. **Secure Storage**: Local subscription state management

## Architecture

### 1. Frontend Components

#### Payment Service (`lib/services/payment_service.dart`)

The payment service handles all CafeBazaar payment operations:

**Key Features:**
- Initialize connection to CafeBazaar
- Purchase subscriptions
- Verify purchases with backend
- Check subscription status
- Consume purchases

**Methods:**
- `purchaseSubscription(String productKey)` - Initiates purchase flow
- `checkSubscriptionStatus()` - Checks active subscription
- `getAvailableProducts(List<String> productKeys)` - Fetches product info
- `disconnect()` - Disconnects from payment service

#### Subscription Page (`lib/features/subscription/pages/subscription_page.dart`)

Updated to integrate payment flow:
- Shows subscription plans (monthly/yearly)
- Handles payment button click
- Shows loading states during payment
- Displays success/error dialogs
- Stores subscription status locally

#### Secure Storage (`lib/features/login/data/datasources/secure_storage.dart`)

Extended with subscription methods:
- `setSubscriptionActive(bool isActive)` - Store subscription status
- `isSubscriptionActive()` - Check if user has active subscription
- `storeSubscriptionData(String data)` - Store subscription details
- `getSubscriptionData()` - Retrieve subscription details

### 2. Backend Components

#### Subscription Model (`server/src/models/Subscription.ts`)

Database model for storing subscription records:

**Fields:**
- `userId` - Reference to user
- `planType` - 'monthly' or 'yearly'
- `productKey` - CafeBazaar product identifier
- `purchaseToken` - Unique purchase token from CafeBazaar
- `orderId` - Order ID from CafeBazaar
- `payload` - Developer payload
- `isActive` - Subscription status
- `startDate` - Subscription start date
- `expiryDate` - Subscription expiry date
- `autoRenew` - Auto-renewal status

#### Subscription Controller (`server/src/controllers/subscriptionController.ts`)

Handles subscription-related API requests:

**Endpoints:**
- `POST /api/subscription/verify-purchase` - Verify and activate purchase
- `GET /api/subscription/status` - Get user's subscription status
- `POST /api/subscription/cancel` - Cancel subscription
- `GET /api/subscription/history` - Get subscription history

#### Routes (`server/src/routes/subscriptionRoutes.ts`)

RESTful API routes for subscription management. All routes require authentication.

## Setup Instructions

### 1. Flutter App Setup

#### Add Poolakey Dependency

Already added to `pubspec.yaml`:
```yaml
dependencies:
  poolakey: ^2.0.0
```

#### Configure Android Manifest

Add the following to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Add billing permission -->
    <uses-permission android:name="com.farsitel.bazaar.permission.PAY_THROUGH_BAZAAR" />
    
    <application>
        <!-- Your existing application config -->
    </application>
</manifest>
```

#### Update RSA Public Key

In `lib/services/payment_service.dart`, replace the RSA key with your actual key from CafeBazaar Developer Console:

```dart
_payment = Payment(
  rsaKey: 'YOUR_ACTUAL_RSA_PUBLIC_KEY_FROM_CAFEBAZAAR',
);
```

To get your RSA key:
1. Log in to CafeBazaar Developer Console
2. Go to your app's page
3. Navigate to "In-App Products" or "Financial Settings"
4. Copy your RSA Public Key

### 2. Backend Setup

#### Add Subscription Routes to Server

Already added to `server/src/index.ts`:
```typescript
import subscriptionRoutes from './routes/subscriptionRoutes';
app.use('/api/subscription', subscriptionRoutes);
```

#### Configure Product Keys in Database

You need to configure your CafeBazaar product keys in the database. Update the subscription plans with your product keys:

```bash
# Connect to MongoDB
mongo your_database_name

# Update monthly plan
db.subscriptionplans.updateOne(
  { duration: 'monthly' },
  { $set: { cafebazaarProductKey: 'your_monthly_product_key' } }
)

# Update yearly plan
db.subscriptionplans.updateOne(
  { duration: 'yearly' },
  { $set: { cafebazaarProductKey: 'your_yearly_product_key' } }
)
```

Or use the admin panel to update product keys through the UI.

### 3. CafeBazaar Developer Console Setup

#### Create In-App Products

1. Log in to [CafeBazaar Developer Console](https://cafebazaar.ir/developers/)
2. Select your app
3. Go to "In-App Products" section
4. Create two subscription products:
   - Monthly subscription (e.g., `monthly_premium`)
   - Yearly subscription (e.g., `yearly_premium`)
5. Set prices and billing periods
6. Activate the products

#### Configure Subscription Details

For each subscription:
- Set title and description
- Configure billing period (1 month or 12 months)
- Set price in Tomans
- Enable auto-renewal if desired
- Save and activate

## Payment Flow

### User Journey

1. **View Subscription Plans**
   - User opens subscription page
   - Plans are fetched from backend with CafeBazaar product keys
   - Monthly and yearly options displayed

2. **Select Plan**
   - User selects monthly or yearly plan
   - Taps "Continue" button

3. **Initiate Payment**
   - Payment service connects to CafeBazaar
   - Purchase dialog is shown by CafeBazaar
   - User completes payment

4. **Verify Purchase**
   - Purchase token is sent to backend
   - Backend verifies purchase authenticity
   - Subscription record is created in database
   - Purchase is consumed

5. **Activate Subscription**
   - Backend marks subscription as active
   - Frontend stores subscription status locally
   - Success dialog is shown to user

### Technical Flow

```
[Flutter App] -> [Poolakey] -> [CafeBazaar]
      |                              |
      v                              v
[Purchase Token] <-------------- [Payment]
      |
      v
[Backend API]
      |
      v
[Verify Token + Create Subscription]
      |
      v
[Consume Purchase]
      |
      v
[Success Response]
```

## API Endpoints

### Verify Purchase
```http
POST /api/subscription/verify-purchase
Authorization: Bearer {token}
Content-Type: application/json

{
  "productKey": "yearly_premium",
  "purchaseToken": "token_from_cafebazaar",
  "orderId": "order_id_from_cafebazaar",
  "payload": "optional_developer_payload"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription activated successfully",
  "data": {
    "subscription": {
      "planType": "yearly",
      "isActive": true,
      "startDate": "2025-01-01T00:00:00.000Z",
      "expiryDate": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

### Get Subscription Status
```http
GET /api/subscription/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isActive": true,
    "planType": "yearly",
    "expiryDate": "2026-01-01T00:00:00.000Z",
    "startDate": "2025-01-01T00:00:00.000Z"
  }
}
```

### Cancel Subscription
```http
POST /api/subscription/cancel
Authorization: Bearer {token}
```

### Get Subscription History
```http
GET /api/subscription/history
Authorization: Bearer {token}
```

## Translation Keys

All payment-related messages are localized in both English and Persian:

**English** (`assets/translations/en-US.json`):
- `subscription.payment.processing` - "Processing payment..."
- `subscription.payment.success` - "Payment successful!"
- `subscription.payment.failed` - "Payment failed"
- `subscription.payment.cancelled` - "Payment cancelled"
- `subscription.payment.error` - "An error occurred during payment"
- `subscription.payment.subscription_activated` - "Your subscription has been activated!"

**Persian** (`assets/translations/fa-IR.json`):
- `subscription.payment.processing` - "در حال پردازش پرداخت..."
- `subscription.payment.success` - "پرداخت موفق!"
- `subscription.payment.failed` - "پرداخت ناموفق"
- And more...

## Error Handling

The implementation includes comprehensive error handling:

### Payment Service Errors
- Billing service unavailable
- Product not found
- Product unavailable for purchase
- Product already owned
- Purchase cancelled by user
- Network errors

### Backend Errors
- Authentication failures
- Purchase token already used
- Invalid product keys
- Database errors

All errors are displayed to users with localized messages and appropriate recovery options.

## Testing

### Development Testing

1. **Use CafeBazaar Sandbox**
   - Enable sandbox mode in CafeBazaar Developer Console
   - Use test accounts for purchases
   - No actual charges are made

2. **Test Purchase Flow**
   ```bash
   # Run the app in debug mode
   flutter run
   
   # Navigate to subscription page
   # Select a plan and tap Continue
   # Complete payment in sandbox
   ```

3. **Verify Backend**
   ```bash
   # Check subscription in database
   mongo your_database
   db.subscriptions.find({ userId: ObjectId("user_id") })
   ```

### Production Testing

Before releasing to production:
1. Test with real CafeBazaar accounts
2. Verify purchase verification works correctly
3. Test subscription expiry handling
4. Test cancellation flow
5. Monitor error logs

## Security Considerations

1. **RSA Key Protection**
   - Never commit your actual RSA key to version control
   - Store it securely and inject it during build

2. **Purchase Verification**
   - Always verify purchases on backend
   - Never trust client-side verification alone
   - Validate purchase tokens with CafeBazaar

3. **Token Management**
   - Ensure purchase tokens are unique
   - Prevent token reuse attacks
   - Log all purchase attempts

4. **Subscription Status**
   - Regularly check subscription expiry
   - Implement auto-renewal handling
   - Handle subscription cancellations

## Monitoring and Analytics

Consider implementing:
- Purchase success/failure rates
- Revenue tracking
- Subscription churn analysis
- Error rate monitoring
- Payment funnel analytics

## Support

For issues or questions:
- CafeBazaar Support: support@cafebazaar.ir
- Poolakey GitHub: https://github.com/cafebazaar/CafeBazaarAuth-Flutter
- Internal Support: See your development team

## Future Enhancements

Potential improvements:
- Promotional codes integration
- Trial periods
- Family sharing
- Subscription pause/resume
- Multiple pricing tiers
- Regional pricing
- Referral discounts

## Troubleshooting

### Common Issues

**Issue: "Billing service unavailable"**
- Ensure device has CafeBazaar app installed
- Check internet connection
- Verify billing permission in manifest

**Issue: "Product not found"**
- Verify product keys in database match CafeBazaar
- Check if products are activated in CafeBazaar console
- Ensure product IDs are correct

**Issue: "Purchase verification failed"**
- Check backend logs for detailed errors
- Verify API endpoint is accessible
- Ensure authentication token is valid
- Check database connection

**Issue: "Product already owned"**
- Check if subscription is already active
- Verify purchase was consumed properly
- May need to manually consume in CafeBazaar console

## References

- [Poolakey Documentation](https://github.com/cafebazaar/CafeBazaarAuth-Flutter)
- [CafeBazaar Developer Guide](https://developers.cafebazaar.ir/)
- [In-App Billing Best Practices](https://developers.cafebazaar.ir/fa/docs/in-app-billing/)

