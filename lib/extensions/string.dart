import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

extension StringExtension on String {
  /// Converts English numbers to Persian/Farsi numbers only if the current locale is Persian
  String toPersianNumbers(BuildContext context) {
    // Check if current locale is Persian/Farsi
    try {
      final currentLocale = context.locale.languageCode;
      if (currentLocale != 'fa') {
        return this; // Return original string if not Persian locale
      }
    } catch (e) {
      // If we can't access the locale, return the original string
      return this;
    }

    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

    String result = this;
    for (int i = 0; i < englishNumbers.length; i++) {
      result = result.replaceAll(englishNumbers[i], persianNumbers[i]);
    }
    return result;
  }
}
