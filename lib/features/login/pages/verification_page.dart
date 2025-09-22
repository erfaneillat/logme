import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:easy_localization/easy_localization.dart' as tr;
import 'package:sms_autofill/sms_autofill.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import '../providers/login_provider.dart';
import '../../../../extensions/context.dart';

class VerificationPage extends HookConsumerWidget {
  final String phoneNumber;

  const VerificationPage({
    super.key,
    required this.phoneNumber,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pinControllers =
        List.generate(6, (index) => useTextEditingController());
    final focusNodes = List.generate(6, (index) => useFocusNode());
    final currentIndex = useState(0);

    final loginNotifier = ref.read(loginProvider.notifier);
    final loginState = ref.watch(loginProvider);

    useEffect(() {
      SmsAutoFill().listenForCode();
      return () {
        SmsAutoFill().unregisterListener();
      };
    }, const []);

    void handleVerifyCode() async {
      final code = pinControllers.map((controller) => controller.text).join();
      if (code.length != 6) return;

      try {
        final user = await loginNotifier.verifyCode(code);
        // If successful, check if user has completed additional info
        if (user != null && context.mounted) {
          if (user.hasCompletedAdditionalInfo) {
            GoRouter.of(context).go('/home');
          } else {
            GoRouter.of(context).go('/additional-info');
          }
        }
      } catch (e) {
        // Error is already handled in notifier
      }
    }

    // Note: SMS auto-fill is handled by the SmsAutoFill().listenForCode() call in the first useEffect
    // The manual input fields will work with both manual typing and auto-fill

    void handleResendCode() async {
      try {
        await loginNotifier.sendCode(phoneNumber);
      } catch (e) {
        // Error is already handled in notifier
      }
    }

    void onDigitChanged(String value, int index) {
      if (value.length == 1) {
        // Move to next field
        if (index < 5) {
          currentIndex.value = index + 1;
          focusNodes[index + 1].requestFocus();
        } else {
          // Last digit entered, verify code
          focusNodes[index].unfocus();
          handleVerifyCode();
        }
      } else if (value.isEmpty && index > 0) {
        // Move to previous field on backspace
        currentIndex.value = index - 1;
        focusNodes[index - 1].requestFocus();
      }
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 40),
              // Title
              Text(
                'login.enter_code'.tr(),
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 28,
                    ),
              ),
              const SizedBox(height: 16),
              // Instructions
              Text(
                'login.code_instruction'.tr(),
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 16,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 16),
              // Auto-fill hint
              Row(
                children: [
                  Icon(
                    Icons.message,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'login.auto_fill_hint'.tr(),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              // Manual PIN input fields
              Center(
                child: Directionality(
                  textDirection: TextDirection.ltr,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(6, (index) {
                      return Container(
                        width: 45,
                        height: 55,
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        child: TextFormField(
                          controller: pinControllers[index],
                          focusNode: focusNodes[index],
                          textAlign: TextAlign.center,
                          keyboardType: TextInputType.number,
                          maxLength: 1,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                          decoration: InputDecoration(
                            counterText: '',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(
                                color: currentIndex.value == index
                                    ? context.colorScheme.primary
                                    : Colors.grey[300]!,
                                width: 2,
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(
                                color: Colors.grey[300]!,
                                width: 1,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(
                                color: context.colorScheme.primary,
                                width: 2,
                              ),
                            ),
                            filled: true,
                            fillColor: currentIndex.value == index
                                ? context.colorScheme.primary.withOpacity(0.05)
                                : Colors.grey[50],
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          onChanged: (value) => onDigitChanged(value, index),
                          onTap: () {
                            currentIndex.value = index;
                          },
                        ),
                      );
                    }),
                  ),
                ),
              ),
              const Spacer(),
              // Error message
              if (loginState.error != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    loginState.error!,
                    style: TextStyle(color: Colors.red[700]),
                    textAlign: TextAlign.center,
                  ),
                ),
              if (loginState.error != null) const SizedBox(height: 16),
              // Verify button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: loginState.isLoading ? null : handleVerifyCode,
                  child: loginState.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          'login.confirm'.tr(),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 16),
              // Resend code
              Center(
                child: GestureDetector(
                  onTap: handleResendCode,
                  child: RichText(
                    text: TextSpan(
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                      children: [
                        TextSpan(text: 'login.didnt_receive'.tr()),
                        const TextSpan(text: ' '),
                        TextSpan(
                          text: 'login.resend_code'.tr(),
                          style: TextStyle(
                            color: context.colorScheme.primary,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
