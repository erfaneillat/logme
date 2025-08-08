import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class NavigationService {
  static void goToHome(BuildContext context) {
    context.go('/');
  }

  static void goToSettings(BuildContext context) {
    context.go('/settings');
  }

  static void goBack(BuildContext context) {
    context.pop();
  }

  static void pushToSettings(BuildContext context) {
    context.push('/settings');
  }

  static void pushToHome(BuildContext context) {
    context.push('/');
  }

  static void goToNamed(BuildContext context, String routeName) {
    context.goNamed(routeName);
  }

  static void pushToNamed(BuildContext context, String routeName) {
    context.pushNamed(routeName);
  }
}
