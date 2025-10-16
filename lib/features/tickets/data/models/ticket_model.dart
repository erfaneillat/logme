enum TicketStatus {
  open,
  inProgress,
  resolved,
  closed;

  String toServerString() {
    switch (this) {
      case TicketStatus.open:
        return 'open';
      case TicketStatus.inProgress:
        return 'in_progress';
      case TicketStatus.resolved:
        return 'resolved';
      case TicketStatus.closed:
        return 'closed';
    }
  }

  static TicketStatus fromString(String status) {
    switch (status) {
      case 'open':
        return TicketStatus.open;
      case 'in_progress':
        return TicketStatus.inProgress;
      case 'resolved':
        return TicketStatus.resolved;
      case 'closed':
        return TicketStatus.closed;
      default:
        return TicketStatus.open;
    }
  }
}

enum TicketPriority {
  low,
  medium,
  high,
  urgent;

  String toServerString() {
    return name;
  }

  static TicketPriority fromString(String priority) {
    switch (priority) {
      case 'low':
        return TicketPriority.low;
      case 'medium':
        return TicketPriority.medium;
      case 'high':
        return TicketPriority.high;
      case 'urgent':
        return TicketPriority.urgent;
      default:
        return TicketPriority.medium;
    }
  }
}

enum TicketCategory {
  technical,
  billing,
  featureRequest,
  bugReport,
  general,
  other;

  String toServerString() {
    switch (this) {
      case TicketCategory.technical:
        return 'technical';
      case TicketCategory.billing:
        return 'billing';
      case TicketCategory.featureRequest:
        return 'feature_request';
      case TicketCategory.bugReport:
        return 'bug_report';
      case TicketCategory.general:
        return 'general';
      case TicketCategory.other:
        return 'other';
    }
  }

  static TicketCategory fromString(String category) {
    switch (category) {
      case 'technical':
        return TicketCategory.technical;
      case 'billing':
        return TicketCategory.billing;
      case 'feature_request':
        return TicketCategory.featureRequest;
      case 'bug_report':
        return TicketCategory.bugReport;
      case 'general':
        return TicketCategory.general;
      case 'other':
        return TicketCategory.other;
      default:
        return TicketCategory.general;
    }
  }
}

class TicketMessage {
  final String? id;
  final String senderId;
  final String senderName;
  final String senderRole; // 'user' or 'admin'
  final String message;
  final List<String>? attachments;
  final DateTime createdAt;

  TicketMessage({
    this.id,
    required this.senderId,
    required this.senderName,
    required this.senderRole,
    required this.message,
    this.attachments,
    required this.createdAt,
  });

  factory TicketMessage.fromJson(Map<String, dynamic> json) {
    return TicketMessage(
      id: json['_id'] as String?,
      senderId: json['senderId'] as String,
      senderName: json['senderName'] as String,
      senderRole: json['senderRole'] as String,
      message: json['message'] as String,
      attachments: (json['attachments'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) '_id': id,
      'senderId': senderId,
      'senderName': senderName,
      'senderRole': senderRole,
      'message': message,
      if (attachments != null) 'attachments': attachments,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class TicketModel {
  final String id;
  final String userId;
  final String userName;
  final String userPhone;
  final String subject;
  final TicketCategory category;
  final TicketPriority priority;
  final TicketStatus status;
  final List<TicketMessage> messages;
  final String? assignedTo;
  final String? assignedToName;
  final DateTime lastMessageAt;
  final DateTime? resolvedAt;
  final DateTime? closedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  TicketModel({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userPhone,
    required this.subject,
    required this.category,
    required this.priority,
    required this.status,
    required this.messages,
    this.assignedTo,
    this.assignedToName,
    required this.lastMessageAt,
    this.resolvedAt,
    this.closedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory TicketModel.fromJson(Map<String, dynamic> json) {
    return TicketModel(
      id: json['_id'] as String,
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      userPhone: json['userPhone'] as String,
      subject: json['subject'] as String,
      category: TicketCategory.fromString(json['category'] as String),
      priority: TicketPriority.fromString(json['priority'] as String),
      status: TicketStatus.fromString(json['status'] as String),
      messages: (json['messages'] as List<dynamic>)
          .map((e) => TicketMessage.fromJson(e as Map<String, dynamic>))
          .toList(),
      assignedTo: json['assignedTo'] as String?,
      assignedToName: json['assignedToName'] as String?,
      lastMessageAt: DateTime.parse(json['lastMessageAt'] as String),
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.parse(json['resolvedAt'] as String)
          : null,
      closedAt: json['closedAt'] != null
          ? DateTime.parse(json['closedAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': userId,
      'userName': userName,
      'userPhone': userPhone,
      'subject': subject,
      'category': category.toServerString(),
      'priority': priority.toServerString(),
      'status': status.toServerString(),
      'messages': messages.map((e) => e.toJson()).toList(),
      if (assignedTo != null) 'assignedTo': assignedTo,
      if (assignedToName != null) 'assignedToName': assignedToName,
      'lastMessageAt': lastMessageAt.toIso8601String(),
      if (resolvedAt != null) 'resolvedAt': resolvedAt!.toIso8601String(),
      if (closedAt != null) 'closedAt': closedAt!.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  TicketModel copyWith({
    String? id,
    String? userId,
    String? userName,
    String? userPhone,
    String? subject,
    TicketCategory? category,
    TicketPriority? priority,
    TicketStatus? status,
    List<TicketMessage>? messages,
    String? assignedTo,
    String? assignedToName,
    DateTime? lastMessageAt,
    DateTime? resolvedAt,
    DateTime? closedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return TicketModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
      userPhone: userPhone ?? this.userPhone,
      subject: subject ?? this.subject,
      category: category ?? this.category,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      messages: messages ?? this.messages,
      assignedTo: assignedTo ?? this.assignedTo,
      assignedToName: assignedToName ?? this.assignedToName,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      closedAt: closedAt ?? this.closedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
