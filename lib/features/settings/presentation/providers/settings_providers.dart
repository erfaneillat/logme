import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../plan/data/repositories/plan_repository_impl.dart';
import '../../../home/presentation/providers/home_date_provider.dart';
import '../../data/datasources/preferences_remote_data_source.dart';

class PreferencesState {
  final bool addBurnedCalories;
  final bool rolloverCalories;

  const PreferencesState({
    this.addBurnedCalories = true,
    this.rolloverCalories = true,
  });

  PreferencesState copyWith({
    bool? addBurnedCalories,
    bool? rolloverCalories,
  }) =>
      PreferencesState(
        addBurnedCalories: addBurnedCalories ?? this.addBurnedCalories,
        rolloverCalories: rolloverCalories ?? this.rolloverCalories,
      );
}

class PreferencesNotifier extends StateNotifier<PreferencesState> {
  final Ref ref;

  PreferencesNotifier(this.ref) : super(const PreferencesState()) {
    // Load preferences from backend when initialized
    _loadFromBackend();
  }

  Future<void> _loadFromBackend() async {
    try {
      final dataSource = ref.read(preferencesRemoteDataSourceProvider);
      final preferences = await dataSource.getUserPreferences();
      state = state.copyWith(
        addBurnedCalories: preferences['addBurnedCalories'],
        rolloverCalories: preferences['rolloverCalories'],
      );
    } catch (e) {
      // Keep default values on error
      print('Error loading preferences: $e');
    }
  }

  Future<void> toggleAddBurnedCalories(bool value) async {
    try {
      final dataSource = ref.read(preferencesRemoteDataSourceProvider);
      final updated = await dataSource.updateUserPreferences(
        addBurnedCalories: value,
      );
      state = state.copyWith(
        addBurnedCalories: updated['addBurnedCalories'],
        rolloverCalories: updated['rolloverCalories'],
      );
    } catch (e) {
      // Revert state on error
      print('Error updating addBurnedCalories: $e');
    }
  }

  Future<void> toggleRolloverCalories(bool value) async {
    try {
      final dataSource = ref.read(preferencesRemoteDataSourceProvider);
      final updated = await dataSource.updateUserPreferences(
        rolloverCalories: value,
      );
      state = state.copyWith(
        addBurnedCalories: updated['addBurnedCalories'],
        rolloverCalories: updated['rolloverCalories'],
      );
    } catch (e) {
      // Revert state on error
      print('Error updating rolloverCalories: $e');
    }
  }

  Future<void> refreshFromBackend() => _loadFromBackend();
}

final preferencesProvider =
    StateNotifierProvider<PreferencesNotifier, PreferencesState>((ref) {
  return PreferencesNotifier(ref);
});

// Macros state for Adjust Macros page
class MacrosState {
  final int calories;
  final int protein;
  final int carbs;
  final int fat;

  const MacrosState({
    this.calories = 1700,
    this.protein = 110,
    this.carbs = 200,
    this.fat = 50,
  });

  MacrosState copyWith({int? calories, int? protein, int? carbs, int? fat}) =>
      MacrosState(
        calories: calories ?? this.calories,
        protein: protein ?? this.protein,
        carbs: carbs ?? this.carbs,
        fat: fat ?? this.fat,
      );
}

class MacrosNotifier extends StateNotifier<MacrosState> {
  final Ref ref;
  MacrosNotifier(this.ref) : super(const MacrosState()) {
    // Load initial macros from backend (latest plan)
    _loadFromBackend();
  }

  void update({int? calories, int? protein, int? carbs, int? fat}) {
    state = state.copyWith(
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat,
    );
  }

  // Simple demo auto-generation. In real app, compute based on user profile.
  void autoGenerate() {
    // naive balance: 30% protein, 40% carbs, 30% fat of calories
    final cal = state.calories;
    final proteinGrams = ((cal * 0.30) / 4).round();
    final carbsGrams = ((cal * 0.40) / 4).round();
    final fatGrams = ((cal * 0.30) / 9).round();
    state = state.copyWith(
      protein: proteinGrams,
      carbs: carbsGrams,
      fat: fatGrams,
    );
  }

  Future<void> _loadFromBackend() async {
    try {
      final repo = ref.read(planRepositoryProvider);
      final plan = await repo.fetchLatestPlan();
      state = state.copyWith(
        calories: plan.calories,
        protein: plan.proteinGrams,
        carbs: plan.carbsGrams,
        fat: plan.fatsGrams,
      );
    } catch (_) {
      // Keep defaults on error
    }
  }

  Future<void> refreshFromBackend() => _loadFromBackend();

  Future<bool> saveToBackend() async {
    try {
      final repo = ref.read(planRepositoryProvider);
      final updated = await repo.updatePlanManual(
        calories: state.calories,
        proteinGrams: state.protein,
        carbsGrams: state.carbs,
        fatsGrams: state.fat,
      );
      state = state.copyWith(
        calories: updated.calories,
        protein: updated.proteinGrams,
        carbs: updated.carbsGrams,
        fat: updated.fatsGrams,
      );
      // Invalidate Home totals so UI refreshes to the new plan immediately
      ref.invalidate(dailyRemainingProvider);
      return true;
    } catch (_) {
      return false;
    }
  }
}

final macrosProvider =
    StateNotifierProvider<MacrosNotifier, MacrosState>((ref) {
  return MacrosNotifier(ref);
});
