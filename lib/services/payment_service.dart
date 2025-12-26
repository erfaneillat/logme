import 'package:flutter/material.dart';
import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter_poolakey/flutter_poolakey.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io' show Platform;
import 'package:dio/dio.dart';
import 'api_service.dart';
import 'api_service_provider.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/features/subscription/presentation/providers/subscription_status_provider.dart';

final paymentServiceProvider = Provider<PaymentService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return PaymentService(apiService, ref);
});

class PaymentService {
  final ApiService _apiService;
  final Ref _ref;
  bool _isInitialized = false;

  // Replace with your actual RSA public key from CafeBazaar developer console
  static const String _rsaPublicKey =
      'MIHNMA0GCSqGSIb3DQEBAQUAA4G7ADCBtwKBrwDLYqEpaWeTklUBlRiRLrAmpB2/YGIX2NWCWZBhkTBlabQq29d+cMetKLh94f3Zqfe+DJzGLi2+lVIAOGhLx3bRHNvN+UNVV3CxxtfgmQJoSlm8q9hoHxm6R9fj2WGRbryrWRWo1llSvA7ca1xEDJay6xZorRIskfn4VA/A4fl8p+gPxlC5aeiyNTQgRLqi1PcJcupU9MHN17Tr95esIZFWimNLEUY578lJNDMjJGMCAwEAAQ==';

  // RevenueCat API Keys - REPLACE WITH REAL KEYS
  static const String _rcGoogleKey = 'goog_rOqdbpqAOHrTOuAxMHWqyEBbkHX';
  static const String _rcAppleKey = 'appl_PLACEHOLDER_KEY';

  PaymentService(this._apiService, this._ref) {
    _initAll();
  }

  Future<void> _initAll() async {
    await _initializePayment(); // Cafe Bazaar
    await _initializeRevenueCat(); // RevenueCat
  }

  Future<void> _initializePayment() async {
    if (_isInitialized) return;

    final completer = Completer<bool>();

    try {
      // Initialize Poolakey with CafeBazaar RSA key
      // We don't await connect() directly because it might hang in some cases
      // Instead we rely on the callbacks to complete our local completer
      FlutterPoolakey.connect(
        _rsaPublicKey,
        onSucceed: () {
          debugPrint('Connected to CafeBazaar successfully');
          _isInitialized = true;
          if (!completer.isCompleted) completer.complete(true);
        },
        onFailed: () {
          debugPrint('Failed to connect to CafeBazaar');
          _isInitialized = false;
          if (!completer.isCompleted) completer.complete(false);
        },
        onDisconnected: () {
          debugPrint('Disconnected from CafeBazaar');
          _isInitialized = false;
          // Avoid immediate recursion to prevent potential loops;
          // let the next purchase attempt re-initialize if needed.
        },
      ).catchError((e) {
        debugPrint('FlutterPoolakey.connect error: $e');
        if (!completer.isCompleted) completer.complete(false);
      });

      // Wait for callback or timeout (5 seconds)
      try {
        await completer.future.timeout(const Duration(seconds: 5));
        debugPrint('Payment initialization sequence finished');
      } on TimeoutException {
        debugPrint('Payment initialization timed out waiting for callback');
        // If timed out, we assume failure unless _isInitialized became true somehow
        if (!_isInitialized) {
          debugPrint('Payment initialization considered failed due to timeout');
        }
      }
    } on PlatformException catch (e) {
      debugPrint('Failed to initialize payment service: ${e.message}');
      _isInitialized = false;
    } catch (e) {
      debugPrint('Failed to initialize payment service: $e');
      _isInitialized = false;
    }
  }

  Future<void> _initializeRevenueCat() async {
    try {
      if (Platform.isAndroid) {
        await Purchases.configure(PurchasesConfiguration(_rcGoogleKey));
      } else if (Platform.isIOS) {
        await Purchases.configure(PurchasesConfiguration(_rcAppleKey));
      }
      debugPrint('RevenueCat initialized successfully');
    } catch (e) {
      debugPrint('Failed to initialize RevenueCat: $e');
    }
  }

  Future<bool> get isReady async {
    if (!_isInitialized) {
      await _initializePayment();
    }
    return _isInitialized;
  }

