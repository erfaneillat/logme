import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'common_next_button.dart';

class ReferralCodePage extends StatefulWidget {
  final GlobalKey<FormBuilderState> formKey;
  final String? initialValue;
  final Function(String?)? onReferralCodeChanged;
  final VoidCallback? onNext;

  const ReferralCodePage({
    super.key,
    required this.formKey,
    this.initialValue,
    this.onReferralCodeChanged,
    this.onNext,
  });

  @override
  State<ReferralCodePage> createState() => _ReferralCodePageState();
}

class _ReferralCodePageState extends State<ReferralCodePage> {
  final TextEditingController _referralController = TextEditingController();
  bool _isValidCode = false;

  @override
  void initState() {
    super.initState();
    _referralController.text = widget.initialValue ?? '';
    // Initialize local validity without modifying providers during build
    _isValidCode = _referralController.text.trim().isNotEmpty;
    // Defer provider updates until after the first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      widget.onReferralCodeChanged?.call(
        _referralController.text.trim().isEmpty
            ? null
            : _referralController.text.trim(),
      );
    });
  }

  @override
  void dispose() {
    _referralController.dispose();
    super.dispose();
  }

  void _validateCode(String code) {
    setState(() {
      _isValidCode = code.trim().isNotEmpty;
    });
    widget.onReferralCodeChanged
        ?.call(code.trim().isEmpty ? null : code.trim());
  }

  void _submitCode() {
    if (_isValidCode) {
      // Handle code submission logic here
      // For now, just show a snackbar
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Referral code submitted: ${_referralController.text}'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        children: [
          const SizedBox(height: 40),

          // Title
          Text(
            'additional_info.referral_title'.tr(),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  height: 1.3,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
          ),

          const SizedBox(height: 8),

          // Subtitle
          Text(
            'additional_info.referral_subtitle'.tr(),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  height: 1.4,
                  fontSize: 16,
                ),
          ),

          const SizedBox(height: 8),

          // Instruction
          Text(
            'additional_info.referral_instruction'.tr(),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  height: 1.4,
                  fontSize: 14,
                ),
          ),

          const Spacer(),

          // Referral Code Input Field
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                // Input field
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 16),
                    child: TextField(
                      controller: _referralController,
                      decoration: InputDecoration(
                        hintText: 'additional_info.referral_hint'.tr(),
                        hintStyle: TextStyle(
                          color: Theme.of(context)
                              .colorScheme
                              .onSurfaceVariant
                              .withOpacity(0.6),
                          fontSize: 16,
                        ),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.zero,
                      ),
                      style: TextStyle(
                        fontSize: 16,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                      onChanged: _validateCode,
                    ),
                  ),
                ),

                // Submit button
                Container(
                  margin: const EdgeInsets.only(right: 8),
                  child: ElevatedButton(
                    onPressed: _isValidCode ? _submitCode : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isValidCode
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.surfaceVariant,
                      foregroundColor: _isValidCode
                          ? Colors.white
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                    ),
                    child: Text(
                      'additional_info.referral_submit'.tr(),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 40),

          // Continue button
          CommonNextButton(
            onPressed: widget.onNext,
            text: 'additional_info.continue',
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
