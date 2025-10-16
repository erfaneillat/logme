import * as admin from 'firebase-admin';

class FirebaseService {
  private initialized = false;

  /**
   * Initialize Firebase Admin SDK
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Check if Firebase credentials are provided
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

      if (serviceAccountJson) {
        // Use JSON string from environment variable
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.initialized = true;
        console.log('✅ Firebase Admin SDK initialized from JSON');
      } else if (serviceAccountPath) {
        // Use file path
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.initialized = true;
        console.log('✅ Firebase Admin SDK initialized from file');
      } else {
        console.warn('⚠️  Firebase credentials not configured. Push notifications will be disabled.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      console.warn('Push notifications will be disabled.');
    }
  }

  /**
   * Check if Firebase is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: { [key: string]: string }
  ): Promise<boolean> {
    if (!this.initialized) {
      console.warn('Firebase not initialized. Skipping push notification.');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'tickets',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Push notification sent successfully:', response);
      return true;
    } catch (error: any) {
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        console.warn('⚠️  Invalid or expired FCM token:', token);
        // Token is invalid, should be removed from database
        return false;
      }
      console.error('❌ Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: { [key: string]: string }
  ): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
    if (!this.initialized) {
      console.warn('Firebase not initialized. Skipping push notifications.');
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'tickets',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      // Collect invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((resp: admin.messaging.SendResponse, idx: number) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          if (errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered') {
            const token = tokens[idx];
            if (token) {
              invalidTokens.push(token);
            }
          }
        }
      });

      console.log(`✅ Push notifications sent: ${response.successCount} success, ${response.failureCount} failed`);
      if (invalidTokens.length > 0) {
        console.warn(`⚠️  ${invalidTokens.length} invalid tokens found`);
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error) {
      console.error('❌ Error sending multicast push notifications:', error);
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }
  }

  /**
   * Send notification with custom payload
   */
  async sendCustomNotification(
    token: string,
    payload: admin.messaging.Message
  ): Promise<boolean> {
    if (!this.initialized) {
      console.warn('Firebase not initialized. Skipping push notification.');
      return false;
    }

    try {
      await admin.messaging().send({ ...payload, token });
      console.log('✅ Custom push notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending custom push notification:', error);
      return false;
    }
  }
}

export default new FirebaseService();
