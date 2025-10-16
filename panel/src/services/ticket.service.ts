import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { authService } from './auth.service';
import type { 
  Ticket, 
  PaginatedTickets, 
  TicketStatistics, 
  TicketStatus, 
  TicketPriority, 
  TicketCategory 
} from '../types/ticket';

class TicketService {
  private async fetchWithTimeout(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const token = authService.getToken();
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          ...options.headers,
        },
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  // Admin: List all tickets with filters
  async list(params: {
    page?: number;
    limit?: number;
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    userId?: string;
    search?: string;
    sort?: string;
  }): Promise<PaginatedTickets> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.category) query.set('category', params.category);
    if (params.userId) query.set('userId', params.userId);
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);

    const url = `${API_BASE_URL}/api/tickets/admin/list?${query.toString()}`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }

  // Get ticket by ID
  async getById(id: string): Promise<{ success: boolean; data?: { ticket: Ticket } }> {
    const url = `${API_BASE_URL}/api/tickets/${id}`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }

  // Add message to ticket
  async addMessage(
    id: string, 
    message: string
  ): Promise<{ success: boolean; message?: string; data?: { ticket: Ticket } }> {
    const url = `${API_BASE_URL}/api/tickets/${id}/messages`;
    const res = await this.fetchWithTimeout(url, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return res.json();
  }

  // Update ticket status (admin only)
  async updateStatus(
    id: string, 
    status: TicketStatus,
    assignedTo?: string
  ): Promise<{ success: boolean; message?: string; data?: { ticket: Ticket } }> {
    const url = `${API_BASE_URL}/api/tickets/${id}/status`;
    const res = await this.fetchWithTimeout(url, {
      method: 'PUT',
      body: JSON.stringify({ status, assignedTo }),
    });
    return res.json();
  }

  // Update ticket priority (admin only)
  async updatePriority(
    id: string, 
    priority: TicketPriority
  ): Promise<{ success: boolean; message?: string; data?: { ticket: Ticket } }> {
    const url = `${API_BASE_URL}/api/tickets/${id}/priority`;
    const res = await this.fetchWithTimeout(url, {
      method: 'PUT',
      body: JSON.stringify({ priority }),
    });
    return res.json();
  }

  // Get ticket statistics (admin only)
  async getStatistics(): Promise<{ success: boolean; data?: TicketStatistics }> {
    const url = `${API_BASE_URL}/api/tickets/admin/statistics`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }

  // Get unread ticket count (admin only)
  async getUnreadCount(): Promise<{ success: boolean; data?: { count: number } }> {
    const url = `${API_BASE_URL}/api/tickets/admin/unread-count`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }

  // Delete ticket (admin only)
  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    const url = `${API_BASE_URL}/api/tickets/${id}`;
    const res = await this.fetchWithTimeout(url, {
      method: 'DELETE',
    });
    return res.json();
  }
}

export const ticketService = new TicketService();
