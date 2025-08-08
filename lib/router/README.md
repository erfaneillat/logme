# Go Router Implementation

This app uses Go Router for navigation management. Go Router provides a declarative routing solution for Flutter apps.

## Structure

- `app_router.dart` - Main router configuration
- `NavigationService` - Helper service for navigation methods

## Routes

### Current Routes
- `/` - Home page (counter demo)
- `/settings` - Settings page

### Adding New Routes

To add a new route:

1. Add the route to `app_router.dart`:
```dart
GoRoute(
  path: '/new-page',
  name: 'new-page',
  builder: (context, state) => const NewPage(),
),
```

2. Add navigation methods to `NavigationService`:
```dart
static void goToNewPage(BuildContext context) {
  context.go('/new-page');
}

static void pushToNewPage(BuildContext context) {
  context.push('/new-page');
}
```

## Navigation Methods

### Using NavigationService
```dart
// Navigate to a route (replaces current route)
NavigationService.goToHome(context);
NavigationService.goToSettings(context);

// Push a route (adds to navigation stack)
NavigationService.pushToSettings(context);

// Go back
NavigationService.goBack(context);

// Navigate by route name
NavigationService.goToNamed(context, 'settings');
```

### Direct Go Router Usage
```dart
// Navigate to a route
context.go('/settings');

// Push a route
context.push('/settings');

// Go back
context.pop();

// Navigate by route name
context.goNamed('settings');
```

## Error Handling

The router includes a custom error page that displays when a route is not found. The error page includes:
- Error icon
- "Page Not Found" message
- "Go Home" button to navigate back to the home page

## Localization

All error messages and navigation-related text are localized using easy_localization:
- `page_not_found` - "Page Not Found" / "صفحه یافت نشد"
- `page_not_found_message` - Error description
- `go_home` - "Go Home" / "رفتن به خانه" 