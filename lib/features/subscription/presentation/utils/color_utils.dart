import 'package:flutter/material.dart';

Color parseHexColor(String hexColor) {
  try {
    final hexCode = hexColor.replaceAll('#', '');
    return Color(int.parse('FF$hexCode', radix: 16));
  } catch (e) {
    return const Color(0xFFE53935);
  }
}

Color darkenColor(Color color, [double amount = 0.2]) {
  final hsl = HSLColor.fromColor(color);
  return hsl.withLightness((hsl.lightness - amount).clamp(0.0, 1.0)).toColor();
}
