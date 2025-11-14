import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

class StyledChatMessage extends StatelessWidget {
  const StyledChatMessage({
    super.key,
    required this.text,
    required this.textColor,
    required this.isUser,
  });

  final String text;
  final Color textColor;
  final bool isUser;

  @override
  Widget build(BuildContext context) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) {
      return const SizedBox.shrink();
    }

    final baseStyle = TextStyle(
      color: textColor,
      fontSize: 15,
      height: 1.5,
    );

    return MarkdownBody(
      data: text,
      styleSheet: MarkdownStyleSheet(
        p: baseStyle,
        strong: baseStyle.copyWith(fontWeight: FontWeight.w700),
        em: baseStyle.copyWith(fontStyle: FontStyle.italic),
        h1: baseStyle.copyWith(fontSize: 18, fontWeight: FontWeight.w700),
        h2: baseStyle.copyWith(fontSize: 17, fontWeight: FontWeight.w700),
        h3: baseStyle.copyWith(fontSize: 16, fontWeight: FontWeight.w700),
        listBullet: baseStyle,
      ),
      softLineBreak: true,
    );
  }
}
