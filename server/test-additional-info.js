const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
let authToken = '';

// Test functions
async function testSendVerificationCode() {
    console.log('\n1. Testing send verification code...');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/send-code`, {
            phone: '+1234567890'
        });
        console.log('✅ Send verification code successful:', response.data.message);
    } catch (error) {
        console.error('❌ Send verification code failed:', error.response?.data || error.message);
    }
}

async function testVerifyPhone() {
    console.log('\n2. Testing phone verification...');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/verify-phone`, {
            phone: '+1234567890',
            verificationCode: '123456'
        });

        if (response.data.success) {
            authToken = response.data.data.token;
            console.log('✅ Phone verification successful');
            console.log('📱 User data:', response.data.data.user);
            console.log('🔑 Token received:', authToken.substring(0, 20) + '...');
        }
    } catch (error) {
        console.error('❌ Phone verification failed:', error.response?.data || error.message);
    }
}

async function testSaveAdditionalInfo() {
    console.log('\n3. Testing save additional info...');
    try {
        const response = await axios.post(`${BASE_URL}/api/user/additional-info`, {
            gender: 'male',
            age: 25,
            weight: 70.5,
            height: 175.0,
            activityLevel: 'moderately_active',
            weightGoal: 'lose_weight'
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('✅ Save additional info successful:', response.data.message);
        console.log('📊 Additional info data:', response.data.data.additionalInfo);
    } catch (error) {
        console.error('❌ Save additional info failed:', error.response?.data || error.message);
    }
}

async function testGetAdditionalInfo() {
    console.log('\n4. Testing get additional info...');
    try {
        const response = await axios.get(`${BASE_URL}/api/user/additional-info`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('✅ Get additional info successful');
        console.log('📊 Retrieved data:', response.data.data.additionalInfo);
    } catch (error) {
        console.error('❌ Get additional info failed:', error.response?.data || error.message);
    }
}

async function testMarkAdditionalInfoCompleted() {
    console.log('\n5. Testing mark additional info completed...');
    try {
        const response = await axios.post(`${BASE_URL}/api/user/mark-additional-info-completed`, {}, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('✅ Mark additional info completed successful:', response.data.message);
    } catch (error) {
        console.error('❌ Mark additional info completed failed:', error.response?.data || error.message);
    }
}

async function testGetProfileAfterCompletion() {
    console.log('\n6. Testing get profile after completion...');
    try {
        const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('✅ Get profile successful');
        console.log('👤 User profile:', response.data.data.user);
        console.log('✅ hasCompletedAdditionalInfo:', response.data.data.user.hasCompletedAdditionalInfo);
    } catch (error) {
        console.error('❌ Get profile failed:', error.response?.data || error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Additional Info API Tests...\n');

    await testSendVerificationCode();
    await testVerifyPhone();

    if (authToken) {
        await testSaveAdditionalInfo();
        await testGetAdditionalInfo();
        await testMarkAdditionalInfoCompleted();
        await testGetProfileAfterCompletion();
    } else {
        console.log('❌ Cannot continue tests without authentication token');
    }

    console.log('\n🏁 Tests completed!');
}

// Run tests
runAllTests().catch(console.error); 