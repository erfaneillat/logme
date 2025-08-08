// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'language_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$currentLanguageCodeHash() =>
    r'9df3cb1b7939d3189f17a22767774094fd084cd8';

/// See also [currentLanguageCode].
@ProviderFor(currentLanguageCode)
final currentLanguageCodeProvider = AutoDisposeProvider<String>.internal(
  currentLanguageCode,
  name: r'currentLanguageCodeProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$currentLanguageCodeHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef CurrentLanguageCodeRef = AutoDisposeProviderRef<String>;
String _$isCurrentLanguageRTLHash() =>
    r'b6e39b8e518c51342668e2ba5bf2ba9afd7e63ce';

/// See also [isCurrentLanguageRTL].
@ProviderFor(isCurrentLanguageRTL)
final isCurrentLanguageRTLProvider = AutoDisposeProvider<bool>.internal(
  isCurrentLanguageRTL,
  name: r'isCurrentLanguageRTLProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$isCurrentLanguageRTLHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef IsCurrentLanguageRTLRef = AutoDisposeProviderRef<bool>;
String _$availableLanguagesHash() =>
    r'ade8e0fd9a86c3929ed637693da9c7d1b524b99c';

/// See also [availableLanguages].
@ProviderFor(availableLanguages)
final availableLanguagesProvider =
    AutoDisposeProvider<List<Map<String, String>>>.internal(
  availableLanguages,
  name: r'availableLanguagesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$availableLanguagesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef AvailableLanguagesRef
    = AutoDisposeProviderRef<List<Map<String, String>>>;
String _$languageNotifierHash() => r'29a23a3e9964e5de0d517e41b24968b8b5517102';

/// See also [LanguageNotifier].
@ProviderFor(LanguageNotifier)
final languageNotifierProvider =
    AutoDisposeNotifierProvider<LanguageNotifier, Locale>.internal(
  LanguageNotifier.new,
  name: r'languageNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$languageNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$LanguageNotifier = AutoDisposeNotifier<Locale>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
