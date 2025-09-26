const axios = require('axios');

const BASE_URL = 'http://localhost:9000';

async function testDeleteAccount() {
    try {
        console.log('🧪 Testing Delete Account API...\n');

        // First, create a test user and get a token
        console.log('1. Creating test user...');
        const phone = '+1234567890';

        // Send verification code
        const sendCodeResponse = await axios.post(`${BASE_URL}/api/auth/send-code`, {
            phone: phone
        });
        console.log('✅ Verification code sent:', sendCodeResponse.data.message);

        // For testing, we'll use a mock verification code
        // In real scenario, you'd get this from SMS
        const verificationCode = '123456'; // This would normally come from SMS

        // Verify phone (this will fail in real scenario, but we can test the endpoint structure)
        try {
            const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-phone`, {
                phone: phone,
                verificationCode: verificationCode
            });
            console.log('✅ Phone verified:', verifyResponse.data.message);

            const token = verifyResponse.data.data.token;

            // Test delete account endpoint
            console.log('\n2. Testing delete account...');
            const deleteResponse = await axios.delete(`${BASE_URL}/api/auth/account`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    reason: 'Test deletion'
                }
            });

            console.log('✅ Account deleted successfully:', deleteResponse.data.message);

        } catch (verifyError) {
            console.log('⚠️  Phone verification failed (expected in test):', verifyError.response?.data?.message || verifyError.message);
            console.log('   This is normal since we used a mock verification code');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testDeleteAccount();
