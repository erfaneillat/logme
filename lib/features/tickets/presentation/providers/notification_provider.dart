import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/services/api_service_provider.dart';
import 'package:cal_ai/features/tickets/data/services/notification_service.dart';
import 'package:cal_ai/features/tickets/data/models/notification_model.dart';

// Service provider
final notificationServiceProvider = Provider<NotificationService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return NotificationService(apiService);
});

// Provider for fetching notifications
final notificationsProvider = FutureProvider.autoDispose<List<NotificationModel>>((ref) async {
  final notificationService = ref.watch(notificationServiceProvider);
  return await notificationService.getUserNotifications();
});

// Provider for unread count
final unreadNotificationCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final notificationService = ref.watch(notificationServiceProvider);
  return await notificationService.getUnreadCount();
});

// State notifier for marking notifications as read
class MarkNotificationReadNotifier extends StateNotifier<AsyncValue<bool>> {
  MarkNotificationReadNotifier(this._notificationService)
      : super(const AsyncValue.data(false));

  final NotificationService _notificationService;

  Future<void> markAsRead(String notificationId) async {
    state = const AsyncValue.loading();
    try {
      final success = await _notificationService.markAsRead(notificationId);
      state = AsyncValue.data(success);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> markAllAsRead() async {
    state = const AsyncValue.loading();
    try {
      final success = await _notificationService.markAllAsRead();
      state = AsyncValue.data(success);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final markNotificationReadProvider =
    StateNotifierProvider.autoDispose<MarkNotificationReadNotifier, AsyncValue<bool>>(
  (ref) {
    final notificationService = ref.watch(notificationServiceProvider);
    return MarkNotificationReadNotifier(notificationService);
  },
);
