# Offers Management System - Implementation Guide

## Overview
A comprehensive offers management system has been implemented to allow creating and managing promotional offers for subscription plans with advanced targeting, time-based offers, and user segmentation.

## What Has Been Implemented

### 1. Server-Side (Complete)

#### Models
- **Offer Model** (`/server/src/models/Offer.ts`)
  - Comprehensive offer schema with all required fields
  - Support for multiple offer types: percentage, fixed_amount, trial, feature
  - User targeting: all, new, old, expired, active_subscribers
  - Time-based offers with start/end dates
  - Plan assignment (specific plans or all plans)
  - Priority system for offer ordering
  - Usage tracking and limits
  - Display settings for banner customization

#### Controllers
- **Offer Controller** (`/server/src/controllers/offerController.ts`)
  - `getAllOffers` - Get all offers (admin)
  - `getActiveOffersForUser` - Get applicable offers for a specific user based on their profile
  - `getOfferById` - Get offer by ID or slug
  - `createOffer` - Create new offer (admin)
  - `updateOffer` - Update existing offer (admin)
  - `deleteOffer` - Delete offer (admin)
  - `toggleOfferStatus` - Toggle offer active/inactive status (admin)
  - `incrementUsageCount` - Track offer usage

#### Routes
- **Offer Routes** (`/server/src/routes/offerRoutes.ts`)
  - Public route: `GET /api/offers/active` - Get active offers for logged-in user
  - Public route: `GET /api/offers/:id` - Get offer details
  - Admin routes: CRUD operations for offer management
  - Routes registered in `/server/src/index.ts`

### 2. Admin Panel (Partial)

#### Types & Services
- **Offer Types** (`/panel/src/types/offer.ts`) - TypeScript interfaces
- **Offer Service** (`/panel/src/services/offer.service.ts`) - API client
- **Offers Page** (`/panel/src/pages/OffersPage.tsx`) - Main management page

#### What's Complete
- Offers listing page with grid layout
- Delete confirmation modal
- Success/error message handling
- Integration with subscription plans
- Status toggle functionality

#### What's Needed (Not Yet Created)
You'll need to create these two components:

**1. OfferCard Component** (`/panel/src/components/OfferCard.tsx`):
```typescript
// Display individual offer card with:
// - Visual preview of banner with colors
// - Offer details (type, discount, target users)
// - Timeline info for time-limited offers
// - Priority and usage stats
// - Applicable plans list
// - Action buttons (Edit, Toggle Status, Delete)
```

**2. OfferFormModal Component** (`/panel/src/components/OfferFormModal.tsx`):
```typescript
// Large modal form with sections:
// 
// Section 1: Basic Information
// - name, slug, description
// 
// Section 2: Display Settings
// - bannerText, bannerSubtext
// - backgroundColor, textColor (color pickers)
// - badgeText, icon
// - Live preview of banner
//
// Section 3: Offer Type & Value
// - offerType select (percentage, fixed_amount, trial, feature)
// - discountPercentage (if percentage)
// - discountAmount (if fixed_amount)
//
// Section 4: Time Settings
// - isTimeLimited checkbox
// - startDate, endDate (date inputs)
//
// Section 5: User Targeting
// - targetUserType select
// - Conditional fields based on selection:
//   - new users: userRegisteredWithinDays
//   - old users: userRegisteredAfterDays
//   - Other conditions: hasActiveSubscription, hasExpiredSubscription
// - minPurchaseAmount
//
// Section 6: Plan Assignment
// - applyToAllPlans checkbox
// - applicablePlans multiselect (checkboxes for each plan)
//
// Section 7: Additional Settings
// - priority number input
// - isActive checkbox
// - maxUsageLimit optional number
//
// Form validation and submission logic
```

### 3. Flutter Mobile App (Not Yet Implemented)

#### What's Needed

**1. Offer Model** (`/lib/features/subscription/data/models/offer_model.dart`):
```dart
class OfferModel {
  final String id;
  final String name;
  final String slug;
  final OfferDisplay display;
  final String offerType;
  final double? discountPercentage;
  final double? discountAmount;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool isTimeLimited;
  final String targetUserType;
  final List<String> applicablePlanIds;
  final bool applyToAllPlans;
  final int priority;
  final bool isActive;
  // ... fromJson, toJson methods
}

class OfferDisplay {
  final String bannerText;
  final String? bannerSubtext;
  final String backgroundColor;
  final String textColor;
  final String? badgeText;
  final String? icon;
}
```

