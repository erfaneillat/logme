import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

/// Dialog shown when a free tier user exceeds their daily image analysis limit
Future<bool?> showFreeTierLimitDialog({
  required BuildContext context,
  required String message,
  required String nextResetDate,
  VoidCallback? onUpgradePressed,
}) {
  return showDialog<bool?>(
    context: context,
    barrierDismissible: false,
    builder: (BuildContext context) => AlertDialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Row(
        children: [
          Icon(
            Icons.info_outline,
            color: Colors.orange,
            size: 28,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'free_tier_limit.title'.tr(),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 15,
              height: 1.6,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(
            'common.cancel'.tr(),
            style: const TextStyle(
              color: Colors.grey,
            ),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop(true);
            onUpgradePressed?.call();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
          ),
          child: Text(
            'free_tier_limit.upgrade_button'.tr(),
          ),
        ),
      ],
    ),
  );
}
