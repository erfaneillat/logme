import 'package:cal_ai/services/api_service.dart';
import 'package:cal_ai/features/tickets/data/models/ticket_model.dart';

class TicketService {
  final ApiService _apiService;

  TicketService(this._apiService);

  /// Create a new ticket
  Future<TicketModel> createTicket({
    required String subject,
    required String message,
    TicketCategory category = TicketCategory.general,
    TicketPriority priority = TicketPriority.medium,
  }) async {
    try {
      final response = await _apiService.post('/api/tickets', data: {
        'subject': subject,
        'message': message,
        'category': category.toServerString(),
        'priority': priority.toServerString(),
      });

      if (response['success'] == true && response['data'] != null) {
        return TicketModel.fromJson(
            response['data']['ticket'] as Map<String, dynamic>);
      }

      throw Exception(response['message'] ?? 'Failed to create ticket');
    } catch (e) {
      print('Error creating ticket: $e');
      rethrow;
    }
  }

  /// Get user's tickets
  Future<List<TicketModel>> getMyTickets({
    int page = 1,
    int limit = 20,
    TicketStatus? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (status != null) {
        queryParams['status'] = status.toServerString();
      }

      final response = await _apiService.get(
        '/api/tickets/my-tickets',
        queryParameters: queryParams,
      );

      if (response['success'] == true && response['data'] != null) {
        final ticketsData = response['data']['items'] as List<dynamic>;
        return ticketsData
            .map((json) => TicketModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching tickets: $e');
      return [];
    }
  }

  /// Get ticket by ID
  Future<TicketModel?> getTicketById(String ticketId) async {
    try {
      final response = await _apiService.get('/api/tickets/$ticketId');

      if (response['success'] == true && response['data'] != null) {
        return TicketModel.fromJson(
            response['data']['ticket'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      print('Error fetching ticket: $e');
      return null;
    }
  }

  /// Add a message to a ticket
  Future<TicketModel> addMessage({
    required String ticketId,
    required String message,
  }) async {
    try {
      final response = await _apiService.post(
        '/api/tickets/$ticketId/messages',
        data: {'message': message},
      );

      if (response['success'] == true && response['data'] != null) {
        return TicketModel.fromJson(
            response['data']['ticket'] as Map<String, dynamic>);
      }

      throw Exception(response['message'] ?? 'Failed to send message');
    } catch (e) {
      print('Error adding message: $e');
      rethrow;
    }
  }
}
