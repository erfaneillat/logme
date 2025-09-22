import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../presentation/providers/referral_providers.dart';

class ReferFriendPage extends HookConsumerWidget {
  const ReferFriendPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final codeAsync = ref.watch(referralCodeProvider);
    final updateState = ref.watch(referralCodeUpdateProvider);
    final updateNotifier = ref.read(referralCodeUpdateProvider.notifier);

    void copyToClipboard(String text) async {
      await Clipboard.setData(ClipboardData(text: text));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 8),
                Text('refer.copied'.tr()),
              ],
            ),
            backgroundColor: const Color(0xFF4CAF50),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    }

    void shareCode(String code) {
      final text = 'refer.share_text'.tr(namedArgs: {'code': code});
      Share.share(text);
    }

    Future<void> updateReferralCode(String newCode) async {
      final updatedCode = await updateNotifier.updateCode(newCode);
      if (updatedCode != null && context.mounted) {
        // Refresh the referral code provider to show the updated code
        ref.invalidate(referralCodeProvider);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 8),
                Text('refer.code_updated_success'.tr()),
              ],
            ),
            backgroundColor: const Color(0xFF4CAF50),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            margin: const EdgeInsets.all(16),
          ),
        );
      } else if (updateState.error != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(child: Text(updateState.error!)),
              ],
            ),
            backgroundColor: const Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'refer.title'.tr(),
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: Colors.grey.shade200,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Section
              Container(
                padding: const EdgeInsets.all(24),
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
                  children: [
                    // Icon with gradient background
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Theme.of(context).primaryColor,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color:
                                Theme.of(context).primaryColor.withOpacity(0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.group_add_rounded,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'refer.headline'.tr(),
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: Colors.black87,
                              ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: Column(
                        children: [
                          Text(
                            'refer.empower_title'.tr(),
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: Colors.black87,
                                ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'refer.empower_sub'.tr(),
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: Colors.grey.shade600,
                                  height: 1.5,
                                ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Referral Code Section
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
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
                            color:
                                Theme.of(context).primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.discount,
                            color: Theme.of(context).primaryColor,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'refer.code_label'.tr(),
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: Colors.black87,
                                  ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    codeAsync.when(
                      loading: () => const _CodeBox.loading(),
                      error: (e, st) => _CodeBox(
                        code: '———',
                        onCopy: null,
                        onUpdate: null,
                        isUpdating: false,
                      ),
                      data: (code) => _CodeBox(
                        code: code,
                        onCopy: () => copyToClipboard(code),
                        onUpdate: updateReferralCode,
                        isUpdating: updateState.isLoading,
                      ),
                    ),
                    const SizedBox(height: 16),
                    codeAsync.maybeWhen(
                      orElse: () => _ShareButton(
                        onPressed: null,
                        text: 'refer.share'.tr(),
                      ),
                      data: (code) => _ShareButton(
                        onPressed: () => shareCode(code),
                        text: 'refer.share'.tr(),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              const _EarningsSection(),
              const SizedBox(height: 24),
              _HowToEarnCard(),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShareButton extends StatelessWidget {
  const _ShareButton({
    required this.onPressed,
    required this.text,
  });

  final VoidCallback? onPressed;
  final String text;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: const Icon(Icons.share, size: 18, color: Colors.white),
        label: Text(
          text,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 16,
            color: Colors.white,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: onPressed != null
              ? Theme.of(context).primaryColor
              : Colors.grey.shade400,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          elevation: onPressed != null ? 2 : 0,
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

    Widget buildTile({
      required String title,
      required String value,
      required IconData icon,
      bool isLoading = false,
      bool isError = false,
    }) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isError
                    ? Colors.red.withOpacity(0.1)
                    : isLoading
                        ? Colors.orange.withOpacity(0.1)
                        : Theme.of(context).primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: isError
                    ? Colors.red
                    : isLoading
                        ? Colors.orange
                        : Theme.of(context).primaryColor,
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey.shade600,
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    final formatter = NumberFormat.decimalPattern();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.account_balance_wallet,
                color: Theme.of(context).primaryColor,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'refer.earnings_title'.tr(),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        earningsAsync.when(
          loading: () => buildTile(
            title: 'refer.earnings_amount_label'.tr(),
            value: 'common.loading_ellipsis'.tr(),
            icon: Icons.access_time,
            isLoading: true,
          ),
          error: (e, st) => buildTile(
            title: 'refer.earnings_amount_label'.tr(),
            value: 'refer.unable_to_load'.tr(),
            icon: Icons.error_outline,
            isError: true,
          ),
          data: (amount) => buildTile(
            title: 'refer.earnings_amount_label'.tr(),
            value: 'refer.earnings_amount'.tr(namedArgs: {
              'amount': formatter.format(amount),
            }),
            icon: Icons.attach_money,
          ),
        ),
        const SizedBox(height: 12),
        countAsync.when(
          loading: () => buildTile(
            title: 'refer.earnings_count_label'.tr(),
            value: 'common.loading_ellipsis'.tr(),
            icon: Icons.access_time,
            isLoading: true,
          ),
          error: (e, st) => buildTile(
            title: 'refer.earnings_count_label'.tr(),
            value: 'refer.unable_to_load'.tr(),
            icon: Icons.error_outline,
            isError: true,
          ),
          data: (count) => buildTile(
            title: 'refer.earnings_count_label'.tr(),
            value: 'refer.earnings_count'.tr(namedArgs: {
              'count': formatter.format(count),
            }),
            icon: Icons.people,
          ),
        ),
      ],
    );
  }
}

class _CodeBox extends StatefulWidget {
  const _CodeBox({
    required this.code,
    required this.onCopy,
    required this.onUpdate,
    required this.isUpdating,
  });
  const _CodeBox.loading()
      : code = '…',
        onCopy = null,
        onUpdate = null,
        isUpdating = false;

  final String code;
  final VoidCallback? onCopy;
  final Future<void> Function(String)? onUpdate;
  final bool isUpdating;

  @override
  State<_CodeBox> createState() => _CodeBoxState();
}

class _CodeBoxState extends State<_CodeBox> {
  bool _isEditing = false;
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _controller.text = widget.code;
  }

  @override
  void didUpdateWidget(_CodeBox oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.code != widget.code && !_isEditing) {
      _controller.text = widget.code;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _startEditing() {
    setState(() {
      _isEditing = true;
    });
    _focusNode.requestFocus();
  }

  void _cancelEditing() {
    setState(() {
      _isEditing = false;
      _controller.text = widget.code;
    });
  }

  Future<void> _saveEditing() async {
    final newCode = _controller.text.trim().toUpperCase();
    if (newCode == widget.code) {
      _cancelEditing();
      return;
    }

    if (widget.onUpdate != null) {
      await widget.onUpdate!(newCode);
      // The parent will handle success/error feedback
      if (mounted) {
        setState(() {
          _isEditing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = widget.code == '…';
    final isError = widget.code == '———';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isError
              ? Colors.red.withOpacity(0.2)
              : Theme.of(context).primaryColor.withOpacity(0.1),
          width: 1,
        ),
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
          // Input field container
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isError
                      ? Colors.red.withOpacity(0.1)
                      : isLoading
                          ? Colors.orange.withOpacity(0.1)
                          : Theme.of(context).primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  isError
                      ? Icons.error_outline
                      : isLoading
                          ? Icons.access_time
                          : Icons.discount,
                  color: isError
                      ? Colors.red
                      : isLoading
                          ? Colors.orange
                          : Theme.of(context).primaryColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _isEditing
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          TextField(
                            controller: _controller,
                            focusNode: _focusNode,
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  letterSpacing: 2,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.black87,
                                ),
                            decoration: InputDecoration(
                              border: InputBorder.none,
                              hintText: 'refer.code_input_hint'.tr(),
                              hintStyle: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: (Theme.of(context)
                                            .textTheme
                                            .titleLarge
                                            ?.fontSize ??
                                        20) *
                                    0.6,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 2,
                              ),
                            ),
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(
                                  RegExp(r'[A-Z0-9]')),
                              LengthLimitingTextInputFormatter(8),
                            ],
                            onSubmitted: (_) => _saveEditing(),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'refer.code_input_helper'.tr(),
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: Colors.grey.shade500,
                                      fontStyle: FontStyle.italic,
                                    ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      )
                    : Text(
                        widget.code,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              letterSpacing: 2,
                              fontWeight: FontWeight.w700,
                              color: isError ? Colors.red : Colors.black87,
                            ),
                      ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Action buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: _isEditing
                ? [
                    IconButton(
                      onPressed: widget.isUpdating ? null : _saveEditing,
                      icon: widget.isUpdating
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.check, color: Colors.green),
                      tooltip: 'refer.save_tooltip'.tr(),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.green.withOpacity(0.1),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: _cancelEditing,
                      icon: const Icon(Icons.close, color: Colors.red),
                      tooltip: 'refer.cancel_tooltip'.tr(),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.red.withOpacity(0.1),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ]
                : [
                    IconButton(
                      onPressed: widget.onCopy,
                      icon: Icon(
                        Icons.copy_rounded,
                        color: widget.onCopy != null
                            ? Theme.of(context).primaryColor
                            : Colors.grey.shade400,
                      ),
                      tooltip: 'refer.copy'.tr(),
                      style: IconButton.styleFrom(
                        backgroundColor: widget.onCopy != null
                            ? Theme.of(context).primaryColor.withOpacity(0.1)
                            : Colors.grey.shade100,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                    if (widget.onUpdate != null && !isLoading && !isError) ...[
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: _startEditing,
                        icon: Icon(Icons.edit,
                            color: Theme.of(context).primaryColor),
                        tooltip: 'refer.edit_code_tooltip'.tr(),
                        style: IconButton.styleFrom(
                          backgroundColor:
                              Theme.of(context).primaryColor.withOpacity(0.1),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ],
                  ],
          ),
        ],
      ),
    );
  }
}

class _HowToEarnCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.lightbulb_outline,
                  color: Theme.of(context).primaryColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'refer.how_title'.tr(),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _HowToPoint(
            icon: Icons.share,
            text: 'refer.how_point1'.tr(),
            color: Colors.green,
          ),
          const SizedBox(height: 12),
          _HowToPoint(
            icon: Icons.celebration,
            text: 'refer.how_point2'.tr(),
            color: Colors.orange,
          ),
        ],
      ),
    );
  }
}

class _HowToPoint extends StatelessWidget {
  const _HowToPoint({
    required this.icon,
    required this.text,
    required this.color,
  });

  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(
            icon,
            size: 16,
            color: color,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade700,
                  height: 1.5,
                ),
          ),
        ),
      ],
    );
  }
}
