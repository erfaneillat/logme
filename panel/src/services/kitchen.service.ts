import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { KitchenCategory, CreateKitchenCategoryRequest, UpdateKitchenCategoryRequest } from '../types/kitchen';

interface ApiResponse<T> {
    success?: boolean; // Some APIs return success, others just data.
    // My controller returns pure data on 200, so I should be careful.
    // Actually, look at the controller: res.status(200).json(categories).
    // It doesn't wrap in { success: true, data: ... }.
    // But `appVersionService` expects `ApiResponse`.
    // I should probably adapt the service to the controller or vice versa.
    // The previous controller code I wrote returns just the object or array.
    // So I should just return the data directly or wrap it here.
    // To match appVersionService structure (which seems to expect success/data/message handling in frontend),
    // I will return { success: true, data: response } or { success: false, message: error }.
}

// I will make the service methods return { success: boolean, data?: T, message?: string }
// consistent with how the frontend likely consumes it, even if the backend returns raw data.

class KitchenService {
    private readonly basePath = '/api/kitchen';

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

    async getAllCategories(token: string): Promise<{ success: boolean; data?: KitchenCategory[]; message?: string }> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}${this.basePath}/admin/categories`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to fetch categories');
            }
            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to fetch categories',
            };
        }
    }

    async createCategory(token: string, categoryData: CreateKitchenCategoryRequest): Promise<{ success: boolean; data?: KitchenCategory; message?: string }> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}/categories`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(categoryData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to create category');
            }
            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to create category',
            };
        }
    }

    async updateCategory(token: string, id: string, categoryData: UpdateKitchenCategoryRequest): Promise<{ success: boolean; data?: KitchenCategory; message?: string }> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}/categories/${id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(categoryData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to update category');
            }
            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to update category',
            };
        }
    }

    async deleteCategory(token: string, id: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to delete category');
            }
            return { success: true, message: 'Category deleted successfully' };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to delete category',
            };
        }
    }

    async uploadImage(token: string, file: File): Promise<{ success: boolean; url?: string; message?: string }> {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${API_BASE_URL}${this.basePath}/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    // Content-Type is intentionally omitted so browser sets it with boundary
                },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to upload image');
            }

            const data = await response.json();
            return { success: true, url: data.url };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to upload image',
            };
        }
    }

    async importItems(token: string, categoryId: string, items: any[]): Promise<{ success: boolean; message?: string; category?: KitchenCategory }> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}/import`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ categoryId, items }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to import items');
            }

            const data = await response.json();
            return { success: true, message: data.message, category: data.category };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to import items',
            };
        }
    }

    async generateImageForItem(
        token: string,
        categoryId: string,
        subcategoryIndex: number,
        itemIndex: number
    ): Promise<{
        success: boolean;
        itemName?: string;
        imageUrl?: string;
        skipped?: boolean;
        message?: string;
        error?: string;
    }> {
        try {
            // 90 second timeout per image (well under Cloudflare's ~100s limit)
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 90 * 1000);

            const response = await fetch(`${API_BASE_URL}${this.basePath}/generate-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ categoryId, subcategoryIndex, itemIndex }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to generate image');
            }

            const data = await response.json();
            return {
                success: data.success,
                itemName: data.itemName,
                imageUrl: data.imageUrl,
                skipped: data.skipped,
                message: data.message,
                error: data.error
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to generate image',
            };
        }
    }

    async compressImagesForCategory(
        token: string,
        categoryId: string
    ): Promise<{
        success: boolean;
        message?: string;
        processed?: number;
        skipped?: number;
        errors?: number;
        savedMB?: number;
        savingsPercent?: number;
    }> {
        try {
            const response = await fetch(`${API_BASE_URL}${this.basePath}/compress-images`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ categoryId })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to compress images');
            }

            const data = await response.json();
            return {
                success: data.success,
                message: data.message,
                processed: data.processed,
                skipped: data.skipped,
                errors: data.errors,
                savedMB: data.savedMB,
                savingsPercent: data.savingsPercent
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to compress images',
            };
        }
    }

    async updateCategoryWithJson(
        token: string,
        categoryId: string,
        jsonContent: string,
        language: 'en' | 'fa' = 'en'
    ): Promise<{
        success: boolean;
        message?: string;
        category?: KitchenCategory;
        processedCount?: number;
    }> {
        try {
            // Parse JSON here to ensure it's valid before sending, although server will also checking
            let items;
            try {
                items = JSON.parse(jsonContent);
                if (!Array.isArray(items)) throw new Error('Input must be an array');
            } catch (e) {
                throw new Error('Invalid JSON format');
            }

            const response = await fetch(`${API_BASE_URL}${this.basePath}/update-json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ categoryId, items, language }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to update category');
            }

            const data = await response.json();
            return {
                success: data.success,
                message: data.message,
                category: data.category,
                processedCount: data.processedCount
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to update category',
            };
        }
    }

    async getCategoryLanguageStats(
        token: string,
        categoryId: string
    ): Promise<{
        success: boolean;
        message?: string;
        stats?: {
            totalItems: number;
            itemsWithEnglish: number;
            itemsWithFarsi: number;
            itemsWithBoth: number;
            englishOnly: number;
            farsiOnly: number;
            hasEnglishData: boolean;
            hasFarsiData: boolean;
        };
    }> {
        try {
            const response = await fetch(`${API_BASE_URL}${this.basePath}/categories/${categoryId}/language-stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to get language stats');
            }

            const data = await response.json();
            return {
                success: data.success,
                stats: data.stats
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to get language stats',
            };
        }
    }
}

export const kitchenService = new KitchenService();
