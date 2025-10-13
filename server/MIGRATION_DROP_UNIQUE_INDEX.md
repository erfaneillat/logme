# Migration: Drop Purchase Token Unique Index

## Problem

The `purchaseToken` field in the `subscriptions` collection has a unique index that prevents creating multiple subscription records with the same purchase token. This causes an error:

```
MongoServerError: E11000 duplicate key error collection: cal_ai.subscriptions 
index: purchaseToken_1 dup key: { purchaseToken: "4ZaSGWaFsQvwU-OQ" }
```

## Why We Need This

We want to allow multiple subscription records with the same purchase token for:
- **Testing**: Developers can test purchases multiple times
- **Renewals**: Users can renew subscriptions
- **Reactivations**: Users can reactivate expired subscriptions
- **History**: Maintain a complete purchase history

## Solution

1. Remove `unique: true` from the Subscription model
2. Drop the existing unique index from MongoDB

## How to Run the Migration

### Step 1: Stop the server (if running)
```bash
# Press Ctrl+C in the terminal running the server
```

### Step 2: Run the migration script
```bash
cd server
npm run migrate:drop-purchase-token-index
```

### Expected Output:
```
🔗 Connecting to MongoDB...
✅ Connected to MongoDB

📋 Current indexes:
  - _id_: { _id: 1 }
  - userId_1: { userId: 1 }
  - userId_1_isActive_1: { userId: 1, isActive: 1 }
  - expiryDate_1: { expiryDate: 1 }
  - purchaseToken_1: { purchaseToken: 1 }

🗑️  Dropping purchaseToken_1 unique index...
✅ Successfully dropped purchaseToken_1 index

📋 Indexes after migration:
  - _id_: { _id: 1 }
  - userId_1: { userId: 1 }
  - userId_1_isActive_1: { userId: 1, isActive: 1 }
  - expiryDate_1: { expiryDate: 1 }

✅ Migration completed successfully!
ℹ️  You can now create multiple subscriptions with the same purchase token

🔌 Disconnected from MongoDB
```

### Step 3: Restart the server
```bash
npm run dev
```

## What Changed

### Before:
- ❌ Each purchase token could only exist once in the database
- ❌ Reactivation with same token failed with duplicate key error
- ❌ Testing required clearing database between purchases

### After:
- ✅ Same purchase token can exist multiple times
- ✅ Each purchase creates a new subscription record
- ✅ Full purchase history is maintained
- ✅ Old subscriptions are deactivated (`isActive: false`)
- ✅ New subscription is created and activated

## Security Considerations

### Still Protected Against:
- ✅ **Fraud**: Different users cannot use the same token (checked in controller)
- ✅ **Duplicate Active**: Same user cannot have multiple active subscriptions
- ✅ **Rate Limiting**: Purchase attempts are rate-limited per user

### Controller Logic:
```typescript
// Check if purchase token already exists
const existingSubscription = await Subscription.findOne({ purchaseToken });
if (existingSubscription) {
    const isSameUser = existingSubscription.userId.toString() === userId.toString();
    const isInactive = !existingSubscription.isActive;
    
    if (!isSameUser) {
        // ❌ Different user - FRAUD ATTEMPT
        return 400: "Purchase token already used"
    }
    
    if (!isInactive) {
        // ❌ Same user, active subscription
        return 400: "You already have an active subscription"
    }
    
    // ✅ Same user, inactive subscription - ALLOW
}

// Deactivate old subscriptions
await Subscription.updateMany(
    { userId, isActive: true },
    { $set: { isActive: false } }
);

// Create new subscription record
const subscription = new Subscription({ ... });
await subscription.save();
```

## Database Structure After Migration

### Example User's Subscriptions:
```javascript
[
  {
    _id: ObjectId("..."),
    userId: ObjectId("68d6e88c984086a6ee49de26"),
    purchaseToken: "4ZaSGWaFsQvwU-OQ",
    planType: "monthly",
    isActive: false,
    startDate: "2025-09-13T00:00:00.000Z",
    expiryDate: "2025-10-13T00:00:00.000Z",
    createdAt: "2025-09-13T10:00:00.000Z"
  },
  {
    _id: ObjectId("..."),
    userId: ObjectId("68d6e88c984086a6ee49de26"),
    purchaseToken: "4ZaSGWaFsQvwU-OQ",  // Same token, new record
    planType: "monthly",
    isActive: true,
    startDate: "2025-10-13T00:00:00.000Z",
    expiryDate: "2025-11-13T00:00:00.000Z",
    createdAt: "2025-10-13T18:17:00.000Z"
  }
]
```

## Rollback (if needed)

If you need to restore the unique constraint:

```bash
# Connect to MongoDB
mongosh

# Use the database
use cal_ai

# Create unique index
db.subscriptions.createIndex({ purchaseToken: 1 }, { unique: true })
```

**Warning**: This will fail if duplicate purchase tokens already exist in the database.

## Files Modified

1. **Model**: `/server/src/models/Subscription.ts`
   - Removed `unique: true` from `purchaseToken` field

2. **Migration Script**: `/server/src/scripts/dropPurchaseTokenUniqueIndex.ts`
   - Created migration to drop the index

3. **Package.json**: `/server/package.json`
   - Added `migrate:drop-purchase-token-index` script

## Verification

After running the migration, verify it worked:

```bash
# Connect to MongoDB
mongosh

# Use the database
use cal_ai

# Check indexes
db.subscriptions.getIndexes()

# You should NOT see purchaseToken_1 with unique: true
```

## Next Steps

1. Run the migration: `npm run migrate:drop-purchase-token-index`
2. Restart the server: `npm run dev`
3. Test the purchase flow - it should now work!
4. Verify multiple subscriptions are created in the database

## Support

If you encounter any issues:
1. Check MongoDB is running: `mongosh`
2. Check the migration output for errors
3. Verify the index was dropped: `db.subscriptions.getIndexes()`
4. Check server logs for detailed error messages
