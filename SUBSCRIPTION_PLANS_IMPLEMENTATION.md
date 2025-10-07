# Subscription Plans Management System

This document describes the implementation of the subscription plans management system for Cal AI.

## Overview

The system allows admins to manage subscription plans through an admin panel, which are then dynamically fetched and displayed in the mobile app. All admin APIs are protected and require admin authentication.

## Architecture

### Backend (Server)

#### 1. Database Model: `SubscriptionPlan`
**Location:** `/server/src/models/SubscriptionPlan.ts`

**Fields:**
- `name`: Plan name (e.g., "Yearly Plan", "Monthly Plan")
- `duration`: Plan duration ('monthly' or 'yearly')
- `price`: Price in Toman
- `originalPrice`: Original price before discount (optional)
- `discountPercentage`: Discount percentage (0-100, optional)
- `pricePerMonth`: For yearly plans, shows monthly equivalent price
- `isActive`: Whether the plan is currently available
- `features`: Array of feature strings
- `sortOrder`: For ordering plans in the UI

#### 2. Controller: `SubscriptionPlanController`
**Location:** `/server/src/controllers/subscriptionPlanController.ts`

**Endpoints:**
- `GET /api/subscription-plans` - Get all plans (public, used by mobile app)
  - Query param: `activeOnly=true` to get only active plans
- `GET /api/subscription-plans/:id` - Get a single plan by ID (public)
- `POST /api/subscription-plans` - Create a new plan (admin only)
- `PUT /api/subscription-plans/:id` - Update a plan (admin only)
- `DELETE /api/subscription-plans/:id` - Delete a plan (admin only)

#### 3. Routes: `subscriptionPlanRoutes`
**Location:** `/server/src/routes/subscriptionPlanRoutes.ts`

All write operations (POST, PUT, DELETE) are protected with the `authenticateAdmin` middleware, which:
- Checks if the JWT token is valid
- Verifies that the user has `isAdmin: true` in their user document
- Returns 403 Forbidden if the user is not an admin

#### 4. Server Integration
**Location:** `/server/src/index.ts`

The subscription plan routes are registered at `/api/subscription-plans`.

### Frontend (Admin Panel)

#### 1. Service: `SubscriptionPlanService`
**Location:** `/panel/src/services/subscriptionPlan.service.ts`

Provides methods to interact with the subscription plans API:
- `getAllPlans(token, activeOnly)`
- `getPlanById(token, id)`
- `createPlan(token, planData)`
- `updatePlan(token, id, planData)`
- `deletePlan(token, id)`

#### 2. Types
**Location:** `/panel/src/types/subscriptionPlan.ts`

TypeScript interfaces for:
- `SubscriptionPlan`: Complete plan data
- `CreatePlanInput`: Input for creating plans
- `UpdatePlanInput`: Input for updating plans

#### 3. Plans Management Page
**Location:** `/panel/src/pages/PlansPage.tsx`

**Features:**
- View all subscription plans in a grid layout
- Create new plans with a modal form
- Edit existing plans
- Delete plans with confirmation
- Toggle plan active status
- Add/remove features
- Set pricing, discounts, and sort order
- Beautiful, modern UI with consistent styling

#### 4. Navigation & Layout
**Locations:**
- `/panel/src/App.tsx` - Routing configuration
- `/panel/src/pages/DashboardPage.tsx` - Dashboard with navigation

**Features:**
- Sidebar navigation with active state
- Dashboard with quick links to Plans page
- Consistent layout across all pages
- User profile display in sidebar

### Mobile App (Flutter)

#### 1. Model: `SubscriptionPlanModel`
**Location:** `/lib/features/subscription/data/models/subscription_plan_model.dart`

Dart model representing a subscription plan with:
- JSON serialization/deserialization
- Helper methods (`isMonthly`, `isYearly`)
- All fields from the backend model

#### 2. Service: `SubscriptionPlanService`
**Location:** `/lib/services/subscription_plan_service.dart`

Provides methods to fetch plans:
- `getPlans({activeOnly})` - Fetch all plans
- `getPlanById(id)` - Fetch a single plan

Integrated with Riverpod for dependency injection.

#### 3. Provider: `SubscriptionNotifier`
**Location:** `/lib/features/subscription/presentation/providers/subscription_provider.dart`

**Enhanced with:**
- Automatic plan fetching on initialization
- Loading and error states
- List of fetched plans in state
- `getSelectedPlanDetails()` method to get the currently selected plan data

#### 4. UI Updates: `SubscriptionPage`
**Location:** `/lib/features/subscription/pages/subscription_page.dart`

**Changes:**
- Dynamic plan rendering from API data
- Loading indicator while fetching plans
- Error handling with user-friendly messages
- Price formatting helper
- Displays plan name, price, discount, and price per month from API
- Shows discount badges dynamically

## Usage

### For Admins

1. **Login to Admin Panel**
   - Navigate to the admin panel
   - Enter admin phone number
   - Verify with the code sent to your phone

