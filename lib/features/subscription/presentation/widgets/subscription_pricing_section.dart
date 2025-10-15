import 'dart:ui' as ui;

import 'package:cal_ai/extensions/string.dart';
import 'package:cal_ai/features/subscription/presentation/providers/subscription_provider.dart';
import 'package:cal_ai/features/subscription/presentation/utils/color_utils.dart';
import 'package:cal_ai/features/subscription/presentation/utils/price_utils.dart';
import 'package:cal_ai/features/subscription/presentation/widgets/offer_countdown_timer.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class SubscriptionPricingSection extends StatelessWidget {
  const SubscriptionPricingSection({
    super.key,
    required this.state,
    required this.notifier,
    required this.currentUser,
  });

  final SubscriptionState state;
  final SubscriptionNotifier notifier;
  final dynamic currentUser;

  @override
  Widget build(BuildContext context) {
    if (state.isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(40),
          child: CircularProgressIndicator(),
        ),
      );
    }

    final yearlyTitle = state.yearlyTitle;
    final yearlyPrice = state.yearlyPrice;
    final yearlyOriginalPrice = state.yearlyOriginalPrice;
    final yearlyDiscountPercentage = state.yearlyDiscountPercentage;

    final threeMonthTitle = state.threeMonthTitle;
    final threeMonthPrice = state.threeMonthPrice;
    final threeMonthOriginalPrice = state.threeMonthOriginalPrice;
    final threeMonthDiscountPercentage = state.threeMonthDiscountPercentage;
    final threeMonthPricePerMonth = state.threeMonthPricePerMonth;

    final monthlyTitle = state.monthlyTitle;
    final monthlyPrice = state.monthlyPrice;
    final monthlyOriginalPrice = state.monthlyOriginalPrice;
    final monthlyDiscountPercentage = state.monthlyDiscountPercentage;
    final monthlyPricePerMonth = state.monthlyPricePerMonth;

    final activeOffer = state.activeOffer;

    final offerBgColor = activeOffer != null
        ? parseHexColor(activeOffer.display.backgroundColor)
        : const Color(0xFFE53935);
    final offerTextColor = activeOffer != null
        ? parseHexColor(activeOffer.display.textColor)
        : Colors.white;
    final bool isOfferActive =
        activeOffer != null && activeOffer.isCurrentlyValid;

    double? getOfferPriceForPlan(String? planId, String field) {
      if (activeOffer == null ||
          planId == null ||
          activeOffer.planPricing == null) return null;
      try {
        final planPricing = activeOffer.planPricing!.firstWhere(
          (p) => p.planId == planId,
        );
        if (field == 'price') return planPricing.discountedPrice;
        if (field == 'perMonth') return planPricing.discountedPricePerMonth;
      } catch (_) {}
      return null;
    }

    final double effectiveYearlyPrice = (isOfferActive
        ? (getOfferPriceForPlan(state.yearlyPlanId, 'price') ??
            activeOffer.calculateDiscountedPrice(
              (yearlyPrice ?? 69990).toDouble(),
            ))
        : (yearlyPrice ?? 69990).toDouble());
    final double yearlyPerMonthDisplay =
        getOfferPriceForPlan(state.yearlyPlanId, 'perMonth') ??
            (effectiveYearlyPrice / 12);
    final double? threeMonthPerMonthDisplay =
        getOfferPriceForPlan(state.threeMonthPlanId, 'perMonth') ??
            threeMonthPricePerMonth ??
            (threeMonthPrice != null ? (threeMonthPrice / 3) : null);

    return Container(
      padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20, top: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.white,
      ),
      child: Column(
        children: [
          if (() {
            if (activeOffer == null) return false;
            final effectiveEndDate =
                activeOffer.getEffectiveEndDate(currentUser?.createdAt);
            final now = DateTime.now();
            return activeOffer.isCurrentlyValid &&
                (effectiveEndDate == null || now.isBefore(effectiveEndDate));
          }())
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [offerBgColor, darkenColor(offerBgColor)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: offerBgColor.withOpacity(0.1),
                    blurRadius: 25,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              padding:
                  const EdgeInsets.only(top: 10, left: 2, right: 2, bottom: 2),
              margin: const EdgeInsets.only(bottom: 15),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              FittedBox(
                                fit: BoxFit.scaleDown,
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  activeOffer!.display.bannerText,
                                  maxLines: 1,
                                  softWrap: false,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: offerTextColor,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              if (activeOffer!.display.bannerSubtext != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: FittedBox(
                                    fit: BoxFit.scaleDown,
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      activeOffer!.display.bannerSubtext!,
                                      maxLines: 1,
                                      softWrap: false,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        color: offerTextColor.withOpacity(0.9),
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        () {
                          final effectiveEndDate = activeOffer!
                              .getEffectiveEndDate(currentUser?.createdAt);

                          if (effectiveEndDate != null) {
                            return SizedBox(
                              width: 160,
                              child: Directionality(
                                textDirection: ui.TextDirection.ltr,
                                child: OfferCountdownTimer(
                                  endDate: effectiveEndDate,
                                  style: TextStyle(color: offerTextColor),
                                  onExpired: () {
                                    notifier.refresh();
                                  },
                                  boxWidth: 32,
                                  boxHeight: 32,
                                ),
                              ),
                            );
                          }
                          return const SizedBox.shrink();
                        }(),
                      ],
                    ),
                  ),
                  const SizedBox(height: 15),
                  GestureDetector(
                    onTap: () => notifier.selectPlan(SubscriptionPlan.yearly),
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          height: 80,
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(
                              color:
                                  state.selectedPlan == SubscriptionPlan.yearly
                                      ? offerBgColor
                                      : Colors.transparent,
                              width: 3,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow:
                                state.selectedPlan == SubscriptionPlan.yearly
                                    ? [
                                        BoxShadow(
                                          color: offerBgColor.withOpacity(0.1),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ]
                                    : null,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Expanded(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      yearlyTitle ?? 'Yearly',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Color(0xFF666666),
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        if (yearlyOriginalPrice != null ||
                                            (activeOffer != null &&
                                                activeOffer
                                                    .isCurrentlyValid)) ...[
                                          Text(
                                            formatPrice(yearlyOriginalPrice ??
                                                    yearlyPrice ??
                                                    69990)
                                                .toPersianNumbers(context),
                                            style: const TextStyle(
                                              fontSize: 14,
                                              color: Color(0xFF999999),
                                              decoration:
                                                  TextDecoration.lineThrough,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                        ],
                                        Text(
                                          () {
                                            double base = (yearlyPrice ?? 69990)
                                                .toDouble();
                                            if (activeOffer != null &&
                                                activeOffer.isCurrentlyValid) {
                                              final override =
                                                  getOfferPriceForPlan(
                                                      state.yearlyPlanId,
                                                      'price');
                                              final effective = override ??
                                                  activeOffer
                                                      .calculateDiscountedPrice(
                                                          base);
                                              return formatPrice(effective)
                                                  .toPersianNumbers(context);
                                            }
                                            return formatPrice(base)
                                                .toPersianNumbers(context);
                                          }(),
                                          style: const TextStyle(
                                            fontSize: 18,
                                            color: Color(0xFF1A1A1A),
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        if (activeOffer!.discountPercentage !=
                                            null)
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: offerBgColor,
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              '${activeOffer!.discountPercentage!.toStringAsFixed(0).toPersianNumbers(context)}٪',
                                              style: TextStyle(
                                                color: offerTextColor,
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          )
                                        else if (yearlyDiscountPercentage !=
                                            null)
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFE53935),
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              '${yearlyDiscountPercentage.toStringAsFixed(0).toPersianNumbers(context)}٪',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    formatPrice(yearlyPerMonthDisplay)
                                        .toPersianNumbers(context),
                                    style: const TextStyle(
                                      fontSize: 15,
                                      color: Color(0xFF1A1A1A),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    'subscription.per_month'.tr(),
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Color(0xFF999999),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        if (state.selectedPlan == SubscriptionPlan.yearly)
                          Positioned(
                            bottom: -10,
                            left: 0,
                            right: 0,
                            child: Center(
                              child: Container(
                                padding: const EdgeInsets.all(0),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: offerBgColor.withOpacity(0.3),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Icon(
                                  Icons.check_circle,
                                  color: offerBgColor,
                                  size: 20,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          else
            GestureDetector(
              onTap: () => notifier.selectPlan(SubscriptionPlan.yearly),
              child: Container(
                margin: const EdgeInsets.only(bottom: 15),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      height: 80,
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: state.selectedPlan == SubscriptionPlan.yearly
                            ? const Color(0xFFE53935).withOpacity(0.1)
                            : Colors.white,
                        border: Border.all(
                          color: state.selectedPlan == SubscriptionPlan.yearly
                              ? const Color(0xFFE53935)
                              : const Color(0xFFE53935),
                          width: state.selectedPlan == SubscriptionPlan.yearly
                              ? 3
                              : 2,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: state.selectedPlan == SubscriptionPlan.yearly
                            ? [
                                BoxShadow(
                                  color:
                                      const Color(0xFFE53935).withOpacity(0.1),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : null,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  yearlyTitle ?? 'Yearly',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: Color(0xFF666666),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    if (yearlyOriginalPrice != null) ...[
                                      Text(
                                        formatPrice(yearlyOriginalPrice)
                                            .toPersianNumbers(context),
                                        style: const TextStyle(
                                          fontSize: 14,
                                          color: Color(0xFF999999),
                                          decoration:
                                              TextDecoration.lineThrough,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                    ],
                                    Text(
                                      formatPrice(yearlyPrice ?? 69990)
                                          .toPersianNumbers(context),
                                      style: const TextStyle(
                                        fontSize: 18,
                                        color: Color(0xFF1A1A1A),
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    if (yearlyDiscountPercentage != null)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFE53935),
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          '${yearlyDiscountPercentage.toStringAsFixed(0).toPersianNumbers(context)}٪',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                formatPrice(yearlyPerMonthDisplay)
                                    .toPersianNumbers(context),
                                style: const TextStyle(
                                  fontSize: 15,
                                  color: Color(0xFF1A1A1A),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                'subscription.per_month'.tr(),
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF999999),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (state.selectedPlan == SubscriptionPlan.yearly)
                      Positioned(
                        bottom: -10,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.all(0),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color:
                                      const Color(0xFFE53935).withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.check_circle,
                              color: Color(0xFFE53935),
                              size: 20,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          if (threeMonthPrice != null)
            GestureDetector(
              onTap: () => notifier.selectPlan(SubscriptionPlan.threeMonth),
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      height: 80,
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: state.selectedPlan == SubscriptionPlan.threeMonth
                            ? const Color(0xFF0EA5E9).withOpacity(0.1)
                            : const Color(0xFFF0F9FF),
                        border: Border.all(
                          color:
                              state.selectedPlan == SubscriptionPlan.threeMonth
                                  ? const Color(0xFF0EA5E9)
                                  : const Color(0xFF0EA5E9),
                          width:
                              state.selectedPlan == SubscriptionPlan.threeMonth
                                  ? 3
                                  : 2,
                        ),
                        borderRadius: BorderRadius.circular(15),
                        boxShadow: state.selectedPlan ==
                                SubscriptionPlan.threeMonth
                            ? [
                                BoxShadow(
                                  color:
                                      const Color(0xFF0EA5E9).withOpacity(0.1),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : null,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  threeMonthTitle ?? '3 Months',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: Color(0xFF666666),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Wrap(
                                  spacing: 8,
                                  crossAxisAlignment: WrapCrossAlignment.center,
                                  children: [
                                    if (threeMonthOriginalPrice != null)
                                      Text(
                                        formatPrice(threeMonthOriginalPrice)
                                            .toPersianNumbers(context),
                                        style: const TextStyle(
                                          fontSize: 16,
                                          color: Color(0xFF999999),
                                          decoration:
                                              TextDecoration.lineThrough,
                                        ),
                                      ),
                                    const SizedBox.shrink(),
                                    if (threeMonthDiscountPercentage != null)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF0EA5E9),
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          '${threeMonthDiscountPercentage.toStringAsFixed(0).toPersianNumbers(context)}٪'
                                              .toPersianNumbers(context),
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              if (threeMonthPerMonthDisplay != null)
                                Text(
                                  formatPrice(threeMonthPerMonthDisplay)
                                      .toPersianNumbers(context),
                                  style: const TextStyle(
                                    fontSize: 15,
                                    color: Color(0xFF1A1A1A),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              if (threeMonthPerMonthDisplay != null)
                                Text(
                                  'subscription.per_month'.tr(),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Color(0xFF999999),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (state.selectedPlan == SubscriptionPlan.threeMonth)
                      Positioned(
                        bottom: -10,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.all(0),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color:
                                      const Color(0xFF0EA5E9).withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.check_circle,
                              color: Color(0xFF0EA5E9),
                              size: 20,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          if (monthlyPrice != null)
            GestureDetector(
              onTap: () => notifier.selectPlan(SubscriptionPlan.monthly),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    height: 80,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: state.selectedPlan == SubscriptionPlan.monthly
                          ? const Color(0xFF4CAF50).withOpacity(0.1)
                          : const Color(0xFFF5F5F5),
                      border: Border.all(
                        color: state.selectedPlan == SubscriptionPlan.monthly
                            ? const Color(0xFF4CAF50)
                            : const Color(0xFFE0E0E0),
                        width: state.selectedPlan == SubscriptionPlan.monthly
                            ? 3
                            : 2,
                      ),
                      borderRadius: BorderRadius.circular(15),
                      boxShadow: state.selectedPlan == SubscriptionPlan.monthly
                          ? [
                              BoxShadow(
                                color: const Color(0xFF4CAF50).withOpacity(0.1),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                monthlyTitle ?? 'Monthly',
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Color(0xFF666666),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Wrap(
                                spacing: 8,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  if (monthlyOriginalPrice != null)
                                    Text(
                                      formatPrice(monthlyOriginalPrice)
                                          .toPersianNumbers(context),
                                      style: const TextStyle(
                                        fontSize: 16,
                                        color: Color(0xFF999999),
                                        decoration: TextDecoration.lineThrough,
                                      ),
                                    ),
                                  const SizedBox.shrink(),
                                  if (monthlyDiscountPercentage != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF64748B),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        '${monthlyDiscountPercentage.toStringAsFixed(0).toPersianNumbers(context)}٪'
                                            .toPersianNumbers(context),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              formatPrice(
                                      (monthlyPricePerMonth ?? monthlyPrice))
                                  .toPersianNumbers(context),
                              style: const TextStyle(
                                fontSize: 15,
                                color: Color(0xFF1A1A1A),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            (monthlyPricePerMonth != null)
                                ? Text(
                                    'subscription.per_month'.tr(),
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Color(0xFF999999),
                                    ),
                                  )
                                : const SizedBox.shrink(),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (state.selectedPlan == SubscriptionPlan.monthly)
                    Positioned(
                      bottom: -10,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.all(0),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF4CAF50).withOpacity(0.1),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.check_circle,
                            color: Color(0xFF4CAF50),
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
