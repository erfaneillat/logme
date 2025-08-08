class User {
  final String id;
  final String phone;
  final String? email;
  final String? name;
  final bool isPhoneVerified;
  final String? token;
  final bool hasCompletedAdditionalInfo;

  const User({
    required this.id,
    required this.phone,
    this.email,
    this.name,
    this.isPhoneVerified = false,
    this.token,
    this.hasCompletedAdditionalInfo = false,
  });

  User copyWith({
    String? id,
    String? phone,
    String? email,
    String? name,
    bool? isPhoneVerified,
    String? token,
    bool? hasCompletedAdditionalInfo,
  }) {
    return User(
      id: id ?? this.id,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      name: name ?? this.name,
      isPhoneVerified: isPhoneVerified ?? this.isPhoneVerified,
      token: token ?? this.token,
      hasCompletedAdditionalInfo:
          hasCompletedAdditionalInfo ?? this.hasCompletedAdditionalInfo,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'email': email,
        'name': name,
        'isPhoneVerified': isPhoneVerified,
        'token': token,
        'hasCompletedAdditionalInfo': hasCompletedAdditionalInfo,
      };

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] ?? json['_id'],
        phone: json['phone'],
        email: json['email'],
        name: json['name'],
        isPhoneVerified: json['isPhoneVerified'] ?? false,
        token: json['token'],
        hasCompletedAdditionalInfo: json['hasCompletedAdditionalInfo'] ?? false,
      );

  @override
  String toString() =>
      'User(id: $id, phone: $phone, email: $email, name: $name, isPhoneVerified: $isPhoneVerified, hasCompletedAdditionalInfo: $hasCompletedAdditionalInfo)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is User &&
        other.id == id &&
        other.phone == phone &&
        other.email == email &&
        other.name == name &&
        other.isPhoneVerified == isPhoneVerified &&
        other.hasCompletedAdditionalInfo == hasCompletedAdditionalInfo;
  }

  @override
  int get hashCode =>
      id.hashCode ^
      phone.hashCode ^
      email.hashCode ^
      name.hashCode ^
      isPhoneVerified.hashCode ^
      hasCompletedAdditionalInfo.hashCode;
}