2. **Manage Plans**
   - Click on "Subscription Plans" in the sidebar
   - Click "+ Create Plan" to add a new plan
   - Fill in the plan details:
     - Name (e.g., "Yearly Plan")
     - Duration (Monthly or Yearly)
     - Price in Toman
     - Optional: Original price, discount percentage
     - Optional: Price per month (for yearly plans)
     - Active status
     - Features list
     - Sort order
   - Click "Create Plan" to save

3. **Edit Plans**
   - Click "Edit" on any plan card
   - Modify the fields
   - Click "Update Plan" to save

4. **Delete Plans**
   - Click "Delete" on any plan card
   - Confirm the deletion

### For Mobile App Users

The mobile app automatically fetches active plans from the server when the subscription page is opened. Users will see the plans configured by admins with all their details (name, price, discounts, etc.).

## Security

- All admin APIs require authentication with a valid JWT token
- The `authenticateAdmin` middleware ensures only users with `isAdmin: true` can access admin endpoints
- Public endpoints (GET) are accessible to the mobile app without authentication
- CORS is configured to allow requests from the admin panel and mobile app

## API Endpoints Summary

| Method | Endpoint | Auth Required | Admin Only | Description |
|--------|----------|---------------|------------|-------------|
| GET | `/api/subscription-plans` | No | No | Get all plans |
| GET | `/api/subscription-plans/:id` | No | No | Get plan by ID |
| POST | `/api/subscription-plans` | Yes | Yes | Create new plan |
| PUT | `/api/subscription-plans/:id` | Yes | Yes | Update plan |
| DELETE | `/api/subscription-plans/:id` | Yes | Yes | Delete plan |

## Environment Setup

### Server
No additional environment variables needed. The subscription plans API uses the existing database connection.

### Admin Panel
The API base URL is configured in `/panel/src/config/api.ts`:
- Development: `http://localhost:9000`
- Production: `https://loqmeapp.ir`

### Mobile App
The API base URL is configured in `/lib/config/api_config.dart`:
- Development (Android): `http://10.0.2.2:9000`
- Development (Web): `http://localhost:9000`
- Production: `https://loqmeapp.ir`

## Testing

### Manual Testing Steps

1. **Create an admin user:**
   ```bash
   # In MongoDB, set isAdmin: true for a test user
   db.users.updateOne(
     { phone: "+1234567890" },
     { $set: { isAdmin: true } }
   )
   ```

2. **Test Admin Panel:**
   - Login with admin account
   - Create a few test plans
   - Edit and delete plans
   - Verify all CRUD operations work

3. **Test Mobile App:**
   - Open subscription page
   - Verify plans appear correctly
   - Check loading states
   - Verify plan selection works

## Future Enhancements

Potential improvements:
- Plan analytics (views, selections)
- Plan templates
- A/B testing for plans
- Subscription purchase flow integration
- Payment gateway integration
- User subscription management
- Plan usage statistics

## Troubleshooting

### Plans not showing in mobile app
- Check that plans are marked as `isActive: true`
- Verify API endpoint is accessible
- Check network connectivity
- Look for errors in app logs

### Cannot create plans in admin panel
- Verify admin user has `isAdmin: true` in database
- Check JWT token is valid and not expired
- Verify API endpoint is accessible
- Check browser console for errors

### Server errors
- Check MongoDB connection
- Verify all required fields are provided
- Check server logs for detailed error messages

## Files Created/Modified

### Server
- ✅ Created: `/server/src/models/SubscriptionPlan.ts`
- ✅ Created: `/server/src/controllers/subscriptionPlanController.ts`
- ✅ Created: `/server/src/routes/subscriptionPlanRoutes.ts`
- ✅ Modified: `/server/src/index.ts`
- ✅ Modified: `/server/src/middleware/authMiddleware.ts` (authenticateAdmin already existed)

### Admin Panel
- ✅ Created: `/panel/src/types/subscriptionPlan.ts`
- ✅ Created: `/panel/src/services/subscriptionPlan.service.ts`
- ✅ Created: `/panel/src/pages/PlansPage.tsx`
- ✅ Modified: `/panel/src/App.tsx`
- ✅ Modified: `/panel/src/pages/DashboardPage.tsx`
- ✅ Modified: `/panel/package.json` (added react-router-dom)

### Mobile App
- ✅ Created: `/lib/features/subscription/data/models/subscription_plan_model.dart`
- ✅ Created: `/lib/services/subscription_plan_service.dart`
- ✅ Modified: `/lib/config/api_config.dart`
- ✅ Modified: `/lib/features/subscription/presentation/providers/subscription_provider.dart`
- ✅ Modified: `/lib/features/subscription/pages/subscription_page.dart`

## Summary

The subscription plans management system is now fully functional with:
- ✅ Backend API with CRUD operations (admin-protected)
- ✅ Admin panel for managing plans
- ✅ Mobile app integration to fetch and display plans
- ✅ Proper authentication and authorization
- ✅ Beautiful, modern UI
- ✅ Error handling and loading states
- ✅ Type safety (TypeScript for panel, Dart for app)

All admin APIs are protected and only accessible to users with admin privileges. The mobile app fetches plans dynamically from the server, allowing admins to update pricing and features without app updates.

