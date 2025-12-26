import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

/// RevenueCat API Keys - Configure these in your environment
/// iOS API Key from RevenueCat dashboard
const String _revenueCatAppleApiKey = String.fromEnvironment(
  'REVENUECAT_APPLE_API_KEY',
  defaultValue: '', // Add your default key here for testing
);

/// Android API Key from RevenueCat dashboard
const String _revenueCatGoogleApiKey = String.fromEnvironment(
  'REVENUECAT_GOOGLE_API_KEY',
  defaultValue: '', // Add your default key here for testing
);

/// Provider for RevenueCatService
final revenueCatServiceProvider = Provider<RevenueCatService>((ref) {
  return RevenueCatService();
});

/// Result of a RevenueCat purchase attempt
class RevenueCatPurchaseResult {
  final bool success;
  final String? productId;
  final String? transactionId;
  final String? purchaseToken;
  final String store;
  final String? entitlementId;
  final String? message;
  final DateTime? expiresDate;

  RevenueCatPurchaseResult({
    required this.success,
    this.productId,
    this.transactionId,
    this.purchaseToken,
    required this.store,
    this.entitlementId,
    this.message,
    this.expiresDate,
  });

  Map<String, dynamic> toJson() => {
        'success': success,
        'productId': productId,
        'transactionId': transactionId,
        'purchaseToken': purchaseToken,
        'store': store,
        'entitlementId': entitlementId,
        'message': message,
        'expiresDate': expiresDate?.toIso8601String(),
      };
}

/// Service for handling RevenueCat in-app purchases
/// Used for global users (App Store / Play Store)
class RevenueCatService {
  bool _isInitialized = false;
  bool _isConfigured = false;

  /// Initialize RevenueCat SDK
  Future<bool> initialize({String? appUserId}) async {
    if (_isInitialized) {
      debugPrint('RevenueCat already initialized');
      return true;
    }

    // Get the appropriate API key based on platform
    final apiKey =
        Platform.isIOS ? _revenueCatAppleApiKey : _revenueCatGoogleApiKey;

    if (apiKey.isEmpty) {
      debugPrint(
          'RevenueCat API key not configured for ${Platform.isIOS ? 'iOS' : 'Android'}');
      return false;
    }

    try {
      debugPrint(
          'Initializing RevenueCat with API key: ${apiKey.substring(0, 10)}...');

      // Configure Purchases SDK
      PurchasesConfiguration configuration;
      if (Platform.isAndroid) {
        configuration = PurchasesConfiguration(apiKey);
      } else if (Platform.isIOS) {
        configuration = PurchasesConfiguration(apiKey);
      } else {
        debugPrint('RevenueCat: Unsupported platform');
        return false;
      }

      // Set app user ID if provided (for linking to your backend user)
      if (appUserId != null && appUserId.isNotEmpty) {
        configuration.appUserID = appUserId;
      }

      await Purchases.configure(configuration);
      _isInitialized = true;
      _isConfigured = true;

      debugPrint('RevenueCat initialized successfully');

      // Enable debug logs in debug mode
      if (kDebugMode) {
        await Purchases.setLogLevel(LogLevel.debug);
      }

      return true;
    } catch (e) {
      debugPrint('Failed to initialize RevenueCat: $e');
      return false;
    }
  }

  /// Check if RevenueCat is properly initialized
  bool get isInitialized => _isInitialized && _isConfigured;

  /// Get the current store type
  String get store => Platform.isIOS ? 'app_store' : 'play_store';

  /// Login/identify user with RevenueCat
  Future<void> login(String appUserId) async {
    if (!isInitialized) {
      await initialize(appUserId: appUserId);
      return;
    }

    try {
      await Purchases.logIn(appUserId);
      debugPrint('RevenueCat user logged in: $appUserId');
    } catch (e) {
      debugPrint('RevenueCat login error: $e');
    }
  }

  /// Logout from RevenueCat
  Future<void> logout() async {
    if (!isInitialized) return;

    try {
      await Purchases.logOut();
      debugPrint('RevenueCat user logged out');
    } catch (e) {
      debugPrint('RevenueCat logout error: $e');
    }
  }

  /// Get available offerings (subscription products)
  Future<Offerings?> getOfferings() async {
    if (!isInitialized) {
      final initialized = await initialize();
      if (!initialized) return null;
    }

    try {
      final offerings = await Purchases.getOfferings();
      debugPrint(
          'RevenueCat offerings fetched: ${offerings.current?.identifier}');
      return offerings;
    } catch (e) {
      debugPrint('Failed to get offerings: $e');
      return null;
    }
  }

