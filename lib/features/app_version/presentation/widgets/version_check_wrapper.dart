import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/features/app_version/presentation/providers/app_version_provider.dart';
import 'package:cal_ai/features/app_version/presentation/widgets/update_dialog.dart';

class VersionCheckWrapper extends ConsumerWidget {
  final Widget child;

  const VersionCheckWrapper({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final versionCheckAsync = ref.watch(appVersionCheckProvider);

    versionCheckAsync.whenData((versionCheck) {
      if (versionCheck.shouldShowUpdate) {
        // Show update dialog after the current frame is built
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (context.mounted) {
            showDialog(
              context: context,
              barrierDismissible: !versionCheck.isForceUpdate,
              builder: (context) => UpdateDialog(versionCheck: versionCheck),
            );
          }
        });
      }
    });

    return child;
  }
}
