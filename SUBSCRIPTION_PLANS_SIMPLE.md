# Subscription Plans Management System (Simplified)

## Overview

A simplified subscription pricing management system where:
- **Two static plans**: Monthly and Yearly (cannot be created or deleted)
- **Admins**: Can only edit prices through the admin panel
- **Mobile App**: Fetches and displays prices dynamically

## Architecture

### Backend (Server)

#### 1. Database Model: `SubscriptionPlan`
**Location:** `/server/src/models/SubscriptionPlan.ts`

Two static records in the database:
- **Monthly Plan** - Basic monthly subscription
- **Yearly Plan** - Annual subscription with discount

#### 2. API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/subscription-plans` | No | Get all plans (used by mobile app) |
| PUT | `/api/subscription-plans/:duration/price` | Admin | Update price for monthly/yearly |

**Update Price Example:**
```bash
curl -X PUT https://loqmeapp.ir/api/subscription-plans/yearly/price \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 499000,
    "originalPrice": 1188000,
    "discountPercentage": 60,
    "pricePerMonth": 41583
  }'
```

#### 3. Initialization Script
**Location:** `/server/src/scripts/initializeSubscriptionPlans.ts`

Run once to create the default plans:
```bash
cd server && npx ts-node src/scripts/initializeSubscriptionPlans.ts
```

Default prices:
- **Monthly**: 99,000 Toman
- **Yearly**: 499,000 Toman (60% off, 41,583 Toman/month)

### Admin Panel

**Location:** `/panel/src/pages/PlansPage.tsx`

**Features:**
- View two plan cards (Monthly and Yearly)
- Click "Edit Pricing" to modify prices
- For yearly plan: Can edit price, original price, discount %, and price/month
- For monthly plan: Can only edit price
- Changes are saved via API and reflected immediately

**Access:** Only users with `isAdmin: true` can access this page

### Mobile App (Flutter)

**Provider:** `/lib/features/subscription/presentation/providers/subscription_provider.dart`

The provider automatically fetches prices on initialization and stores them in state:
- `monthlyPrice`
- `yearlyPrice`
- `yearlyOriginalPrice`
- `yearlyDiscountPercentage`
- `yearlyPricePerMonth`

**UI:** `/lib/features/subscription/pages/subscription_page.dart`

The existing static UI displays fetched prices:
- Shows loading indicator while fetching
- Falls back to translation keys if prices fail to load
- Displays prices with Persian number formatting

## Setup Instructions

### 1. Initialize Database Plans

```bash
cd server
npx ts-node src/scripts/initializeSubscriptionPlans.ts
```

### 2. Create an Admin User

In MongoDB:
```javascript
db.users.updateOne(
  { phone: "+1234567890" },
  { $set: { isAdmin: true } }
)
```

### 3. Start Admin Panel

```bash
cd panel
npm run dev
```

Visit `http://localhost:5173` and login with admin phone.

### 4. Edit Prices

1. Navigate to "Subscription Plans" in sidebar
2. Click "Edit Pricing" on a plan card
3. Update the prices
4. Click "Update Price"

### 5. Test Mobile App

The Flutter app will automatically fetch and display the new prices on the subscription page.

## Key Benefits

✅ **Simplicity**: Only 2 static plans, no complex CRUD operations  
✅ **Control**: Admins can adjust pricing without app updates  
✅ **Reliability**: Static structure prevents accidental plan deletion  
✅ **Fallback**: Mobile app uses translation keys if API fails  
✅ **Fast**: Minimal API calls, prices cached in app state  

## API Security

- GET endpoints: Public (for mobile app)
- PUT endpoints: Admin-only (requires `isAdmin: true`)
- Authentication: JWT token with `authenticateAdmin` middleware

## Files Modified

### Server
- ✅ Created: `/server/src/scripts/initializeSubscriptionPlans.ts`
- ✅ Modified: `/server/src/controllers/subscriptionPlanController.ts`
- ✅ Modified: `/server/src/routes/subscriptionPlanRoutes.ts`

### Admin Panel
- ✅ Simplified: `/panel/src/pages/PlansPage.tsx` (removed create/delete)
- ✅ Simplified: `/panel/src/services/subscriptionPlan.service.ts` (only updatePrice method)

### Mobile App
- ✅ Simplified: `/lib/features/subscription/presentation/providers/subscription_provider.dart`
- ✅ Modified: `/lib/features/subscription/pages/subscription_page.dart`

## Troubleshooting

### Plans not appearing in mobile app
- Check that database has the 2 plans (run init script)
- Verify API is accessible
- Check network connectivity

### Cannot edit prices
- Ensure user has `isAdmin: true` in database
- Check JWT token is valid
- Verify API endpoint `/api/subscription-plans/:duration/price`

### Database doesn't have plans
Run the initialization script:
```bash
cd server && npx ts-node src/scripts/initializeSubscriptionPlans.ts
```

## Summary

This simplified implementation provides a clean, maintainable subscription pricing system:

- **2 Static Plans** (Monthly & Yearly) - Cannot be created or deleted
- **Price Editing Only** - Admins can update prices through panel
- **Dynamic Display** - Mobile app fetches and displays latest prices
- **Admin Protected** - All write operations require admin role
- **Fallback Support** - Uses translation keys if API fails

The system is production-ready and provides the perfect balance between flexibility and simplicity! 🎉

