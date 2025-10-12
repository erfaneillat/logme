# Flutter Cafe Bazaar Integration - Usage Guide

## Overview

The Flutter payment service now includes enhanced Cafe Bazaar validation with two-step verification:
1. **Cafe Bazaar API Validation** - Verifies purchase directly with Cafe Bazaar (fraud detection)
2. **Backend Verification** - Creates subscription in your database

## Updated Payment Flow

```
User Purchase → Poolakey → Cafe Bazaar Validation → Backend Verification → Success
                              ↓ (if fraud)
                           Reject Purchase
```

## Available Methods

### 1. Purchase Subscription (Enhanced)

The `purchaseSubscription` method now includes automatic Cafe Bazaar validation:

```dart
final paymentService = ref.watch(paymentServiceProvider);

final result = await paymentService.purchaseSubscription('monthly_subscription');

if (result.success) {
  // Subscription activated successfully
  print('Purchase Token: ${result.purchaseToken}');
  print('Order ID: ${result.orderId}');
} else {
  // Show error message
  print('Error: ${result.message}');
}
```

**What happens internally:**
1. Initiates purchase via Poolakey
2. Validates with Cafe Bazaar API (checks for fraud/refunds)
3. Verifies with backend (creates subscription)
4. Returns result

### 2. Validate Purchase with Cafe Bazaar

Manually validate a purchase with Cafe Bazaar API:

```dart
final paymentService = ref.watch(paymentServiceProvider);

final isValid = await paymentService.validateWithCafeBazaar(
  productId: 'monthly_subscription',
  purchaseToken: 'abc123xyz...',
);

if (isValid) {
  print('Purchase is valid and not refunded');
} else {
  print('Purchase is invalid or refunded');
}
```

**Use cases:**
- Verify old purchases
- Check if purchase was refunded
- Fraud detection

### 3. Check Subscription Status

Get detailed subscription information from Cafe Bazaar:

```dart
final paymentService = ref.watch(paymentServiceProvider);

final status = await paymentService.checkCafeBazaarSubscriptionStatus(
  subscriptionId: 'monthly_subscription',
  purchaseToken: 'abc123xyz...',
);

if (status != null) {
  print('Valid: ${status.valid}');
  print('Active: ${status.active}');
  print('Expiry: ${status.expiryTime}');
  print('Auto-renewing: ${status.autoRenewing}');
  print('Status: ${status.statusText}');
  
  if (status.isExpired) {
    // Show renewal prompt
  }
}
```

**Use cases:**
- Check if subscription is still active
- Get expiry date
- Check auto-renewal status
- Display subscription details to user

## CafeBazaarSubscriptionStatus Class

```dart
class CafeBazaarSubscriptionStatus {
  final bool valid;              // Whether subscription exists in Cafe Bazaar
  final bool active;             // Whether subscription is currently active
  final DateTime? expiryTime;    // When subscription expires
  final bool autoRenewing;       // Whether auto-renewal is enabled
  final String? linkedSubscriptionToken; // Unique subscription identifier
  
  // Computed properties
  bool get isExpired;            // true if expired
  String get statusText;         // Human-readable status
}
```

## Usage Examples

### Example 1: Purchase Flow in UI

```dart
// In subscription_page.dart
Future<void> _handleSubscriptionPurchase(
  BuildContext context,
  WidgetRef ref,
  String productKey,
) async {
  final paymentService = ref.watch(paymentServiceProvider);
  
  // Show loading
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (_) => Center(child: CircularProgressIndicator()),
  );
  
  try {
    // Purchase with automatic validation
    final result = await paymentService.purchaseSubscription(productKey);
    
    Navigator.pop(context); // Close loading
    
    if (result.success) {
      // Show success dialog
      _showSuccessDialog(context);
    } else {
      // Show error dialog
      _showErrorDialog(context, result.message);
    }
  } catch (e) {
    Navigator.pop(context);
    _showErrorDialog(context, 'An error occurred');
  }
}
```

