import 'package:flutter/material.dart';
import 'dart:async';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../settings/data/referral_repository.dart';
import 'common_next_button.dart';

class ReferralCodePage extends ConsumerStatefulWidget {
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
  ConsumerState<ReferralCodePage> createState() => _ReferralCodePageState();
}

class _ReferralCodePageState extends ConsumerState<ReferralCodePage> {
  final TextEditingController _referralController = TextEditingController();
  bool _isValidCode = false;
  bool _isValidating = false;
  bool _isSubmitting = false;
  String? _validationError; // localized message or null
  Timer? _debounce;

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
      // Kick off initial validation if there's a prefilled code
      if (_referralController.text.trim().isNotEmpty) {
        _validateCode(_referralController.text.trim());
      }
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _referralController.dispose();
    super.dispose();
  }

  void _onChanged(String code) {
    // optimistic local enable on non-empty
    setState(() {
      _isValidCode = code.trim().isNotEmpty;
      _validationError = null;
    });
    widget.onReferralCodeChanged?.call(code.trim().isEmpty ? null : code.trim());

    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () async {
      await _validateCode(code);
    });
  }

  Future<void> _validateCode(String code) async {
    final repo = ref.read(referralRepositoryProvider);
    final trimmed = code.trim();
    if (trimmed.isEmpty) {
      setState(() {
        _isValidCode = false;
        _validationError = null;
      });
      return;
    }
    setState(() {
      _isValidating = true;
      _validationError = null;
    });
    try {
      final valid = await repo.validateCode(trimmed);
      setState(() {
        _isValidCode = valid;
        _validationError = valid ? null : 'additional_info.referral_invalid'.tr();
      });
    } catch (e) {
      setState(() {
        _isValidCode = false;
        _validationError = 'additional_info.referral_validation_error'.tr();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isValidating = false;
        });
      }
    }
  }

  Future<void> _submitCode() async {
    if (!_isValidCode || _isSubmitting) return;
    final code = _referralController.text.trim();
    if (code.isEmpty) return;
    final repo = ref.read(referralRepositoryProvider);
    setState(() {
      _isSubmitting = true;
    });
    try {
      await repo.submitCode(code);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('additional_info.referral_submit_success'.tr())),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('additional_info.referral_submit_failed'.tr())),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
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
                        suffixIcon: _isValidating
                            ? Padding(
                                padding: const EdgeInsets.all(12.0),
                                child: SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation(
                                      Theme.of(context).colorScheme.primary,
                                    ),
                                  ),
                                ),
                              )
                            : (_validationError == null && _referralController.text.trim().isNotEmpty)
                                ? const Icon(Icons.check_circle, color: Colors.green)
                                : null,
                      ),
                      style: TextStyle(
                        fontSize: 16,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                      onChanged: _onChanged,
                    ),
                  ),
                ),

                // Submit button
                Container(
                  margin: const EdgeInsets.only(right: 8),
                  child: ElevatedButton(
                    onPressed: _isValidCode && !_isSubmitting ? _submitCode : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isValidCode && !_isSubmitting
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.surfaceVariant,
                      foregroundColor: _isValidCode && !_isSubmitting
                          ? Colors.white
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                    ),
                    child: _isSubmitting
                        ? SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Theme.of(context).colorScheme.onPrimary,
                              ),
                            ),
                          )
                        : Text(
                            'additional_info.referral_submit'.tr(),
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),

          if (_validationError != null) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                _validationError!,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                  fontSize: 12,
                ),
              ),
            ),
          ],

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
