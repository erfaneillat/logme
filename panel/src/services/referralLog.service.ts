import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type { ReferralLogResponse } from '../types/referralLog';
import { authService } from './auth.service';

class ReferralLogService {
    async getUserReferralLogs(
        userId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<ReferralLogResponse> {
        const token = authService.getToken();
        const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.BY_ID(userId)}/referral-logs?page=${page}&limit=${limit}`;

        console.log('Fetching referral logs from:', url);

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            console.log('Referral logs response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Referral logs error:', errorText);
                throw new Error(`Failed to fetch referral logs: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('Referral logs fetched successfully:', data);
            return data as ReferralLogResponse;
        } catch (error) {
            console.error('Referral log service error:', error);
            throw error;
        }
    }
}

export const referralLogService = new ReferralLogService();

