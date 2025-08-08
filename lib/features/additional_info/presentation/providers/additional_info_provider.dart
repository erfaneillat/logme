import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../data/providers/data_providers.dart';
import '../../domain/repositories/additional_info_repository.dart';
import '../../domain/usecases/save_additional_info_usecase.dart';
import '../../domain/usecases/mark_additional_info_completed_usecase.dart';
import '../../domain/entities/additional_info.dart';
import '../../../login/presentation/providers/auth_provider.dart';
import '../../../login/domain/usecases/update_additional_info_completion_usecase.dart';

// Repository Provider
final additionalInfoRepositoryProvider =
    Provider<AdditionalInfoRepository>((ref) {
  return ref.watch(additionalInfoRepositoryImplProvider);
});

// Use Case Providers
final saveAdditionalInfoUseCaseProvider =
    Provider<SaveAdditionalInfoUseCase>((ref) {
  final repository = ref.watch(additionalInfoRepositoryProvider);
  return SaveAdditionalInfoUseCase(repository);
});

final markAdditionalInfoCompletedUseCaseProvider =
    Provider<MarkAdditionalInfoCompletedUseCase>((ref) {
  final repository = ref.watch(additionalInfoRepositoryProvider);
  return MarkAdditionalInfoCompletedUseCase(repository);
});

// State Notifier for Additional Info
class AdditionalInfoNotifier extends StateNotifier<AdditionalInfo> {
  final SaveAdditionalInfoUseCase saveUseCase;
  final MarkAdditionalInfoCompletedUseCase markCompletedUseCase;
  final UpdateAdditionalInfoCompletionUseCase updateCompletionUseCase;

  AdditionalInfoNotifier({
    required this.saveUseCase,
    required this.markCompletedUseCase,
    required this.updateCompletionUseCase,
  }) : super(const AdditionalInfo());

  void updateGender(String gender) {
    state = state.copyWith(gender: gender);
  }

  void updateBirthDate(DateTime birthDate) {
    state = state.copyWith(birthDate: birthDate);
  }

  void updateAge(int age) {
    state = state.copyWith(age: age);
  }

  void updateWeight(double weight) {
    state = state.copyWith(weight: weight);
  }

  void updateHeight(double height) {
    state = state.copyWith(height: height);
  }

  void updateActivityLevel(String activityLevel) {
    state = state.copyWith(activityLevel: activityLevel);
  }

  void updateWeightGoal(String weightGoal) {
    state = state.copyWith(weightGoal: weightGoal);
  }

  void updateWorkoutFrequency(String workoutFrequency) {
    // Derive activity level from workout frequency if possible
    String? derivedActivityLevel;
    switch (workoutFrequency) {
      case '0-2':
        derivedActivityLevel = 'lightly_active';
        break;
      case '3-5':
        derivedActivityLevel = 'moderately_active';
        break;
      case '6+':
        derivedActivityLevel = 'very_active';
        break;
      default:
        derivedActivityLevel = state.activityLevel;
    }
    state = state.copyWith(
      workoutFrequency: workoutFrequency,
      activityLevel: derivedActivityLevel,
    );
  }

  void updateTargetWeight(double targetWeight) {
    state = state.copyWith(targetWeight: targetWeight);
  }

  void updateWeightLossSpeed(double weightLossSpeed) {
    state = state.copyWith(weightLossSpeed: weightLossSpeed);
  }

  void updateDiet(String diet) {
    state = state.copyWith(diet: diet);
  }

  void updateAccomplishment(String accomplishment) {
    state = state.copyWith(accomplishment: accomplishment);
  }

  void updateReferralCode(String? referralCode) {
    state = state.copyWith(referralCode: referralCode);
  }

  Future<void> saveAdditionalInfo() async {
    // Ensure derived fields are populated
    AdditionalInfo infoToSave = state;

    // Derive age if missing and birthDate is provided
    if (infoToSave.age == null && infoToSave.birthDate != null) {
      final now = DateTime.now();
      int age = now.year - infoToSave.birthDate!.year;
      final hasHadBirthdayThisYear =
          (now.month > infoToSave.birthDate!.month) ||
              (now.month == infoToSave.birthDate!.month &&
                  now.day >= infoToSave.birthDate!.day);
      if (!hasHadBirthdayThisYear) {
        age -= 1;
      }
      infoToSave = infoToSave.copyWith(age: age);
    }

    // Derive activityLevel from workoutFrequency if still missing
    if (infoToSave.activityLevel == null &&
        infoToSave.workoutFrequency != null) {
      String? derivedActivityLevel;
      switch (infoToSave.workoutFrequency) {
        case '0-2':
          derivedActivityLevel = 'lightly_active';
          break;
        case '3-5':
          derivedActivityLevel = 'moderately_active';
          break;
        case '6+':
          derivedActivityLevel = 'very_active';
          break;
      }
      if (derivedActivityLevel != null) {
        infoToSave = infoToSave.copyWith(activityLevel: derivedActivityLevel);
      }
    }

    await saveUseCase.execute(infoToSave);
  }

  Future<void> markCompleted() async {
    await markCompletedUseCase.execute();
    await updateCompletionUseCase.execute(true);
  }

  bool get isComplete => state.isComplete;
}

final additionalInfoProvider =
    StateNotifierProvider<AdditionalInfoNotifier, AdditionalInfo>((ref) {
  final saveUseCase = ref.watch(saveAdditionalInfoUseCaseProvider);
  final markCompletedUseCase =
      ref.watch(markAdditionalInfoCompletedUseCaseProvider);
  final updateCompletionUseCase =
      ref.watch(updateAdditionalInfoCompletionUseCaseProvider);
  return AdditionalInfoNotifier(
    saveUseCase: saveUseCase,
    markCompletedUseCase: markCompletedUseCase,
    updateCompletionUseCase: updateCompletionUseCase,
  );
});
