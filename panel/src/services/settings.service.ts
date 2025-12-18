import { API_BASE_URL } from '../config/api';
import { authService } from './auth.service';

export interface KitchenSettings {
    isEnabled: boolean;
    accessMode: 'all' | 'selected';
    allowedUserIds: { _id: string; name?: string; phone: string }[];
}

export interface Settings {
    _id: string;
    kitchen: KitchenSettings;
}

export const settingsService = {
    getSettings: async (): Promise<Settings> => {
        const token = authService.getToken();
        const response = await fetch(`${API_BASE_URL}/api/settings`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: token ? `Bearer ${token}` : '',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch settings');
        }
        return response.json();
    },

    updateSettings: async (settings: Partial<Settings>): Promise<Settings> => {
        const token = authService.getToken();
        const response = await fetch(`${API_BASE_URL}/api/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(settings),
        });
        if (!response.ok) {
            throw new Error('Failed to update settings');
        }
        return response.json();
    },
};
