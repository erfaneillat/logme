import 'package:cal_ai/extensions/context.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../login/presentation/providers/auth_provider.dart';
import '../presentation/providers/settings_providers.dart';

class SettingsPage extends HookConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);
    final prefs = ref.watch(preferencesProvider);

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          _buildTopGradientBackground(context),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('settings.title'.tr(),
                      style: Theme.of(context)
                          .textTheme
                          .headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),

                  // Profile card
                  _ProfileCard(userAsync: userAsync),

                  const SizedBox(height: 12),

                  // Invite friends card
                  _InviteFriendsCard(),

                  const SizedBox(height: 12),

                  // Main actions list
                  _SectionCard(children: [
                    _SettingsTile(
                      icon: Icons.badge_outlined,
                      title: 'settings.personal_details'.tr(),
                      onTap: () => context.push('/personal-details'),
                    ),
                    _Divider(),
                    _SettingsTile(
                      icon: Icons.bubble_chart_outlined,
                      title: 'settings.adjust_macros'.tr(),
                      onTap: () => context.push('/adjust-macros'),
                    ),
                    _Divider(),
                    _SettingsTile(
                      icon: Icons.flag_outlined,
                      title: 'settings.goal_and_weight'.tr(),
                      onTap: () {},
                    ),
                    _Divider(),
                    _SettingsTile(
                      icon: Icons.history_toggle_off,
                      title: 'settings.weight_history'.tr(),
                      onTap: () {},
                    ),
                    _Divider(),
                    _SettingsTile(
                      icon: Icons.language,
                      title: 'settings.language'.tr(),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {},
                    ),
                  ]),

                  const SizedBox(height: 12),

                  // Preferences toggles
                  _SectionCard(
                    header: Row(children: [
                      const Icon(Icons.toggle_on_outlined),
                      const SizedBox(width: 8),
                      Text('settings.preferences'.tr(),
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                    ]),
                    children: [
                      _SwitchTile(
                        title: 'settings.add_burned'.tr(),
                        subtitle: 'settings.add_burned_desc'.tr(),
                        value: prefs.addBurnedCalories,
                        onChanged: (v) => ref
                            .read(preferencesProvider.notifier)
                            .toggleAddBurnedCalories(v),
                      ),
                      _Divider(),
                      _SwitchTile(
                        title: 'settings.rollover'.tr(),
                        subtitle: 'settings.rollover_desc'.tr(),
                        value: prefs.rolloverCalories,
                        onChanged: (v) => ref
                            .read(preferencesProvider.notifier)
                            .toggleRolloverCalories(v),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Legal and support
                  _SectionCard(children: [
                    _SettingsTile(
                      icon: Icons.description_outlined,
                      title: 'settings.terms'.tr(),
                    ),
                    const _Divider(),
                    _SettingsTile(
                      icon: Icons.privacy_tip_outlined,
                      title: 'settings.privacy'.tr(),
                    ),
                    const _Divider(),
                    _SettingsTile(
                      icon: Icons.email_outlined,
                      title: 'settings.support_email'.tr(),
                    ),
                    const _Divider(),
                    _SettingsTile(
                      icon: Icons.person_off_outlined,
                      title: 'settings.delete_account'.tr(),
                    ),
                  ]),

                  const SizedBox(height: 12),

                  // Logout
                  _SectionCard(children: [
                    _SettingsTile(
                      icon: Icons.logout,
                      title: 'settings.logout'.tr(),
                      onTap: () async {
                        await ref.read(logoutUseCaseProvider).execute();
                      },
                    )
                  ]),

                  const SizedBox(height: 24),
                  Center(
                    child: Text(
                      'settings.version'.tr(namedArgs: {'version': '1.0.106'}),
                      style: Theme.of(context)
                          .textTheme
                          .labelMedium
                          ?.copyWith(color: Colors.black54),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

Widget _buildTopGradientBackground(BuildContext context) {
  return Container(
    height: 180,
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFFF7F7FA), Color(0xFFF9FAFB)],
      ),
    ),
  );
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.userAsync});
  final AsyncValue<dynamic> userAsync; // keep it simple for now

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          const CircleAvatar(radius: 26, child: Icon(Icons.person_outline)),
          const SizedBox(width: 12),
          Expanded(
            child: userAsync.when(
              loading: () => const SizedBox(
                  height: 24,
                  child: Align(
                      alignment: Alignment.centerLeft,
                      child: CircularProgressIndicator(strokeWidth: 2))),
              error: (e, st) => const Text('-'),
              data: (u) {
                final name = u?.name ?? '—';
                final phone = u?.phone ?? '';
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: Theme.of(context).textTheme.titleMedium),
                    if (phone.isNotEmpty)
                      Text(phone,
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Colors.black54)),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _InviteFriendsCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.group_add_outlined),
              const SizedBox(width: 8),
              Text('settings.invite_friends'.tr(),
                  style: const TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.asset(
              'assets/images/food-onboarding.jpg',
              height: 140,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(height: 12),
          Text('settings.journey_together'.tr(),
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.push('/refer-friend'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                shape: const StadiumBorder(),
              ),
              child: Text(
                'settings.refer_cta'.tr(),
                style: context.textTheme.titleMedium
                    ?.copyWith(color: Colors.white),
              ),
            ),
          )
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({this.header, required this.children});
  final Widget? header;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (header != null) ...[
            header!,
            const SizedBox(height: 8),
          ],
          ...children,
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    this.onTap,
    this.trailing,
  });
  final IconData icon;
  final String title;
  final VoidCallback? onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Icon(icon),
            const SizedBox(width: 12),
            Expanded(
              child:
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
            ),
            trailing ?? const SizedBox.shrink(),
          ],
        ),
      ),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  const _SwitchTile({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 2),
              Text(subtitle,
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: Colors.black54)),
            ],
          ),
        ),
        Switch(value: value, onChanged: onChanged),
      ],
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      height: 1,
      color: Colors.grey.shade200,
    );
  }
}
