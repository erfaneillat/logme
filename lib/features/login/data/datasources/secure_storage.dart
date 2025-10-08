import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract class SecureStorage {
  Future<void> storeToken(String token);
  Future<String?> getToken();
  Future<void> deleteToken();
  Future<void> storeUserData(String userData);
  Future<String?> getUserData();
  Future<void> deleteUserData();
  Future<void> storePhone(String phone);
  Future<String?> getPhone();
  Future<void> deletePhone();
  Future<void> setLuckyWheelShown(bool shown);
  Future<bool> hasLuckyWheelBeenShown();
  Future<void> setSubscriptionActive(bool isActive);
  Future<bool> isSubscriptionActive();
  Future<void> storeSubscriptionData(String subscriptionData);
  Future<String?> getSubscriptionData();
}

class SecureStorageImpl implements SecureStorage {
  static const _storage = FlutterSecureStorage();

  static const String _tokenKey = 'auth_token';
  static const String _userDataKey = 'user_data';
  static const String _phoneKey = 'phone_number';
  static const String _luckyWheelShownKey = 'lucky_wheel_shown';
  static const String _subscriptionActiveKey = 'subscription_active';
  static const String _subscriptionDataKey = 'subscription_data';

  @override
  Future<void> storeToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  @override
  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  @override
  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  @override
  Future<void> storeUserData(String userData) async {
    await _storage.write(key: _userDataKey, value: userData);
  }

  @override
  Future<String?> getUserData() async {
    return await _storage.read(key: _userDataKey);
  }

  @override
  Future<void> deleteUserData() async {
    await _storage.delete(key: _userDataKey);
  }

  @override
  Future<void> storePhone(String phone) async {
    await _storage.write(key: _phoneKey, value: phone);
  }

  @override
  Future<String?> getPhone() async {
    return await _storage.read(key: _phoneKey);
  }

  @override
  Future<void> deletePhone() async {
    await _storage.delete(key: _phoneKey);
  }

  @override
  Future<void> setLuckyWheelShown(bool shown) async {
    await _storage.write(key: _luckyWheelShownKey, value: shown.toString());
  }

  @override
  Future<bool> hasLuckyWheelBeenShown() async {
    final value = await _storage.read(key: _luckyWheelShownKey);
    return value == 'true';
  }

  @override
  Future<void> setSubscriptionActive(bool isActive) async {
    await _storage.write(
        key: _subscriptionActiveKey, value: isActive.toString());
  }

  @override
  Future<bool> isSubscriptionActive() async {
    final value = await _storage.read(key: _subscriptionActiveKey);
    return value == 'true';
  }

  @override
  Future<void> storeSubscriptionData(String subscriptionData) async {
    await _storage.write(key: _subscriptionDataKey, value: subscriptionData);
  }

  @override
  Future<String?> getSubscriptionData() async {
    return await _storage.read(key: _subscriptionDataKey);
  }
}
