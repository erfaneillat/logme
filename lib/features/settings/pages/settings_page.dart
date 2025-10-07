import 'dart:async';
import 'dart:math';

import 'package:cal_ai/extensions/context.dart';
import 'package:cal_ai/services/lucky_wheel_service.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../login/presentation/providers/auth_provider.dart';
import '../presentation/providers/settings_providers.dart';
import '../widgets/edit_name_bottom_sheet.dart';

class SettingsPage extends HookConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);
    final prefs = ref.watch(preferencesProvider);

    // Show lucky wheel dialog once per visit
    useEffect(() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showLuckyWheelDialog(context, ref);
      });
      return null;
    }, const []);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Content
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Profile card
                  _ProfileCard(userAsync: userAsync),
                  const SizedBox(height: 20),

                  // Invite friends card
                  _InviteFriendsCard(),
                  const SizedBox(height: 20),

                  // Main actions grid
                  _ActionGrid(),
                  const SizedBox(height: 20),

                  // Preferences section
                  _PreferencesSection(prefs: prefs, ref: ref),
                  const SizedBox(height: 20),

                  // Support & Legal section
                  _SupportSection(),
                  const SizedBox(height: 20),

                  // Logout section
                  _LogoutSection(ref: ref),

                  const SizedBox(height: 32),
                  Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'settings.version'
                            .tr(namedArgs: {'version': '1.0.106'}),
                        style:
                            Theme.of(context).textTheme.labelMedium?.copyWith(
                                  color: Colors.black54,
                                  fontWeight: FontWeight.w500,
                                ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// New component widgets
class _ActionGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 16),
          child: Text(
            'settings.quick_actions'.tr(),
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: Colors.black87,
                ),
          ),
        ),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.4,
          children: [
            _ActionCard(
              icon: Icons.person_outline,
              title: 'settings.personal_details'.tr(),
              subtitle: 'settings.profile_details_subtitle'.tr(),
              color: const Color(0xFF4F46E5),
              onTap: () => context.push('/personal-details'),
            ),
            _ActionCard(
              icon: Icons.donut_large_outlined,
              title: 'settings.adjust_macros'.tr(),
              subtitle: 'settings.nutrition_targets_subtitle'.tr(),
              color: const Color(0xFF059669),
              onTap: () => context.push('/adjust-macros'),
            ),
            _ActionCard(
              icon: Icons.flag_outlined,
              title: 'settings.goal_and_weight'.tr(),
              subtitle: 'settings.track_progress_subtitle'.tr(),
              color: const Color(0xFFDC2626),
              onTap: () => context.push('/personal-details'),
            ),
            _ActionCard(
              icon: Icons.history,
              title: 'settings.weight_history'.tr(),
              subtitle: 'settings.view_trends_subtitle'.tr(),
              color: const Color(0xFF7C3AED),
              onTap: () => context.push('/weight-history'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _LanguageCard(),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: color.withOpacity(0.1),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
              BoxShadow(
                color: color.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      icon,
                      color: color,
                      size: 22,
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios,
                    color: Colors.grey.shade400,
                    size: 14,
                  ),
                ],
              ),
              const Spacer(),
              Text(
                title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey.shade600,
                    ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LanguageCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => context.push('/language-selection'),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.language,
                  color: Theme.of(context).primaryColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'settings.language'.tr(),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  context.locale.languageCode == 'fa' ? 'فارسی' : 'English',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                Icons.chevron_right,
                color: Colors.grey.shade400,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PreferencesSection extends StatelessWidget {
  const _PreferencesSection({required this.prefs, required this.ref});
  final dynamic prefs;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 16),
          child: Row(
            children: [
              Icon(
                Icons.tune,
                color: Theme.of(context).primaryColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'settings.preferences'.tr(),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              _ModernSwitchTile(
                title: 'settings.add_burned'.tr(),
                subtitle: 'settings.add_burned_desc'.tr(),
                value: prefs.addBurnedCalories,
                onChanged: (v) async {
                  await ref
                      .read(preferencesProvider.notifier)
                      .toggleAddBurnedCalories(v);
                },
                icon: Icons.local_fire_department_outlined,
                color: const Color(0xFFFF6B35),
              ),
              const _ModernDivider(),
              _ModernSwitchTile(
                title: 'settings.rollover'.tr(),
                subtitle: 'settings.rollover_desc'.tr(),
                value: prefs.rolloverCalories,
                onChanged: (v) async {
                  await ref
                      .read(preferencesProvider.notifier)
                      .toggleRolloverCalories(v);
                },
                icon: Icons.update,
                color: const Color(0xFF10B981),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SupportSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 16),
          child: Row(
            children: [
              Icon(
                Icons.help_outline,
                color: Theme.of(context).primaryColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'settings.support_legal'.tr(),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              _ModernSettingsTile(
                icon: Icons.privacy_tip_outlined,
                title: 'settings.privacy'.tr(),
                color: const Color(0xFF8B5CF6),
                onTap: () async {
                  final Uri url =
                      Uri.parse('https://loqmeapp.ir/privacy-policy');
                  try {
                    if (await canLaunchUrl(url)) {
                      await launchUrl(url,
                          mode: LaunchMode.externalApplication);
                    } else {
                      // Fallback to platform default
                      await launchUrl(url);
                    }
                  } catch (e) {
                    // Show error message if URL cannot be launched
                    if (context.mounted) {
                      context.showMessage(
                        'settings.url_launch_error'.tr(),
                        SnackBarType.error,
                      );
                    }
                  }
                },
              ),
              const _ModernDivider(),
              _ModernSettingsTile(
                icon: Icons.email_outlined,
                title: 'settings.support'.tr(),
                color: const Color(0xFF06B6D4),
                onTap: () async {
                  final Uri url = Uri.parse('https://loqmeapp.ir/contact');
                  try {
                    if (await canLaunchUrl(url)) {
                      await launchUrl(url,
                          mode: LaunchMode.externalApplication);
                    } else {
                      // Fallback to platform default
                      await launchUrl(url);
                    }
                  } catch (e) {
                    // Show error message if URL cannot be launched
                    if (context.mounted) {
                      context.showMessage(
                        'settings.url_launch_error'.tr(),
                        SnackBarType.error,
                      );
                    }
                  }
                },
              ),
              const _ModernDivider(),
              _ModernSettingsTile(
                icon: Icons.person_off_outlined,
                title: 'settings.delete_account'.tr(),
                color: const Color(0xFFEF4444),
                onTap: () => context.push('/delete-account'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// Helper function to show logout confirmation dialog
Future<bool> _showLogoutConfirmDialog(BuildContext context) async {
  print('🔥 Showing logout confirmation dialog'); // Debug print

  return await showDialog<bool>(
        context: context,
        barrierDismissible: false, // User must tap button to dismiss
        builder: (BuildContext context) {
          print('🔥 Dialog builder called'); // Debug print

          return AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.logout,
                    color: Colors.red,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'settings.logout_confirm_title'.tr(),
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 18,
                    ),
                  ),
                ),
              ],
            ),
            content: Text(
              'settings.logout_confirm_message'.tr(),
              style: TextStyle(
                color: Colors.grey.shade700,
                height: 1.4,
              ),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  print('🔥 Cancel button pressed'); // Debug print
                  Navigator.of(context).pop(false);
                },
                child: Text(
                  'settings.cancel'.tr(),
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              TextButton(
                onPressed: () {
                  print('🔥 Confirm logout button pressed'); // Debug print
                  Navigator.of(context).pop(true);
                },
                child: Text(
                  'settings.logout_confirm'.tr(),
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, color: Colors.red),
                ),
              ),
            ],
          );
        },
      ) ??
      false; // Return false if dialog is dismissed
}

class _LogoutSection extends HookConsumerWidget {
  const _LogoutSection({required this.ref});
  final WidgetRef ref;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoggingOut = useState(false);

    return ElevatedButton(
      onPressed: isLoggingOut.value
          ? null
          : () async {
              print('🔥 Logout button pressed'); // Debug print

              // Show confirmation dialog first
              final confirmed = await _showLogoutConfirmDialog(context);
              print('🔥 Confirmation result: $confirmed'); // Debug print

              if (!confirmed) return;

              isLoggingOut.value = true;
              print('🔥 Starting logout process'); // Debug print

              try {
                // Execute logout
                print('🔥 Calling logout use case'); // Debug print
                await ref.read(logoutUseCaseProvider).execute();
                print('🔥 Logout use case completed'); // Debug print

                // Invalidate all cached providers to ensure clean state
                ref.invalidate(currentUserProvider);
                print('🔥 Providers invalidated'); // Debug print

                // Navigate to login page after successful logout
                if (context.mounted) {
                  print('🔥 Navigating to login'); // Debug print
                  context.go('/login');
                }
              } catch (e) {
                print('🔥 Logout error: $e'); // Debug print
                // Show error message if logout fails
                if (context.mounted) {
                  context.showMessage(
                    'settings.logout_error'.tr(args: [e.toString()]),
                    SnackBarType.error,
                  );
                }
              } finally {
                if (context.mounted) {
                  isLoggingOut.value = false;
                  print('🔥 Logout process finished'); // Debug print
                }
              }
            },
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.red,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 8,
        ),
      ),
      child: isLoggingOut.value
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            )
          : Text(
              'settings.logout_button'.tr(),
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.userAsync});
  final AsyncValue<dynamic> userAsync;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () async {
          // Show name editing bottom sheet
          await userAsync.whenOrNull(
            data: (user) async {
              await EditNameBottomSheet.show(context, user?.name);
            },
          );
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Theme.of(context).primaryColor,
                Theme.of(context).primaryColor.withOpacity(0.8),
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Theme.of(context).primaryColor.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.3),
                    width: 2,
                  ),
                ),
                child: const Icon(
                  Icons.person_outline,
                  color: Colors.white,
                  size: 32,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: userAsync.when(
                  loading: () => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 16,
                        width: 120,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        height: 12,
                        width: 80,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ],
                  ),
                  error: (e, st) => Text(
                    'settings.error_loading_profile'.tr(),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white.withOpacity(0.9),
                        ),
                  ),
                  data: (u) {
                    final name = u?.name ?? '-';
                    final phone = u?.phone ?? '';
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -0.2,
                                  ),
                        ),
                        if (phone.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            phone,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: Colors.white.withOpacity(0.8),
                                  fontWeight: FontWeight.w500,
                                ),
                          ),
                        ],
                      ],
                    );
                  },
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.chevron_right,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InviteFriendsCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.group_add_outlined,
                  color: Colors.orange,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'settings.invite_friends'.tr(),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Container(
              height: 120,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.orange.withOpacity(0.1),
                    Colors.amber.withOpacity(0.05),
                  ],
                ),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.people_outline,
                      size: 40,
                      color: Colors.orange.shade700,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'settings.earn_rewards'.tr(),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.orange.shade700,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'settings.journey_together'.tr(),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => context.push('/refer-friend'),
              icon: const Icon(
                Icons.share,
                size: 18,
                color: Colors.white,
              ),
              label: Text(
                'settings.refer_cta'.tr(),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModernSwitchTile extends StatelessWidget {
  const _ModernSwitchTile({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    required this.icon,
    required this.color,
  });

  final String title;
  final String subtitle;
  final bool value;
  final Future<void> Function(bool) onChanged;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.black54,
                        height: 1.3,
                      ),
                ),
              ],
            ),
          ),
          Transform.scale(
            scale: 0.8,
            child: Switch(
              value: value,
              onChanged: (bool newValue) async {
                await onChanged(newValue);
              },
              activeColor: color,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
        ],
      ),
    );
  }
}

