import 'dart:ui' as ui;
import 'package:cal_ai/features/subscription/data/models/offer_model.dart';
import 'package:cal_ai/features/subscription/presentation/utils/color_utils.dart';
import 'package:cal_ai/features/subscription/presentation/widgets/offer_countdown_timer.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';

class HomeOfferBanner extends StatelessWidget {
  const HomeOfferBanner({
    super.key,
    required this.offer,
    required this.userCreatedAt,
    required this.onExpired,
  });

  final OfferModel offer;
  final DateTime? userCreatedAt;
  final VoidCallback onExpired;

  @override
  Widget build(BuildContext context) {
    final offerBgColor = parseHexColor(offer.display.backgroundColor);
    final offerTextColor = parseHexColor(offer.display.textColor);
    final effectiveEndDate = offer.getEffectiveEndDate(userCreatedAt);

    // Don't show banner if offer is not valid
    if (!offer.isCurrentlyValid) {
      return const SizedBox.shrink();
    }

    // Don't show banner if end date has passed
    if (effectiveEndDate != null && DateTime.now().isAfter(effectiveEndDate)) {
      return const SizedBox.shrink();
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: offerBgColor,
        systemNavigationBarColor: offerBgColor,
      ),
      child: GestureDetector(
        onTap: () {
          // Navigate to subscription page when tapped
          context.pushNamed('subscription');
        },
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [offerBgColor, darkenColor(offerBgColor)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            // borderRadius: const BorderRadius.only(
            //   bottomLeft: Radius.circular(16),
            //   bottomRight: Radius.circular(16),
            // ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Offer content (aligned to the right in RTL)
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          offer.display.bannerText,
                          maxLines: 1,
                          softWrap: false,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            color: offerTextColor,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (offer.display.bannerSubtext != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              offer.display.bannerSubtext!,
                              maxLines: 1,
                              softWrap: false,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.right,
                              style: TextStyle(
                                color: offerTextColor.withOpacity(0.9),
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Countdown timer on the left
                if (effectiveEndDate != null)
                  SizedBox(
                    width: 160,
                    child: Directionality(
                      textDirection: ui.TextDirection.ltr,
                      child: OfferCountdownTimer(
                        endDate: effectiveEndDate,
                        style: TextStyle(color: offerTextColor),
                        onExpired: onExpired,
                        boxWidth: 32,
                        boxHeight: 32,
                      ),
                    ),
                  ),
                const SizedBox(width: 12),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: offerTextColor,
                  size: 20,
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}
