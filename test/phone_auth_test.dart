import 'package:flutter_test/flutter_test.dart';
import 'package:cal_ai/features/login/domain/entities/user.dart';

void main() {
  group('Phone Authentication Tests', () {
    test('User entity should be created correctly from JSON', () {
      final json = {
        'id': '123',
        'phone': '+1234567890',
        'email': 'test@example.com',
        'name': 'Test User',
        'isPhoneVerified': true,
        'token': 'jwt_token_here'
      };

      final user = User.fromJson(json);

      expect(user.id, '123');
      expect(user.phone, '+1234567890');
      expect(user.email, 'test@example.com');
      expect(user.name, 'Test User');
      expect(user.isPhoneVerified, true);
      expect(user.token, 'jwt_token_here');
    });

    test('User entity should convert to JSON correctly', () {
      final user = User(
        id: '123',
        phone: '+1234567890',
        email: 'test@example.com',
        name: 'Test User',
        isPhoneVerified: true,
        token: 'jwt_token_here',
      );

      final json = user.toJson();

      expect(json['id'], '123');
      expect(json['phone'], '+1234567890');
      expect(json['email'], 'test@example.com');
      expect(json['name'], 'Test User');
      expect(json['isPhoneVerified'], true);
      expect(json['token'], 'jwt_token_here');
    });

    test('User copyWith should work correctly', () {
      final user = User(
        id: '123',
        phone: '+1234567890',
        email: 'test@example.com',
        name: 'Test User',
        isPhoneVerified: false,
      );

      final updatedUser = user.copyWith(
        name: 'Updated Name',
        isPhoneVerified: true,
      );

      expect(updatedUser.id, '123');
      expect(updatedUser.phone, '+1234567890');
      expect(updatedUser.email, 'test@example.com');
      expect(updatedUser.name, 'Updated Name');
      expect(updatedUser.isPhoneVerified, true);
    });
  });
}
