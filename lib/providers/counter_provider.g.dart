// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'counter_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$counterTextHash() => r'6967f3fe43fdc4d15a42eb8f0ce3cdbccabbd455';

/// See also [counterText].
@ProviderFor(counterText)
final counterTextProvider = AutoDisposeProvider<String>.internal(
  counterText,
  name: r'counterTextProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$counterTextHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef CounterTextRef = AutoDisposeProviderRef<String>;
String _$canDecrementHash() => r'415e9b00c4cb2a1a795ffa7a8391c349c62c40f4';

/// See also [canDecrement].
@ProviderFor(canDecrement)
final canDecrementProvider = AutoDisposeProvider<bool>.internal(
  canDecrement,
  name: r'canDecrementProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$canDecrementHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef CanDecrementRef = AutoDisposeProviderRef<bool>;
String _$counterNotifierHash() => r'a5130b6c9761242864b68a6e4824344183e7dead';

/// See also [CounterNotifier].
@ProviderFor(CounterNotifier)
final counterNotifierProvider =
    AutoDisposeNotifierProvider<CounterNotifier, int>.internal(
  CounterNotifier.new,
  name: r'counterNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$counterNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$CounterNotifier = AutoDisposeNotifier<int>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
