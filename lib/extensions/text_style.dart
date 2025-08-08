import 'package:flutter/material.dart';

extension TextStyleX on TextStyle {
  TextStyle get makeBold => copyWith(fontWeight: FontWeight.bold);

  TextStyle makeUnderline() => copyWith(decoration: TextDecoration.underline);
  TextStyle makeBlack() => copyWith(color: Colors.black);
  TextStyle makeWhite() => copyWith(color: Colors.white);
}
