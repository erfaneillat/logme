import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SubscriptionPlan from '../models/SubscriptionPlan';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cal_ai';

async function initializeSubscriptionPlans() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if plans already exist
        const existingPlans = await SubscriptionPlan.find({});

        if (existingPlans.length === 0) {
            console.log('No subscription plans found. Creating default plans...');

            // Create Monthly Plan
            await SubscriptionPlan.create({
                name: 'Monthly Plan',
                duration: 'monthly',
                price: 99000, // Default price in Toman
                isActive: true,
                features: [],
                sortOrder: 2,
            });

            // Create Yearly Plan
            await SubscriptionPlan.create({
                name: 'Yearly Plan',
                duration: 'yearly',
                price: 499000, // Default price in Toman
                originalPrice: 1188000, // 99000 * 12
                discountPercentage: 60,
                pricePerMonth: 41583, // 499000 / 12
                isActive: true,
                features: [],
                sortOrder: 1,
            });

            console.log('✅ Default subscription plans created successfully!');
        } else {
            console.log('Subscription plans already exist:');
            existingPlans.forEach(plan => {
                console.log(`- ${plan.name} (${plan.duration}): ${plan.price} Toman`);
            });
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error initializing subscription plans:', error);
        process.exit(1);
    }
}

// Run the initialization
initializeSubscriptionPlans();