  /// Purchase a subscription with the given product key
  Future<PurchaseResult> purchaseSubscription(String productKey) async {
    try {
      if (!_isInitialized) {
        debugPrint('Payment service not initialized, initializing...');
        await _initializePayment();
        if (!_isInitialized) {
          debugPrint('Payment service failed to initialize');
          return PurchaseResult(
            success: false,
            message: 'Payment service not initialized',
          );
        }
      }

      // Start subscription purchase flow
      // Use unique payload for tracking
      final payload = DateTime.now().millisecondsSinceEpoch.toString();

      debugPrint(
          'Calling FlutterPoolakey.subscribe for $productKey with payload $payload');

      PurchaseInfo purchaseInfo;
      try {
        purchaseInfo = await FlutterPoolakey.subscribe(
          productKey,
          payload: payload,
        ).timeout(const Duration(seconds: 30)); // 30s timeout for native call

        debugPrint(
            'FlutterPoolakey.subscribe completed: orderId=${purchaseInfo.orderId}');
      } catch (e) {
        debugPrint('FlutterPoolakey.subscribe failed or timed out: $e');
        if (e is TimeoutException) {
          return PurchaseResult(
            success: false,
            message:
                'CafeBazaar app did not respond. Please ensure it is installed and updated.',
          );
        }
        rethrow;
      }

      // Step 1: Validate with Cafe Bazaar API (fraud detection)
      debugPrint('Validating purchase with Cafe Bazaar...');
      final isValidWithCafeBazaar = await validateWithCafeBazaar(
        productId: productKey,
        purchaseToken: purchaseInfo.purchaseToken,
      );

      if (!isValidWithCafeBazaar) {
        debugPrint('Cafe Bazaar validation failed');
        return PurchaseResult(
          success: false,
          message:
              'Purchase validation failed. Please contact support if you were charged.',
        );
      }

      // Step 2: Verify with backend (creates subscription in database)
      debugPrint('Verifying purchase with backend...');
      debugPrint(
          'Purchase info: productKey=$productKey, orderId=${purchaseInfo.orderId}, payload=${purchaseInfo.payload}');
      final verificationResult = await _verifyPurchaseWithBackend(
        productKey: productKey,
        purchaseToken: purchaseInfo.purchaseToken,
        orderId: purchaseInfo.orderId,
        payload: purchaseInfo.payload,
      );

      if (verificationResult['success'] == true) {
        // Trigger subscription status refresh by incrementing the trigger
        _ref.read(subscriptionRefreshTriggerProvider.notifier).state++;
        return PurchaseResult(
          success: true,
          message: 'Subscription activated successfully',
          purchaseToken: purchaseInfo.purchaseToken,
          orderId: purchaseInfo.orderId,
        );
      } else {
        return PurchaseResult(
          success: false,
          message: verificationResult['message'] as String? ??
              'Purchase verification failed',
        );
      }
    } on PlatformException catch (e) {
      debugPrint('Poolakey error: ${e.code} - ${e.message}');
      return PurchaseResult(
        success: false,
        message: _getErrorMessage(e.code, e.message),
      );
    } catch (e) {
      debugPrint('Purchase error: $e');
      return PurchaseResult(
        success: false,
        message: 'An error occurred during purchase: $e',
      );
    }
  }

  /// Purchase a regular product (not subscription)
  Future<PurchaseResult> purchaseProduct(String productKey) async {
    try {
      if (!_isInitialized) {
        await _initializePayment();
        if (!_isInitialized) {
          return PurchaseResult(
            success: false,
            message: 'Payment service not initialized',
          );
        }
      }

      // Start purchase flow
      final payload = DateTime.now().millisecondsSinceEpoch.toString();

      final purchaseInfo = await FlutterPoolakey.purchase(
        productKey,
        payload: payload,
      );

      // Verify with backend
      final verificationResult = await _verifyPurchaseWithBackend(
        productKey: productKey,
        purchaseToken: purchaseInfo.purchaseToken,
        orderId: purchaseInfo.orderId,
        payload: purchaseInfo.payload,
      );

      if (verificationResult['success'] == true) {
        // Trigger subscription status refresh by incrementing the trigger
        _ref.read(subscriptionRefreshTriggerProvider.notifier).state++;
        // Consume the purchase for regular products
        await FlutterPoolakey.consume(purchaseInfo.purchaseToken);

        return PurchaseResult(
          success: true,
          message: 'Purchase successful',
          purchaseToken: purchaseInfo.purchaseToken,
          orderId: purchaseInfo.orderId,
        );
      } else {
        return PurchaseResult(
          success: false,
          message: verificationResult['message'] as String? ??
              'Purchase verification failed',
        );
      }
    } on PlatformException catch (e) {
      debugPrint('Poolakey error: ${e.code} - ${e.message}');
      return PurchaseResult(
        success: false,
        message: _getErrorMessage(e.code, e.message),
      );
    } catch (e) {
      debugPrint('Purchase error: $e');
      return PurchaseResult(
        success: false,
        message: 'An error occurred during purchase: $e',
      );
    }
  }

