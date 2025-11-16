import 'dart:io';

import 'package:cal_ai/extensions/context.dart';
import 'package:cal_ai/services/chat_service.dart';
import 'package:cal_ai/services/image_picker_service.dart';
import 'package:cal_ai/common/widgets/styled_chat_message.dart';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' as tr;
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shamsi_date/shamsi_date.dart';
import 'package:go_router/go_router.dart';
import '../data/models/chat_message.dart';
import '../presentation/providers/chat_provider.dart';

// Coach data model
class Coach {
  final String name;
  final String specialty;
  final String avatarEmoji;

  const Coach({
    required this.name,
    required this.specialty,
    required this.avatarEmoji,
  });

  static const Coach defaultCoach = Coach(
    name: 'Coach Ali',
    specialty: 'متخصص تغذیه',
    avatarEmoji: '👨‍⚕️',
  );
}

class ChatPage extends HookConsumerWidget {
  const ChatPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatState = ref.watch(chatProvider);
    final chatNotifier = ref.read(chatProvider.notifier);
    final messageController = useTextEditingController();
    final scrollController = useScrollController();
    final focusNode = useFocusNode();
    final attachedImage = useState<XFile?>(null);

    // Handle daily message limit error and navigate to subscription
    useEffect(() {
      print('DEBUG: useEffect triggered, chatState.error = ${chatState.error}');
      if (chatState.error == 'DAILY_MESSAGE_LIMIT_REACHED') {
        print(
            'DEBUG: Daily limit error detected in useEffect, showing snackbar and navigating');
        // Show a snackbar message
        WidgetsBinding.instance.addPostFrameCallback((_) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('home.chat_daily_limit_reached'.tr()),
              duration: const Duration(seconds: 3),
            ),
          );
          // Navigate to subscription page after showing message
          Future.delayed(const Duration(milliseconds: 500), () {
            if (context.mounted) {
              print('DEBUG: Navigating to subscription page');
              context.pushNamed('subscription');
            }
          });
        });
      }
      return null;
    }, [chatState.error]);

    // Lazy-load older messages when scrolling near the top (maxScrollExtent)
    useEffect(() {
      void onScroll() {
        if (!scrollController.hasClients) return;
        final position = scrollController.position;
        const threshold = 80.0;
        // With reverse: true, older messages are at maxScrollExtent (top of viewport)
        if (position.maxScrollExtent - position.pixels <= threshold &&
            chatState.hasMore &&
            !chatState.isHistoryLoading) {
          chatNotifier.loadMoreHistory();
        }
      }

      scrollController.addListener(onScroll);
      return () {
        scrollController.removeListener(onScroll);
      };
    }, [
      scrollController,
      chatState.hasMore,
      chatState.isHistoryLoading,
      chatNotifier
    ]);

    return Scaffold(
      backgroundColor: context.theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Modern Header
            _buildHeader(context),

            // Messages list
            Expanded(
              child: Directionality(
                textDirection: TextDirection.rtl,
                child: chatState.messages.isEmpty
                    ? _buildEmptyState(context)
                    : ListView.builder(
                        controller: scrollController,
                        reverse: true,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        physics: const BouncingScrollPhysics(),
                        keyboardDismissBehavior:
                            ScrollViewKeyboardDismissBehavior.manual,
                        itemCount: chatState.messages.length +
                            (chatState.isLoading ? 1 : 0) +
                            (chatState.isHistoryLoading && chatState.hasMore
                                ? 1
                                : 0),
                        itemBuilder: (context, index) {
                          final messages = chatState.messages;
                          final hasTyping = chatState.isLoading;
                          final hasHistoryLoader =
                              chatState.isHistoryLoading && chatState.hasMore;
                          final messageCount = messages.length;
                          final totalCount = messageCount +
                              (hasTyping ? 1 : 0) +
                              (hasHistoryLoader ? 1 : 0);

                          if (index >= totalCount) {
                            return const SizedBox.shrink();
                          }

                          // Typing indicator at index 0 (bottom of viewport)
                          if (hasTyping && index == 0) {
                            return const _TypingBubble();
                          }

                          // History loader at last index (top of viewport)
                          if (hasHistoryLoader && index == totalCount - 1) {
                            return const _HistoryLoadingIndicator();
                          }

                          // Calculate message index (reverse display order)
                          final messageStartIndex = hasTyping ? 1 : 0;
                          final messageEndIndex =
                              totalCount - (hasHistoryLoader ? 1 : 0);

                          if (index < messageStartIndex ||
                              index >= messageEndIndex) {
                            return const SizedBox.shrink();
                          }

                          final displayIndex = index - messageStartIndex;
                          final messageIndex = messageCount - 1 - displayIndex;
                          final message = messages[messageIndex];

                          // Show date divider for the first message of each day (chronologically)
                          final bool showDateDivider;
                          if (messageIndex == 0) {
                            // Oldest message always shows a date divider
                            showDateDivider = true;
                          } else {
                            final previousMessage = messages[messageIndex - 1];
                            showDateDivider = !_isSameDay(
                              previousMessage.createdAt,
                              message.createdAt,
                            );
                          }

                          return Column(
                            children: [
                              if (showDateDivider)
                                _DateDivider(date: message.createdAt),
                              _MessageBubble(message: message),
                            ],
                          );
                        },
                      ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
              child: _QuickReplySection(
                isLoading: chatState.isLoading,
                onQuickReplyTap: (value) {
                  if (chatState.isLoading) {
                    return;
                  }

                  ref.read(chatProvider.notifier).sendMessage(value);
                },
              ),
            ),

            // Message input
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
                border: Border(
                  top: BorderSide(color: Colors.grey.shade100, width: 1),
                ),
              ),
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
              child: SafeArea(
                top: false,
                child: Directionality(
                  textDirection: TextDirection.rtl,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Attach / camera button
                      GestureDetector(
                        onTap: () {
                          FocusScope.of(context).unfocus();
                          _showImageSourceSheet(context, ref, attachedImage);
                        },
                        child: Icon(
                          Icons.camera_alt_outlined,
                          size: 24,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Message input
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (attachedImage.value != null)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Stack(
                                        children: [
                                          ClipRRect(
                                            borderRadius:
                                                BorderRadius.circular(12),
                                            child: Image.file(
                                              File(attachedImage.value!.path),
                                              width: 60,
                                              height: 60,
                                              fit: BoxFit.cover,
                                            ),
                                          ),
                                          Positioned(
                                            top: 0,
                                            left: 0,
                                            child: GestureDetector(
                                              onTap: () {
                                                attachedImage.value = null;
                                              },
                                              child: Container(
                                                padding:
                                                    const EdgeInsets.all(4),
                                                decoration: BoxDecoration(
                                                  color: Colors.black
                                                      .withOpacity(0.6),
                                                  shape: BoxShape.circle,
                                                ),
                                                child: const Icon(
                                                  Icons.close,
                                                  size: 14,
                                                  color: Colors.white,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              TextField(
                                controller: messageController,
                                focusNode: focusNode,
                                maxLines: null,
                                minLines: 1,
                                maxLength: 500,
                                textInputAction: TextInputAction.send,
                                onSubmitted: (text) async {
                                  final trimmed = text.trim();
                                  if (trimmed.isEmpty || chatState.isLoading) {
                                    return;
                                  }

                                  String? imageUrl;
                                  final file = attachedImage.value;
                                  if (file != null) {
                                    try {
                                      final chatService =
                                          ref.read(chatServiceProvider);
                                      imageUrl =
                                          await chatService.uploadChatImage(
                                        filePath: file.path,
                                        fileName: file.name,
                                      );
                                    } catch (_) {
                                      // Ignore upload error for now; send text-only
                                    }
                                  }

                                  // Clear input immediately so user sees it as sent
                                  messageController.clear();
                                  attachedImage.value = null;

                                  await ref
                                      .read(chatProvider.notifier)
                                      .sendMessage(trimmed, imageUrl: imageUrl);
                                },
                                decoration: InputDecoration(
                                  isDense: true,
                                  hintText: 'home.type_message'.tr(),
                                  hintStyle: const TextStyle(
                                    color: Color(0xFF9ca3af),
                                    fontSize: 15,
                                  ),
                                  border: InputBorder.none,
                                  contentPadding: EdgeInsets.zero,
                                  counterText: '',
                                ),
                                style: const TextStyle(
                                  fontSize: 15,
                                  color: Color(0xFF1f2937),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Voice/Send button
                      GestureDetector(
                        onTap: chatState.isLoading
                            ? null
                            : () async {
                                final text = messageController.text.trim();
                                if (text.isEmpty) {
                                  return;
                                }

                                String? imageUrl;
                                final file = attachedImage.value;
                                if (file != null) {
                                  try {
                                    final chatService =
                                        ref.read(chatServiceProvider);
                                    imageUrl =
                                        await chatService.uploadChatImage(
                                      filePath: file.path,
                                      fileName: file.name,
                                    );
                                  } catch (_) {
                                    // Ignore upload error for now; send text-only
                                  }
                                }

                                // Clear input immediately so user sees it as sent
                                messageController.clear();
                                attachedImage.value = null;
                                focusNode.unfocus();

                                await ref
                                    .read(chatProvider.notifier)
                                    .sendMessage(text, imageUrl: imageUrl);
                              },
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: chatState.isLoading
                                ? Colors.grey.shade400
                                : Colors.black,
                            shape: BoxShape.circle,
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.send,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
        date1.month == date2.month &&
        date1.day == date2.day;
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200, width: 1),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Row(
        children: [
          // Back button
          GestureDetector(
            onTap: () {
              FocusScope.of(context).unfocus();
              Navigator.of(context).maybePop();
            },
            child: Container(
              padding: const EdgeInsets.all(4),
              child: Icon(
                Icons.arrow_back,
                size: 24,
                color: Colors.grey.shade700,
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Avatar with online badge
          Stack(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                ),
                clipBehavior: Clip.antiAlias,
                child: Image.asset(
                  'assets/images/dorsa.png',
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                bottom: 2,
                right: 2,
                child: Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: const Color(0xFF16a34a),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),
          // User info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'home.chat_coach_name'.tr(),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF000000),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'home.chat_coach_title'.tr(),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    const coach = Coach.defaultCoach;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [Color(0xFF000000), Color(0xFF3f3f46)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x33000000),
                    blurRadius: 20,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  coach.avatarEmoji,
                  style: const TextStyle(fontSize: 50),
                ),
              ),
            ),
            const SizedBox(height: 28),
            Text(
              'home.chat_coach_name'.tr(),
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF000000),
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'home.chat_coach_title'.tr(),
                style: const TextStyle(
                  color: Color(0xFF3f3f46),
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'home.chat_welcome'.tr(),
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: const Color(0xFF6b7280),
                    height: 1.6,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showImageSourceSheet(
    BuildContext context,
    WidgetRef ref,
    ValueNotifier<XFile?> attachedImage,
  ) async {
    final parentContext = context;

    await showModalBottomSheet(
      context: parentContext,
      isScrollControlled: false,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(16),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade400,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: _ImageSourceOptionCard(
                          icon: Icons.camera_alt,
                          title: 'home.camera'.tr(),
                          subtitle: 'home.camera_desc'.tr(),
                          color: const Color(0xFF4CAF50),
                          onTap: () async {
                            Navigator.of(sheetContext).pop();
                            final picker = ref.read(imagePickerServiceProvider);
                            final file = await picker.pickImage(
                              source: ImageSource.camera,
                              imageQuality: 90,
                            );
                            if (file != null) {
                              attachedImage.value = file;
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _ImageSourceOptionCard(
                          icon: Icons.photo_library,
                          title: 'home.gallery'.tr(),
                          subtitle: 'home.gallery_desc'.tr(),
                          color: const Color(0xFF2196F3),
                          onTap: () async {
                            Navigator.of(sheetContext).pop();
                            final picker = ref.read(imagePickerServiceProvider);
                            final file = await picker.pickImage(
                              source: ImageSource.gallery,
                              imageQuality: 90,
                            );
                            if (file != null) {
                              attachedImage.value = file;
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _ImageSourceOptionCard extends StatelessWidget {
  const _ImageSourceOptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.grey.shade200,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: color,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.black54,
                          fontSize: 9,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickReplySection extends StatelessWidget {
  const _QuickReplySection({
    required this.isLoading,
    required this.onQuickReplyTap,
  });

  final bool isLoading;
  final void Function(String) onQuickReplyTap;

  @override
  Widget build(BuildContext context) {
    final replyKeys = [
      'home.chat_quick_replies.general_food_1',
      'home.chat_quick_replies.general_food_2',
      'home.chat_quick_replies.general_food_3',
      'home.chat_quick_replies.general_food_4',
      'home.chat_quick_replies.general_food_5',
      'home.chat_quick_replies.remaining_calories_1',
      'home.chat_quick_replies.remaining_calories_2',
      'home.chat_quick_replies.remaining_calories_3',
      'home.chat_quick_replies.remaining_calories_4',
      'home.chat_quick_replies.weekly_plan_1',
      'home.chat_quick_replies.weekly_plan_2',
      'home.chat_quick_replies.weekly_plan_3',
      'home.chat_quick_replies.weekly_plan_4',
      'home.chat_quick_replies.weekly_by_goal_1',
      'home.chat_quick_replies.weekly_by_goal_2',
      'home.chat_quick_replies.weekly_by_goal_3',
      'home.chat_quick_replies.shopping_1',
      'home.chat_quick_replies.shopping_2',
      'home.chat_quick_replies.shopping_3',
      'home.chat_quick_replies.shopping_4',
      'home.chat_quick_replies.food_to_shopping_1',
      'home.chat_quick_replies.food_to_shopping_2',
      'home.chat_quick_replies.food_to_shopping_3',
      'home.chat_quick_replies.food_to_shopping_4',
    ];

    final replies = replyKeys.map((key) => key.tr()).toList();

    final middleIndex = (replies.length / 2).ceil();
    final firstRow = replies.sublist(0, middleIndex);
    final secondRow = replies.sublist(middleIndex);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _QuickReplyRow(
          labels: firstRow,
          isLoading: isLoading,
          onQuickReplyTap: onQuickReplyTap,
        ),
        const SizedBox(height: 4),
        _QuickReplyRow(
          labels: secondRow,
          isLoading: isLoading,
          onQuickReplyTap: onQuickReplyTap,
        ),
      ],
    );
  }
}

class _QuickReplyRow extends StatelessWidget {
  const _QuickReplyRow({
    required this.labels,
    required this.isLoading,
    required this.onQuickReplyTap,
  });

  final List<String> labels;
  final bool isLoading;
  final void Function(String) onQuickReplyTap;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final label in labels)
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 6),
              child: _QuickReplyChip(
                label: label,
                isDisabled: isLoading,
                onTap: () => onQuickReplyTap(label),
              ),
            ),
        ],
      ),
    );
  }
}

class _QuickReplyChip extends StatelessWidget {
  const _QuickReplyChip({
    required this.label,
    required this.isDisabled,
    required this.onTap,
  });

  final String label;
  final bool isDisabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: isDisabled ? 0.6 : 1,
      child: InkWell(
        onTap: isDisabled ? null : onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.grey.shade300,
              width: 1,
            ),
          ),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF111827),
            ),
          ),
        ),
      ),
    );
  }
}

class _HistoryLoadingIndicator extends StatelessWidget {
  const _HistoryLoadingIndicator();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: const CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    );
  }
}

class _TypingBubble extends StatefulWidget {
  const _TypingBubble();

  @override
  State<_TypingBubble> createState() => _TypingBubbleState();
}

class _TypingBubbleState extends State<_TypingBubble>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        textDirection: TextDirection.ltr,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
            ),
            clipBehavior: Clip.antiAlias,
            child: Image.asset(
              'assets/images/dorsa.png',
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: context.width * 0.6,
              ),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18).copyWith(
                    bottomLeft: const Radius.circular(4),
                  ),
                  border: Border.all(
                    color: Colors.grey.shade200,
                    width: 1,
                  ),
                ),
                child: AnimatedBuilder(
                  animation: _controller,
                  builder: (context, child) {
                    final value = _controller.value;

                    double opacityFor(int index) {
                      final t = (value + index * 0.2) % 1.0;
                      if (t < 0.3) return 0.3;
                      if (t < 0.6) return 0.6;
                      return 1.0;
                    }

                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(3, (i) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          child: Opacity(
                            opacity: opacityFor(i),
                            child: const CircleAvatar(
                              radius: 3,
                              backgroundColor: Color(0xFF9CA3AF),
                            ),
                          ),
                        );
                      }),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final isUser = message.isFromUser;
    final bubbleColor = isUser ? context.colorScheme.primary : Colors.white;
    final textColor = isUser ? Colors.white : const Color(0xFF111827);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        textDirection: TextDirection.ltr,
        children: [
          if (!isUser) ...[
            Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
              ),
              clipBehavior: Clip.antiAlias,
              child: Image.asset(
                'assets/images/dorsa.png',
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: context.width * 0.8,
              ),
              child: Column(
                crossAxisAlignment:
                    isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: bubbleColor,
                      borderRadius: BorderRadius.circular(18).copyWith(
                        bottomLeft: Radius.circular(isUser ? 18 : 4),
                        bottomRight: Radius.circular(isUser ? 4 : 18),
                      ),
                      border: isUser
                          ? null
                          : Border.all(
                              color: Colors.grey.shade200,
                              width: 1,
                            ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Flexible(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (message.imageUrl != null &&
                                  message.imageUrl!.isNotEmpty) ...[
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.network(
                                    message.imageUrl!,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                const SizedBox(height: 6),
                              ],
                              if (message.message.isNotEmpty) ...[
                                StyledChatMessage(
                                  text: message.message,
                                  textColor: textColor,
                                  isUser: isUser,
                                ),
                                const SizedBox(height: 4),
                              ],
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (isUser) ...[
                                    Icon(
                                      Icons.check,
                                      size: 14,
                                      color: Colors.white70,
                                    ),
                                    const SizedBox(width: 4),
                                  ],
                                  Text(
                                    _formatTime(message.createdAt),
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: isUser
                                          ? Colors.white70
                                          : const Color(0xFF9CA3AF),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDate = DateTime(dateTime.year, dateTime.month, dateTime.day);

    final h = dateTime.hour.toString().padLeft(2, '0');
    final mm = dateTime.minute.toString().padLeft(2, '0');

    if (messageDate == today) {
      return '$h:$mm';
    } else if (messageDate == today.subtract(const Duration(days: 1))) {
      return 'دیروز $h:$mm';
    } else {
      final j = Jalali.fromDateTime(dateTime);
      final f = j.formatter;
      return '${f.d} ${f.mN}';
    }
  }
}

class _DateDivider extends StatelessWidget {
  const _DateDivider({required this.date});

  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDate = DateTime(date.year, date.month, date.day);

    String dateText;
    if (messageDate == today) {
      dateText = 'امروز';
    } else if (messageDate == today.subtract(const Duration(days: 1))) {
      dateText = 'دیروز';
    } else {
      final j = Jalali.fromDateTime(date);
      final f = j.formatter;
      dateText = '${f.d} ${f.mN}';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.grey.shade200.withOpacity(0.8),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            dateText,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF6B7280),
            ),
          ),
        ),
      ),
    );
  }
}
