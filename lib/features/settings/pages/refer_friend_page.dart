import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';

import '../presentation/providers/referral_providers.dart';

class ReferFriendPage extends HookConsumerWidget {
  const ReferFriendPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final codeAsync = ref.watch(referralCodeProvider);

    void copyToClipboard(String text) async {
      await Clipboard.setData(ClipboardData(text: text));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('refer.copied'.tr())),
        );
      }
    }

    void shareCode(String code) {
      final text = 'refer.share_text'.tr(namedArgs: {'code': code});
      Share.share(text);
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('refer.title'.tr()),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'refer.headline'.tr(),
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 16),
              const _AvatarsOrbit(),
              const SizedBox(height: 16),
              Center(
                child: Column(
                  children: [
                    Text(
                      'refer.empower_title'.tr(),
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'refer.empower_sub'.tr(),
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: Colors.black54),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Promo code field
              Text('refer.code_label'.tr(),
                  style: Theme.of(context)
                      .textTheme
                      .labelLarge
                      ?.copyWith(color: Colors.black54)),
              const SizedBox(height: 8),
              codeAsync.when(
                loading: () => const _CodeBox.loading(),
                error: (e, st) => _CodeBox(
                  code: '———',
                  onCopy: null,
                ),
                data: (code) => _CodeBox(
                  code: code,
                  onCopy: () => copyToClipboard(code),
                ),
              ),

              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: codeAsync.maybeWhen(
                  orElse: () => ElevatedButton(
                    onPressed: null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      shape: const StadiumBorder(),
                    ),
                    child: Text('refer.share'.tr()),
                  ),
                  data: (code) => ElevatedButton(
                    onPressed: () => shareCode(code),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      shape: const StadiumBorder(),
                    ),
                    child: Text('refer.share'.tr()),
                  ),
                ),
              ),

              const SizedBox(height: 20),
              const _EarningsSection(),
              const SizedBox(height: 16),
              _HowToEarnCard(),
            ],
          ),
        ),
      ),
    );
  }
}

class _EarningsSection extends HookConsumerWidget {
  const _EarningsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final earningsAsync = ref.watch(referralEarningsProvider);
    final countAsync = ref.watch(referralSuccessCountProvider);

    Widget buildTile({required String title, required String value}) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF7F7FA),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(title,
                  style: Theme.of(context)
                      .textTheme
                      .labelLarge
                      ?.copyWith(color: Colors.black54)),
            ),
            Text(value,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w700)),
          ],
        ),
      );
    }

    final formatter = NumberFormat.decimalPattern();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('refer.earnings_title'.tr(),
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        earningsAsync.when(
          loading: () => buildTile(title: 'refer.earnings_amount_label'.tr(), value: '…'),
          error: (e, st) => buildTile(title: 'refer.earnings_amount_label'.tr(), value: '—'),
          data: (amount) => buildTile(
            title: 'refer.earnings_amount_label'.tr(),
            value: 'refer.earnings_amount'.tr(namedArgs: {
              'amount': formatter.format(amount),
            }),
          ),
        ),
        const SizedBox(height: 8),
        countAsync.when(
          loading: () => buildTile(title: 'refer.earnings_count_label'.tr(), value: '…'),
          error: (e, st) => buildTile(title: 'refer.earnings_count_label'.tr(), value: '—'),
          data: (count) => buildTile(
            title: 'refer.earnings_count_label'.tr(),
            value: 'refer.earnings_count'.tr(namedArgs: {
              'count': formatter.format(count),
            }),
          ),
        ),
      ],
    );
  }
}

class _AvatarsOrbit extends StatelessWidget {
  const _AvatarsOrbit();

  @override
  Widget build(BuildContext context) {
    final colors = [
      Colors.lightBlue.shade200, // left-top
      Colors.green.shade300,     // mid-left-top
      Colors.blue.shade200,      // mid-right-top
      Colors.orange.shade200,    // right-top
      Colors.pink.shade200,      // left-bottom
      Colors.purple.shade200,    // right-bottom
    ];

    return SizedBox(
      height: 160,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Center circle with icon
          Container(
            width: 72,
            height: 72,
            decoration: const BoxDecoration(
              color: Color(0xFFEDEDED),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.local_dining_rounded, color: Colors.black87, size: 28),
          ),

          // Top-left
          Align(
            alignment: const Alignment(-0.85, -0.25),
            child: _Avatar(color: colors[0]),
          ),
          // Mid-left-top
          Align(
            alignment: const Alignment(-0.35, -0.55),
            child: _Avatar(color: colors[1]),
          ),
          // Mid-right-top
          Align(
            alignment: const Alignment(0.35, -0.55),
            child: _Avatar(color: colors[2]),
          ),
          // Top-right
          Align(
            alignment: const Alignment(0.85, -0.20),
            child: _Avatar(color: colors[3]),
          ),
          // Bottom-left
          Align(
            alignment: const Alignment(-0.45, 0.70),
            child: _Avatar(color: colors[4]),
          ),
          // Bottom-right
          Align(
            alignment: const Alignment(0.45, 0.70),
            child: _Avatar(color: colors[5]),
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
      ),
      child: CircleAvatar(
        radius: 28,
        backgroundColor: color,
        child: const Icon(Icons.person, color: Colors.white),
      ),
    );
  }
}

class _CodeBox extends StatelessWidget {
  const _CodeBox({required this.code, required this.onCopy});
  const _CodeBox.loading()
      : code = '…',
        onCopy = null;

  final String code;
  final VoidCallback? onCopy;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F7FA),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              code,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(letterSpacing: 2, fontWeight: FontWeight.w700),
            ),
          ),
          IconButton(
            onPressed: onCopy,
            icon: const Icon(Icons.copy_rounded),
            tooltip: 'refer.copy'.tr(),
          )
        ],
      ),
    );
  }
}

class _HowToEarnCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFEDEDED),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.info_outline),
              const SizedBox(width: 8),
              Text('refer.how_title'.tr(),
                  style: const TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.star, size: 16),
              const SizedBox(width: 6),
              Expanded(child: Text('refer.how_point1'.tr())),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.star, size: 16),
              const SizedBox(width: 6),
              Expanded(child: Text('refer.how_point2'.tr())),
            ],
          ),
        ],
      ),
    );
  }
}
