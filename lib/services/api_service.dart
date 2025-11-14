import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../utils/error_handler.dart';

class ApiService {
  late final Dio _dio;
  final String baseUrl;
  final Future<String?> Function()? getToken;
  final Future<String> Function()? refreshToken;
  final Future<void> Function()? onLogout;
  Completer<String?>? _refreshCompleter;

  ApiService({
    required this.baseUrl,
    this.getToken,
    this.refreshToken,
    this.onLogout,
  }) {
    // Debug logging for connection troubleshooting
    if (kDebugMode) {
      print('🔗 ApiService initialized with baseUrl: $baseUrl');
      ApiConfig.debugConfig();
    }

    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        sendTimeout: ApiConfig.sendTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _setupInterceptors();
  }

  // Test connection method for debugging
  Future<bool> testConnection() async {
    try {
      if (kDebugMode) {
        print('🧪 Testing connection to: $baseUrl');
      }

      final response = await _dio.get('/');
      if (kDebugMode) {
        print('✅ Connection successful: ${response.statusCode}');
        print('📡 Response: ${response.data}');
      }
      return true;
    } catch (e) {
      if (kDebugMode) {
        print('❌ Connection failed: $e');
        if (e is DioException) {
          print('🔍 Dio Error Type: ${e.type}');
          print('🔍 Dio Error Message: ${e.message}');
          print('🔍 Dio Error Response: ${e.response?.statusCode}');
        }
      }
      return false;
    }
  }

  void _setupInterceptors() {
    // Pretty Logger interceptor for beautiful request/response logging
    if (kDebugMode && ApiConfig.enablePrettyLogging) {
      _dio.interceptors.add(
        PrettyDioLogger(
          requestHeader: true,
          requestBody: true,
          responseBody: true,
          responseHeader: false,
          error: true,
          compact: true,
          maxWidth: 90,
        ),
      );
    }

    // Request interceptor to add auth token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (getToken != null) {
            final token = await getToken!();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
      ),
    );

    // Error interceptor for global error handling and token refresh
    _dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) async {
          final statusCode = error.response?.statusCode;
          final responseData = error.response?.data;

          // Check if token is expired or invalid (403 with specific message)
          final isTokenExpired = _isTokenExpired(statusCode, responseData);
          final isAuthError = statusCode == 401;
          final isRefreshCall =
              error.requestOptions.path == ApiConfig.authRefreshToken;
          final alreadyRetried = error.requestOptions.extra['__ret'] == true;

          // Handle token expiration - logout immediately
          if (isTokenExpired) {
            if (onLogout != null) {
              await onLogout!();
            }
            final errorResponse = _handleError(error);
            return handler.reject(errorResponse);
          }

          // Handle 401 with token refresh attempt
          if (isAuthError &&
              !isRefreshCall &&
              !alreadyRetried &&
              refreshToken != null) {
            try {
              final newToken = await _performTokenRefresh();
              if (newToken != null) {
                final RequestOptions req = error.requestOptions;
                req.headers['Authorization'] = 'Bearer $newToken';
                req.extra['__ret'] = true;
                final response = await _dio.fetch(req);
                return handler.resolve(response);
              }
            } catch (_) {
              // Fall through to logout and original error handling
              if (onLogout != null) {
                await onLogout!();
              }
            }
          }

          final errorResponse = _handleError(error);
          handler.reject(errorResponse);
        },
      ),
    );
  }

  /// Checks if the error indicates token expiration
  bool _isTokenExpired(int? statusCode, dynamic responseData) {
    if (statusCode != 403) return false;

    // Check if response contains token expiration message
    if (responseData is Map<String, dynamic>) {
      final message = responseData['message']?.toString().toLowerCase() ?? '';
      return message.contains('expired token') ||
          message.contains('invalid token') ||
          message.contains('token expired');
    }

    return false;
  }

  Future<String?> _performTokenRefresh() async {
    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }
    if (refreshToken == null) return null;
    _refreshCompleter = Completer<String?>();
    try {
      final freshToken = await refreshToken!();
      _refreshCompleter!.complete(freshToken);
      return freshToken;
    } catch (e) {
      _refreshCompleter!.completeError(e);
      rethrow;
    } finally {
      _refreshCompleter = null;
    }
  }

  DioException _handleError(DioException error) {
    final errorMessage = ErrorHandler.getErrorMessage(error);
    return DioException(
      requestOptions: error.requestOptions,
      error: errorMessage,
      response: error.response,
      type: error.type,
    );
  }

  // Generic GET request
  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data as T;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Server-Sent Events (SSE) POST helper for streaming responses
  Future<Stream<String>> postSseDataLines(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      final mergedOptions = (options ?? Options()).copyWith(
        responseType: ResponseType.stream,
      );

      final response = await _dio.post<ResponseBody>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: mergedOptions,
        cancelToken: cancelToken,
      );

      final body = response.data;
      if (body == null) {
        return const Stream.empty();
      }

      final controller = StreamController<String>();
      var buffer = '';

      // Decode UTF-8 bytes into text and split into SSE lines
      utf8.decoder.bind(body.stream).listen(
        (chunk) {
          buffer += chunk;
          final lines = buffer.split('\n');
          buffer = lines.removeLast();

          for (final rawLine in lines) {
            final line = rawLine.trim();
            if (line.isEmpty || line.startsWith('event:')) {
              continue;
            }
            if (line.startsWith('data:')) {
              final dataPart = line.substring(5).trim();
              if (dataPart.isNotEmpty) {
                controller.add(dataPart);
              }
            }
          }
        },
        onError: (error) {
          if (!controller.isClosed) {
            controller.addError(error);
            controller.close();
          }
        },
        onDone: () {
          if (!controller.isClosed) {
            controller.close();
          }
        },
        cancelOnError: true,
      );

      return controller.stream;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Generic POST request
  Future<T> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data as T;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Generic PUT request
  Future<T> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data as T;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Generic DELETE request
  Future<T> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data as T;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Generic PATCH request
  Future<T> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.patch<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data as T;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Upload file
  Future<T> uploadFile<T>(
    String path, {
    required String fileField,
    required String filePath,
    String? fileName,
    Map<String, dynamic>? formData,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
  }) async {
    try {
      final formDataObj = FormData.fromMap({
        fileField: await MultipartFile.fromFile(filePath, filename: fileName),
        ...?formData,
      });

      final response = await _dio.post<T>(
        path,
        data: formDataObj,
        options: options,
        cancelToken: cancelToken,
        onSendProgress: onSendProgress,
      );
      return response.data as T;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Download file
  Future<void> downloadFile(
    String url,
    String savePath, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      await _dio.download(
        url,
        savePath,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onReceiveProgress: onReceiveProgress,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Cancel all requests
  void cancelAllRequests() {
    _dio.close();
  }
}

// API Response wrapper for consistent response handling
class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final Map<String, dynamic>? errors;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.errors,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : null,
      errors: json['errors'] != null
          ? Map<String, dynamic>.from(json['errors'])
          : null,
    );
  }

  factory ApiResponse.success({
    required T data,
    String message = 'Success',
  }) {
    return ApiResponse<T>(
      success: true,
      message: message,
      data: data,
    );
  }

  factory ApiResponse.error({
    required String message,
    Map<String, dynamic>? errors,
  }) {
    return ApiResponse<T>(
      success: false,
      message: message,
      errors: errors,
    );
  }
}