**2. Offer Service** (`/lib/features/subscription/data/services/offer_service.dart`):
```dart
class OfferService {
  Future<List<OfferModel>> getActiveOffers() async {
    // GET /api/offers/active
    // Returns offers applicable to current user
  }
}
```

**3. Update Subscription Provider** (`/lib/features/subscription/presentation/providers/subscription_provider.dart`):
```dart
// Add offers state
List<OfferModel> offers = [];

// Fetch offers alongside plans
Future<void> loadSubscriptionData() async {
  // Load plans
  // Load offers
  // Apply best offer to each plan
}

// Method to apply offer to plan pricing
PlanWithOffer applyOfferToPlan(Plan plan, Offer offer) {
  // Calculate discounted price
  // Return plan with applied offer
}
```

**4. Update Subscription Page UI** (`/lib/features/subscription/pages/subscription_page.dart`):
```dart
// Replace hardcoded timer with dynamic offer data
// Use offer.display properties for banner
// Calculate timer countdown if offer.endDate exists
// Show offer.display.badgeText instead of hardcoded "تخفیف ویژه"
// Apply offer discount to plan prices dynamically
```

### 4. Translation Keys (Required)

Add to both `/assets/translations/fa-IR.json` and `/assets/translations/en-US.json`:

```json
{
  "offers": {
    "special_offer": "تخفیف ویژه / Special Offer",
    "limited_time": "محدود / Limited Time",
    "new_users_only": "فقط کاربران جدید / New Users Only",
    "expires_in": "منقضی می‌شود / Expires in",
    "days": "روز / days",
    "hours": "ساعت / hours",
    "minutes": "دقیقه / minutes",
    "off": "تخفیف / OFF",
    "save": "صرفه‌جویی / Save",
    "for_limited_time": "برای مدت محدود / For Limited Time"
  }
}
```

## Key Features Implemented

### 1. Multiple Offer Types
- **Percentage**: 70% OFF
- **Fixed Amount**: 50,000 Toman discount
- **Trial**: Free trial periods
- **Feature**: Special feature unlocks

### 2. User Targeting
- **All Users**: Everyone sees the offer
- **New Users**: Users registered within X days
- **Old Users**: Users registered after X days
- **Expired Subscribers**: Users with expired subscriptions
- **Active Subscribers**: Current subscribers (for upgrades)

### 3. Advanced Conditions
- Registration time window
- Active/expired subscription status
- Minimum purchase amount
- Usage limits

### 4. Plan Assignment
- Apply to all plans
- Or select specific plans
- Each offer can target different plans

### 5. Time-Based Offers
- Optional start/end dates
- Automatic activation/deactivation
- Perfect for seasonal campaigns (Winter Sale, etc.)

### 6. Display Customization
- Custom banner text and subtext
- Custom colors (background & text)
- Badge text for urgency
- Icon/emoji support

### 7. Priority System
- Higher priority offers show first
- Control which offer users see when multiple apply
- Perfect for A/B testing

## How It Works

### Creating an Offer (Example: Winter Sale)

1. **Admin creates offer in panel**:
   - Name: "Winter Sale 2024"
   - Slug: "winter-2024"
   - Banner: "70% تخفیف ویژه زمستان"
   - Type: Percentage (70%)
   - Time: Dec 1 - Jan 31
   - Target: All users
   - Plans: Yearly plan only
   - Priority: 10

2. **Server stores offer** in MongoDB

3. **Mobile app fetches offers**:
   - `GET /api/offers/active`
   - Server checks user profile
   - Returns applicable offers

4. **App displays offer**:
   - Shows 70% discount on yearly plan
   - Displays countdown timer until Jan 31
   - Shows banner with custom colors
   - Applies discount to plan price

### User Targeting Example