  /// Purchase a subscription package
  Future<RevenueCatPurchaseResult> purchasePackage(Package package) async {
    if (!isInitialized) {
      final initialized = await initialize();
      if (!initialized) {
        return RevenueCatPurchaseResult(
          success: false,
          store: store,
          message: 'RevenueCat not initialized',
        );
      }
    }

    try {
      debugPrint(
          'Starting RevenueCat purchase for package: ${package.identifier}');

      final customerInfo = await Purchases.purchasePackage(package);

      // Check if the purchase was successful by looking at entitlements
      final premiumEntitlement = customerInfo.entitlements.all['premium'];
      final isActive = premiumEntitlement?.isActive ?? false;

      if (isActive) {
        debugPrint('RevenueCat purchase successful! Premium is active.');
        DateTime? expirationDateTime;
        if (premiumEntitlement?.expirationDate != null) {
          expirationDateTime =
              DateTime.tryParse(premiumEntitlement!.expirationDate!);
        }
        return RevenueCatPurchaseResult(
          success: true,
          productId: package.storeProduct.identifier,
          store: store,
          entitlementId: 'premium',
          expiresDate: expirationDateTime,
          message: 'Subscription activated successfully',
        );
      } else {
        debugPrint('RevenueCat purchase completed but premium not active');
        return RevenueCatPurchaseResult(
          success: false,
          productId: package.storeProduct.identifier,
          store: store,
          message: 'Purchase completed but subscription not activated',
        );
      }
    } on PurchasesErrorCode catch (e) {
      debugPrint('RevenueCat purchase error code: $e');

      String message;
      switch (e) {
        case PurchasesErrorCode.purchaseCancelledError:
          message = 'Purchase cancelled';
          break;
        case PurchasesErrorCode.purchaseNotAllowedError:
          message = 'Purchase not allowed on this device';
          break;
        case PurchasesErrorCode.purchaseInvalidError:
          message = 'Invalid purchase request';
          break;
        case PurchasesErrorCode.productNotAvailableForPurchaseError:
          message = 'Product not available for purchase';
          break;
        case PurchasesErrorCode.networkError:
          message = 'Network error. Please check your connection.';
          break;
        default:
          message = 'Purchase failed: ${e.toString()}';
      }

      return RevenueCatPurchaseResult(
        success: false,
        store: store,
        message: message,
      );
    } catch (e) {
      debugPrint('RevenueCat purchase error: $e');
      return RevenueCatPurchaseResult(
        success: false,
        store: store,
        message: 'Purchase failed: ${e.toString()}',
      );
    }
  }

  /// Purchase a product by its identifier
  Future<RevenueCatPurchaseResult> purchaseProduct(String productId) async {
    if (!isInitialized) {
      final initialized = await initialize();
      if (!initialized) {
        return RevenueCatPurchaseResult(
          success: false,
          store: store,
          message: 'RevenueCat not initialized',
        );
      }
    }

    try {
      debugPrint('Starting RevenueCat purchase for product: $productId');

      // Get offerings to find the package
      final offerings = await Purchases.getOfferings();
      final currentOffering = offerings.current;

      if (currentOffering == null) {
        return RevenueCatPurchaseResult(
          success: false,
          store: store,
          message: 'No offerings available',
        );
      }

      // Find the package matching the product ID
      Package? targetPackage;
      for (final package in currentOffering.availablePackages) {
        if (package.storeProduct.identifier == productId ||
            package.identifier
                .toLowerCase()
                .contains(productId.toLowerCase())) {
          targetPackage = package;
          break;
        }
      }

      // If not found in current offering, try all offerings
      if (targetPackage == null) {
        for (final offering in offerings.all.values) {
          for (final package in offering.availablePackages) {
            if (package.storeProduct.identifier == productId ||
                package.identifier
                    .toLowerCase()
                    .contains(productId.toLowerCase())) {
              targetPackage = package;
              break;
            }
          }
          if (targetPackage != null) break;
        }
      }

      if (targetPackage == null) {
        debugPrint('Product not found: $productId');
        return RevenueCatPurchaseResult(
          success: false,
          store: store,
          productId: productId,
          message: 'Product not found: $productId',
        );
      }

      // Purchase the package
      return await purchasePackage(targetPackage);
    } catch (e) {
      debugPrint('RevenueCat purchaseProduct error: $e');
      return RevenueCatPurchaseResult(
        success: false,
        store: store,
        productId: productId,
        message: 'Purchase failed: ${e.toString()}',
      );
    }
  }

  /// Check if user has active premium entitlement
  Future<bool> hasPremiumAccess() async {
    if (!isInitialized) {
      final initialized = await initialize();
      if (!initialized) return false;
    }

    try {
      final customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.all['premium']?.isActive ?? false;
    } catch (e) {
      debugPrint('Failed to check premium access: $e');
      return false;
    }
  }

  /// Get current subscription info
  Future<CustomerInfo?> getCustomerInfo() async {
    if (!isInitialized) {
      final initialized = await initialize();
      if (!initialized) return null;
    }

    try {
      return await Purchases.getCustomerInfo();
    } catch (e) {
      debugPrint('Failed to get customer info: $e');
      return null;
    }
  }

  /// Restore previous purchases
  Future<RevenueCatPurchaseResult> restorePurchases() async {
    if (!isInitialized) {
      final initialized = await initialize();
      if (!initialized) {
        return RevenueCatPurchaseResult(
          success: false,
          store: store,
          message: 'RevenueCat not initialized',
        );
      }
    }

    try {
      debugPrint('Restoring RevenueCat purchases...');
      final customerInfo = await Purchases.restorePurchases();

      final premiumEntitlement = customerInfo.entitlements.all['premium'];
      final isActive = premiumEntitlement?.isActive ?? false;

      if (isActive) {
        debugPrint('Purchases restored successfully! Premium is active.');
        DateTime? expirationDateTime;
        if (premiumEntitlement?.expirationDate != null) {
          expirationDateTime =
              DateTime.tryParse(premiumEntitlement!.expirationDate!);
        }
        return RevenueCatPurchaseResult(
          success: true,
          store: store,
          entitlementId: 'premium',
          expiresDate: expirationDateTime,
          message: 'Purchases restored successfully',
        );
      } else {
        debugPrint('No active subscriptions found to restore');
        return RevenueCatPurchaseResult(
          success: false,
          store: store,
          message: 'No active subscriptions to restore',
        );
      }
    } catch (e) {
      debugPrint('Restore purchases error: $e');
      return RevenueCatPurchaseResult(
        success: false,
        store: store,
        message: 'Failed to restore purchases: ${e.toString()}',
      );
    }
  }
}
