import 'package:cal_ai/extensions/context.dart';
import 'package:cal_ai/extensions/int.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:shamsi_date/shamsi_date.dart';
import 'package:cal_ai/services/payment_service.dart';
import 'package:cal_ai/features/subscription/presentation/providers/subscription_status_provider.dart';

class SubscriptionHeader extends HookConsumerWidget {
  const SubscriptionHeader({super.key});

  String _toPersianDigits(String input) {
    const en = ['0','1','2','3','4','5','6','7','8','9'];
    const fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    var out = input;
    for (var i = 0; i < en.length; i++) {
      out = out.replaceAll(en[i], fa[i]);
    }
    return out;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subscriptionAsync = ref.watch(subscriptionActiveProvider);
    final paymentService = ref.watch(paymentServiceProvider);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(
            color: Colors.grey.withOpacity(0.2),
            width: 1,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: const Color(0xFFFFE5E5),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.description_outlined,
              color: Color(0xFFFF4D4D),
              size: 20,
            ),
          ),
          10.widthBox,
          subscriptionAsync.when(
            loading: () => Text(
              '${'subscription.header.status'.tr()}: ${'subscription.header.loading'.tr()}',
              style: context.textTheme.bodyMedium,
            ),
            error: (_, __) => RichText(
              text: TextSpan(
                style: context.textTheme.bodyMedium,
                children: [
                  TextSpan(
                    text: '${'subscription.header.status'.tr()}: ',
                    style: context.textTheme.bodyMedium,
                  ),
                  TextSpan(
                    text: 'subscription.header.none'.tr(),
                    style: context.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ),
            data: (isActive) {
              if (!isActive) {
                return RichText(
                  text: TextSpan(
                    style: context.textTheme.bodyMedium,
                    children: [
                      TextSpan(
                        text: '${'subscription.header.status'.tr()}: ',
                        style: context.textTheme.bodyMedium,
                      ),
                      TextSpan(
                        text: 'subscription.header.none'.tr(),
                        style: context.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                );
              }

              return FutureBuilder<SubscriptionStatus>(
                future: paymentService.checkSubscriptionStatus(),
                builder: (context, snapshot) {
                  final status = snapshot.data;
                  String suffix = '';
                  if (status?.expiryDate != null) {
                    if (context.locale.languageCode == 'fa') {
                      final j = Jalali.fromDateTime(status!.expiryDate!);
                      final f = j.formatter;
                      final dateStr = _toPersianDigits('${f.yyyy}/${f.mm}/${f.dd}');
                      suffix = 'subscription.header.until_fa'.tr(args: [dateStr]);
                    } else {
                      final dateStr = DateFormat('MMM dd, yyyy').format(status!.expiryDate!);
                      suffix = 'subscription.header.until'.tr(args: [dateStr]);
                    }
                  }

                  return RichText(
                    text: TextSpan(
                      style: context.textTheme.bodyMedium,
                      children: [
                        TextSpan(
                          text: '${'subscription.header.status'.tr()}: ',
                          style: context.textTheme.bodyMedium,
                        ),
                        TextSpan(
                          text: 'subscription.header.active'.tr(),
                          style: context.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w900,
                            color: Colors.black,
                          ),
                        ),
                        TextSpan(
                          text: suffix,
                          style: context.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  );
                },
              );
            },
          ),
          const Spacer(),
          IconButton(
            tooltip: 'subscription.header.close'.tr(),
            icon: const Icon(Icons.close, color: Color(0xFF1A1A1A)),
            onPressed: () {
              if (Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              }
            },
          ),
        ],
      ),
    );
  }
}
