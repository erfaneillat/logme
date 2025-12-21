import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { errorLogger } from './errorLogger.service';

export interface ExerciseItem {
    _id: string;
    userId: string;
    userName?: string;
    userPhone: string;
    date: string;
    activityName: string;
    activityDescription: string;
    duration: number;
    caloriesBurned: number;
    intensity: string;
    tips: string[];
    timeIso: string;
    createdAt: string;
}

export interface ExercisesResponse {
    exercises: ExerciseItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ExerciseStats {
    totalExercises: number;
    totalCaloriesBurned: number;
    totalDuration: number;
    uniqueUsers: number;
    intensityBreakdown: {
        low: number;
        moderate: number;
        high: number;
    };
}

class ExercisesService {
    private async fetchWithTimeout(url: string, options: RequestInit = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
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

    private getAuthHeaders(token: string) {
        return {
            Authorization: `Bearer ${token}`,
        };
    }

    async getExercises(
        token: string,
        page: number = 1,
        limit: number = 20,
        intensity?: string
    ): Promise<ExercisesResponse> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (intensity) {
                params.append('intensity', intensity);
            }

            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/admin/exercises?${params.toString()}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching exercises:', error);
            throw error;
        }
    }

    async getExerciseStats(token: string): Promise<ExerciseStats> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/admin/exercises/stats`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching exercise stats:', error);
            throw error;
        }
    }

    async searchExercises(
        token: string,
        searchTerm: string,
        page: number = 1,
        limit: number = 20
    ): Promise<ExercisesResponse> {
        try {
            const params = new URLSearchParams({
                q: searchTerm,
                page: page.toString(),
                limit: limit.toString(),
            });

            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/admin/exercises/search?${params.toString()}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error searching exercises:', error);
            throw error;
        }
    }

    async getUserExercises(
        token: string,
        userId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<ExercisesResponse> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/admin/exercises/user/${userId}?${params.toString()}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching user exercises:', error);
            throw error;
        }
    }
}

export const exercisesService = new ExercisesService();