### Example 2: Check Subscription on App Launch

```dart
// In home_page.dart or main.dart
Future<void> _checkSubscriptionStatus() async {
  final paymentService = ref.watch(paymentServiceProvider);
  final secureStorage = ref.watch(secureStorageProvider);
  
  // Get stored purchase token
  final purchaseToken = await secureStorage.getSubscriptionToken();
  
  if (purchaseToken != null) {
    final status = await paymentService.checkCafeBazaarSubscriptionStatus(
      subscriptionId: 'monthly_subscription', // or yearly
      purchaseToken: purchaseToken,
    );
    
    if (status != null && status.active) {
      // Grant premium features
      await secureStorage.setSubscriptionActive(true);
    } else {
      // Remove premium access
      await secureStorage.setSubscriptionActive(false);
      
      if (status != null && !status.autoRenewing) {
        // Show renewal reminder
        _showRenewalReminder();
      }
    }
  }
}
```

### Example 3: Display Subscription Details

```dart
// In profile_page.dart
Widget _buildSubscriptionInfo() {
  return FutureBuilder<CafeBazaarSubscriptionStatus?>(
    future: _getSubscriptionStatus(),
    builder: (context, snapshot) {
      if (snapshot.connectionState == ConnectionState.waiting) {
        return CircularProgressIndicator();
      }
      
      final status = snapshot.data;
      if (status == null || !status.active) {
        return Text('No active subscription');
      }
      
      return Column(
        children: [
          Text('Status: ${status.statusText}'),
          if (status.expiryTime != null)
            Text('Expires: ${_formatDate(status.expiryTime!)}'),
          if (!status.autoRenewing)
            Text(
              'Auto-renewal is disabled',
              style: TextStyle(color: Colors.orange),
            ),
        ],
      );
    },
  );
}

Future<CafeBazaarSubscriptionStatus?> _getSubscriptionStatus() async {
  final paymentService = ref.watch(paymentServiceProvider);
  final purchaseToken = await _getPurchaseToken();
  
  if (purchaseToken == null) return null;
  
  return await paymentService.checkCafeBazaarSubscriptionStatus(
    subscriptionId: 'monthly_subscription',
    purchaseToken: purchaseToken,
  );
}
```

### Example 4: Periodic Status Check

```dart
// Check subscription status periodically
class SubscriptionMonitor {
  Timer? _timer;
  final PaymentService paymentService;
  
  void startMonitoring() {
    // Check every 24 hours
    _timer = Timer.periodic(Duration(hours: 24), (_) {
      _checkStatus();
    });
    
    // Check immediately
    _checkStatus();
  }
  
  Future<void> _checkStatus() async {
    final purchaseToken = await _getPurchaseToken();
    if (purchaseToken == null) return;
    
    final status = await paymentService.checkCafeBazaarSubscriptionStatus(
      subscriptionId: 'monthly_subscription',
      purchaseToken: purchaseToken,
    );
    
    if (status != null) {
      if (!status.active) {
        // Subscription expired
        _handleExpiredSubscription();
      } else if (status.expiryTime != null) {
        final daysUntilExpiry = status.expiryTime!
            .difference(DateTime.now())
            .inDays;
        
        if (daysUntilExpiry <= 3 && !status.autoRenewing) {
          // Show renewal reminder
          _showRenewalReminder(daysUntilExpiry);
        }
      }
    }
  }
  
  void stopMonitoring() {
    _timer?.cancel();
  }
}
```

## Error Handling

### Purchase Validation Errors

```dart
final result = await paymentService.purchaseSubscription(productKey);

if (!result.success) {
  // Handle specific errors
  if (result.message.contains('validation failed')) {
    // Purchase might be fraudulent or refunded
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Verification Failed'),
        content: Text(
          'We could not verify your purchase. '
          'If you were charged, please contact support.'
        ),
        actions: [
          TextButton(
            onPressed: () => _contactSupport(),
            child: Text('Contact Support'),
          ),
        ],
      ),
    );
  } else {
    // Other errors
    _showErrorDialog(context, result.message);
  }
}
```

