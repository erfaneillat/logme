#!/usr/bin/env node

/**
 * Development Setup Script for Cal AI Server
 *
 * This script helps set up the development environment with:
 * - NODE_ENV=development for hardcoded verification code "123456"
 * - Proper port configuration (9000) for mobile app compatibility
 * - Environment variable configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Cal AI Server for Development...\n');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExample = `# Development Environment Configuration
NODE_ENV=development

# Server Configuration
PORT=9000
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/cal_ai

# JWT Configuration
JWT_SECRET=your-secret-key-for-development

# OpenAI Configuration (Optional for development)
OPENAI_API_KEY=your-openai-api-key-here

# SMS Service Configuration (Optional for development)
KAVENEGAR_API_KEY=your-kavenegar-api-key-here

# CORS Configuration
CORS_ORIGIN=*`;

if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envExample);
    console.log('✅ Created .env file with development configuration');
} else {
    console.log('ℹ️  .env file already exists');
}

// Development verification code info
console.log('\n📱 Development Verification Code:');
console.log('   • Use "123456" as the verification code');
console.log('   • This works only in development mode (NODE_ENV=development)');
console.log('   • In production, real SMS verification is required\n');

console.log('🛠️  Server Configuration:');
console.log('   • Port: 9000 (matches mobile app configuration)');
console.log('   • Host: 0.0.0.0 (accessible from mobile emulator)');
console.log('   • Environment: development\n');

console.log('📋 Next Steps:');
console.log('   1. Configure your MongoDB connection string in .env');
console.log('   2. Add your OpenAI API key for food analysis (optional)');
console.log('   3. Add your KaveNegar API key for SMS (optional)');
console.log('   4. Run: npm run dev');
console.log('   5. Mobile app will connect to: http://10.0.2.2:9000\n');

console.log('✅ Development setup complete!');
console.log('💡 Remember: Use "123456" as the verification code for testing!');
