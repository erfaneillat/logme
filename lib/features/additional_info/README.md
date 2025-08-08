# Additional Information Feature

This feature handles the collection of user profile information after login, following Clean Architecture principles.

## Architecture Overview

### Domain Layer
- **Entities**: `AdditionalInfo` - Core business object representing user profile data
- **Repositories**: `AdditionalInfoRepository` - Abstract interface for additional info operations
- **Use Cases**: 
  - `SaveAdditionalInfoUseCase` - Saves user profile information
  - `MarkAdditionalInfoCompletedUseCase` - Marks additional info as completed

### Data Layer
- **Repository Implementation**: `AdditionalInfoRepositoryImpl` - Concrete implementation
- **Data Sources**: `AdditionalInfoRemoteDataSource` - API operations for additional info
- **Models**: API response models and data transfer objects

### Presentation Layer
- **Providers**: 
  - `additionalInfoProvider` - Manages additional info state and operations
- **Pages**: 
  - `AdditionalInfoPage` - Main page with PageView containing multiple steps
  - `GenderSelectionPage` - Gender selection with male/female options
  - `AgeSelectionPage` - Age input with validation
  - `WeightHeightPage` - Weight and height input fields
  - `ActivityLevelPage` - Activity level selection (sedentary, lightly active, etc.)
  - `WeightGoalPage` - Weight goal selection (lose, maintain, gain weight)

## Flow

1. **Login Verification**: After successful phone verification, the app checks if user has completed additional information
2. **Redirect Logic**: 
   - If `hasCompletedAdditionalInfo` is true → Navigate to home
   - If `hasCompletedAdditionalInfo` is false → Navigate to additional info page
3. **PageView Navigation**: User goes through 5 pages in sequence:
   - Gender selection
   - Age input
   - Weight and height input
   - Activity level selection
   - Weight goal selection
4. **Completion**: After completing all steps, user is redirected to home page

## API Endpoints

### Server-side Routes
- `POST /api/user/additional-info` - Save additional information
- `POST /api/user/mark-additional-info-completed` - Mark additional info as completed

### Request/Response Examples

#### Save Additional Info
```json
POST /api/user/additional-info
{
  "gender": "male",
  "age": 25,
  "weight": 70.5,
  "height": 175.0,
  "activityLevel": "moderately_active",
  "weightGoal": "lose_weight"
}

Response:
{
  "success": true,
  "message": "Additional info saved successfully"
}
```

#### Mark Additional Info Completed
```json
POST /api/user/mark-additional-info-completed

Response:
{
  "success": true,
  "message": "Additional info marked as completed"
}
```

## Usage

### Flutter Implementation

1. **Navigate to Additional Info Page**:
```dart
context.go('/additional-info');
```

2. **Check if user completed additional info**:
```dart
final user = await ref.read(getCurrentUserUseCaseProvider).call();
if (user?.hasCompletedAdditionalInfo == true) {
  // User has completed additional info
}
```

3. **Update additional info state**:
```dart
final additionalInfoNotifier = ref.read(additionalInfoProvider.notifier);
additionalInfoNotifier.updateGender('male');
additionalInfoNotifier.updateAge(25);
// ... other updates
```

## State Management

The additional info state is managed using Riverpod with the following structure:

- `gender`: Selected gender (male/female)
- `age`: User's age
- `weight`: User's weight in kg
- `height`: User's height in cm
- `activityLevel`: Selected activity level
- `weightGoal`: Selected weight goal

## UI Components

### Gender Selection
- Two cards for male and female selection
- Visual feedback with icons and colors
- Smooth animations and transitions

### Age Input
- Numeric input field with validation
- Clear labeling and instructions

### Weight/Height Input
- Two separate input fields
- Unit labels (kg, cm)
- Real-time validation

### Activity Level Selection
- Four options with descriptions
- Visual icons for each level
- Check mark for selected option

### Weight Goal Selection
- Three options with descriptions
- Trend icons (down, flat, up)
- Complete setup button

## Error Handling

The system handles various error scenarios:

- Network errors during API calls
- Validation errors for input fields
- Navigation errors
- State management errors

## Testing

Run the tests using:
```bash
flutter test test/widget/phone_auth_widget_test.dart
```

## Dependencies

- `hooks_riverpod` - State management
- `flutter_hooks` - Hooks for Flutter
- `easy_localization` - Internationalization
- `go_router` - Navigation

## Future Enhancements

1. **Data Validation**: Add more robust validation for all input fields
2. **Offline Support**: Handle offline scenarios gracefully
3. **Progress Persistence**: Save progress if user leaves the flow
4. **Customization**: Allow users to skip certain steps or go back
5. **Analytics**: Track user behavior and completion rates 