### Subscription Status Errors

```dart
final status = await paymentService.checkCafeBazaarSubscriptionStatus(
  subscriptionId: subscriptionId,
  purchaseToken: purchaseToken,
);

if (status == null) {
  // API call failed or subscription not found
  print('Could not check subscription status');
} else if (!status.valid) {
  // Subscription doesn't exist in Cafe Bazaar
  print('Invalid subscription');
} else if (!status.active) {
  // Subscription expired
  print('Subscription has expired');
}
```

## Best Practices

### 1. Store Purchase Token Securely

```dart
// After successful purchase
final secureStorage = ref.watch(secureStorageProvider);
await secureStorage.storeSubscriptionToken(result.purchaseToken);
await secureStorage.storeProductKey(productKey);
```

### 2. Check Status on App Launch

```dart
@override
void initState() {
  super.initState();
  WidgetsBinding.instance.addPostFrameCallback((_) {
    _checkSubscriptionStatus();
  });
}
```

### 3. Handle Expiry Gracefully

```dart
if (status != null && status.active) {
  final daysUntilExpiry = status.expiryTime
      ?.difference(DateTime.now())
      .inDays ?? 0;
  
  if (daysUntilExpiry <= 7) {
    // Show expiry warning
    _showExpiryWarning(daysUntilExpiry);
  }
}
```

### 4. Implement Retry Logic

```dart
Future<bool> _validateWithRetry(String productId, String token) async {
  for (int i = 0; i < 3; i++) {
    try {
      final isValid = await paymentService.validateWithCafeBazaar(
        productId: productId,
        purchaseToken: token,
      );
      return isValid;
    } catch (e) {
      if (i == 2) rethrow; // Last attempt
      await Future.delayed(Duration(seconds: 2));
    }
  }
  return false;
}
```

## Testing

### Test with Debug Purchases

```dart
// In development, you can test with debug product IDs
const debugProductKey = 'android.test.purchased';

final result = await paymentService.purchaseSubscription(debugProductKey);
```

### Mock Payment Service for Testing

```dart
class MockPaymentService extends PaymentService {
  @override
  Future<PurchaseResult> purchaseSubscription(String productKey) async {
    await Future.delayed(Duration(seconds: 1));
    return PurchaseResult(
      success: true,
      message: 'Test purchase successful',
      purchaseToken: 'test_token_123',
      orderId: 'test_order_123',
    );
  }
  
  @override
  Future<CafeBazaarSubscriptionStatus?> checkCafeBazaarSubscriptionStatus({
    required String subscriptionId,
    required String purchaseToken,
  }) async {
    return CafeBazaarSubscriptionStatus(
      valid: true,
      active: true,
      expiryTime: DateTime.now().add(Duration(days: 30)),
      autoRenewing: true,
    );
  }
}
```

## Troubleshooting

### Issue: Validation always fails

**Solution:**
- Check that backend token is configured correctly
- Verify package name matches Cafe Bazaar console
- Ensure product ID is correct

### Issue: Status check returns null

**Solution:**
- Verify purchase token is valid
- Check network connectivity
- Ensure backend is running and accessible

### Issue: Purchase succeeds but validation fails

**Solution:**
- This might indicate a fraudulent purchase
- Check Cafe Bazaar console for purchase details
- Contact Cafe Bazaar support if legitimate

## Summary

✅ **Enhanced Security** - Two-step validation prevents fraud
✅ **Detailed Status** - Get expiry time, auto-renewal status
✅ **Better UX** - Show subscription details to users
✅ **Automatic** - Validation happens automatically on purchase
✅ **Flexible** - Can also check status manually anytime

The Flutter payment service is now fully integrated with Cafe Bazaar's validation APIs!
