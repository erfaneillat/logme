import 'package:cal_ai/services/api_service.dart';
import 'package:cal_ai/features/tickets/data/models/notification_model.dart';

class NotificationService {
  final ApiService _apiService;

  NotificationService(this._apiService);

  /// Get user's notifications
  Future<List<NotificationModel>> getUserNotifications({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/api/notifications',
        queryParameters: {
          'page': page.toString(),
          'limit': limit.toString(),
        },
      );

      if (response['success'] == true && response['data'] != null) {
        final notificationsData = response['data']['items'] as List<dynamic>;
        return notificationsData
            .map((json) =>
                NotificationModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching notifications: $e');
      return [];
    }
  }

  /// Get unread notification count
  Future<int> getUnreadCount() async {
    try {
      final response = await _apiService.get('/api/notifications/unread-count');

      if (response['success'] == true && response['data'] != null) {
        return (response['data']['count'] as num).toInt();
      }

      return 0;
    } catch (e) {
      print('Error fetching unread count: $e');
      return 0;
    }
  }

  /// Mark notification as read
  Future<bool> markAsRead(String notificationId) async {
    try {
      final response = await _apiService.put(
        '/api/notifications/$notificationId/read',
        data: {},
      );

      return response['success'] == true;
    } catch (e) {
      print('Error marking notification as read: $e');
      return false;
    }
  }

  /// Mark all notifications as read
  Future<bool> markAllAsRead() async {
    try {
      final response = await _apiService.put(
        '/api/notifications/read-all',
        data: {},
      );

      return response['success'] == true;
    } catch (e) {
      print('Error marking all notifications as read: $e');
      return false;
    }
  }
}
