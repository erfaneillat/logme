import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:cal_ai/services/api_service.dart';
import 'dart:io' show Platform;

/// Top-level function to handle background messages
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📩 Handling background message: ${message.messageId}');
  print('Title: ${message.notification?.title}');
  print('Body: ${message.notification?.body}');
  print('Data: ${message.data}');
}

class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;
  String? _currentToken;

  /// Initialize FCM service
  Future<void> initialize(ApiService apiService) async {
    // Always attempt to register/refresh token on initialize call
    // This handles cases where user logs in/out or token needs update
    await _registerToken(apiService);

    if (_initialized) {
      print('ℹ️  FCM already initialized (listeners active)');
      return;
    }

    try {
      print('🔔 Initializing FCM service listeners...');

      // Request notification permissions
      final settings = await _requestPermissions();
      if (settings.authorizationStatus != AuthorizationStatus.authorized) {
        print('⚠️  Notification permission not granted');
        return;
      }

      // Initialize local notifications
      await _initializeLocalNotifications();

      // Set background message handler
      FirebaseMessaging.onBackgroundMessage(
          _firebaseMessagingBackgroundHandler);

      // Listen for token refresh
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        print('🔄 FCM token refreshed: $newToken');
        _registerTokenToServer(apiService, newToken);
      });

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('📨 Foreground message received: ${message.messageId}');
        _handleForegroundMessage(message);
      });

      // Handle notification taps when app is in background
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        print('📬 Notification tapped (background): ${message.messageId}');
        _handleNotificationTap(message);
      });

      // Check if app was opened from a terminated state
      final initialMessage = await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        print(
            '📬 App opened from notification (terminated): ${initialMessage.messageId}');
        _handleNotificationTap(initialMessage);
      }

      _initialized = true;
      print('✅ FCM service initialized successfully');
    } catch (e) {
      print('❌ Error initializing FCM: $e');
    }
  }

  /// Request notification permissions
  Future<NotificationSettings> _requestPermissions() async {
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    print('🔔 Notification permission: ${settings.authorizationStatus}');
    return settings;
  }

  /// Initialize local notifications for displaying in-app
  Future<void> _initializeLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {
        print('📬 Local notification tapped: ${details.payload}');
        // Handle notification tap
        if (details.payload != null) {
          _handleNotificationPayload(details.payload!);
        }
      },
    );

    // Create notification channel for Android
    if (Platform.isAndroid) {
      const androidChannel = AndroidNotificationChannel(
        'tickets', // id
        'Tickets', // name
        description: 'Notifications for ticket updates',
        importance: Importance.high,
        enableVibration: true,
        playSound: true,
      );

      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(androidChannel);
    }
  }

  /// Get FCM token and register with server
  Future<void> _registerToken(ApiService apiService) async {
    try {
      final token = await _firebaseMessaging.getToken();
      if (token != null) {
        print('📱 FCM Token obtained: ${token.substring(0, 20)}...');
        _currentToken = token;
        await _registerTokenToServer(apiService, token);
      } else {
        print('⚠️  Failed to get FCM token');
      }
    } catch (e) {
      print('❌ Error getting FCM token: $e');
    }
  }

  /// Register token with backend server
  Future<void> _registerTokenToServer(
      ApiService apiService, String token) async {
    try {
      final response = await apiService.post(
        '/api/fcm/register',
        data: {'token': token},
      );

      if (response['success'] == true) {
        print('✅ FCM token registered with server');
      } else {
        print('⚠️  Failed to register FCM token: ${response['message']}');
      }
    } catch (e) {
      print('❌ Error registering FCM token: $e');
    }
  }

  /// Handle foreground messages
  void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;

    if (notification != null) {
      _showLocalNotification(
        title: notification.title ?? 'New Notification',
        body: notification.body ?? '',
        payload: message.data['ticketId'],
      );
    }
  }

  /// Show local notification
  Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'tickets',
      'Tickets',
      channelDescription: 'Notifications for ticket updates',
      importance: Importance.high,
      priority: Priority.high,
      enableVibration: true,
      playSound: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload,
    );
  }

  /// Handle notification tap
  void _handleNotificationTap(RemoteMessage message) {
    final ticketId = message.data['ticketId'] as String?;
    if (ticketId != null) {
      print('🎯 Navigating to ticket: $ticketId');
      // Navigation will be handled by the app
      // You can use a navigation service or stream to handle this
    }
  }

  /// Handle notification payload from local notification
  void _handleNotificationPayload(String payload) {
    print('🎯 Handling payload: $payload');
    // Handle navigation based on payload
  }

  /// Unregister FCM token (e.g., on logout)
  Future<void> unregisterToken(ApiService apiService) async {
    if (_currentToken == null) {
      return;
    }

    try {
      final response = await apiService.post(
        '/api/fcm/remove',
        data: {'token': _currentToken},
      );

      if (response['success'] == true) {
        print('✅ FCM token unregistered from server');
        _currentToken = null;
      }
    } catch (e) {
      print('❌ Error unregistering FCM token: $e');
    }
  }

  /// Get current FCM token
  String? get currentToken => _currentToken;

  /// Check if FCM is initialized
  bool get isInitialized => _initialized;
}
