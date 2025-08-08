const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/auth';

async function testPhoneAuth() {
    try {
        console.log('🧪 Testing Phone Authentication API...\n');

        // Test 1: Send verification code
        console.log('1. Testing send verification code...');
        const sendCodeResponse = await axios.post(`${BASE_URL}/send-code`, {
            phone: '+1234567890'
        });
        console.log('✅ Send code response:', sendCodeResponse.data);

        // Get the verification code from response (in development mode)
        const verificationCode = sendCodeResponse.data.data.verificationCode;
        console.log(`📱 Verification code: ${verificationCode}\n`);

        // Test 2: Verify phone with code
        console.log('2. Testing verify phone...');
        const verifyResponse = await axios.post(`${BASE_URL}/verify-phone`, {
            phone: '+1234567890',
            verificationCode: verificationCode
        });
        console.log('✅ Verify phone response:', verifyResponse.data);

        const token = verifyResponse.data.data.token;
        console.log(`🔑 JWT Token: ${token.substring(0, 20)}...\n`);

        // Test 3: Get profile with token
        console.log('3. Testing get profile...');
        const profileResponse = await axios.get(`${BASE_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Get profile response:', profileResponse.data);

        // Test 4: Update profile
        console.log('4. Testing update profile...');
        const updateResponse = await axios.put(`${BASE_URL}/profile`, {
            name: 'Test User',
            email: 'test@example.com'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Update profile response:', updateResponse.data);

        // Test 5: Refresh token
        console.log('5. Testing refresh token...');
        const refreshResponse = await axios.post(`${BASE_URL}/refresh-token`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Refresh token response:', refreshResponse.data);

        console.log('\n🎉 All tests passed! Phone authentication is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testPhoneAuth(); 