**Offer for New Users (1 Day)**:
- Condition: userRegisteredWithinDays = 1
- When user opens app within 24 hours of registration
- They see special "Welcome" offer
- After 24 hours, offer disappears for them

**Offer for Expired Users**:
- Condition: targetUserType = 'expired'
- hasExpiredSubscription = true
- Only shows to users whose subscription ended
- "Come back! 50% discount to reactivate"

## Integration Points

### 1. Subscription Page
- Replace hardcoded timer with actual offer countdown
- Use offer colors for banner background
- Apply real discounts from offers
- Show offer badge text

### 2. Analytics
- Track offer views
- Track conversions per offer
- A/B test different offers

### 3. Payment Flow
- Apply offer discount during purchase
- Increment offer usage count on successful purchase
- Track which offer was used

## Next Steps to Complete

1. **Create OfferCard component** (display in admin panel)
2. **Create OfferFormModal component** (create/edit form)
3. **Add route to panel App.tsx** for `/panel/offers`
4. **Create Flutter offer model and service**
5. **Update Flutter subscription provider** with offer logic
6. **Update subscription page UI** to use dynamic offers
7. **Add translation keys** for offer-related texts
8. **Test end-to-end flow**:
   - Create offer in admin panel
   - Verify it appears in mobile app
   - Test targeting logic
   - Test discount application

## Database Schema

```javascript
{
  name: "Winter Sale 2024",
  slug: "winter-2024",
  display: {
    bannerText: "70% تخفیف ویژه زمستان",
    bannerSubtext: "فقط تا پایان ژانویه",
    backgroundColor: "#E53935",
    textColor: "#FFFFFF",
    badgeText: "محدود",
    icon: "❄️"
  },
  offerType: "percentage",
  discountPercentage: 70,
  startDate: "2024-12-01T00:00:00Z",
  endDate: "2025-01-31T23:59:59Z",
  isTimeLimited: true,
  targetUserType: "all",
  conditions: {
    userRegisteredWithinDays: null,
    userRegisteredAfterDays: null,
    hasActiveSubscription: null,
    hasExpiredSubscription: null,
    minPurchaseAmount: null
  },
  applicablePlans: [ObjectId("yearly_plan_id")],
  applyToAllPlans: false,
  priority: 10,
  isActive: true,
  usageCount: 0,
  maxUsageLimit: 1000
}
```

## API Endpoints Summary

```
Public:
GET    /api/offers/active          - Get offers for current user
GET    /api/offers/:id             - Get offer details

Admin:
GET    /api/offers                 - List all offers
POST   /api/offers                 - Create new offer
PUT    /api/offers/:id             - Update offer
DELETE /api/offers/:id             - Delete offer
PATCH  /api/offers/:id/toggle      - Toggle active status
POST   /api/offers/:id/increment-usage - Increment usage count
```

## Future Enhancements

1. **Offer Analytics Dashboard**
   - Views, clicks, conversions per offer
   - Revenue generated per offer
   - A/B testing results

2. **Offer Scheduling**
   - Schedule offers in advance
   - Recurring offers (weekly, monthly)

3. **Referral Integration**
   - Offers for referred users
   - Offers for referrers

4. **Dynamic Pricing**
   - AI-powered offer suggestions
   - Personalized discounts based on user behavior

5. **Multi-currency Support**
   - Different prices for different regions

## Testing Checklist

- [ ] Create offer in admin panel
- [ ] Verify offer appears in list
- [ ] Edit offer and verify changes
- [ ] Toggle offer status
- [ ] Delete offer
- [ ] Fetch active offers from mobile app
- [ ] Verify user targeting works (new vs old users)
- [ ] Verify time-based offers (start/end dates)
- [ ] Verify plan-specific offers
- [ ] Verify discount calculation
- [ ] Verify usage counter increments
- [ ] Verify max usage limit enforcement
- [ ] Test priority ordering (multiple offers)
- [ ] Test offer expiration
- [ ] Test countdown timer in UI

## Conclusion

The offers management system provides a flexible, powerful way to run promotional campaigns. Admins can create targeted offers with custom branding, apply them to specific plans and user segments, and track their performance. The system is designed to be extensible for future enhancements like A/B testing, analytics, and AI-powered personalization.
