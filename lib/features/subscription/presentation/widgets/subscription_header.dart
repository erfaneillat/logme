import 'package:cal_ai/extensions/context.dart';
import 'package:cal_ai/extensions/int.dart';
import 'package:flutter/material.dart';

class SubscriptionHeader extends StatelessWidget {
  const SubscriptionHeader({super.key});

  @override
  Widget build(BuildContext context) {
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
          RichText(
            text: TextSpan(
              style: context.textTheme.bodyMedium,
              children: [
                TextSpan(
                  text: 'وضعیت اشتراک: ',
                  style: context.textTheme.bodyMedium,
                ),
                TextSpan(
                  text: 'بدون اشتراک',
                  style: context.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
          IconButton(
            tooltip: 'بستن',
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
