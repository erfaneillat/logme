import 'package:flutter/material.dart';

extension SizedBoxExtension on int {
  SizedBox get heightBox => SizedBox(height: toDouble());
  SizedBox get widthBox => SizedBox(width: toDouble());
}
