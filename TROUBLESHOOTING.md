# Troubleshooting Guide

This guide helps you resolve common issues with the Cal AI phone authentication system.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- Flutter 3.6+
- Dart 3.6+

## 🔧 Server Issues

### MongoDB Connection Error

**Error**: `MongoParseError: option buffermaxentries is not supported`

**Solution**: 
1. Make sure MongoDB is running:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Windows
   # Start MongoDB service from Services
   
   # Linux
   sudo systemctl start mongod
   ```

2. Check MongoDB status:
   ```bash
   # macOS
   brew services list | grep mongodb
   
   # Linux
   sudo systemctl status mongod
   ```

3. Test MongoDB connection:
   ```bash
   mongosh mongodb://127.0.0.1:27017/cal_ai
   ```

### Server Won't Start

**Error**: `Port 3000 is already in use`

**Solution**:
1. Find and kill the process using port 3000:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. Or change the port in the server configuration.

### Build Errors

**Error**: TypeScript compilation errors

**Solution**:
1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Start the server:
   ```bash
   npm start
   ```

## 📱 Flutter Issues

### Missing Dependencies

**Error**: `The imported package 'http' isn't a dependency`

**Solution**:
1. Add missing dependencies to `pubspec.yaml`:
   ```yaml
   dependencies:
     http: ^1.1.0
   ```

2. Install dependencies:
   ```bash
   flutter pub get
   ```

### Provider Errors

**Error**: `Undefined name 'authNotifierProvider'`

**Solution**:
1. Make sure you're using the correct provider:
   ```dart
   // Use loginProvider instead of authNotifierProvider
   final loginNotifier = ref.read(loginProvider.notifier);
   final loginState = ref.watch(loginProvider);
   ```

2. Import the correct provider:
   ```dart
   import '../providers/login_provider.dart';
   ```

### Analysis Errors

**Error**: Flutter analysis shows errors

**Solution**:
1. Run analysis to see all issues:
   ```bash
   flutter analyze
   ```

2. Fix critical errors (ignore deprecation warnings for now)

3. Run tests to ensure everything works:
   ```bash
   flutter test
   ```

## 🧪 Testing Issues

### Server Tests Fail

**Error**: API tests fail

**Solution**:
1. Make sure the server is running:
   ```bash
   cd server
   node test-auth.js
   ```

2. Check if MongoDB is accessible

3. Verify environment variables are set

### Flutter Tests Fail

**Error**: Widget tests fail

**Solution**:
1. Run specific test:
   ```bash
   flutter test test/phone_auth_test.dart
   ```

2. Check mock implementations

3. Ensure all dependencies are properly injected

## 🔐 Authentication Issues

### OTP Not Working

**Problem**: Verification codes don't work

**Solution**:
1. Check server logs for OTP generation
2. Verify the code is 6 digits
3. Check if the code has expired (10 minutes)
4. Ensure phone number format is correct (+1234567890)

### JWT Token Issues

**Problem**: Authentication tokens not working

**Solution**:
1. Check JWT_SECRET environment variable
2. Verify token expiration (7 days)
3. Check token format in Authorization header

## 🌐 Network Issues

### CORS Errors

**Error**: Cross-origin request blocked

**Solution**:
1. Check CORS configuration in server
2. Verify allowed origins
3. Ensure proper headers are set

### API Endpoint Not Found

**Error**: 404 errors for API endpoints

**Solution**:
1. Check server routes configuration
2. Verify endpoint URLs
3. Ensure server is running on correct port

## 📊 Database Issues

### MongoDB Connection

**Error**: Cannot connect to MongoDB

**Solution**:
1. Check MongoDB service status
2. Verify connection string
3. Check firewall settings
4. Ensure MongoDB is accessible from your IP

### Data Persistence

**Problem**: Data not saving/loading

**Solution**:
1. Check database permissions
2. Verify schema validation
3. Check for validation errors
4. Review error logs

## 🛠️ Development Tips

### Environment Setup

1. Create a `.env` file in the server directory:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/cal_ai
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3000
   NODE_ENV=development
   ```

2. Use the start script:
   ```bash
   cd server
   node start-server.js
   ```

### Debugging

1. Enable debug logging:
   ```bash
   NODE_ENV=development DEBUG=* npm start
   ```

2. Check Flutter logs:
   ```bash
   flutter logs
   ```

3. Use Flutter DevTools for debugging

### Performance

1. Monitor MongoDB performance
2. Check API response times
3. Optimize database queries
4. Use proper indexing

## 📞 Getting Help

If you're still experiencing issues:

1. Check the logs for detailed error messages
2. Verify all prerequisites are installed
3. Ensure you're using compatible versions
4. Check the GitHub issues for similar problems
5. Create a new issue with detailed information

## 🔄 Common Commands

```bash
# Server
cd server
npm install
npm run build
npm start

# Flutter
flutter pub get
flutter analyze
flutter test
flutter run

# MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
```

## 📝 Log Locations

- **Server logs**: Console output
- **MongoDB logs**: `/var/log/mongodb/mongod.log` (Linux)
- **Flutter logs**: `flutter logs`
- **Build logs**: Console output during build process 