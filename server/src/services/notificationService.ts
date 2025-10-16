import Notification, { NotificationType, INotification } from '../models/Notification';
import mongoose from 'mongoose';
import User from '../models/User';
import firebaseService from './firebaseService';
import { logServiceError } from '../utils/errorLogger';

class NotificationService {
  private translateStatus(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'باز',
      IN_PROGRESS: 'در حال رسیدگی',
      RESOLVED: 'حل شد',
      CLOSED: 'بسته شد',
      PENDING: 'در انتظار',
    };
    return map[status] ?? status.replace('_', ' ').toLowerCase();
  }

  /**
   * Create a new notification
   */
  async createNotification(
    userId: mongoose.Types.ObjectId | string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<INotification> {
    try {
      const notification = await Notification.create({
        userId: new mongoose.Types.ObjectId(userId.toString()),
        type,
        title,
        body,
        data: data || {},
        isRead: false,
      });

      console.log(`✅ Notification created for user ${userId}: ${title}`);

      // Send push notification if Firebase is configured
      await this.sendPushNotification(userId, title, body, data);

      return notification;
    } catch (error) {
      logServiceError('notificationService', 'createNotification', error as Error, {
        userId,
        type,
        title,
        body,
        data,
      });
      throw error;
    }
  }

  /**
   * Create notification for ticket reply
   */
  async notifyTicketReply(
    userId: mongoose.Types.ObjectId | string,
    ticketId: string,
    ticketSubject: string,
    replierName: string
  ): Promise<INotification> {
    return this.createNotification(
      userId,
      NotificationType.TICKET_REPLY,
      'پاسخ جدید به تیکت شما',
      `پشتیبانی به تیکت شما پاسخ داد: «${ticketSubject}»`,
      {
        ticketId,
        ticketSubject,
        replierName,
      }
    );
  }

  /**
   * Create notification for ticket status change
   */
  async notifyTicketStatusChange(
    userId: mongoose.Types.ObjectId | string,
    ticketId: string,
    ticketSubject: string,
    newStatus: string
  ): Promise<INotification> {
    const statusText = this.translateStatus(newStatus);
    return this.createNotification(
      userId,
      NotificationType.TICKET_STATUS_CHANGE,
      'وضعیت تیکت به‌روزرسانی شد',
      `وضعیت تیکت «${ticketSubject}» به ${statusText} تغییر کرد`,
      {
        ticketId,
        ticketSubject,
        status: newStatus,
      }
    );
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(
    userId: mongoose.Types.ObjectId | string
  ): Promise<INotification[]> {
    return Notification.find({
      userId: new mongoose.Types.ObjectId(userId.toString()),
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: mongoose.Types.ObjectId | string): Promise<number> {
    return Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId.toString()),
      isRead: false,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(
      notificationId,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: mongoose.Types.ObjectId | string): Promise<void> {
    await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId.toString()),
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );
  }

  /**
   * Get paginated notifications for a user
   */
  async getUserNotifications(
    userId: mongoose.Types.ObjectId | string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({
        userId: new mongoose.Types.ObjectId(userId.toString()),
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Notification.countDocuments({
        userId: new mongoose.Types.ObjectId(userId.toString()),
      }),
      this.getUnreadCount(userId),
    ]);

    return { notifications, total, unreadCount };
  }

  /**
   * Delete old read notifications (cleanup)
   */
  async deleteOldReadNotifications(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await Notification.deleteMany({
      isRead: true,
      readAt: { $lt: cutoffDate },
    });

    console.log(`🧹 Cleaned up old notifications older than ${daysOld} days`);
  }

  /**
   * Send push notification via Firebase
   */
  private async sendPushNotification(
    userId: mongoose.Types.ObjectId | string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      if (!firebaseService.isInitialized()) {
        return; // Skip if Firebase not configured
      }

      // Get user's FCM tokens
      const user = await User.findById(userId).select('fcmTokens');
      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        console.log(`No FCM tokens found for user ${userId}`);
        return;
      }

      // Convert data to string values for FCM
      const fcmData: { [key: string]: string } = {};
      if (data) {
        Object.keys(data).forEach((key) => {
          fcmData[key] = String(data[key]);
        });
      }

      // Send to all user's devices
      const result = await firebaseService.sendToMultipleDevices(
        user.fcmTokens,
        title,
        body,
        fcmData
      );

      // Remove invalid tokens from user's account
      if (result.invalidTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { $in: result.invalidTokens } },
        });
        console.log(`🧹 Removed ${result.invalidTokens.length} invalid FCM tokens for user ${userId}`);
      }
    } catch (error) {
      logServiceError('notificationService', 'sendPushNotification', error as Error, {
        userId,
        title,
        body,
        data,
      });
      // Don't throw - we don't want to fail notification creation if push fails
    }
  }
}

export default new NotificationService();
