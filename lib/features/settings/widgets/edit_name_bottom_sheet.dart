import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../common/widgets/custom_text_field.dart';
import '../../../extensions/context.dart';
import '../../login/presentation/providers/auth_provider.dart';

class EditNameBottomSheet extends HookConsumerWidget {
  final String? currentName;

  const EditNameBottomSheet({
    super.key,
    this.currentName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final nameController = useTextEditingController(text: currentName ?? '');
    final isLoading = useState(false);
    final errorMessage = useState<String?>(null);

    String? validateName(String? value) {
      if (value == null || value.trim().isEmpty) {
        return 'settings.name_required'.tr();
      }
      if (value.trim().length < 2) {
        return 'settings.name_too_short'.tr();
      }
      if (value.trim().length > 50) {
        return 'settings.name_too_long'.tr();
      }
      return null;
    }

    Future<void> updateName() async {
      final validation = validateName(nameController.text);
      if (validation != null) {
        errorMessage.value = validation;
        return;
      }

      isLoading.value = true;
      errorMessage.value = null;

      try {
        final updateProfileUseCase = ref.read(updateProfileUseCaseProvider);
        await updateProfileUseCase.call(nameController.text.trim(), null);

        // Refresh the current user provider to get updated data
        ref.invalidate(currentUserProvider);

        if (context.mounted) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('settings.name_updated'.tr()),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        errorMessage.value = 'settings.name_update_failed'.tr();
      } finally {
        isLoading.value = false;
      }
    }

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Title
          Row(
            children: [
              Icon(
                Icons.edit_outlined,
                color: Theme.of(context).primaryColor,
                size: 24,
              ),
              const SizedBox(width: 12),
              Text(
                'settings.edit_name'.tr(),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Name input field
          CustomTextField(
            controller: nameController,
            label: 'settings.name_hint'.tr(),
            hint: 'settings.enter_name'.tr(),
            prefixIcon: const Icon(Icons.person_outline, color: Colors.grey),
            enabled: !isLoading.value,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => updateName(),
          ),

          // Error message
          if (errorMessage.value != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: Colors.red.shade200,
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.error_outline,
                    color: Colors.red.shade700,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      errorMessage.value!,
                      style: TextStyle(
                        color: Colors.red.shade700,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Action buttons
          Row(
            children: [
              // Cancel button
              Expanded(
                child: OutlinedButton(
                  onPressed: isLoading.value
                      ? null
                      : () => Navigator.of(context).pop(),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(
                      color: Colors.grey.shade300,
                      width: 1,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(
                    'common.cancel'.tr(),
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Colors.grey,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Save button
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: isLoading.value ? null : updateName,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    elevation: 0,
                  ),
                  child: isLoading.value
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          'settings.save_name'.tr(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),
        ],
      ),
    );
  }

  static Future<void> show(BuildContext context, String? currentName) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => EditNameBottomSheet(currentName: currentName),
    );
  }
}
