const axios = require('axios');

const BASE_URL = 'http://localhost:9000';

async function testLuckyWheelAPI() {
    try {
        console.log('🧪 Testing Lucky Wheel API...\n');

        // First, we need to authenticate to get a token
        console.log('1. Testing authentication...');
        const phone = '+989123456789'; // Test phone number

        // Send verification code
        const sendCodeResponse = await axios.post(`${BASE_URL}/api/auth/send-code`, {
            phone: phone
        });
        console.log('✅ Send code response:', sendCodeResponse.data);

        // For testing, we'll use a mock verification code
        // In real scenario, you'd get this from SMS
        const verificationCode = '123456';

        // Verify phone
        const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-phone`, {
            phone: phone,
            verificationCode: verificationCode
        });
        console.log('✅ Verify phone response:', verifyResponse.data);

        const token = verifyResponse.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Test logging lucky wheel view
        console.log('\n2. Testing lucky wheel view logging...');
        const logViewResponse = await axios.post(`${BASE_URL}/api/lucky-wheel/view`, {}, { headers });
        console.log('✅ Log view response:', logViewResponse.data);

        // Test getting lucky wheel stats
        console.log('\n3. Testing lucky wheel stats...');
        const statsResponse = await axios.get(`${BASE_URL}/api/lucky-wheel/stats`, { headers });
        console.log('✅ Stats response:', statsResponse.data);

        // Test getting lucky wheel history
        console.log('\n4. Testing lucky wheel history...');
        const historyResponse = await axios.get(`${BASE_URL}/api/lucky-wheel/history`, { headers });
        console.log('✅ History response:', historyResponse.data);

        console.log('\n🎉 All tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testLuckyWheelAPI();
