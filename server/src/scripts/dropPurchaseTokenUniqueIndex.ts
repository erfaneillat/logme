import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Migration script to drop the unique index on purchaseToken field
 * This allows multiple subscription records with the same purchase token
 * (useful for testing, renewals, and reactivations)
 */
async function dropPurchaseTokenUniqueIndex() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/logme';

        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }
        const collection = db.collection('subscriptions');

        // Get existing indexes (handle missing collection)
        console.log('\n📋 Current indexes:');
        let indexes: any[] = [];
        try {
            indexes = await collection.indexes();
            indexes.forEach((index: any) => {
                console.log(`  - ${index.name}:`, index.key);
            });
        } catch (err: any) {
            if (err?.code === 26 || err?.codeName === 'NamespaceNotFound' || /ns does not exist/i.test(err?.errmsg || '')) {
                console.log('ℹ️  Collection "subscriptions" does not exist. Nothing to drop.');
                console.log('\n✅ Migration completed successfully!');
                return;
            }
            throw err;
        }

        // Check if purchaseToken_1 index exists
        const purchaseTokenIndex = indexes.find((idx: any) => idx.name === 'purchaseToken_1');

        if (purchaseTokenIndex) {
            console.log('\n🗑️  Dropping purchaseToken_1 unique index...');
            await collection.dropIndex('purchaseToken_1');
            console.log('✅ Successfully dropped purchaseToken_1 index');
        } else {
            console.log('\n⚠️  purchaseToken_1 index not found (may have been already dropped)');
        }

        // Verify the index was dropped
        console.log('\n📋 Indexes after migration:');
        const updatedIndexes = await collection.indexes();
        updatedIndexes.forEach((index: any) => {
            console.log(`  - ${index.name}:`, index.key);
        });

        console.log('\n✅ Migration completed successfully!');
        console.log('ℹ️  You can now create multiple subscriptions with the same purchase token');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the migration
dropPurchaseTokenUniqueIndex();
