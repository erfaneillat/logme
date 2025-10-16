# Push Notifications Quick Start Guide

This guide will help you get push notifications working quickly for your ticketing system.

## Overview

When an admin replies to a user's ticket, the user will receive:
1. **In-app notification** stored in the database
2. **Push notification** sent to their device via Firebase Cloud Messaging

## Prerequisites

✅ Firebase project created
✅ Node.js server running
✅ Flutter app installed on a device

## Quick Setup (5 Steps)

### Step 1: Install Firebase Admin SDK (Backend)

```bash
cd server
npm install firebase-admin
```

### Step 2: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ (Settings) → **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file

### Step 3: Configure Backend Environment

Add to your `server/.env`:

```env
# Option A: Use JSON string (recommended for production)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project",...}'

# Option B: Use file path (recommended for development)
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

**Important**: Add `serviceAccountKey.json` to `.gitignore`!

### Step 4: Restart Server

```bash
# If using PM2
pm2 restart all

# If running directly
npm run dev
```

Check logs for:
```
✅ Firebase Admin SDK initialized
```

### Step 5: Setup Flutter App

```bash
cd /path/to/flutter/app

# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Configure Firebase
flutterfire configure
```

Follow the prompts to select your Firebase project.

### Step 6: Add Flutter Dependencies

Add to `pubspec.yaml`:

```yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.6
  flutter_local_notifications: ^16.3.0
```

Run:
```bash
flutter pub get
```

### Step 7: Initialize Firebase in Flutter

Update `lib/main.dart`:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:cal_ai/services/fcm_service.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  runApp(ProviderScope(child: MyApp()));
}

class MyApp extends ConsumerStatefulWidget {
  @override
  ConsumerState<MyApp> createState() => _MyAppState();
}

class _MyAppState extends ConsumerState<MyApp> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 1), () async {
      final apiService = ref.read(apiServiceProvider);
      await FCMService().initialize(apiService);
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(...);
  }
}
```

### Step 8: Test It!

1. **Build and run the Flutter app** on a real device (not simulator for iOS)
   ```bash
   flutter run
   ```

2. **Check logs** for:
   ```
   📱 FCM Token obtained: xxx...
   ✅ FCM token registered with server
   ```

3. **Login to the app** as a user

4. **Create a ticket** from the app

5. **Login to admin panel** and reply to the ticket

6. **Check the user's device** - you should see a push notification! 🎉

## How It Works

```
User Creates Ticket
        ↓
Admin Opens Ticket in Panel
        ↓
Admin Replies to Ticket
        ↓
Backend Creates Notification in DB
        ↓
Backend Gets User's FCM Tokens
        ↓
Firebase Admin SDK Sends Push
        ↓
User's Device Shows Notification
```

## Verification Checklist

- [ ] Server logs show "✅ Firebase Admin SDK initialized"
- [ ] Flutter logs show "✅ FCM service initialized successfully"
- [ ] Flutter logs show "✅ FCM token registered with server"
- [ ] User document in MongoDB has `fcmTokens` array with at least one token
- [ ] Admin panel shows unread ticket count
- [ ] When admin replies, user receives push notification
- [ ] Tapping notification opens the app (optionally navigate to ticket)

## Troubleshooting

### Backend Not Sending Notifications

**Check Firebase initialization:**
```bash
# Look for this in server logs
✅ Firebase Admin SDK initialized
```

If you see "⚠️ Firebase credentials not configured":
- Verify `.env` file has `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_PATH`
- Restart the server

**Check notification creation:**
```bash
# Server logs when admin replies
✅ Notification created for user xxx
📩 Push notification sent: 1 success, 0 failed
```

### Flutter Not Receiving Notifications

**Android:**
1. Ensure `minSdkVersion` is at least 21 in `android/app/build.gradle`
2. Verify `google-services.json` exists in `android/app/`
3. Rebuild: `flutter clean && flutter run`

**iOS:**
1. Must use a **physical device** (not simulator)
2. Check Xcode: Capabilities → Push Notifications is enabled
3. Verify APNs certificate is uploaded to Firebase Console
4. Check iOS Settings → Your App → Notifications are allowed

**General:**
```bash
# Check if token was registered
curl http://localhost:9000/api/fcm/tokens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Still Not Working?

1. **Check Firebase Console** → Cloud Messaging for delivery logs
2. **Check server logs** for errors when sending notifications
3. **Verify backend can reach Firebase**: 
   ```bash
   curl https://fcm.googleapis.com/
   ```
4. **Test with Firebase Console**:
   - Go to Firebase Console → Cloud Messaging
   - Send a test message using the FCM token from your device

## Platform-Specific Setup

### Android Only
- See `FLUTTER_FIREBASE_SETUP.md` → Step 4

### iOS Only  
- See `FLUTTER_FIREBASE_SETUP.md` → Step 5
- Requires physical device
- Requires APNs certificate setup

## Complete Documentation

- **Backend Setup**: [`server/FIREBASE_SETUP.md`](server/FIREBASE_SETUP.md)
- **Flutter Setup**: [`FLUTTER_FIREBASE_SETUP.md`](FLUTTER_FIREBASE_SETUP.md)
- **API Documentation**: Check backend routes in `server/src/routes/fcmRoutes.ts`

## Production Deployment

### Backend (DigitalOcean/VPS)

1. Set environment variable:
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   ```

2. Restart server:
   ```bash
   pm2 restart all
   ```

### Flutter (App Stores)

1. Ensure Firebase is configured for production
2. Build release APK/IPA with Firebase dependencies
3. Test on production devices before submitting

## FAQ

**Q: Do notifications work in development?**
A: Yes! Just make sure you're using a real device for iOS.

**Q: Can I test without a real device?**
A: Android emulator works, but iOS simulator does NOT support push notifications.

**Q: What if user has multiple devices?**
A: Our implementation supports multiple FCM tokens per user. All devices will receive notifications.

**Q: How do I debug notification delivery?**
A: Check Firebase Console → Cloud Messaging → Reports for delivery statistics.

**Q: Do notifications work when app is closed?**
A: Yes! Firebase handles delivery even when the app is terminated.

**Q: What happens to invalid tokens?**
A: They're automatically removed from the database when detected.

## Need Help?

1. Check the detailed setup guides
2. Review server logs for errors
3. Check Flutter logs with `flutter run -v`
4. Test with Firebase Console test message
5. Verify your Firebase project settings

## Success! 🎉

If you can:
- ✅ See FCM token in server logs
- ✅ Trigger a push notification by admin replying
- ✅ Receive the notification on your device

You're all set! Push notifications are working correctly.
