import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../data/models/chat_message.dart';
import '../../../../services/chat_service.dart';

class ChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final String? error;
  final bool isHistoryLoading;
  final bool hasMore;
  final String? nextCursor;
  final bool shouldScrollToBottom;

  ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.error,
    this.isHistoryLoading = false,
    this.hasMore = false,
    this.nextCursor,
    this.shouldScrollToBottom = false,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    String? error,
    bool? isHistoryLoading,
    bool? hasMore,
    String? nextCursor,
    bool? shouldScrollToBottom,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isHistoryLoading: isHistoryLoading ?? this.isHistoryLoading,
      hasMore: hasMore ?? this.hasMore,
      nextCursor: nextCursor ?? this.nextCursor,
      shouldScrollToBottom: shouldScrollToBottom ?? this.shouldScrollToBottom,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final ChatService _chatService;

  ChatNotifier(this._chatService) : super(ChatState()) {
    _loadInitialMessages();
  }

  Future<void> _loadInitialMessages() async {
    state = state.copyWith(
      isHistoryLoading: true,
      error: null,
    );

    try {
      final history = await _chatService.fetchNutritionHistory(limit: 30);
      final items = history.items
          .map((json) => ChatMessage.fromJson(json))
          .toList(growable: false);

      if (items.isEmpty) {
        state = state.copyWith(
          messages: [
            ChatMessage(
              message: 'home.chat_welcome'.tr(),
              isFromUser: false,
              createdAt: DateTime.now(),
            ),
          ],
          isHistoryLoading: false,
          hasMore: false,
          nextCursor: null,
          shouldScrollToBottom: true,
        );
      } else {
        state = state.copyWith(
          messages: items,
          isHistoryLoading: false,
          hasMore: history.hasMore,
          nextCursor: history.nextCursor,
          shouldScrollToBottom: true,
        );
      }
    } catch (e) {
      if (state.messages.isEmpty) {
        state = state.copyWith(
          messages: [
            ChatMessage(
              message: 'home.chat_welcome'.tr(),
              isFromUser: false,
              createdAt: DateTime.now(),
            ),
          ],
        );
      }

      state = state.copyWith(
        isHistoryLoading: false,
        error: e.toString(),
        shouldScrollToBottom: true,
      );
    }
  }

  Future<void> _streamFromFullText({
    required String full,
    required List<ChatMessage> baseMessages,
    required DateTime createdAt,
  }) async {
    final words = full.split(' ');
    var partial = '';

    for (final word in words) {
      if (word.isEmpty) {
        continue;
      }

      if (partial.isEmpty) {
        partial = word;
      } else {
        partial = '$partial $word';
      }

      final trainerResponse = ChatMessage(
        message: partial,
        isFromUser: false,
        createdAt: createdAt,
      );

      state = state.copyWith(
        messages: [...baseMessages, trainerResponse],
        isLoading: true,
        shouldScrollToBottom: true,
      );

      await Future.delayed(const Duration(milliseconds: 80));
    }
  }

  Future<void> sendMessage(String message, {String? imageUrl}) async {
    if (message.trim().isEmpty) return;

    final trimmed = message.trim();

    final userMessage = ChatMessage(
      message: trimmed,
      isFromUser: true,
      createdAt: DateTime.now(),
      imageUrl: imageUrl,
    );

    // Add user message immediately and mark AI as "typing"
    state = state.copyWith(
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
      shouldScrollToBottom: true,
    );

    try {
      final stream = await _chatService.streamNutritionMessage(
        message: trimmed,
        imageUrl: imageUrl,
      );
      await _streamAssistantReplyFromServer(stream);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> _streamAssistantReplyFromServer(
    Stream<Map<String, dynamic>> events,
  ) async {
    final baseMessages = [...state.messages];
    var partial = '';
    final createdAt = DateTime.now();
    var hasAnyToken = false;

    try {
      await for (final event in events) {
        if (event.isEmpty) {
          continue;
        }

        final token = event['token'] as String?;
        final done = event['done'] == true;

        if (token != null && token.isNotEmpty) {
          hasAnyToken = true;
          partial += token;

          final trainerResponse = ChatMessage(
            message: partial,
            isFromUser: false,
            createdAt: createdAt,
          );

          state = state.copyWith(
            messages: [...baseMessages, trainerResponse],
            isLoading: true,
            shouldScrollToBottom: true,
          );

          // Small delay so the user can visually perceive streaming
          await Future.delayed(const Duration(milliseconds: 35));
        }

        if (done) {
          // Fallback: if backend only sent a final full message without tokens,
          // simulate streaming from the full text so UI still animates.
          if (!hasAnyToken) {
            final full = (event['full'] as String?) ?? '';
            if (full.isNotEmpty) {
              await _streamFromFullText(
                full: full,
                baseMessages: baseMessages,
                createdAt: createdAt,
              );
            }
          }
          break;
        }
      }
    } finally {
      state = state.copyWith(
        isLoading: false,
        shouldScrollToBottom: true,
      );
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  Future<void> loadMoreHistory() async {
    if (state.isHistoryLoading || !state.hasMore) {
      return;
    }

    state = state.copyWith(
      isHistoryLoading: true,
      error: null,
    );

    try {
      final history = await _chatService.fetchNutritionHistory(
        before: state.nextCursor,
        limit: 30,
      );

      final olderItems = history.items
          .map((json) => ChatMessage.fromJson(json))
          .toList(growable: false);

      if (olderItems.isNotEmpty) {
        state = state.copyWith(
          messages: [...olderItems, ...state.messages],
          hasMore: history.hasMore,
          nextCursor: history.nextCursor,
        );
      }

      state = state.copyWith(
        isHistoryLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isHistoryLoading: false,
        error: e.toString(),
      );
    }
  }

  void markScrolledToBottom() {
    if (state.shouldScrollToBottom) {
      state = state.copyWith(shouldScrollToBottom: false);
    }
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  final chatService = ref.watch(chatServiceProvider);
  return ChatNotifier(chatService);
});
