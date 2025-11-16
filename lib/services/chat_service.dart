import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_service.dart';
import 'api_service_provider.dart';
import '../config/api_config.dart';

class NutritionChatHistoryResponse {
  final List<Map<String, dynamic>> items;
  final bool hasMore;
  final String? nextCursor;

  NutritionChatHistoryResponse({
    required this.items,
    required this.hasMore,
    required this.nextCursor,
  });
}

class ChatService {
  final ApiService _apiService;

  ChatService(this._apiService);

  Future<String> sendNutritionMessage({
    required String message,
    String? imageUrl,
  }) async {
    final data = <String, dynamic>{
      'message': message,
      if (imageUrl != null && imageUrl.isNotEmpty) 'imageUrl': imageUrl,
    };

    final response = await _apiService.post<Map<String, dynamic>>(
      ApiConfig.nutritionChat,
      data: data,
    );

    if (response['success'] == true) {
      final data = response['data'] as Map<String, dynamic>?;
      final reply = data != null ? data['reply'] as String? : null;
      if (reply != null && reply.isNotEmpty) {
        return reply;
      }
    }

    throw Exception(
        response['message'] ?? 'Failed to get nutrition chat response');
  }

  Future<String> uploadChatImage({
    required String filePath,
    required String fileName,
  }) async {
    final response = await _apiService.uploadFile<Map<String, dynamic>>(
      ApiConfig.nutritionChatImage,
      fileField: 'image',
      filePath: filePath,
      fileName: fileName,
    );

    if (response['success'] == true) {
      final data = response['data'] as Map<String, dynamic>?;
      final url = data != null ? data['imageUrl'] as String? : null;
      if (url != null && url.isNotEmpty) {
        return url;
      }
    }

    throw Exception(response['message'] ?? 'Failed to upload chat image');
  }

  /// Streaming nutrition chat using Server-Sent Events.
  /// Each SSE `data:` line is expected to be a JSON object, for example:
  /// {"token": "..."} or {"done": true, "full": "..."}
  Future<Stream<Map<String, dynamic>>> streamNutritionMessage({
    required String message,
    String? imageUrl,
  }) async {
    final data = <String, dynamic>{
      'message': message,
      'stream': true,
      if (imageUrl != null && imageUrl.isNotEmpty) 'imageUrl': imageUrl,
    };

    final lineStream = await _apiService.postSseDataLines(
      ApiConfig.nutritionChat,
      data: data,
      queryParameters: const {
        'stream': '1',
      },
    );

    return lineStream.map((line) {
      try {
        final decoded = jsonDecode(line);
        if (decoded is Map<String, dynamic>) {
          return decoded;
        }
      } catch (_) {
        // Ignore malformed JSON line and return empty map
      }
      return <String, dynamic>{};
    });
  }

  Future<NutritionChatHistoryResponse> fetchNutritionHistory({
    String? before,
    int limit = 20,
  }) async {
    final query = <String, dynamic>{
      'limit': limit.toString(),
      if (before != null) 'before': before,
    };

    final response = await _apiService.get<Map<String, dynamic>>(
      ApiConfig.nutritionChatHistory,
      queryParameters: query,
    );

    if (response['success'] == true) {
      final data = response['data'] as Map<String, dynamic>? ?? {};
      final rawItems = data['items'] as List<dynamic>? ?? const [];
      final items =
          rawItems.whereType<Map<String, dynamic>>().toList(growable: false);

      final pagination = data['pagination'] as Map<String, dynamic>? ?? {};
      final hasMore = pagination['hasMore'] == true;
      final nextCursor = pagination['nextCursor'] as String?;

      return NutritionChatHistoryResponse(
        items: items,
        hasMore: hasMore,
        nextCursor: nextCursor,
      );
    }

    throw Exception(
        response['message'] ?? 'Failed to load nutrition chat history');
  }
}

final chatServiceProvider = Provider<ChatService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return ChatService(apiService);
});