class _ModernSettingsTile extends StatelessWidget {
  const _ModernSettingsTile({
    required this.icon,
    required this.title,
    required this.color,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: Colors.grey.shade400,
                size: 18,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ModernDivider extends StatelessWidget {
  const _ModernDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      height: 1,
      color: Colors.grey.shade100,
    );
  }
}

// Lucky wheel dialog functions
void _showLuckyWheelDialog(BuildContext context, WidgetRef ref) {
  // Log the lucky wheel view to the server
  _logLuckyWheelView(context);

  showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) {
      return _LuckyWheelDialog(
        onClaim: () {
          Navigator.of(dialogContext).pop();
          // Navigate to subscription page
          context.push('/subscription');
        },
      );
    },
  );
}

void _logLuckyWheelView(BuildContext context) {
  // Get the lucky wheel service from the provider
  final container = ProviderScope.containerOf(context);
  final luckyWheelService = container.read(luckyWheelServiceProvider);

  // Call the API to log the lucky wheel view
  luckyWheelService.logLuckyWheelView().catchError((error) {
    // Log error but don't show to user as this is not critical
    debugPrint('Failed to log lucky wheel view: $error');
    return <String, dynamic>{}; // Return empty map to satisfy return type
  });
}

class _LuckyWheelDialog extends StatefulWidget {
  const _LuckyWheelDialog({required this.onClaim});

