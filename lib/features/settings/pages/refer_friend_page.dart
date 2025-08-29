import 'dart:math';
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
                Text('Referral code updated successfully!'),
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
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text(
          'refer.title'.tr(),
          style: const TextStyle(fontWeight: FontWeight.w700),
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
            color: const Color(0xFFEEEEEE),
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
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF6366F1).withValues(alpha: 0.1),
                      const Color(0xFF8B5CF6).withValues(alpha: 0.1),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    Text(
                      'refer.headline'.tr(),
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF1F2937),
                              ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
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
                                ?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF1F2937),
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
                                  color: const Color(0xFF6B7280),
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
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.08),
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
                            color:
                                const Color(0xFF6366F1).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.discount,
                            color: const Color(0xFF6366F1),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'refer.code_label'.tr(),
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF1F2937),
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
                    SizedBox(
                      width: double.infinity,
                      child: codeAsync.maybeWhen(
                        orElse: () => _ShareButton(
                          onPressed: null,
                          text: 'refer.share'.tr(),
                        ),
                        data: (code) => _ShareButton(
                          onPressed: () => shareCode(code),
                          text: 'refer.share'.tr(),
                        ),
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
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: onPressed != null
              ? [const Color(0xFF6366F1), const Color(0xFF8B5CF6)]
              : [const Color(0xFF9CA3AF), const Color(0xFF6B7280)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: onPressed != null
            ? [
                BoxShadow(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16),
          elevation: 0,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.share, size: 20, color: Colors.white),
            const SizedBox(width: 8),
            Text(
              text,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
          ],
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
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF6366F1).withValues(alpha: 0.06),
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
                    ? const Color(0xFFEF4444).withValues(alpha: 0.1)
                    : isLoading
                        ? const Color(0xFFF59E0B).withValues(alpha: 0.1)
                        : const Color(0xFF10B981).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: isError
                    ? const Color(0xFFEF4444)
                    : isLoading
                        ? const Color(0xFFF59E0B)
                        : const Color(0xFF10B981),
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
                          color: const Color(0xFF6B7280),
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1F2937),
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
                color: const Color(0xFF6366F1).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.account_balance_wallet,
                color: Color(0xFF6366F1),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'refer.earnings_title'.tr(),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1F2937),
                  ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        earningsAsync.when(
          loading: () => buildTile(
            title: 'refer.earnings_amount_label'.tr(),
            value: 'Loading...',
            icon: Icons.access_time,
            isLoading: true,
          ),
          error: (e, st) => buildTile(
            title: 'refer.earnings_amount_label'.tr(),
            value: 'Unable to load',
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
            value: 'Loading...',
            icon: Icons.access_time,
            isLoading: true,
          ),
          error: (e, st) => buildTile(
            title: 'refer.earnings_count_label'.tr(),
            value: 'Unable to load',
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

class _AvatarsOrbit extends StatefulWidget {
  const _AvatarsOrbit();

  @override
  State<_AvatarsOrbit> createState() => _AvatarsOrbitState();
}

class _AvatarsOrbitState extends State<_AvatarsOrbit>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    )..repeat();

    _rotationAnimation = Tween<double>(
      begin: 0.0,
      end: 2 * pi,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.linear,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = [
      const Color(0xFF3B82F6), // blue-500
      const Color(0xFF10B981), // emerald-500
      const Color(0xFF6366F1), // indigo-500
      const Color(0xFFF59E0B), // amber-500
      const Color(0xFFEF4444), // red-500
      const Color(0xFF8B5CF6), // violet-500
    ];

    return SizedBox(
      height: 180,
      child: AnimatedBuilder(
        animation: _rotationAnimation,
        builder: (context, child) {
          return Stack(
            alignment: Alignment.center,
            children: [
              // Outer rotating ring
              Transform.rotate(
                angle: _rotationAnimation.value,
                child: Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.2),
                      width: 2,
                    ),
                  ),
                ),
              ),

              // Center circle with icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.local_dining_rounded,
                  color: Colors.white,
                  size: 32,
                ),
              ),

              // Animated avatars
              ...List.generate(6, (index) {
                final angle = (index * pi / 3) + _rotationAnimation.value;
                final radius = 70.0;
                final x = radius * cos(angle);
                final y = radius * sin(angle);

                return Transform.translate(
                  offset: Offset(x, y),
                  child: _Avatar(color: colors[index]),
                );
              }),
            ],
          );
        },
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
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: CircleAvatar(
        radius: 24,
        backgroundColor: color,
        child: const Icon(
          Icons.person,
          color: Colors.white,
          size: 20,
        ),
      ),
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
              ? const Color(0xFFEF4444).withValues(alpha: 0.2)
              : const Color(0xFF6366F1).withValues(alpha: 0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isError
                  ? const Color(0xFFEF4444).withValues(alpha: 0.1)
                  : isLoading
                      ? const Color(0xFFF59E0B).withValues(alpha: 0.1)
                      : const Color(0xFF6366F1).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              isError
                  ? Icons.error_outline
                  : isLoading
                      ? Icons.access_time
                      : Icons.discount,
              color: isError
                  ? const Color(0xFFEF4444)
                  : isLoading
                      ? const Color(0xFFF59E0B)
                      : const Color(0xFF6366F1),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _isEditing
                ? TextField(
                    controller: _controller,
                    focusNode: _focusNode,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          letterSpacing: 2,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1F2937),
                        ),
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      hintText: 'Enter code (4-8 chars)',
                      hintStyle: TextStyle(
                        color: const Color(0xFF6B7280),
                        fontSize:
                            Theme.of(context).textTheme.titleLarge?.fontSize,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2,
                      ),
                    ),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[A-Z0-9]')),
                      LengthLimitingTextInputFormatter(8),
                    ],
                    onSubmitted: (_) => _saveEditing(),
                  )
                : Text(
                    widget.code,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          letterSpacing: 2,
                          fontWeight: FontWeight.w700,
                          color: isError
                              ? const Color(0xFFEF4444)
                              : const Color(0xFF1F2937),
                        ),
                  ),
          ),
          if (_isEditing) ...[
            IconButton(
              onPressed: widget.isUpdating ? null : _saveEditing,
              icon: widget.isUpdating
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.check, color: Color(0xFF10B981)),
              tooltip: 'Save',
              style: IconButton.styleFrom(
                backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.1),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: _cancelEditing,
              icon: const Icon(Icons.close, color: Color(0xFFEF4444)),
              tooltip: 'Cancel',
              style: IconButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444).withValues(alpha: 0.1),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ] else ...[
            IconButton(
              onPressed: widget.onCopy,
              icon: Icon(
                Icons.copy_rounded,
                color: widget.onCopy != null
                    ? const Color(0xFF6366F1)
                    : const Color(0xFF9CA3AF),
              ),
              tooltip: 'refer.copy'.tr(),
              style: IconButton.styleFrom(
                backgroundColor: widget.onCopy != null
                    ? const Color(0xFF6366F1).withValues(alpha: 0.1)
                    : const Color(0xFFF3F4F6),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            if (widget.onUpdate != null && !isLoading && !isError) ...[
              const SizedBox(width: 8),
              IconButton(
                onPressed: _startEditing,
                icon: const Icon(Icons.edit, color: Color(0xFF6366F1)),
                tooltip: 'Edit code',
                style: IconButton.styleFrom(
                  backgroundColor:
                      const Color(0xFF6366F1).withValues(alpha: 0.1),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ],
          ],
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
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withValues(alpha: 0.08),
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
                  color: const Color(0xFF6366F1).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.lightbulb_outline,
                  color: Color(0xFF6366F1),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'refer.how_title'.tr(),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1F2937),
                    ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _HowToPoint(
            icon: Icons.share,
            text: 'refer.how_point1'.tr(),
            color: const Color(0xFF10B981),
          ),
          const SizedBox(height: 12),
          _HowToPoint(
            icon: Icons.celebration,
            text: 'refer.how_point2'.tr(),
            color: const Color(0xFFF59E0B),
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
            color: color.withValues(alpha: 0.1),
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
                  color: const Color(0xFF374151),
                  height: 1.5,
                ),
          ),
        ),
      ],
    );
  }
}
