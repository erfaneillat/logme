// dart format width=80

/// GENERATED CODE - DO NOT MODIFY BY HAND
/// *****************************************************
///  FlutterGen
/// *****************************************************

// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: deprecated_member_use,directives_ordering,implicit_dynamic_list_literal,unnecessary_import

import 'package:flutter/widgets.dart';

class Assets {
  const Assets._();

  /// File path: assets/fonts/vazir-bold.ttf
  static const String fontsVazirBold = 'assets/fonts/vazir-bold.ttf';

  /// File path: assets/fonts/vazir-medium.ttf
  static const String fontsVazirMedium = 'assets/fonts/vazir-medium.ttf';

  /// File path: assets/fonts/vazir-thin.ttf
  static const String fontsVazirThin = 'assets/fonts/vazir-thin.ttf';

  /// File path: assets/images/food-onboarding.jpg
  static const AssetGenImage imagesFoodOnboarding =
      AssetGenImage('assets/images/food-onboarding.jpg');

  /// File path: assets/images/loqme_logo.jpg
  static const AssetGenImage imagesLoqmeLogo =
      AssetGenImage('assets/images/loqme_logo.jpg');

  /// File path: assets/images/loqme_logo_PNG.png
  static const AssetGenImage imagesLoqmeLogoPNG =
      AssetGenImage('assets/images/loqme_logo_PNG.png');

  /// File path: assets/images/man-onboarding.jpg
  static const AssetGenImage imagesManOnboarding =
      AssetGenImage('assets/images/man-onboarding.jpg');

  /// File path: assets/images/subscription_bg.png
  static const AssetGenImage imagesSubscriptionBg =
      AssetGenImage('assets/images/subscription_bg.png');

  /// File path: assets/translations/en-US.json
  static const String translationsEnUS = 'assets/translations/en-US.json';

  /// File path: assets/translations/fa-IR.json
  static const String translationsFaIR = 'assets/translations/fa-IR.json';

  /// List of all assets
  static List<dynamic> get values => [
        fontsVazirBold,
        fontsVazirMedium,
        fontsVazirThin,
        imagesFoodOnboarding,
        imagesLoqmeLogo,
        imagesLoqmeLogoPNG,
        imagesManOnboarding,
        imagesSubscriptionBg,
        translationsEnUS,
        translationsFaIR
      ];
}

class AssetGenImage {
  const AssetGenImage(
    this._assetName, {
    this.size,
    this.flavors = const {},
    this.animation,
  });

  final String _assetName;

  final Size? size;
  final Set<String> flavors;
  final AssetGenImageAnimation? animation;

  Image image({
    Key? key,
    AssetBundle? bundle,
    ImageFrameBuilder? frameBuilder,
    ImageErrorWidgetBuilder? errorBuilder,
    String? semanticLabel,
    bool excludeFromSemantics = false,
    double? scale,
    double? width,
    double? height,
    Color? color,
    Animation<double>? opacity,
    BlendMode? colorBlendMode,
    BoxFit? fit,
    AlignmentGeometry alignment = Alignment.center,
    ImageRepeat repeat = ImageRepeat.noRepeat,
    Rect? centerSlice,
    bool matchTextDirection = false,
    bool gaplessPlayback = true,
    bool isAntiAlias = false,
    String? package,
    FilterQuality filterQuality = FilterQuality.medium,
    int? cacheWidth,
    int? cacheHeight,
  }) {
    return Image.asset(
      _assetName,
      key: key,
      bundle: bundle,
      frameBuilder: frameBuilder,
      errorBuilder: errorBuilder,
      semanticLabel: semanticLabel,
      excludeFromSemantics: excludeFromSemantics,
      scale: scale,
      width: width,
      height: height,
      color: color,
      opacity: opacity,
      colorBlendMode: colorBlendMode,
      fit: fit,
      alignment: alignment,
      repeat: repeat,
      centerSlice: centerSlice,
      matchTextDirection: matchTextDirection,
      gaplessPlayback: gaplessPlayback,
      isAntiAlias: isAntiAlias,
      package: package,
      filterQuality: filterQuality,
      cacheWidth: cacheWidth,
      cacheHeight: cacheHeight,
    );
  }

  ImageProvider provider({
    AssetBundle? bundle,
    String? package,
  }) {
    return AssetImage(
      _assetName,
      bundle: bundle,
      package: package,
    );
  }

  String get path => _assetName;

  String get keyName => _assetName;
}

class AssetGenImageAnimation {
  const AssetGenImageAnimation({
    required this.isAnimation,
    required this.duration,
    required this.frames,
  });

  final bool isAnimation;
  final Duration duration;
  final int frames;
}
