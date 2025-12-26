import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/features/login/models/login_state.dart';
import 'package:cal_ai/features/login/providers/login_provider.dart';
import 'package:cal_ai/features/login/domain/usecases/send_verification_code_usecase.dart';
import 'package:cal_ai/features/login/domain/usecases/verify_phone_usecase.dart';
import 'package:cal_ai/features/login/domain/entities/user.dart';
import 'package:cal_ai/features/login/domain/repositories/auth_repository.dart';

// Mock repository for testing
class MockAuthRepository implements AuthRepository {
  @override
  Future<void> sendVerificationCode(String phone) async {
    await Future.delayed(const Duration(milliseconds: 100));
  }

  @override
  Future<User> verifyPhone(String phone, String verificationCode) async {
    await Future.delayed(const Duration(milliseconds: 100));
    return User(
      id: 'test_id',
      phone: phone,
      name: 'Test User',
      isPhoneVerified: true,
    );
  }

  @override
  Future<User?> getCurrentUser() async => null;

  @override
  Future<User> updateProfile(String? name, String? email) async {
    return User(
      id: 'test_id',
      phone: '+1234567890',
      name: name,
      email: email,
      isPhoneVerified: true,
    );
  }

  @override
  Future<void> logout() async {}

  @override
  Future<String> refreshToken() async => 'new_token';

  @override
  Future<bool> isAuthenticated() async => false;

  @override
  Future<void> updateAdditionalInfoCompletion(bool hasCompleted) async {}
}

// Mock use cases for testing
class MockSendVerificationCodeUseCase implements SendVerificationCodeUseCase {
  @override
  final AuthRepository repository = MockAuthRepository();

  @override
  Future<void> call(String phone) async {
    await repository.sendVerificationCode(phone);
  }
}

class MockVerifyPhoneUseCase implements VerifyPhoneUseCase {
  @override
  final AuthRepository repository = MockAuthRepository();

  @override
  Future<User> call(String phone, String verificationCode) async {
    return await repository.verifyPhone(phone, verificationCode);
  }
}

// Mock provider for testing
final mockLoginProvider =
    StateNotifierProvider<LoginNotifier, LoginState>((ref) {
  return LoginNotifier(
    sendVerificationCodeUseCase: MockSendVerificationCodeUseCase(),
    verifyPhoneUseCase: MockVerifyPhoneUseCase(),
    ref: ref,
  );
});

class TestPhoneAuthWidget extends StatelessWidget {
  const TestPhoneAuthWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Consumer(
          builder: (context, ref, child) {
            final loginState = ref.watch(mockLoginProvider);
            final loginNotifier = ref.read(mockLoginProvider.notifier);

            return Column(
              children: [
                Text('Phone: ${loginState.phoneNumber ?? "Not set"}'),
                Text('Loading: ${loginState.isLoading}'),
                Text('Code Sent: ${loginState.isCodeSent}'),
                Text('Logged In: ${loginState.isLoggedIn}'),
                Text('Error: ${loginState.error ?? "None"}'),
                ElevatedButton(
                  onPressed: () => loginNotifier.sendCode('+1234567890'),
                  child: const Text('Send Code'),
                ),
                ElevatedButton(
                  onPressed: () => loginNotifier.verifyCode('123456'),
                  child: const Text('Verify Code'),
                ),
                ElevatedButton(
                  onPressed: () => loginNotifier.reset(),
                  child: const Text('Reset'),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

void main() {
  group('Phone Auth Widget Tests', () {
    testWidgets('should display initial state correctly',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: TestPhoneAuthWidget(),
        ),
      );

      expect(find.text('Phone: Not set'), findsOneWidget);
      expect(find.text('Loading: false'), findsOneWidget);
      expect(find.text('Code Sent: false'), findsOneWidget);
      expect(find.text('Logged In: false'), findsOneWidget);
      expect(find.text('Error: None'), findsOneWidget);
    });

    testWidgets('should update state when send code is pressed',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: TestPhoneAuthWidget(),
        ),
      );

      await tester.tap(find.text('Send Code'));
      await tester.pump();

      // Should show loading
      expect(find.text('Loading: true'), findsOneWidget);

      // Wait for the async operation to complete
      await tester.pump(const Duration(milliseconds: 200));

      // Should show updated state
      expect(find.text('Phone: +1234567890'), findsOneWidget);
      expect(find.text('Code Sent: true'), findsOneWidget);
      expect(find.text('Loading: false'), findsOneWidget);
    });

    testWidgets('should update state when verify code is pressed',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: TestPhoneAuthWidget(),
        ),
      );

      // First send code
      await tester.tap(find.text('Send Code'));
      await tester.pump(const Duration(milliseconds: 200));

      // Then verify code
      await tester.tap(find.text('Verify Code'));
      await tester.pump();

      // Should show loading
      expect(find.text('Loading: true'), findsOneWidget);

      // Wait for the async operation to complete
      await tester.pump(const Duration(milliseconds: 200));

      // Should show updated state
      expect(find.text('Loading: false'), findsOneWidget);
    });

    testWidgets('should reset state when reset is pressed',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: TestPhoneAuthWidget(),
        ),
      );

      // First send code to change state
      await tester.tap(find.text('Send Code'));
      await tester.pump(const Duration(milliseconds: 200));

      // Verify state changed
      expect(find.text('Phone: +1234567890'), findsOneWidget);
      expect(find.text('Code Sent: true'), findsOneWidget);

      // Then reset
      await tester.tap(find.text('Reset'));
      await tester.pump();

      // Should show initial state
      expect(find.text('Phone: Not set'), findsOneWidget);
      expect(find.text('Code Sent: false'), findsOneWidget);
      expect(find.text('Logged In: false'), findsOneWidget);
    });
  });
}
