import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'custom_loading_widget.dart';
import 'loading_size.dart';



class TranslatedLoadingWidget extends StatelessWidget {
  final String translationKey;
  final Map<String, String>? args;
  final Color? color;
  final LoadingSize size;

  const TranslatedLoadingWidget({
    super.key,
    this.translationKey = 'common.loading',
    this.args,
    this.color,
    this.size = LoadingSize.medium,
  });

  const TranslatedLoadingWidget.small({
    super.key,
    this.translationKey = 'common.loading',
    this.args,
    this.color,
  }) : size = LoadingSize.small;

  const TranslatedLoadingWidget.large({
    super.key,
    this.translationKey = 'common.loading',
    this.args,
    this.color,
  }) : size = LoadingSize.large;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        CustomLoadingWidget(
          color: color,
          size: size,
        ),
        const SizedBox(height: 16),
        Text(
          translationKey.tr(namedArgs: args),
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
          ),
        ),
      ],
    );
  }
}

class CenteredTranslatedLoadingWidget extends StatelessWidget {
  final String translationKey;
  final Map<String, String>? args;
  final Color? color;
  final LoadingSize size;

  const CenteredTranslatedLoadingWidget({
    super.key,
    this.translationKey = 'common.loading',
    this.args,
    this.color,
    this.size = LoadingSize.medium,
  });

  const CenteredTranslatedLoadingWidget.small({
    super.key,
    this.translationKey = 'common.loading',
    this.args,
    this.color,
  }) : size = LoadingSize.small;

  const CenteredTranslatedLoadingWidget.large({
    super.key,
    this.translationKey = 'common.loading',
    this.args,
    this.color,
  }) : size = LoadingSize.large;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: TranslatedLoadingWidget(
        translationKey: translationKey,
        args: args,
        color: color,
        size: size,
      ),
    );
  }
}
