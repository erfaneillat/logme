import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:cal_ai/gen/assets.gen.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cal_ai/services/payment_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io' show Platform;
import 'dart:convert';
import 'dart:ui' as ui;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:cal_ai/services/fcm_service.dart';
import 'package:cal_ai/services/api_service_provider.dart';

/// A page that displays the webapp in a WebView
/// Supports: File uploads, Camera access, Payment redirects, External links, CafeBazaar payments
class WebAppPage extends ConsumerStatefulWidget {
  const WebAppPage({super.key});

  @override
  ConsumerState<WebAppPage> createState() => _WebAppPageState();
}

class _WebAppPageState extends ConsumerState<WebAppPage>
    with SingleTickerProviderStateMixin {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _isControllerReady = false;
  String? _errorMessage;

  // Animation controller for splash screen
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  // Configure your webapp URL here
  // In production, this points to your deployed webapp
  // In development (debug mode), it uses localhost
  static String get _webappBaseUrl {
    if (kDebugMode) {
      // For development - update the IP if testing on a physical device
      // Use your computer's local IP address when testing on a real device
      return 'http://10.0.2.2:3000/app/'; // Android emulator
      // return 'http://localhost:3000/app/'; // iOS simulator
      // return 'http://192.168.1.X:3000/app/'; // Physical device (replace with your IP)
    }
    return 'https://loqmeapp.ir/app/';
  }

  // Payment gateway domains that should open in external browser
  static const List<String> _externalDomains = [
    'zarinpal.com',
    'zarinp.al',
    'payment.zarinpal.com',
  ];

  PackageInfo? _packageInfo;

  @override
  void initState() {
    super.initState();
    _initAnimations();
    // _loadPackageInfo(); // Moved to _initWebView to ensure it completes before injection
    _initWebView();
  }

  Future<void> _loadPackageInfo() async {
    _packageInfo = await PackageInfo.fromPlatform();
  }

  void _initAnimations() {
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeOutBack,
      ),
    );

    _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  bool _isExternalUrl(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return false;

    for (final domain in _externalDomains) {
      if (uri.host.contains(domain)) {
        return true;
      }
    }
    return false;
  }

  Future<void> _launchExternalUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _initWebView() async {
    try {
      // Load package info first to ensure it's available for bridge injection
      await _loadPackageInfo();

      // Determine market flavor
      String market = const String.fromEnvironment('FLUTTER_APP_FLAVOR');
      if (market.isEmpty) {
        if (_packageInfo?.packageName.contains('global') ?? false) {
          market = 'global';
        } else {
          market = 'iran';
        }
      }

      // Get the auth token from secure storage
      const storage = FlutterSecureStorage();
      final token = await storage.read(key: 'auth_token');

      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(Colors.white)
        ..setNavigationDelegate(
          NavigationDelegate(
            onProgress: (int progress) {
              if (kDebugMode) {
                print('WebView loading progress: $progress%');
              }
            },
            onPageStarted: (String url) {
              if (kDebugMode) {
                print('WebView page started: $url');
              }
              setState(() {
                _errorMessage = null;
              });

              // Inject API_BASE_URL early so the webapp uses correct server address
              _injectApiBaseUrl();
            },
            onPageFinished: (String url) {
              if (kDebugMode) {
                print('WebView page finished: $url');
              }

              // Inject the auth token into the webapp if available
              if (token != null) {
                _injectAuthToken(token);

                // Initialize FCM service to restore notifications
                _initFCM();
              }

              // Inject Flutter bridge for native features
              _injectFlutterBridge(market);

              // Delay hiding splash to ensure content is rendered
              Future.delayed(const Duration(milliseconds: 300), () {
                if (mounted) {
                  setState(() {
                    _isLoading = false;
                  });
                }
              });
            },
            onWebResourceError: (WebResourceError error) {
              if (kDebugMode) {
                print('WebView error: ${error.description}');
              }
              // Only show error for main frame errors
              if (error.isForMainFrame ?? true) {
                setState(() {
                  _isLoading = false;
                  _errorMessage = 'Failed to load: ${error.description}';
                });
              }
            },
            onNavigationRequest: (NavigationRequest request) {
              if (kDebugMode) {
                print('Navigation request: ${request.url}');
              }

              // Check if this is an external payment URL
              if (_isExternalUrl(request.url)) {
                _launchExternalUrl(request.url);
                return NavigationDecision.prevent;
              }

              // Handle tel: and mailto: links
              final uri = Uri.tryParse(request.url);
              if (uri != null) {
                if (uri.scheme == 'tel' || uri.scheme == 'mailto') {
                  launchUrl(uri);
                  return NavigationDecision.prevent;
                }
              }

              return NavigationDecision.navigate;
            },
          ),
        )
        ..setUserAgent('Loqme Flutter WebView')
        ..addJavaScriptChannel(
          'FlutterPayment',
          onMessageReceived: (JavaScriptMessage message) async {
            _handlePaymentMessage(message.message);
          },
        );

      // Enable file selection on Android (for camera/gallery)
      if (Platform.isAndroid) {
        final androidController =
            _controller.platform as AndroidWebViewController;
        await androidController.setMediaPlaybackRequiresUserGesture(false);

        // Fix resolution issues for crisp text rendering
        await androidController.setTextZoom(100); // Prevent system font scaling
        await androidController.setUseWideViewPort(
            true); // Respect viewport meta tag for proper DPI

        // Handle file uploads on Android
        await androidController.setOnShowFileSelector((params) async {
          if (kDebugMode) {
            print('File selector opened:');
            print('  Accept types: ${params.acceptTypes}');
            print('  Mode: ${params.mode}');
            print('  Is capture enabled: ${params.isCaptureEnabled}');
          }

          final ImagePicker picker = ImagePicker();
          XFile? image;

          try {
            // Check if this is a camera capture request using isCaptureEnabled
            // This is true when the HTML input has capture="environment" or capture="user"
            if (params.isCaptureEnabled) {
              // Camera capture requested - open camera directly
              if (kDebugMode) {
                print('Opening camera (isCaptureEnabled=true)');
              }
              image = await picker.pickImage(
                source: ImageSource.camera,
                imageQuality: 85,
              );
            } else if (params.mode == FileSelectorMode.openMultiple) {
              // Multiple selection = gallery with multi-select
              if (kDebugMode) {
                print('Opening gallery with multi-select');
              }
              final images = await picker.pickMultiImage(imageQuality: 85);
              if (images.isNotEmpty) {
                return images
                    .map((img) => Uri.file(img.path).toString())
                    .toList();
              }
              return [];
            } else {
              // Single file selection without capture = gallery
              if (kDebugMode) {
                print('Opening gallery (single select)');
              }
              image = await picker.pickImage(
                source: ImageSource.gallery,
                imageQuality: 85,
              );
            }
          } catch (e) {
            if (kDebugMode) {
              print('Error picking image: $e');
            }
            return [];
          }

          if (image != null) {
            return [Uri.file(image.path).toString()];
          }

          return [];
        });
      }

      // Build the URL with the token and market as query parameters
      final uri = Uri.parse(_webappBaseUrl);
      final queryParams = Map<String, String>.from(uri.queryParameters);
      if (token != null) {
        queryParams['token'] = token;
      }
      queryParams['market'] = market;

      final webappUrl = uri.replace(queryParameters: queryParams).toString();

      await _controller.loadRequest(Uri.parse(webappUrl));

      setState(() {
        _isControllerReady = true;
      });
    } catch (e) {
      if (kDebugMode) {
        print('Error initializing WebView: $e');
      }
      setState(() {
        _isLoading = false;
        _errorMessage = 'Error initializing: $e';
      });
    }
  }

  /// Injects the API base URL for the webapp to use
  Future<void> _injectApiBaseUrl() async {
    // In debug mode, use 10.0.2.2 for Android emulator to reach host machine
    final apiBaseUrl =
        kDebugMode ? 'http://10.0.2.2:9000' : 'https://loqmeapp.ir';

    try {
      await _controller.runJavaScript('''
        (function() {
          window.API_BASE_URL = '$apiBaseUrl';
          console.log('[Flutter] API_BASE_URL set to:', '$apiBaseUrl');
        })();
      ''');
    } catch (e) {
      if (kDebugMode) {
        print('Error injecting API base URL: $e');
      }
    }

    // Inject viewport enhancements for crisp rendering
    await _injectViewportEnhancements();
  }

  /// Injects viewport enhancements for high-resolution WebView rendering
  Future<void> _injectViewportEnhancements() async {
    try {
      await _controller.runJavaScript('''
        (function() {
          // Ensure viewport meta tag is set correctly for high-DPI displays
          var viewport = document.querySelector('meta[name="viewport"]');
          if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
          }
          viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
          
          // Set CSS variable for device pixel ratio if needed
          document.documentElement.style.setProperty('--device-pixel-ratio', window.devicePixelRatio);
          
          console.log('[Flutter] Viewport enhanced. DPR:', window.devicePixelRatio);
        })();
      ''');
    } catch (e) {
      if (kDebugMode) {
        print('Error injecting viewport enhancements: $e');
      }
    }
  }

  /// Injects the auth token into the webapp's localStorage
  Future<void> _injectAuthToken(String token) async {
    try {
      await _controller.runJavaScript('''
        (function() {
          try {
            localStorage.setItem('auth_token', '$token');
            localStorage.setItem('isLoggedIn', 'true');
            console.log('Auth token injected from Flutter');
          } catch (e) {
            console.error('Failed to inject auth token:', e);
          }
        })();
      ''');
    } catch (e) {
      if (kDebugMode) {
        print('Error injecting auth token: $e');
      }
    }
  }

  /// Injects a Flutter bridge for native features communication
  Future<void> _injectFlutterBridge(String market) async {
    try {
      final version = _packageInfo?.version ?? '1.0.0';
      final buildNumber = _packageInfo?.buildNumber ?? '1';
      final platform = Platform.isAndroid ? 'android' : 'ios';

      // Get device locale (e.g., 'en', 'fa', 'de', etc.)
      final deviceLocale = ui.PlatformDispatcher.instance.locale;
      final deviceLanguageCode =
          deviceLocale.languageCode; // e.g., 'en', 'fa', 'ar'

      await _controller.runJavaScript('''
        (function() {
          // Flutter bridge for native features
          window.FlutterBridge = {
            isFlutterWebView: true,
            version: '$version',
            buildNumber: '$buildNumber',
            platform: '$platform',
            market: '$market',
            deviceLocale: '$deviceLanguageCode',
            
            // Called when webapp needs to share content
            share: function(text, url) {
              console.log('FlutterBridge.share called:', text, url);
            },
            
            // Called when webapp needs haptic feedback
            haptic: function(type) {
              console.log('FlutterBridge.haptic called:', type);
            },
            
            // Called when webapp needs to purchase via CafeBazaar
            // productKey: the CafeBazaar product key for the plan
            // Returns a Promise that resolves with the result
            purchaseCafeBazaar: function(productKey) {
              console.log('FlutterBridge.purchaseCafeBazaar called:', productKey);
              return new Promise((resolve, reject) => {
                // Store callback in window for Flutter to call back
                window._cafebazaarCallback = { resolve, reject };
                // Send message to Flutter
                FlutterPayment.postMessage(JSON.stringify({
                  action: 'purchaseSubscription',
                  productKey: productKey
                }));
              });
            },
            
            // Called when user logs in successfully in WebApp
            setAuthToken: function(token) {
              console.log('FlutterBridge.setAuthToken called');
              FlutterPayment.postMessage(JSON.stringify({
                action: 'setAuthToken',
                token: token
              }));
            }
          };
          
          // Set device locale in webapp if not already set
          // Supported locales: 'en', 'fa'. Default to 'en' if not supported.
          var supportedLocales = ['en', 'fa'];
          var savedLocale = localStorage.getItem('app_locale');
          
          if (!savedLocale) {
            var deviceLang = '$deviceLanguageCode';
            var localeToSet = supportedLocales.includes(deviceLang) ? deviceLang : 'en';
            localStorage.setItem('app_locale', localeToSet);
            console.log('[Flutter] Device locale set to webapp:', localeToSet, '(device:', deviceLang, ')');
          } else {
            console.log('[Flutter] Locale already saved in webapp:', savedLocale);
          }
          
          console.log('FlutterBridge initialized with CafeBazaar payment support. Version: $version+$buildNumber, Market: $market, DeviceLocale: $deviceLanguageCode');
        })();
      ''');
    } catch (e) {
      if (kDebugMode) {
        print('Error injecting Flutter bridge: $e');
      }
    }
  }

  /// Handles payment messages from the webapp
  Future<void> _handlePaymentMessage(String message) async {
    if (kDebugMode) {
      print('Payment message received: $message');
    }

    try {
      final data = jsonDecode(message);
      final action = data['action'] as String?;
      final productKey = data['productKey'] as String?;

      if (kDebugMode) {
        print('Parsed action: $action, productKey: $productKey');
      }

      if (action == 'purchaseSubscription' && productKey != null) {
        // Get the payment service from Riverpod
        final paymentService = ref.read(paymentServiceProvider);

        if (kDebugMode) {
          print('Starting CafeBazaar purchase for: $productKey');
        }

        try {
          // Perform the CafeBazaar purchase with a timeout
          final result =
              await paymentService.purchaseSubscription(productKey).timeout(
            const Duration(
                seconds:
                    120), // 2 minutes timeout for user to complete purchase
            onTimeout: () {
              if (kDebugMode) {
                print('CafeBazaar purchase timed out');
              }
              return PurchaseResult(
                success: false,
                message: 'زمان پرداخت به پایان رسید. لطفاً دوباره تلاش کنید.',
              );
            },
          );

          if (kDebugMode) {
            print(
                'CafeBazaar purchase result: success=${result.success}, message=${result.message}');
          }

          // Send result back to webapp
          await _sendPaymentResult(
              result.success, result.message, result.orderId);
        } catch (purchaseError) {
          if (kDebugMode) {
            print('CafeBazaar purchase error: $purchaseError');
          }

          // Check for common errors
          String errorMessage = 'خطا در پرداخت';
          if (purchaseError.toString().contains('not installed') ||
              purchaseError.toString().contains('unavailable')) {
            errorMessage = 'لطفاً اپلیکیشن کافه‌بازار را نصب کنید';
          } else if (purchaseError.toString().contains('cancelled') ||
              purchaseError.toString().contains('canceled')) {
            errorMessage = 'پرداخت لغو شد';
          }

          await _sendPaymentResult(false, errorMessage, null);
        }
      } else if (action == 'setAuthToken') {
        final token = data['token'] as String?;
        if (token != null) {
          if (kDebugMode) {
            print(
                'Received auth token from WebApp: ${token.substring(0, 10)}...');
          }

          // Save token to secure storage
          const storage = FlutterSecureStorage();
          await storage.write(key: 'auth_token', value: token);

          // Initialize FCM now that we have a token
          await _initFCM();
        }
      } else {
        if (kDebugMode) {
          print(
              'Invalid payment message: action=$action, productKey=$productKey');
        }
        await _sendPaymentResult(false, 'درخواست نامعتبر', null);
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error handling payment message: $e');
      }
      await _sendPaymentResult(false, 'خطا در پردازش درخواست پرداخت: $e', null);
    }
  }

  /// Sends payment result back to the webapp
  Future<void> _sendPaymentResult(
      bool success, String message, String? orderId) async {
    if (kDebugMode) {
      print(
          'Sending payment result to webapp: success=$success, message=$message, orderId=$orderId');
    }

    try {
      final resultJson = jsonEncode({
        'success': success,
        'message': message,
        'orderId': orderId,
      });

      if (kDebugMode) {
        print('Result JSON: $resultJson');
      }

      await _controller.runJavaScript('''
        (function() {
          console.log('Payment result received in webapp:', $resultJson);
          if (window._cafebazaarCallback) {
            var result = $resultJson;
            if (result.success) {
              window._cafebazaarCallback.resolve(result);
            } else {
              // Pass the message as an Error object
              var error = new Error(result.message);
              // Attach orderId if available (for debugging/tracking)
              if (result.orderId) error.orderId = result.orderId;
              window._cafebazaarCallback.reject(error);
            }
            delete window._cafebazaarCallback;
          } else {
            console.log('No _cafebazaarCallback found!');
          }
        })();
      ''');
    } catch (e) {
      if (kDebugMode) {
        print('Error sending payment result: $e');
      }
    }
  }

  /// Initializes FCM service for push notifications
  Future<void> _initFCM() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      await FCMService().initialize(apiService);
      if (kDebugMode) {
        print('FCM initialized from WebAppPage');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error initializing FCM in WebAppPage: $e');
      }
    }
  }

  Future<void> _refresh() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    _animationController.forward(from: 0);
    if (_isControllerReady) {
      await _controller.reload();
    } else {
      await _initWebView();
    }
  }

  Widget _buildSplashScreen() {
    return Container(
      color: Colors.white,
      child: Center(
        child: AnimatedBuilder(
          animation: _animationController,
          builder: (context, child) {
            return Opacity(
              opacity: _opacityAnimation.value,
              child: Transform.scale(
                scale: _scaleAnimation.value,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // App logo
                    Assets.imagesLoqmeLogoPNG.image(
                      width: 120,
                      height: 120,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildErrorScreen() {
    return Container(
      color: Colors.white,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App logo
            Assets.imagesLoqmeLogoPNG.image(
              width: 100,
              height: 100,
            ),
            const SizedBox(height: 32),
            const Icon(
              Icons.wifi_off_rounded,
              color: Colors.red,
              size: 48,
            ),
            const SizedBox(height: 16),
            const Text(
              'خطا در اتصال',
              style: TextStyle(
                color: Colors.black87,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'Vazir',
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                _errorMessage ?? 'لطفا اتصال اینترنت خود را بررسی کنید',
                style: const TextStyle(
                  color: Colors.black54,
                  fontSize: 14,
                  fontFamily: 'Vazir',
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _refresh,
              icon: const Icon(Icons.refresh),
              label: const Text(
                'تلاش مجدد',
                style: TextStyle(fontFamily: 'Vazir'),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4ADE80),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      // Handle back button to navigate back in WebView history
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;

        if (_isControllerReady) {
          final canGoBack = await _controller.canGoBack();
          if (canGoBack) {
            await _controller.goBack();
          } else {
            if (context.mounted) {
              Navigator.of(context).pop();
            }
          }
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Stack(
          children: [
            // WebView (always in the stack, but behind splash when loading)
            if (_isControllerReady)
              SafeArea(
                child: Platform.isAndroid
                    ? WebViewWidget.fromPlatformCreationParams(
                        params: AndroidWebViewWidgetCreationParams(
                          controller: _controller.platform,
                          displayWithHybridComposition: true,
                        ),
                      )
                    : WebViewWidget(controller: _controller),
              ),

            // Splash screen overlay while loading
            if (_isLoading && _errorMessage == null) _buildSplashScreen(),

            // Error screen
            if (_errorMessage != null) _buildErrorScreen(),
          ],
        ),
      ),
    );
  }
}
