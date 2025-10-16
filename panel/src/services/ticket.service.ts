import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { authService } from './auth.service';
import { errorLogger } from './errorLogger.service';
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
      errorLogger.error('Fetch timeout error', error as Error, { action: 'fetchWithTimeout', component: 'TicketService', url });
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
    try {
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
    } catch (error) {
      errorLogger.error('Failed to list tickets', error as Error, { action: 'list', component: 'TicketService' }, { params });
      throw error;
    }
  }

  // Get ticket by ID
  async getById(id: string): Promise<{ success: boolean; data?: { ticket: Ticket } }> {
    try {
      const url = `${API_BASE_URL}/api/tickets/${id}`;
      const res = await this.fetchWithTimeout(url);
      return res.json();
    } catch (error) {
      errorLogger.error('Failed to get ticket', error as Error, { action: 'getById', component: 'TicketService' }, { ticketId: id });
      throw error;
    }
  }

  // Add message to ticket
  async addMessage(
    id: string, 
    message: string
  ): Promise<{ success: boolean; message?: string; data?: { ticket: Ticket } }> {
    try {
      const url = `${API_BASE_URL}/api/tickets/${id}/messages`;
      const res = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      return res.json();
    } catch (error) {
      errorLogger.error('Failed to add message', error as Error, { action: 'addMessage', component: 'TicketService' }, { ticketId: id });
      throw error;
    }
  }

  // Update ticket status (admin only)
  async updateStatus(
    id: string, 
    status: TicketStatus,
    assignedTo?: string
  ): Promise<{ success: boolean; message?: string; data?: { ticket: Ticket } }> {
    try {
      const url = `${API_BASE_URL}/api/tickets/${id}/status`;
      const res = await this.fetchWithTimeout(url, {
        method: 'PUT',
        body: JSON.stringify({ status, assignedTo }),
      });
      return res.json();
    } catch (error) {
      errorLogger.error('Failed to update ticket status', error as Error, { action: 'updateStatus', component: 'TicketService' }, { ticketId: id, status });
      throw error;
    }
  }

  // Update ticket priority (admin only)
  async updatePriority(
    id: string, 
    priority: TicketPriority
  ): Promise<{ success: boolean; message?: string; data?: { ticket: Ticket } }> {
    try {
      const url = `${API_BASE_URL}/api/tickets/${id}/priority`;
      const res = await this.fetchWithTimeout(url, {
        method: 'PUT',
        body: JSON.stringify({ priority }),
      });
      return res.json();
    } catch (error) {
      errorLogger.error('Failed to update ticket priority', error as Error, { action: 'updatePriority', component: 'TicketService' }, { ticketId: id, priority });
      throw error;
    }
  }

  // Get ticket statistics (admin only)
  async getStatistics(): Promise<{ success: boolean; data?: TicketStatistics }> {
    try {
      const url = `${API_BASE_URL}/api/tickets/admin/statistics`;
      const res = await this.fetchWithTimeout(url);
      return res.json();
    } catch (error) {
      errorLogger.error('Failed to get ticket statistics', error as Error, { action: 'getStatistics', component: 'TicketService' });
      throw error;
    }
  }

  // Get unread ticket count (admin only)
  async getUnreadCount(): Promise<{ success: boolean; data?: { count: number } }> {
    try {
      const url = `${API_BASE_URL}/api/tickets/admin/unread-count`;
      const res = await this.fetchWithTimeout(url);
      return res.json();
    } catch (error) {
      errorLogger.error('Failed to get unread count', error as Error, { action: 'getUnreadCount', component: 'TicketService' });
      throw error;
    }
  }

  // Delete ticket (admin only)
  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const url = `${API_BASE_URL}/api/tickets/${id}`;
      const res = await this.fetchWithTimeout(url, {
        method: 'DELETE',
      });
      return res.json();
    } catch (error) {
      errorLogger.error('Failed to delete ticket', error as Error, { action: 'delete', component: 'TicketService' }, { ticketId: id });
      throw error;
    }
  }
}

export const ticketService = new TicketService();
