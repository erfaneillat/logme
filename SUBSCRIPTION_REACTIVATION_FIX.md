# Subscription Reactivation Fix

## Problem
Users couldn't purchase subscriptions again after their previous subscription became inactive because the server was blocking any reuse of purchase tokens, even for the same user with an inactive subscription.

## Root Cause
The `verifyPurchase` endpoint in `subscriptionController.ts` was rejecting **all** attempts to reuse a purchase token, regardless of:
- Whether it was the same user
- Whether the previous subscription was inactive

This was too strict for development/testing scenarios where users need to test purchases multiple times.

## Solution Implemented

### 1. Smart Token Reuse Logic
Updated the purchase verification to allow reactivation while maintaining security:

```typescript
// Check if purchase token already exists
const existingSubscription = await Subscription.findOne({ purchaseToken });
if (existingSubscription) {
    const isSameUser = existingSubscription.userId.toString() === userId.toString();
    const isInactive = !existingSubscription.isActive;
    
    if (!isSameUser) {
        // ❌ Different user trying to use same token - FRAUD ATTEMPT
        return 400: "Purchase token already used"
    }
    
    if (!isInactive) {
        // ❌ Same user, but subscription is still active
        return 400: "You already have an active subscription"
    }
    
    // ✅ Same user, inactive subscription - ALLOW REACTIVATION
}
```

### 2. Update vs Create Logic
Instead of always creating a new subscription record, the system now:
- **Updates** the existing subscription if reactivating
- **Creates** a new subscription if it's a first-time purchase

```typescript
if (existingSubscription) {
    // Update existing subscription
    existingSubscription.isActive = true;
    existingSubscription.startDate = startDate;
    existingSubscription.expiryDate = expiryDate;
    // ... update other fields
    subscription = await existingSubscription.save();
} else {
    // Create new subscription
    subscription = new Subscription({ ... });
    await subscription.save();
}
```

### 3. Enhanced Logging
Added detailed logging for all scenarios:

```typescript
// Fraud detection
console.error('🚨 Fraud attempt: Different user trying to use same token')

// Active subscription conflict
console.warn('⚠️ Purchase token already used for active subscription')

// Successful reactivation
console.log('♻️ Reactivating subscription for same user')

// New subscription
console.log('✅ New subscription created')
```

### 4. Translation Support
Added new translation keys for better user feedback:

**English:**
- `already_have_active`: "You already have an active subscription"
- `subscription_reactivated`: "Your subscription has been reactivated!"

**Persian:**
- `already_have_active`: "شما در حال حاضر یک اشتراک فعال دارید"
- `subscription_reactivated`: "اشتراک شما مجدداً فعال شد!"

## Security Considerations

### ✅ Maintained Security
- **Fraud Prevention**: Different users cannot use the same purchase token
- **Duplicate Prevention**: Same user cannot activate an already-active subscription
- **Audit Trail**: All attempts are logged with detailed context

### ✅ Improved UX
- **Testing Friendly**: Developers can test purchases multiple times
- **Renewal Support**: Users can reactivate expired subscriptions
- **Clear Errors**: Users get specific error messages for each scenario

## Use Cases

### Case 1: First Purchase ✅
```
User A purchases monthly subscription
→ Creates new subscription record
→ isActive: true
```

### Case 2: Reactivation (Same User, Inactive) ✅
```
User A's subscription expires (isActive: false)
User A purchases again with same token
→ Updates existing subscription record
→ isActive: true, new dates
```

### Case 3: Fraud Attempt (Different User) ❌
```
User A purchases subscription
User B tries to use User A's token
→ Blocked: "Purchase token already used"
→ Logged as fraud attempt
```

### Case 4: Duplicate Active (Same User) ❌
```
User A has active subscription
User A tries to purchase again with same token
→ Blocked: "You already have an active subscription"
```

## Testing Scenarios

### Test 1: Normal Purchase Flow
1. User makes first purchase
2. Validates with Cafe Bazaar ✅
3. Verifies with backend ✅
4. Subscription created ✅

### Test 2: Reactivation Flow
1. User's subscription expires (manually set isActive: false)
2. User purchases again with same token
3. Validates with Cafe Bazaar ✅
4. Verifies with backend ✅
5. Existing subscription updated ✅

### Test 3: Security Test
1. User A purchases subscription
2. User B tries to use User A's token
3. Backend rejects with fraud warning ✅

## Files Modified

1. **Server Controller**
   - `/server/src/controllers/subscriptionController.ts`
   - Updated `verifyPurchase()` method
   - Added smart token reuse logic
   - Added update vs create logic
   - Enhanced logging

2. **Translations**
   - `/assets/translations/fa-IR.json`
   - `/assets/translations/en-US.json`
   - Added `already_have_active` and `subscription_reactivated` keys

## API Response Changes

### Success Response (Reactivation)
```json
{
  "success": true,
  "message": "Subscription activated successfully",
  "data": {
    "subscription": {
      "planType": "monthly",
      "isActive": true,
      "startDate": "2025-10-13T17:58:00.000Z",
      "expiryDate": "2025-11-13T17:58:00.000Z"
    }
  }
}
```

### Error Response (Active Subscription)
```json
{
  "success": false,
  "message": "You already have an active subscription"
}
```

### Error Response (Fraud Attempt)
```json
{
  "success": false,
  "message": "Purchase token already used"
}
```

## Deployment Notes

### No Database Migration Required
- Uses existing schema
- Updates existing records when reactivating
- No breaking changes

### Backward Compatible
- Existing subscriptions work as before
- New logic only affects reactivation scenarios
- No changes to API contracts

## Monitoring

Watch for these log messages:

```bash
# Normal operation
✅ New subscription created
♻️ Reactivating subscription for same user

# Warnings
⚠️ Purchase token already used for active subscription

# Security alerts
🚨 Fraud attempt: Different user trying to use same token
```

## Next Steps

1. **Test the fix:**
   ```bash
   # Make a purchase with the app
   # Check server logs for "♻️ Reactivating subscription"
   ```

2. **Verify database:**
   ```bash
   # Check that subscription is updated, not duplicated
   db.subscriptions.find({ userId: "..." })
   ```

3. **Test edge cases:**
   - Same user, inactive subscription → Should work ✅
   - Same user, active subscription → Should block ❌
   - Different user, same token → Should block ❌

## Summary

The fix allows users to reactivate their subscriptions using the same purchase token when their previous subscription is inactive, while maintaining strong security against fraud attempts. This is especially useful for:
- Development and testing
- Users who want to renew after expiration
- Handling Cafe Bazaar sandbox purchases

The implementation maintains all security checks while providing a better user experience for legitimate reactivation scenarios.
