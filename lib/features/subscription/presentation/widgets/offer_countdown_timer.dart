import 'dart:async';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:cal_ai/extensions/string.dart';

class OfferCountdownTimer extends StatefulWidget {
  final DateTime endDate;
  final TextStyle? style;
  final VoidCallback? onExpired;

  const OfferCountdownTimer({
    super.key,
    required this.endDate,
    this.style,
    this.onExpired,
  });

  @override
  State<OfferCountdownTimer> createState() => _OfferCountdownTimerState();
}

class _OfferCountdownTimerState extends State<OfferCountdownTimer> {
  Timer? _timer;
  Duration _timeRemaining = Duration.zero;
  bool _hasNotifiedExpired = false;

  @override
  void initState() {
    super.initState();
    _updateTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _updateTime());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _updateTime() {
    final now = DateTime.now();
    final difference = widget.endDate.difference(now);

    if (difference.isNegative) {
      setState(() => _timeRemaining = Duration.zero);
      _timer?.cancel();
      
      // Notify parent that timer expired
      if (!_hasNotifiedExpired && widget.onExpired != null) {
        _hasNotifiedExpired = true;
        widget.onExpired!();
      }
    } else {
      setState(() => _timeRemaining = difference);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_timeRemaining == Duration.zero) {
      return const SizedBox.shrink(); // Hide when expired
    }

    final hours = _timeRemaining.inHours;
    final minutes = _timeRemaining.inMinutes.remainder(60);
    final seconds = _timeRemaining.inSeconds.remainder(60);

    final hoursStr = hours.toString().padLeft(2, '0').toPersianNumbers(context);
    final minutesStr = minutes.toString().padLeft(2, '0').toPersianNumbers(context);
    final secondsStr = seconds.toString().padLeft(2, '0').toPersianNumbers(context);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildTimerBox(hoursStr),
        const SizedBox(width: 6),
        _buildTimerBox(minutesStr),
        const SizedBox(width: 6),
        _buildTimerBox(secondsStr),
      ],
    );
  }

  Widget _buildTimerBox(String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        value,
        style: widget.style?.copyWith(
          color: const Color(0xFFE53935),
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ) ?? const TextStyle(
          color: Color(0xFFE53935),
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
