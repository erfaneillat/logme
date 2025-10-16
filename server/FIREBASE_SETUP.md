# Firebase Push Notifications Setup Guide

This guide explains how to set up Firebase Cloud Messaging (FCM) for push notifications.

## Prerequisites

1. A Firebase project (create one at https://console.firebase.google.com)
2. Node.js server with access to Firebase Admin SDK

## Installation

### 1. Install Firebase Admin SDK

```bash
cd server
npm install firebase-admin
```

### 2. Get Firebase Service Account Key

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Click on the gear icon (⚙️) → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file securely (DO NOT commit to git)

### 3. Configure Environment Variables

Add one of the following to your `.env` file:

**Option A: Using JSON string (recommended for production)**
```env
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-id",...}'
```

**Option B: Using file path (recommended for development)**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/your/serviceAccountKey.json
```

### 4. Add to .gitignore

Make sure your Firebase credentials are not committed:

```
# Firebase service account keys
serviceAccountKey.json
firebase-adminsdk-*.json
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | JSON string of service account | Either this or PATH |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON file | Either this or JSON |

If neither variable is set, the server will start normally but push notifications will be disabled.

## API Endpoints

### Register FCM Token
```
POST /api/fcm/register
Authorization: Bearer <token>
Body: { "token": "fcm_device_token_here" }
```

### Remove FCM Token
```
POST /api/fcm/remove
Authorization: Bearer <token>
Body: { "token": "fcm_device_token_here" }
```

### Get User's FCM Tokens (Debug)
```
GET /api/fcm/tokens
Authorization: Bearer <token>
```

## How It Works

1. **User Registration**: When a user logs in on their device, the Flutter app obtains an FCM token
2. **Token Storage**: The token is sent to `/api/fcm/register` and stored in the user's document
3. **Notification Creation**: When an event occurs (e.g., admin replies to ticket), a notification is created
4. **Push Delivery**: The notification service automatically sends push notifications to all registered devices
5. **Token Cleanup**: Invalid or expired tokens are automatically removed from the database

## Notification Flow

```
Event Trigger (Admin Reply)
        ↓
Create DB Notification
        ↓
Get User's FCM Tokens
        ↓
Send via Firebase Admin SDK
        ↓
User's Device Receives Push
        ↓
App Shows Notification
```

## Testing

### 1. Test with cURL

Register a token:
```bash
curl -X POST http://localhost:9000/api/fcm/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_FCM_TOKEN"}'
```

### 2. Verify in Database

Check that the token is stored:
```javascript
db.users.findOne({ _id: ObjectId("USER_ID") }, { fcmTokens: 1 })
```

### 3. Trigger a Notification

Create a test ticket reply to trigger a notification:
```bash
curl -X POST http://localhost:9000/api/tickets/TICKET_ID/messages \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test reply from admin"}'
```

## Troubleshooting

### Push notifications not being sent

1. **Check Firebase initialization**:
   - Look for "✅ Firebase Admin SDK initialized" in server logs
   - If you see "⚠️ Firebase credentials not configured", check your environment variables

2. **Check FCM tokens**:
   ```bash
   curl http://localhost:9000/api/fcm/tokens \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Check server logs** for push notification attempts:
   - "✅ Push notification sent successfully"
   - "❌ Error sending push notification"
   - "⚠️ Invalid or expired FCM token"

### Token errors

If you see "Invalid registration token" errors:
- The token may have expired (app reinstalled, data cleared)
- The service automatically removes invalid tokens from the database

### Firebase Admin SDK errors

Common errors:
- **Invalid credentials**: Check your service account JSON
- **Insufficient permissions**: Ensure the service account has "Firebase Cloud Messaging Admin" role
- **Project not found**: Verify the project_id in your service account JSON

## Security Best Practices

1. **Never commit** service account keys to version control
2. **Rotate keys** periodically in Firebase Console
3. **Use environment variables** for all sensitive configuration
4. **Restrict service account permissions** to only what's needed
5. **Monitor token usage** and remove unused tokens regularly

## Production Deployment

For production environments (e.g., DigitalOcean):

1. Set the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable with the full JSON string
2. Ensure it's properly escaped for your deployment platform
3. Restart the server to apply changes
4. Verify Firebase initialization in logs

Example for PM2:
```bash
pm2 set pm2-ecosystem.config.json FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
pm2 restart all
```

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [FCM Server Documentation](https://firebase.google.com/docs/cloud-messaging/server)
- [Flutter Firebase Messaging](https://firebase.google.com/docs/cloud-messaging/flutter/client)
