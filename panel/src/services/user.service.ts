import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT } from '../config/api';
import { authService } from './auth.service';
import { errorLogger } from './errorLogger.service';
import type { User, DeletedUser, PaginatedResponse } from '../types/user';

class UserService {
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

  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    isAdmin?: boolean;
    isPhoneVerified?: boolean;
    hasCompletedAdditionalInfo?: boolean;
    hasGeneratedPlan?: boolean;
    sort?: string; // "-createdAt"
  }): Promise<PaginatedResponse<User>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.isAdmin !== undefined) query.set('isAdmin', String(params.isAdmin));
    if (params.isPhoneVerified !== undefined) query.set('isPhoneVerified', String(params.isPhoneVerified));
    if (params.hasCompletedAdditionalInfo !== undefined) query.set('hasCompletedAdditionalInfo', String(params.hasCompletedAdditionalInfo));
    if (params.hasGeneratedPlan !== undefined) query.set('hasGeneratedPlan', String(params.hasGeneratedPlan));
    if (params.sort) query.set('sort', params.sort);

    const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.BASE}?${query.toString()}`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }

  async listDeleted(params: {
    page?: number;
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
  }): Promise<PaginatedResponse<DeletedUser>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params.dateTo) query.set('dateTo', params.dateTo);
    if (params.sort) query.set('sort', params.sort);

    const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.BASE}/deleted/list?${query.toString()}`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }

  async getById(id: string): Promise<{ success: boolean; data?: { user: User } }> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.BY_ID(id)}`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }

  async getDeletedById(id: string): Promise<{ success: boolean; data?: { user: DeletedUser } }> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.BASE}/deleted/${id}`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }

  async update(id: string, payload: Partial<Pick<User, 'name' | 'email' | 'isAdmin'>>): Promise<{ success: boolean; message?: string; data?: { user: User } }> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.BY_ID(id)}`;
    const res = await this.fetchWithTimeout(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.BY_ID(id)}`;
    const res = await this.fetchWithTimeout(url, {
      method: 'DELETE',
    });
    return res.json();
  }
}

export const userService = new UserService();
