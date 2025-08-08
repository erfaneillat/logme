import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'services/language_service.dart';
import 'router/app_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'config/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();

  runApp(
    EasyLocalization(
      supportedLocales: LanguageService.supportedLocales,
      path: 'assets/translations',
      startLocale: LanguageService.persianLocale,
      fallbackLocale: LanguageService.persianLocale,
      child: const ProviderScope(child: MyApp()),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'app_title',
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
      theme: lightTheme,
      routerConfig: AppRouter.router,
    );
  }
}