  final VoidCallback onClaim;

  @override
  State<_LuckyWheelDialog> createState() => _LuckyWheelDialogState();
}

class _LuckyWheelDialogState extends State<_LuckyWheelDialog>
    with TickerProviderStateMixin {
  double _turns = 0;
  bool _isSpinning = false;
  bool _hasSpun = false;
  late AnimationController _bounceController;
  late AnimationController _glowController;
  late Animation<double> _bounceAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _bounceController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _glowController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    _bounceAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _bounceController, curve: Curves.elasticOut),
    );
    _glowAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _bounceController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async => false,
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        elevation: 20,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(32),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Colors.white,
                Colors.grey[50]!,
              ],
            ),
          ),
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Title with gradient text
                  ShaderMask(
                    shaderCallback: (bounds) => LinearGradient(
                      colors: [Colors.purple[600]!, Colors.pink[600]!],
                    ).createShader(bounds),
                    child: Text(
                      'subscription.lucky_wheel.title'.tr(),
                      style:
                          Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                                color: Colors.white,
                              ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Animated hurry badge
                  AnimatedBuilder(
                    animation: _glowAnimation,
                    builder: (context, child) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.red[400]!,
                              Colors.red[600]!,
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.red
                                  .withOpacity(0.3 * _glowAnimation.value),
                              blurRadius: 8 + (4 * _glowAnimation.value),
                              spreadRadius: 2 * _glowAnimation.value,
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.flash_on,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'subscription.lucky_wheel.hurry_badge'.tr(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 20),

                  // Subtitle with better typography
                  Text(
                    'subscription.lucky_wheel.subtitle'.tr(),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: Colors.grey[800],
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),

                  // Description with improved styling
                  Text(
                    'subscription.lucky_wheel.description'.tr(),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                          height: 1.5,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),

                  // Enhanced wheel container with glow effect
                  AnimatedBuilder(
                    animation: _bounceAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _bounceAnimation.value,
                        child: Container(
                          height: 280,
                          width: 280,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.purple.withOpacity(0.2),
                                blurRadius: 20,
                                spreadRadius: 5,
                              ),
                              BoxShadow(
                                color: Colors.pink.withOpacity(0.1),
                                blurRadius: 40,
                                spreadRadius: 10,
                              ),
                            ],
                          ),
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              AnimatedRotation(
                                turns: _turns,
                                duration: const Duration(milliseconds: 3500),
                                curve: Curves.easeOutQuart,
                                onEnd: () {
                                  if (mounted) {
                                    setState(() {
                                      _isSpinning = false;
                                      _hasSpun = true;
                                    });
                                    _bounceController.forward().then((_) {
                                      _bounceController.reverse();
                                    });
                                  }
                                },
                                child: _buildWheel(),
                              ),
                              Positioned(
                                top: -16,
                                child:
                                    _PointerIndicator(isSpinning: _isSpinning),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 32),

                  // Enhanced button with gradient and animation
                  AnimatedBuilder(
                    animation: _glowAnimation,
                    builder: (context, child) {
                      return Container(
                        width: double.infinity,
                        height: 56,
                        decoration: BoxDecoration(
                          gradient: _hasSpun
                              ? LinearGradient(
                                  colors: [
                                    Colors.green[400]!,
                                    Colors.green[600]!
                                  ],
                                )
                              : LinearGradient(
                                  colors: [
                                    Colors.purple[600]!,
                                    Colors.pink[600]!
                                  ],
                                ),
                          borderRadius: BorderRadius.circular(28),
                          boxShadow: [
                            BoxShadow(
                              color: (_hasSpun ? Colors.green : Colors.purple)
                                  .withOpacity(
                                      0.3 + (0.2 * _glowAnimation.value)),
                              blurRadius: 12 + (4 * _glowAnimation.value),
                              spreadRadius: 2 * _glowAnimation.value,
                            ),
                          ],
                        ),
                        child: ElevatedButton(
                          onPressed: _isSpinning
                              ? null
                              : _hasSpun
                                  ? widget.onClaim
                                  : _spinWheel,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(28),
                            ),
                          ),
                          child: _isSpinning
                              ? Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      'subscription.lucky_wheel.spinning'.tr(),
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (_hasSpun) ...[
                                      Icon(
                                        Icons.check_circle,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                    ] else ...[
                                      Icon(
                                        Icons.casino,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                    ],
                                    Expanded(
                                      child: Text(
                                        _hasSpun
                                            ? 'subscription.lucky_wheel.result_cta'
                                                .tr()
                                            : 'subscription.lucky_wheel.spin_button'
                                                .tr(),
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                        textAlign: TextAlign.center,
                                        overflow: TextOverflow.ellipsis,
                                        maxLines: 1,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWheel() {
    final wheelItems = [
      _WheelItem(
        colors: [Colors.red[400]!, Colors.red[600]!],
        label: '۷۰٪\nتخفیف',
        isSpecial: true,
      ),
      _WheelItem(
        colors: [Colors.green[400]!, Colors.green[600]!],
        label: '۵۰٪\nتخفیف',
      ),
      _WheelItem(
        colors: [Colors.orange[400]!, Colors.orange[500]!],
        label: '۳۰٪\nتخفیف',
      ),
      _WheelItem(
        colors: [Colors.blue[400]!, Colors.blue[600]!],
        label: '۲۰٪\nتخفیف',
      ),
      _WheelItem(
        colors: [Colors.purple[400]!, Colors.purple[600]!],
        label: '۱۰٪\nتخفیف',
      ),
      _WheelItem(
        colors: [Colors.grey[400]!, Colors.grey[600]!],
        label: 'پوچ',
      ),
    ];

    return Stack(
      alignment: Alignment.center,
      children: [
        SizedBox.expand(
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  Colors.white,
                  Colors.grey[100]!,
                  Colors.grey[200]!,
                ],
                stops: const [0.0, 0.7, 1.0],
              ),
              border: Border.all(
                color: Colors.grey[300]!,
                width: 3,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.15),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
                BoxShadow(
                  color: Colors.white.withOpacity(0.8),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
          ),
        ),
        for (int i = 0; i < wheelItems.length; i++)
          Positioned.fill(
            child: CustomPaint(
              painter: _SlicePainter(
                colors: wheelItems[i].colors,
                startAngle: -pi / 2 + i * (2 * pi / wheelItems.length),
                sweepAngle: 2 * pi / wheelItems.length,
              ),
            ),
          ),
        Positioned.fill(
          child: _WheelLabelsLayer(items: wheelItems),
        ),
        Center(
          child: Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white,
                  Colors.grey[50]!,
                ],
              ),
              border: Border.all(
                color: Colors.grey[400]!,
                width: 3,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: _hasSpun
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '70%',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.red[600],
                          height: 1,
                        ),
                      ),
                      Text(
                        'OFF',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.red[600],
                          height: 1,
                        ),
                      ),
                    ],
                  )
                : Icon(
                    Icons.casino,
                    size: 36,
                    color: Colors.grey[600],
                  ),
          ),
        ),
      ],
    );
  }

  void _spinWheel() {
    setState(() {
      _isSpinning = true;
      // Always land on the 70% slice (index 0)
      const totalSlices = 6;
      const targetSlice = 0;

      final currentFraction = _turns - _turns.floorToDouble();
      final randomFullTurns = 4 + Random().nextInt(3); // 4-6 full turns

      // Align pointer (top) with the center of the target slice
      final targetFraction = 1 - ((targetSlice + 0.5) / totalSlices);

      double additionalTurns =
          randomFullTurns + (targetFraction - currentFraction);

      _turns += additionalTurns;
    });

    // Start glow animation
    _glowController.repeat(reverse: true);

    // Stop glow animation when spinning ends
    Future.delayed(const Duration(milliseconds: 3500), () {
      if (mounted) {
        _glowController.stop();
        _glowController.reset();
      }
    });
  }
}

