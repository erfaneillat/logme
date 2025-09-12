const mongoose = require('mongoose');
const { updateStreakOnFirstMeal } = require('./dist/services/streakService');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cal_ai_test';

async function testStreakOnFirstMeal() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Test user ID (you may need to adjust this based on your test data)
        const testUserId = '507f1f77bcf86cd799439011'; // Replace with actual user ID
        const testDate = '2024-01-15';

        console.log(`Testing streak update for user ${testUserId} on date ${testDate}`);

        // Test the new function
        await updateStreakOnFirstMeal(testUserId, testDate);
        console.log('Streak update completed successfully');

        // Verify the user's streak was updated
        const User = require('./dist/models/User').default;
        const user = await User.findById(testUserId);

        if (user) {
            console.log('User streak info:');
            console.log(`- Current streak: ${user.streakCount}`);
            console.log(`- Last streak date: ${user.lastStreakDate}`);
        } else {
            console.log('User not found');
        }

        // Verify the streak record was created
        const Streak = require('./dist/models/Streak').default;
        const streakRecord = await Streak.findOne({ userId: testUserId, date: testDate });

        if (streakRecord) {
            console.log('Streak record:');
            console.log(`- Date: ${streakRecord.date}`);
            console.log(`- Completed: ${streakRecord.completed}`);
        } else {
            console.log('No streak record found');
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the test
testStreakOnFirstMeal();
