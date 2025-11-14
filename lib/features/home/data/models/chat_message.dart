class ChatMessage {
  final String? id;
  final String message;
  final bool isFromUser;
  final DateTime createdAt;
  final bool isSending;
  final String? imageUrl;

  ChatMessage({
    this.id,
    required this.message,
    required this.isFromUser,
    required this.createdAt,
    this.isSending = false,
    this.imageUrl,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['_id'] as String?,
      message: json['message'] as String,
      isFromUser: json['senderRole'] == 'user',
      createdAt: DateTime.parse(json['createdAt'] as String),
      imageUrl: json['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) '_id': id,
      'message': message,
      'senderRole': isFromUser ? 'user' : 'trainer',
      'createdAt': createdAt.toIso8601String(),
      if (imageUrl != null) 'imageUrl': imageUrl,
    };
  }

  ChatMessage copyWith({
    String? id,
    String? message,
    bool? isFromUser,
    DateTime? createdAt,
    bool? isSending,
    String? imageUrl,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      message: message ?? this.message,
      isFromUser: isFromUser ?? this.isFromUser,
      createdAt: createdAt ?? this.createdAt,
      isSending: isSending ?? this.isSending,
      imageUrl: imageUrl ?? this.imageUrl,
    );
  }
}