class _WheelItem {
  const _WheelItem({
    required this.colors,
    required this.label,
    this.isSpecial = false,
  });

  final List<Color> colors;
  final String label;
  final bool isSpecial;
}

class _SlicePainter extends CustomPainter {
  _SlicePainter({
    required this.colors,
    required this.startAngle,
    required this.sweepAngle,
  });

  final List<Color> colors;
  final double startAngle;
  final double sweepAngle;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final paint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: colors,
      ).createShader(Rect.fromCircle(center: center, radius: radius));

    final path = Path()
      ..moveTo(center.dx, center.dy)
      ..arcTo(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
      )
      ..close();

    canvas.drawPath(path, paint);

    final borderPaint = Paint()
      ..color = Colors.white.withOpacity(0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    canvas.drawPath(path, borderPaint);
  }

  @override
  bool shouldRepaint(_SlicePainter oldDelegate) {
    return oldDelegate.startAngle != startAngle ||
        oldDelegate.sweepAngle != sweepAngle;
  }
}

class _WheelLabelsLayer extends StatelessWidget {
  const _WheelLabelsLayer({required this.items});

  final List<_WheelItem> items;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        for (int i = 0; i < items.length; i++)
          Positioned.fill(
            child: Transform.rotate(
              angle: -pi / 2 + i * (2 * pi / items.length) + pi / items.length,
              child: Align(
                alignment: Alignment.topCenter,
                child: Padding(
                  padding: const EdgeInsets.only(top: 50),
                  child: Transform.rotate(
                    angle: pi / 2,
                    child: Text(
                      items[i].label,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: items[i].isSpecial ? 18 : 16,
                        fontWeight: items[i].isSpecial
                            ? FontWeight.w900
                            : FontWeight.bold,
                        color: Colors.white,
                        shadows: [
                          Shadow(
                            color: Colors.black.withOpacity(0.4),
                            blurRadius: 3,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _PointerIndicator extends StatelessWidget {
  const _PointerIndicator({required this.isSpinning});

  final bool isSpinning;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 0,
      height: 0,
      decoration: BoxDecoration(
        border: Border(
          left: BorderSide(
            width: 20,
            color: isSpinning ? Colors.amber : Colors.red,
          ),
          right: BorderSide(
            width: 20,
            color: isSpinning ? Colors.amber : Colors.red,
          ),
          bottom: BorderSide(
            width: 32,
            color: Colors.transparent,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: (isSpinning ? Colors.amber : Colors.red).withOpacity(0.5),
            blurRadius: 8,
            spreadRadius: 2,
          ),
        ],
      ),
    );
  }
}
