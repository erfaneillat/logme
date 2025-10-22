import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:sms_autofill/sms_autofill.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/foundation.dart';
import '../providers/login_provider.dart';
import 'verification_page.dart';
import 'package:cal_ai/features/app_version/presentation/widgets/version_check_wrapper.dart';

class LoginPage extends HookConsumerWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phoneController = useTextEditingController();
    final loginNotifier = ref.read(loginProvider.notifier);
    final loginState = ref.watch(loginProvider);
    final appSignature = useState<String?>(null);

    useEffect(() {
      Future.microtask(() async {
        try {
          appSignature.value = await SmsAutoFill().getAppSignature;
        } catch (_) {}
      });
      return null;
    }, const []);

    void handleSendCode() async {
      if (phoneController.text.trim().isEmpty) {
        return;
      }

      try {
        await loginNotifier.sendCode(phoneController.text.trim());
        // Navigate to verification page
        if (context.mounted) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => VerificationPage(
                phoneNumber: phoneController.text.trim(),
              ),
            ),
          );
        }
      } catch (e) {
        // Error is already handled in notifier
      }
    }

    return VersionCheckWrapper(
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            children: [
              const SizedBox(height: 60),
              // Welcome Title
              Text(
                'login.welcome_title'.tr(),
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 28,
                      height: 1.2,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              // Phone Input Field
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TextFormField(
                  controller: phoneController,
                  decoration: InputDecoration(
                    hintText: 'login.phone_hint'.tr(),
                    hintStyle: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 16,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                  ),
                  keyboardType: TextInputType.phone,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              if (kDebugMode && appSignature.value != null) ...[
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () async {
                    final value = appSignature.value!;
                    await Clipboard.setData(ClipboardData(text: value));
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('App hash copied')),
                      );
                    }
                  },
                  child: Text(
                    'SMS app hash: ${appSignature.value}',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
              const Spacer(),
              // Continue Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: loginState.isLoading ? null : handleSendCode,
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
                          'login.continue'.tr(),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 20),
              // Terms Text
              GestureDetector(
                onTap: () async {
                  final uri = Uri.parse('https://loqmeapp.ir/privacy-policy');
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                },
                child: Text(
                  'login.terms_text'.tr(),
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                    height: 1.4,
                    decoration: TextDecoration.underline,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    ),
    );
  }
}
