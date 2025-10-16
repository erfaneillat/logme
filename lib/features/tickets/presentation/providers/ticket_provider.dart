import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:cal_ai/services/api_service_provider.dart';
import 'package:cal_ai/features/tickets/data/services/ticket_service.dart';
import 'package:cal_ai/features/tickets/data/models/ticket_model.dart';

// Service provider
final ticketServiceProvider = Provider<TicketService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return TicketService(apiService);
});

// Provider for fetching user's tickets
final myTicketsProvider = FutureProvider.autoDispose
    .family<List<TicketModel>, TicketStatus?>((ref, status) async {
  final ticketService = ref.watch(ticketServiceProvider);
  return await ticketService.getMyTickets(status: status);
});

// Provider for fetching a specific ticket by ID
final ticketByIdProvider = FutureProvider.autoDispose
    .family<TicketModel?, String>((ref, ticketId) async {
  final ticketService = ref.watch(ticketServiceProvider);
  return await ticketService.getTicketById(ticketId);
});

// State notifier for creating tickets
class CreateTicketNotifier extends StateNotifier<AsyncValue<TicketModel?>> {
  CreateTicketNotifier(this._ticketService) : super(const AsyncValue.data(null));

  final TicketService _ticketService;

  Future<bool> createTicket({
    required String subject,
    required String message,
    required TicketCategory category,
    required TicketPriority priority,
  }) async {
    state = const AsyncValue.loading();
    try {
      final ticket = await _ticketService.createTicket(
        subject: subject,
        message: message,
        category: category,
        priority: priority,
      );
      state = AsyncValue.data(ticket);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  void reset() {
    state = const AsyncValue.data(null);
  }
}

final createTicketProvider =
    StateNotifierProvider.autoDispose<CreateTicketNotifier, AsyncValue<TicketModel?>>(
  (ref) {
    final ticketService = ref.watch(ticketServiceProvider);
    return CreateTicketNotifier(ticketService);
  },
);

// State notifier for adding messages to tickets
class AddMessageNotifier extends StateNotifier<AsyncValue<TicketModel?>> {
  AddMessageNotifier(this._ticketService) : super(const AsyncValue.data(null));

  final TicketService _ticketService;

  Future<bool> addMessage({
    required String ticketId,
    required String message,
  }) async {
    state = const AsyncValue.loading();
    try {
      final ticket = await _ticketService.addMessage(
        ticketId: ticketId,
        message: message,
      );
      state = AsyncValue.data(ticket);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  void reset() {
    state = const AsyncValue.data(null);
  }
}

final addMessageProvider =
    StateNotifierProvider.autoDispose<AddMessageNotifier, AsyncValue<TicketModel?>>(
  (ref) {
    final ticketService = ref.watch(ticketServiceProvider);
    return AddMessageNotifier(ticketService);
  },
);
