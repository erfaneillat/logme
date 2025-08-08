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
}

class SecureStorageImpl implements SecureStorage {
  static const _storage = FlutterSecureStorage();

  static const String _tokenKey = 'auth_token';
  static const String _userDataKey = 'user_data';
  static const String _phoneKey = 'phone_number';

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
}
