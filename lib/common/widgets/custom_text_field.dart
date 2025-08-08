import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:ui' show TextDirection;

class CustomTextField extends StatelessWidget {
  const CustomTextField({
    super.key,
    required this.hint,
    this.validator,
    this.controller,
    this.label,
    this.keyboardType,
    this.inputFormatters,
    this.prefixIcon,
    this.textDirection,
    this.suffixIcon,
    this.obscureText = false,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.onChanged,
    this.onSubmitted,
    this.enabled = true,
    this.readOnly = false,
    this.filled,
    this.fillColor,
    this.borderRadius,
    this.contentPadding,
    this.textAlign = TextAlign.start,
    this.style,
    this.hintStyle,
    this.errorStyle,
    this.labelStyle,
    this.border,
    this.focusNode,
    this.autofocus = false,
    this.textInputAction,
    this.onTap,
    this.suffix,
    this.prefix,
  });

  final String hint;
  final String? Function(String? value)? validator;
  final TextEditingController? controller;
  final String? label;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final TextDirection? textDirection;
  final bool obscureText;
  final int? maxLines;
  final int? minLines;
  final int? maxLength;
  final void Function(String?)? onChanged;
  final void Function(String?)? onSubmitted;
  final bool enabled;
  final bool readOnly;
  final bool? filled;
  final Color? fillColor;
  final BorderRadius? borderRadius;
  final EdgeInsetsGeometry? contentPadding;
  final TextAlign textAlign;
  final TextStyle? style;
  final TextStyle? hintStyle;
  final TextStyle? errorStyle;
  final TextStyle? labelStyle;
  final InputBorder? border;
  final FocusNode? focusNode;
  final bool autofocus;
  final TextInputAction? textInputAction;
  final VoidCallback? onTap;
  final Widget? suffix;
  final Widget? prefix;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final effectiveBorderRadius = borderRadius ?? BorderRadius.circular(100);
    final effectiveContentPadding = contentPadding ??
        const EdgeInsets.symmetric(horizontal: 16, vertical: 12);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: (labelStyle ?? theme.textTheme.titleMedium)?.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 8),
        ],
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          textDirection: textDirection,
          obscureText: obscureText,
          maxLines: maxLines,
          minLines: minLines,
          maxLength: maxLength,
          onChanged: onChanged,
          onFieldSubmitted: onSubmitted,
          enabled: enabled,
          readOnly: readOnly,
          focusNode: focusNode,
          autofocus: autofocus,
          textInputAction: textInputAction,
          onTap: onTap,
          textAlign: textAlign,
          style: style ??
              theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.onSecondaryContainer,
              ),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: prefixIcon,
            suffixIcon: suffixIcon,
            prefix: prefix,
            suffix: suffix,
            hintStyle: hintStyle ??
                theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.onSecondaryContainer.withOpacity(0.6),
                ),
            border: border ??
                OutlineInputBorder(
                  borderRadius: effectiveBorderRadius,
                  borderSide: BorderSide.none,
                ),
            errorStyle: errorStyle ??
                theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.error,
                ),
            filled: filled ?? true,
            fillColor: fillColor ?? theme.colorScheme.secondaryContainer,
            contentPadding: effectiveContentPadding,
            enabledBorder: border ??
                OutlineInputBorder(
                  borderRadius: effectiveBorderRadius,
                  borderSide: BorderSide.none,
                ),
            focusedBorder: border ??
                OutlineInputBorder(
                  borderRadius: effectiveBorderRadius,
                  borderSide: BorderSide(
                    color: theme.colorScheme.primary,
                    width: 2,
                  ),
                ),
            errorBorder: border ??
                OutlineInputBorder(
                  borderRadius: effectiveBorderRadius,
                  borderSide: BorderSide(
                    color: theme.colorScheme.error,
                    width: 1,
                  ),
                ),
            focusedErrorBorder: border ??
                OutlineInputBorder(
                  borderRadius: effectiveBorderRadius,
                  borderSide: BorderSide(
                    color: theme.colorScheme.error,
                    width: 2,
                  ),
                ),
          ),
          validator: validator,
        ),
      ],
    );
  }
}
