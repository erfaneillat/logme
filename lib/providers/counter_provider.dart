import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

part 'counter_provider.g.dart';

@riverpod
class CounterNotifier extends _$CounterNotifier {
  @override
  int build() {
    return 0;
  }

  void increment() {
    state++;
  }

  void decrement() {
    if (state > 0) {
      state--;
    }
  }

  void reset() {
    state = 0;
  }

  void setValue(int value) {
    state = value;
  }
}

@riverpod
String counterText(Ref ref) {
  final count = ref.watch(counterNotifierProvider);
  return count.toString();
}

@riverpod
bool canDecrement(Ref ref) {
  final count = ref.watch(counterNotifierProvider);
  return count > 0;
}
