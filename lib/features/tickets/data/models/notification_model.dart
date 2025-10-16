enum NotificationType {
  ticketReply,
  ticketStatusChange,
  system,
  subscription;

  String toServerString() {
    switch (this) {
      case NotificationType.ticketReply:
        return 'ticket_reply';
      case NotificationType.ticketStatusChange:
        return 'ticket_status_change';
      case NotificationType.system:
        return 'system';
      case NotificationType.subscription:
        return 'subscription';
    }
  }

  static NotificationType fromString(String type) {
    switch (type) {
      case 'ticket_reply':
        return NotificationType.ticketReply;
      case 'ticket_status_change':
        return NotificationType.ticketStatusChange;
      case 'system':
        return NotificationType.system;
      case 'subscription':
        return NotificationType.subscription;
      default:
        return NotificationType.system;
    }
  }
}

class NotificationModel {
  final String id;
  final String userId;
  final NotificationType type;
  final String title;
  final String body;
  final Map<String, dynamic>? data;
  final bool isRead;
  final DateTime createdAt;
  final DateTime? readAt;

  NotificationModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.body,
    this.data,
    required this.isRead,
    required this.createdAt,
    this.readAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] as String,
      userId: json['userId'] as String,
      type: NotificationType.fromString(json['type'] as String),
      title: json['title'] as String,
      body: json['body'] as String,
      data: json['data'] as Map<String, dynamic>?,
      isRead: json['isRead'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      readAt: json['readAt'] != null
          ? DateTime.parse(json['readAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': userId,
      'type': type.toServerString(),
      'title': title,
      'body': body,
      if (data != null) 'data': data,
      'isRead': isRead,
      'createdAt': createdAt.toIso8601String(),
      if (readAt != null) 'readAt': readAt!.toIso8601String(),
    };
  }

  NotificationModel copyWith({
    String? id,
    String? userId,
    NotificationType? type,
    String? title,
    String? body,
    Map<String, dynamic>? data,
    bool? isRead,
    DateTime? createdAt,
    DateTime? readAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      title: title ?? this.title,
      body: body ?? this.body,
      data: data ?? this.data,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
      readAt: readAt ?? this.readAt,
    );
  }
}
