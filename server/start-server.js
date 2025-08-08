const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Cal AI Server...\n');

// Check if dist folder exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    console.log('📦 Building TypeScript files...');
    const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'inherit',
        cwd: __dirname
    });

    buildProcess.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Build completed successfully');
            startServer();
        } else {
            console.error('❌ Build failed');
            process.exit(1);
        }
    });
} else {
    startServer();
}

function startServer() {
    console.log('🔧 Starting server...');

    // Set environment variables
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/cal_ai';

    const serverProcess = spawn('node', ['dist/index.js'], {
        stdio: 'inherit',
        cwd: __dirname
    });

    serverProcess.on('close', (code) => {
        if (code !== 0) {
            console.log('\n❌ Server stopped with error code:', code);
            console.log('\n🔧 Troubleshooting tips:');
            console.log('1. Make sure MongoDB is running:');
            console.log('   - macOS: brew services start mongodb-community');
            console.log('   - Windows: Start MongoDB service');
            console.log('   - Linux: sudo systemctl start mongod');
            console.log('2. Check if MongoDB is accessible at: mongodb://127.0.0.1:27017');
            console.log('3. Make sure port 3000 is available');
        }
    });

    // Handle process termination
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        serverProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down server...');
        serverProcess.kill('SIGTERM');
    });
} 