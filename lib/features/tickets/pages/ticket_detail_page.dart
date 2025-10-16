import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:shamsi_date/shamsi_date.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/extensions/context.dart';
import 'package:cal_ai/features/tickets/data/models/ticket_model.dart';
import 'package:cal_ai/features/tickets/presentation/providers/ticket_provider.dart';

class TicketDetailPage extends HookConsumerWidget {
  const TicketDetailPage({super.key, required this.ticketId});

  final String ticketId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticketAsync = ref.watch(ticketByIdProvider(ticketId));
    final messageController = useTextEditingController();
    final scrollController = useScrollController();

    final addMessageState = ref.watch(addMessageProvider);

    ref.listen<AsyncValue<TicketModel?>>(addMessageProvider, (prev, next) {
      next.whenOrNull(
        data: (ticket) {
          if (ticket != null) {
            context.showMessage(
              'tickets.message_sent'.tr(),
              SnackBarType.success,
            );
            messageController.clear();
            ref.read(addMessageProvider.notifier).reset();
            // Refresh the ticket
            ref.invalidate(ticketByIdProvider(ticketId));
            // Scroll to bottom
            Future.delayed(const Duration(milliseconds: 300), () {
              if (scrollController.hasClients) {
                scrollController.animateTo(
                  scrollController.position.maxScrollExtent,
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOut,
                );
              }
            });
          }
        },
        error: (error, _) {
          context.showMessage(
            'tickets.send_failed'.tr(args: [error.toString()]),
            SnackBarType.error,
          );
        },
      );
    });

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: ticketAsync.when(
        loading: () => SafeArea(
          child: Column(
            children: [
              _buildHeader(context, null),
              const Expanded(
                child: Center(child: CircularProgressIndicator(color: Colors.black)),
              ),
            ],
          ),
        ),
        error: (error, stack) => SafeArea(
          child: Column(
            children: [
              _buildHeader(context, null),
              Expanded(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.error_outline, size: 64, color: Colors.red),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'tickets.error_loading'.tr(),
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
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
        data: (ticket) {
          if (ticket == null) {
            return SafeArea(
              child: Column(
                children: [
                  _buildHeader(context, null),
                  Expanded(
                    child: Center(
                      child: Text(
                        'tickets.not_found'.tr(),
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          return SafeArea(
            child: Column(
              children: [
                // Modern Header
                _buildHeader(context, ticket),
                // Ticket info card
                Container(
                  margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.06),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              ticket.subject,
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                            ),
                          ),
                          _StatusBadge(status: ticket.status),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 12,
                        runSpacing: 8,
                        children: [
                          _PriorityBadge(priority: ticket.priority),
                          _CategoryChip(category: ticket.category),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.calendar_today_rounded,
                                    size: 14, color: Colors.grey.shade700),
                                const SizedBox(width: 6),
                                Text(
                                  (() {
                                    final j = Jalali.fromDateTime(ticket.createdAt);
                                    final f = j.formatter;
                                    return '${f.mN} ${f.d}, ${f.yyyy}';
                                  })(),
                                  style: TextStyle(
                                    color: Colors.grey.shade700,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Messages list
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    padding: const EdgeInsets.all(20),
                    itemCount: ticket.messages.length,
                    itemBuilder: (context, index) {
                      final message = ticket.messages[index];
                      return _MessageBubble(message: message);
                    },
                  ),
                ),

                // Message input
                if (ticket.status != TicketStatus.closed)
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 16,
                          offset: const Offset(0, -4),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                    child: SafeArea(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: TextField(
                                controller: messageController,
                                maxLines: null,
                                maxLength: 500,
                                decoration: InputDecoration(
                                  hintText: 'tickets.type_message'.tr(),
                                  filled: true,
                                  fillColor: Colors.transparent,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(24),
                                    borderSide: BorderSide.none,
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                    vertical: 14,
                                  ),
                                  counterText: '',
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Colors.black, Color(0xFF2D2D2D)],
                              ),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.2),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: IconButton(
                              onPressed: addMessageState.isLoading
                                  ? null
                                  : () async {
                                      final text = messageController.text.trim();
                                      if (text.isNotEmpty) {
                                        await ref
                                            .read(addMessageProvider.notifier)
                                            .addMessage(
                                              ticketId: ticketId,
                                              message: text,
                                            );
                                      }
                                    },
                              icon: addMessageState.isLoading
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                      ),
                                    )
                                  : const Icon(Icons.send_rounded, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context, TicketModel? ticket) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.black, Color(0xFF2D2D2D)],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Row(
          children: [
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.black),
                onPressed: () => context.pop(),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'tickets.ticket_details'.tr(),
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  if (ticket != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      '#${ticket.id.substring(0, 8)}',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white.withOpacity(0.7),
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final TicketStatus status;

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case TicketStatus.open:
        color = Colors.blue;
        break;
      case TicketStatus.inProgress:
        color = Colors.orange;
        break;
      case TicketStatus.resolved:
        color = Colors.green;
        break;
      case TicketStatus.closed:
        color = Colors.grey;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withOpacity(0.15), color.withOpacity(0.08)],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3), width: 1.5),
      ),
      child: Text(
        'tickets.status_${status.toServerString()}'.tr(),
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _PriorityBadge extends StatelessWidget {
  const _PriorityBadge({required this.priority});

  final TicketPriority priority;

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (priority) {
      case TicketPriority.low:
        color = Colors.grey;
        break;
      case TicketPriority.medium:
        color = Colors.blue;
        break;
      case TicketPriority.high:
        color = Colors.orange;
        break;
      case TicketPriority.urgent:
        color = Colors.red;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.flag_rounded, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            'tickets.priority_${priority.toServerString()}'.tr(),
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.category});

  final TicketCategory category;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.category_rounded, size: 14, color: Colors.grey.shade700),
          const SizedBox(width: 4),
          Text(
            'tickets.category_${category.toServerString()}'.tr(),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade700,
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final TicketMessage message;

  @override
  Widget build(BuildContext context) {
    final isAdmin = message.senderRole == 'admin';

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        mainAxisAlignment:
            isAdmin ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isAdmin) ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.purple.shade100, Colors.purple.shade50],
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.support_agent,
                  size: 20, color: Colors.purple.shade700),
            ),
            const SizedBox(width: 12),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isAdmin ? CrossAxisAlignment.start : CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isAdmin ? Colors.white : Colors.black,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20),
                      topRight: const Radius.circular(20),
                      bottomLeft: Radius.circular(isAdmin ? 4 : 20),
                      bottomRight: Radius.circular(isAdmin ? 20 : 4),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(isAdmin ? 0.06 : 0.15),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (isAdmin)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Text(
                            message.senderName,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.purple.shade700,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      Text(
                        message.message,
                        style: TextStyle(
                          color: isAdmin ? Colors.black87 : Colors.white,
                          height: 1.4,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.access_time_rounded,
                        size: 12, color: Colors.grey.shade500),
                    const SizedBox(width: 4),
                    Text(
                      (() {
                        final j = Jalali.fromDateTime(message.createdAt);
                        final f = j.formatter;
                        final h = message.createdAt.hour.toString().padLeft(2, '0');
                        final mm = message.createdAt.minute.toString().padLeft(2, '0');
                        return '${f.mN} ${f.d}, $h:$mm';
                      })(),
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade600,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (!isAdmin) ...[
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.grey.shade200, Colors.grey.shade100],
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.person, size: 20, color: Colors.grey.shade700),
            ),
          ],
        ],
      ),
    );
  }
}
