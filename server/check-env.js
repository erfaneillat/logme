// Simple environment variable check utility
require('dotenv').config();

console.log('Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('OPENAI_API_KEY starts with sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-') || false);

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is missing or empty!');
    process.exit(1);
} else {
    console.log('✅ OPENAI_API_KEY is properly configured');
}