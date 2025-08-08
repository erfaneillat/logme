import 'package:flutter/material.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/language_service.dart';

part 'language_provider.g.dart';

@riverpod
class LanguageNotifier extends _$LanguageNotifier {
  @override
  Locale build() {
    return LanguageService.englishLocale;
  }

  void changeLanguage(String languageCode) {
    final newLocale = LanguageService.getLocaleFromCode(languageCode);
    state = newLocale;
  }

  String getCurrentLanguageCode() {
    return LanguageService.getLanguageCode(state);
  }

  bool isRTL() {
    return LanguageService.isRTL(state);
  }

  String getLanguageName(String languageCode) {
    return LanguageService.getLanguageName(languageCode);
  }
}

@riverpod
String currentLanguageCode(Ref ref) {
  final languageNotifier = ref.watch(languageNotifierProvider.notifier);
  return languageNotifier.getCurrentLanguageCode();
}

@riverpod
bool isCurrentLanguageRTL(Ref ref) {
  final languageNotifier = ref.watch(languageNotifierProvider.notifier);
  return languageNotifier.isRTL();
}

@riverpod
List<Map<String, String>> availableLanguages(Ref ref) {
  return [
    {
      'code': 'en',
      'name': 'English',
      'nativeName': 'English',
    },
    {
      'code': 'fa',
      'name': 'Persian',
      'nativeName': 'فارسی',
    },
  ];
}
