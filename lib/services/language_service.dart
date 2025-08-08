import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class LanguageService {
  static const String _englishCode = 'en';
  static const String _persianCode = 'fa';

  static const Locale englishLocale = Locale('en', 'US');
  static const Locale persianLocale = Locale('fa', 'IR');

  static List<Locale> get supportedLocales => [
        englishLocale,
        persianLocale,
      ];

  static String getLanguageName(String languageCode) {
    switch (languageCode) {
      case _englishCode:
        return 'English';
      case _persianCode:
        return 'فارسی';
      default:
        return 'English';
    }
  }

  static String getLanguageCode(Locale locale) {
    return locale.languageCode;
  }

  static bool isRTL(Locale locale) {
    return locale.languageCode == _persianCode;
  }

  static Locale getLocaleFromCode(String languageCode) {
    switch (languageCode) {
      case _englishCode:
        return englishLocale;
      case _persianCode:
        return persianLocale;
      default:
        return englishLocale;
    }
  }

  static String getCurrentLanguageCode(BuildContext context) {
    return context.locale.languageCode;
  }

  static bool isCurrentLanguageRTL(BuildContext context) {
    return isRTL(context.locale);
  }

  static Future<void> changeLanguage(
      BuildContext context, String languageCode) async {
    final newLocale = getLocaleFromCode(languageCode);
    await context.setLocale(newLocale);
  }

  static String tr(BuildContext context, String key) {
    return key.tr();
  }

  static String trArgs(BuildContext context, String key, List<String> args) {
    return key.tr(args: args);
  }

  static String trNamed(
      BuildContext context, String key, Map<String, String> namedArgs) {
    return key.tr(namedArgs: namedArgs);
  }
}