  /// Validate purchase with Cafe Bazaar API
  /// This provides an extra layer of validation before backend verification
  Future<bool> validateWithCafeBazaar({
    required String productId,
    required String purchaseToken,
  }) async {
    try {
      final response = await _apiService.post(
        '/api/subscription/validate-cafebazaar',
        data: {
          'productId': productId,
          'purchaseToken': purchaseToken,
        },
      );

      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        // Check if purchase is valid and not refunded
        final isValid = data['valid'] == true;
        final isPurchased = data['purchaseState'] == 'purchased';
        final isNotRefunded = data['purchaseState'] != 'refunded';

        return isValid && isPurchased && isNotRefunded;
      }
      return false;
    } catch (e) {
      debugPrint('Cafe Bazaar validation error: $e');
      return false;
    }
  }

  /// Check subscription status with Cafe Bazaar API
  /// Returns detailed subscription information including expiry and auto-renewal
  Future<CafeBazaarSubscriptionStatus?> checkCafeBazaarSubscriptionStatus({
    required String subscriptionId,
    required String purchaseToken,
  }) async {
    try {
      final response = await _apiService.post(
        '/api/subscription/check-subscription-status',
        data: {
          'subscriptionId': subscriptionId,
          'purchaseToken': purchaseToken,
        },
      );

      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        return CafeBazaarSubscriptionStatus(
          valid: data['valid'] ?? false,
          active: data['active'] ?? false,
          expiryTime: data['expiryTime'] != null
              ? DateTime.fromMillisecondsSinceEpoch(data['expiryTime'])
              : null,
          autoRenewing: data['autoRenewing'] ?? false,
          linkedSubscriptionToken: data['linkedSubscriptionToken'] as String?,
        );
      }
      return null;
    } catch (e) {
      debugPrint('Cafe Bazaar subscription status error: $e');
      return null;
    }
  }

  /// Verify purchase with backend
  Future<Map<String, dynamic>> _verifyPurchaseWithBackend({
    required String productKey,
    required String purchaseToken,
    required String orderId,
    required String payload,
  }) async {
    try {
      debugPrint(
          'Sending to backend: productKey=$productKey, orderId=$orderId, payload=$payload');
      final response = await _apiService.post(
        '/api/subscription/verify-purchase',
        data: {
          'productKey': productKey,
          'purchaseToken': purchaseToken,
          'orderId': orderId,
          'payload': payload,
        },
      );

      debugPrint(
          'Backend response: ${response['success']}, message: ${response['message']}');
      return {
        'success': response['success'] == true,
        'message': response['message'] as String?,
      };
    } catch (e) {
      debugPrint('Backend verification error: $e');
      String errorMessage = 'Connection error during verification: $e';

      if (e is DioException) {
        // If it's a DioException, checks if the error property contains our clean message from ErrorHandler
        // or effectively from the server due to our ErrorHandler fix
        if (e.error is String) {
          errorMessage = e.error as String;
        } else if (e.message != null) {
          errorMessage = e.message!;
        }
      }

      return {
        'success': false,
        'message': errorMessage,
      };
    }
  }

  /// Check if user has active subscription
  Future<SubscriptionStatus> checkSubscriptionStatus() async {
    try {
      final response = await _apiService.get('/api/subscription/status');

      if (response['success'] == true && response['data'] != null) {
        final data = response['data'] as Map<String, dynamic>;
        return SubscriptionStatus(
          isActive: data['isActive'] as bool? ?? false,
          planType: data['planType'] as String?,
          expiryDate: data['expiryDate'] != null
              ? DateTime.parse(data['expiryDate'] as String)
              : null,
        );
      }

      return SubscriptionStatus(isActive: false);
    } catch (e) {
      debugPrint('Error checking subscription status: $e');
      return SubscriptionStatus(isActive: false);
    }
  }

  /// Get details for subscription products
  Future<List<ProductInfo>> getSubscriptionDetails(
      List<String> productKeys) async {
    try {
      if (!_isInitialized) {
        await _initializePayment();
      }

      final skuDetailsList =
          await FlutterPoolakey.getSubscriptionSkuDetails(productKeys);

      return skuDetailsList.map((sku) {
        return ProductInfo(
          productKey: sku.sku,
          title: sku.title,
          description: sku.description,
          price: sku.price,
        );
      }).toList();
    } on PlatformException catch (e) {
      debugPrint('Error getting subscription details: ${e.message}');
      return [];
    } catch (e) {
      debugPrint('Error getting subscription details: $e');
      return [];
    }
  }

  /// Get details for in-app products
  Future<List<ProductInfo>> getProductDetails(List<String> productKeys) async {
    try {
      if (!_isInitialized) {
        await _initializePayment();
      }

      final skuDetailsList =
          await FlutterPoolakey.getInAppSkuDetails(productKeys);

      return skuDetailsList.map((sku) {
        return ProductInfo(
          productKey: sku.sku,
          title: sku.title,
          description: sku.description,
          price: sku.price,
        );
      }).toList();
    } on PlatformException catch (e) {
      debugPrint('Error getting product details: ${e.message}');
      return [];
    } catch (e) {
      debugPrint('Error getting product details: $e');
      return [];
    }
  }

  /// Get all purchased products
  Future<List<PurchaseInfo>> getAllPurchasedProducts() async {
    try {
      if (!_isInitialized) {
        await _initializePayment();
      }

      return await FlutterPoolakey.getAllPurchasedProducts();
    } on PlatformException catch (e) {
      debugPrint('Error getting purchased products: ${e.message}');
      return [];
    } catch (e) {
      debugPrint('Error getting purchased products: $e');
      return [];
    }
  }

  /// Get all subscribed products
  Future<List<PurchaseInfo>> getAllSubscribedProducts() async {
    try {
      if (!_isInitialized) {
        await _initializePayment();
      }

      return await FlutterPoolakey.getAllSubscribedProducts();
    } on PlatformException catch (e) {
      debugPrint('Error getting subscribed products: ${e.message}');
      return [];
    } catch (e) {
      debugPrint('Error getting subscribed products: $e');
      return [];
    }
  }

  /// Consume a purchase (only for non-subscription products)
  Future<bool> consumePurchase(String purchaseToken) async {
    try {
      if (!_isInitialized) {
        await _initializePayment();
      }

      await FlutterPoolakey.consume(purchaseToken);
      return true;
    } on PlatformException catch (e) {
      debugPrint('Error consuming purchase: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error consuming purchase: $e');
      return false;
    }
  }

  String _getErrorMessage(String? errorCode, String? errorMessage) {
    // Return specific error message if available
    if (errorMessage != null && errorMessage.isNotEmpty) {
      return errorMessage;
    }

    // Fallback to generic messages based on error code
    switch (errorCode) {
      case 'BILLING_UNAVAILABLE':
        return 'Billing service unavailable';
      case 'ITEM_UNAVAILABLE':
        return 'Product not found';
      case 'DEVELOPER_ERROR':
        return 'Developer error occurred';
      case 'ERROR':
        return 'Error during purchase';
      case 'ITEM_ALREADY_OWNED':
        return 'Product already owned';
      case 'ITEM_NOT_OWNED':
        return 'Product not owned';
      case 'USER_CANCELED':
        return 'Purchase cancelled';
      case 'BILLING_NOT_INITIALIZED':
        return 'Billing not initialized';
      default:
        return 'Unknown error occurred';
    }
  }

  /// Purchase via RevenueCat
  Future<PurchaseResult> purchaseRevenueCat(String productIdentifier) async {
    try {
      debugPrint('Purchasing via RevenueCat: $productIdentifier');

      // Fetch offerings
      try {
        final offerings = await Purchases.getOfferings();
        debugPrint(
            'RC Offerings fetched: current=${offerings.current}, all=${offerings.all}');
        if (offerings.current != null) {
          debugPrint(
              'RC Current Offering Packages: ${offerings.current!.availablePackages.map((p) => '${p.identifier}:${p.storeProduct.identifier}').join(', ')}');
        }

        if (offerings.current == null) {
          debugPrint('No current offering configured in RevenueCat');
          return PurchaseResult(
              success: false, message: 'No offerings available');
        }

        // Find the package matching the identifier
        Package? package;

        // 1. Try to find in Current Offering first (Common Case)
        if (offerings.current != null &&
            offerings.current!.availablePackages.isNotEmpty) {
          try {
            package = offerings.current!.availablePackages.firstWhere((p) =>
                p.identifier == productIdentifier ||
                p.storeProduct.identifier == productIdentifier);
          } catch (_) {
            // Not found in current
          }
        }

        // 2. If not found, and we have a specific offering identifier (e.g. 'yearlyoff')
        // We can try to look up that specific offering directly if the productIdentifier matches an offering ID logic
        // OR we just iterate all offerings to find a matching package identifier.
        if (package == null) {
          // Special case for 'yearlyoff' which seems to be an OFFERING name in the screenshots
          // but the user might pass it as productIdentifier.
          // In the screenshot: Offering = 'yearlyoff', Package = 'monthly' (which wraps 'yearlyoff:yearlyoff')

          if (productIdentifier == 'yearlyoff') {
            final specialOffering = offerings.all['yearlyoff'];
            if (specialOffering != null &&
                specialOffering.availablePackages.isNotEmpty) {
              // Assuming we want the first available package in this special offering
              package = specialOffering.availablePackages.first;
            }
          }
        }

        // 3. Last Resort Fallback for standard keys
        if (package == null && offerings.current != null) {
          if (productIdentifier == 'monthly') {
            package = offerings.current!.monthly;
          } else if (productIdentifier == 'yearly') {
            package = offerings.current!.annual;
          }
        }

        if (package == null) {
          return PurchaseResult(success: false, message: 'Product not found');
        }

        debugPrint(
            'Initiating purchase for package: ${package.identifier}, Product ID: ${package.storeProduct.identifier}');
        final customerInfo = await Purchases.purchasePackage(package);

        // Verify entitlement
        final isPro =
            customerInfo.entitlements.all['premium']?.isActive ?? false;

        if (isPro) {
          // Sync with backend
          await _verifyRevenueCatBackend(customerInfo.originalAppUserId);

          // Trigger refresh
          final notifier =
              _ref.read(subscriptionRefreshTriggerProvider.notifier);
          notifier.state = notifier.state + 1;

          return PurchaseResult(
              success: true,
              message: 'Subscription activated',
              orderId: customerInfo.originalAppUserId);
        } else {
          return PurchaseResult(
              success: false,
              message: 'Purchase succeeded but entitlement not active');
        }
      } on PlatformException catch (e) {
        var errorCode = PurchasesErrorHelper.getErrorCode(e);
        if (errorCode == PurchasesErrorCode.purchaseCancelledError) {
          return PurchaseResult(
              success: false, message: 'User cancelled purchase');
        }
        return PurchaseResult(
            success: false, message: e.message ?? 'Unknown error');
      }
    } catch (e) {
      return PurchaseResult(success: false, message: 'Error: $e');
    }
  }

  Future<bool> _verifyRevenueCatBackend(String appUserId) async {
    try {
      // Send to backend to let it know to sync/update user status
      final response = await _apiService
          .post('/api/subscription/verify-revenuecat', data: {
        'appUserId': appUserId,
        'platform': Platform.isIOS ? 'ios' : 'android'
      });
      return response['success'] == true;
    } catch (e) {
      debugPrint('Backend sync failed: $e');
      return false;
    }
  }
}

