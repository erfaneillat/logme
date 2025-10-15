import 'package:cal_ai/services/lucky_wheel_service.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

Future<void> logLuckyWheelView(BuildContext context) async {
  try {
    final container = ProviderScope.containerOf(context);
    final luckyWheelService = container.read(luckyWheelServiceProvider);
    await luckyWheelService.logLuckyWheelView();
  } catch (e) {
    // Swallow errors; logging isn't user-critical
  }
}
