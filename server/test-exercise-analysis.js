// Test script for exercise analysis API
const axios = require('axios');

const BASE_URL = 'http://localhost:9001'; // dev environment
const TEST_TOKEN = 'your-jwt-token-here'; // Replace with actual token

async function testExerciseAnalysis() {
    try {
        console.log('Testing exercise analysis API...');

        const response = await axios.post(`${BASE_URL}/api/logs/analyze-exercise`, {
            exercise: 'Running',
            duration: 30
        }, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('Test successful!');
    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

// Uncomment to run test (after setting up proper token)
// testExerciseAnalysis();

console.log('Exercise analysis test script created.');
console.log('To run this test:');
console.log('1. Start the development server: npm run dev');
console.log('2. Get a valid JWT token from authentication');
console.log('3. Replace TEST_TOKEN with your actual token');
console.log('4. Run: node test-exercise-analysis.js');