class PurchaseResult {
  final bool success;
  final String message;
  final String? purchaseToken;
  final String? orderId;

  PurchaseResult({
    required this.success,
    required this.message,
    this.purchaseToken,
    this.orderId,
  });
}

class SubscriptionStatus {
  final bool isActive;
  final String? planType;
  final DateTime? expiryDate;

  SubscriptionStatus({
    required this.isActive,
    this.planType,
    this.expiryDate,
  });
}

class ProductInfo {
  final String productKey;
  final String title;
  final String description;
  final String price;

  ProductInfo({
    required this.productKey,
    required this.title,
    required this.description,
    required this.price,
  });
}

class CafeBazaarSubscriptionStatus {
  final bool valid;
  final bool active;
  final DateTime? expiryTime;
  final bool autoRenewing;
  final String? linkedSubscriptionToken;

  CafeBazaarSubscriptionStatus({
    required this.valid,
    required this.active,
    this.expiryTime,
    required this.autoRenewing,
    this.linkedSubscriptionToken,
  });

  bool get isExpired =>
      expiryTime != null && expiryTime!.isBefore(DateTime.now());

  String get statusText {
    if (!valid) return 'Invalid';
    if (!active) return 'Expired';
    if (autoRenewing) return 'Active (Auto-renewing)';
    return 'Active';
  }
}
