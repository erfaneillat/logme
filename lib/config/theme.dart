import 'package:flutter/material.dart';

const primaryColor = Colors.black;
const textColor = Colors.white;
final lightTheme = ThemeData.light().copyWith(
    textTheme: ThemeData.light().textTheme.apply(
          fontFamily: 'Vazir',
        ),
    scaffoldBackgroundColor: const Color(0xffF9FAFB),
    primaryColor: primaryColor,
    highlightColor: Colors.grey[300],
    textButtonTheme: TextButtonThemeData(
        style: ButtonStyle(
            padding: WidgetStateProperty.all<EdgeInsetsGeometry>(
                const EdgeInsets.symmetric(vertical: 5, horizontal: 12)),
            overlayColor:
                WidgetStateProperty.all<Color>(Colors.grey.withOpacity(0.1)),
            shape: WidgetStateProperty.all<RoundedRectangleBorder>(
                RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(100))))),
    elevatedButtonTheme: ElevatedButtonThemeData(
        style: ButtonStyle(
            textStyle: WidgetStateProperty.all<TextStyle>(
              const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  fontFamily: 'Vazir'),
            ),
            foregroundColor: WidgetStateProperty.all<Color>(textColor),
            minimumSize: WidgetStateProperty.all<Size>(const Size(0, 56)),
            maximumSize: WidgetStateProperty.all<Size>(const Size(0, 56)),
            backgroundColor: WidgetStateProperty.resolveWith<Color>((states) =>
                states.contains(WidgetState.disabled)
                    ? Colors.grey.withOpacity(0.3)
                    : primaryColor),
            shape: WidgetStateProperty.all<RoundedRectangleBorder>(
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(100))))),
    colorScheme: const ColorScheme(
      brightness: Brightness.dark,
      primary: primaryColor,
      onPrimary: Colors.white,
      secondary: Color(0xffFF6B35),
      onSecondary: Colors.white,
      secondaryContainer: Color(0xffEBEDF1),
      onSecondaryContainer: Colors.black,
      tertiaryContainer: Color(0xffECEFF1),
      error: Colors.red,
      onError: Colors.red,
      surface: Color(0xffF0F3F4),
      onSurface: Colors.black,
    ));
