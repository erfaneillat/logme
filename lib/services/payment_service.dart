import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_poolakey/flutter_poolakey.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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

  PaymentService(this._apiService, this._ref) {
    _initializePayment();
  }

  Future<void> _initializePayment() async {
    try {
      // Initialize Poolakey with CafeBazaar RSA key
      await FlutterPoolakey.connect(
        _rsaPublicKey,
        onSucceed: () {
          debugPrint('Connected to CafeBazaar successfully');
          _isInitialized = true;
        },
        onFailed: () {
          debugPrint('Failed to connect to CafeBazaar');
          _isInitialized = false;
        },
        onDisconnected: () {
          debugPrint('Disconnected from CafeBazaar, reconnecting...');
          _isInitialized = false;
          _initializePayment();
        },
      );
      _isInitialized = true;
      debugPrint('Payment service initialized successfully');
    } on PlatformException catch (e) {
      debugPrint('Failed to initialize payment service: ${e.message}');
      _isInitialized = false;
    } catch (e) {
      debugPrint('Failed to initialize payment service: $e');
      _isInitialized = false;
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
        await _initializePayment();
        if (!_isInitialized) {
          return PurchaseResult(
            success: false,
            message: 'Payment service not initialized',
          );
        }
      }

      // Start subscription purchase flow
      // Use unique payload for tracking
      final payload = DateTime.now().millisecondsSinceEpoch.toString();

      final purchaseInfo = await FlutterPoolakey.subscribe(
        productKey,
        payload: payload,
      );

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
          message: 'Purchase validation failed. Please contact support if you were charged.',
        );
      }

      // Step 2: Verify with backend (creates subscription in database)
      debugPrint('Verifying purchase with backend...');
      debugPrint('Purchase info: productKey=$productKey, orderId=${purchaseInfo.orderId}, payload=${purchaseInfo.payload}');
      final verificationResult = await _verifyPurchaseWithBackend(
        productKey: productKey,
        purchaseToken: purchaseInfo.purchaseToken,
        orderId: purchaseInfo.orderId,
        payload: purchaseInfo.payload,
      );

      if (verificationResult) {
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
          message: 'Purchase verification failed',
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

      if (verificationResult) {
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
          message: 'Purchase verification failed',
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
  Future<bool> _verifyPurchaseWithBackend({
    required String productKey,
    required String purchaseToken,
    required String orderId,
    required String payload,
  }) async {
    try {
      debugPrint('Sending to backend: productKey=$productKey, orderId=$orderId, payload=$payload');
      final response = await _apiService.post(
        '/api/subscription/verify-purchase',
        data: {
          'productKey': productKey,
          'purchaseToken': purchaseToken,
          'orderId': orderId,
          'payload': payload,
        },
      );

      debugPrint('Backend response: ${response['success']}, message: ${response['message']}');
      return response['success'] == true;
    } catch (e) {
      debugPrint('Backend verification error: $e');
      return false;
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

  bool get isExpired => expiryTime != null && expiryTime!.isBefore(DateTime.now());
  
  String get statusText {
    if (!valid) return 'Invalid';
    if (!active) return 'Expired';
    if (autoRenewing) return 'Active (Auto-renewing)';
    return 'Active';
  }
}
