import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/extensions/context.dart';
import 'package:cal_ai/features/tickets/data/models/ticket_model.dart';
import 'package:cal_ai/features/tickets/presentation/providers/ticket_provider.dart';

class CreateTicketPage extends HookConsumerWidget {
  const CreateTicketPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjectController = useTextEditingController();
    final messageController = useTextEditingController();
    final selectedCategory = useState(TicketCategory.general);
    final selectedPriority = useState(TicketPriority.medium);
    final formKey = useMemoized(() => GlobalKey<FormState>());

    final createTicketState = ref.watch(createTicketProvider);

    ref.listen<AsyncValue<TicketModel?>>(createTicketProvider, (prev, next) {
      next.whenOrNull(
        data: (ticket) {
          if (ticket != null) {
            context.showMessage(
              'tickets.ticket_created'.tr(),
              SnackBarType.success,
            );
            ref.read(createTicketProvider.notifier).reset();
            // Invalidate tickets list to refresh
            ref.invalidate(myTicketsProvider(null));
            // Navigate back
            context.pop();
          }
        },
        error: (error, _) {
          context.showMessage(
            'tickets.create_failed'.tr(args: [error.toString()]),
            SnackBarType.error,
          );
        },
      );
    });

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            // Modern Header
            Container(
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
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
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
                            'tickets.create_ticket'.tr(),
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'tickets.fill_form'.tr(),
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withOpacity(0.8),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Form content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [

                      // Subject field
                      Text(
                        'tickets.subject'.tr(),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: TextFormField(
                          controller: subjectController,
                          decoration: InputDecoration(
                            hintText: 'tickets.subject_hint'.tr(),
                            prefixIcon: const Icon(Icons.title_rounded),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide.none,
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide(color: Colors.grey.shade200),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(color: Colors.black, width: 2),
                            ),
                            errorBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(color: Colors.red),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'tickets.subject_required'.tr();
                            }
                            if (value.trim().length < 3) {
                              return 'tickets.subject_too_short'.tr();
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Category field
                      Text(
                        'tickets.category'.tr(),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: DropdownButtonFormField<TicketCategory>(
                          value: selectedCategory.value,
                          decoration: InputDecoration(
                            prefixIcon: const Icon(Icons.category_rounded),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide.none,
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide(color: Colors.grey.shade200),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(color: Colors.black, width: 2),
                            ),
                          ),
                          items: TicketCategory.values.map((category) {
                            return DropdownMenuItem(
                              value: category,
                              child: Text('tickets.category_${category.toServerString()}'.tr()),
                            );
                          }).toList(),
                          onChanged: (value) {
                            if (value != null) selectedCategory.value = value;
                          },
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Priority field
                      Text(
                        'tickets.priority'.tr(),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: DropdownButtonFormField<TicketPriority>(
                          value: selectedPriority.value,
                          decoration: InputDecoration(
                            prefixIcon: const Icon(Icons.flag_rounded),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide.none,
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide(color: Colors.grey.shade200),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(color: Colors.black, width: 2),
                            ),
                          ),
                          items: TicketPriority.values.map((priority) {
                            return DropdownMenuItem(
                              value: priority,
                              child: Text('tickets.priority_${priority.toServerString()}'.tr()),
                            );
                          }).toList(),
                          onChanged: (value) {
                            if (value != null) selectedPriority.value = value;
                          },
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Message field
                      Text(
                        'tickets.message'.tr(),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: TextFormField(
                          controller: messageController,
                          maxLines: 8,
                          decoration: InputDecoration(
                            hintText: 'tickets.message_hint'.tr(),
                            alignLabelWithHint: true,
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide.none,
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide(color: Colors.grey.shade200),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(color: Colors.black, width: 2),
                            ),
                            errorBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(color: Colors.red),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'tickets.message_required'.tr();
                            }
                            if (value.trim().length < 10) {
                              return 'tickets.message_too_short'.tr();
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Submit button
                      Container(
                        width: double.infinity,
                        height: 56,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Colors.black, Color(0xFF2D2D2D)],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 12,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: ElevatedButton(
                          onPressed: createTicketState.isLoading
                              ? null
                              : () async {
                                  if (formKey.currentState?.validate() ?? false) {
                                    await ref
                                        .read(createTicketProvider.notifier)
                                        .createTicket(
                                          subject: subjectController.text.trim(),
                                          message: messageController.text.trim(),
                                          category: selectedCategory.value,
                                          priority: selectedPriority.value,
                                        );
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            foregroundColor: Colors.white,
                            shadowColor: Colors.transparent,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: createTicketState.isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.send_rounded, size: 20),
                                    const SizedBox(width: 8),
                                    Text(
                                      'tickets.submit'.tr(),
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                      const SizedBox(height: 20),
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
}
