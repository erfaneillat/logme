import 'package:hooks_riverpod/hooks_riverpod.dart';

class PreferencesState {
  final bool addBurnedCalories;
  final bool rolloverCalories;

  const PreferencesState({
    this.addBurnedCalories = false,
    this.rolloverCalories = false,
  });

  PreferencesState copyWith({
    bool? addBurnedCalories,
    bool? rolloverCalories,
  }) => PreferencesState(
        addBurnedCalories: addBurnedCalories ?? this.addBurnedCalories,
        rolloverCalories: rolloverCalories ?? this.rolloverCalories,
      );
}

class PreferencesNotifier extends StateNotifier<PreferencesState> {
  PreferencesNotifier() : super(const PreferencesState());

  void toggleAddBurnedCalories(bool value) {
    state = state.copyWith(addBurnedCalories: value);
  }

  void toggleRolloverCalories(bool value) {
    state = state.copyWith(rolloverCalories: value);
  }
}

final preferencesProvider =
    StateNotifierProvider<PreferencesNotifier, PreferencesState>((ref) {
  return PreferencesNotifier();
});
