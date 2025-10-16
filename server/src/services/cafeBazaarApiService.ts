import axios, { AxiosError } from 'axios';
import { logServiceError } from '../utils/errorLogger';

/**
 * Response from Cafe Bazaar purchase validation API
 */
interface CafeBazaarPurchaseResponse {
    consumptionState: number; // 0 = consumed, 1 = not consumed
    purchaseState: number; // 0 = purchased, 1 = refunded
    kind: string; // "androidpublisher#inappPurchase"
    developerPayload: string;
    purchaseTime: number; // milliseconds since 1970/1/1
}

/**
 * Error response from Cafe Bazaar API
 */
interface CafeBazaarErrorResponse {
    error: string;
    error_description: string;
}

/**
 * Result of purchase validation
 */
export interface PurchaseValidationResult {
    valid: boolean;
    consumed: boolean;
    refunded: boolean;
    purchaseTime?: number;
    developerPayload?: string;
    error?: string;
    errorDescription?: string;
}

/**
 * Response from Cafe Bazaar subscription status API
 */
interface CafeBazaarSubscriptionResponse {
    kind: string; // "androidpublisher#subscriptionPurchase"
    initiationTimestampMsec: number; // Subscription start time
    validUntilTimestampMsec: number; // Next charge time or expiry time
    autoRenewing: boolean; // Whether subscription auto-renews
    linkedSubscriptionToken: string; // Unique token for subscription
}

/**
 * Result of subscription status validation
 */
export interface SubscriptionStatusResult {
    valid: boolean;
    active: boolean;
    initiationTime?: number;
    expiryTime?: number;
    autoRenewing?: boolean;
    linkedSubscriptionToken?: string;
    error?: string;
    errorDescription?: string;
}

/**
 * Service for interacting with Cafe Bazaar Developer API
 */
export class CafeBazaarApiService {
    private static readonly BASE_URL = 'https://pardakht.cafebazaar.ir/devapi/v2/api';
    private accessToken: string;

    constructor(accessToken: string) {
        if (!accessToken) {
            throw new Error('Cafe Bazaar access token is required');
        }
        this.accessToken = accessToken;
    }

    /**
     * Validate in-app purchase with Cafe Bazaar
     * 
     * @param packageName - Package name of the app
     * @param productId - SKU of the purchased product
     * @param purchaseToken - Purchase token from Cafe Bazaar
     * @returns Validation result
     */
    async validateInAppPurchase(
        packageName: string,
        productId: string,
        purchaseToken: string
    ): Promise<PurchaseValidationResult> {
        try {
            // Validate input parameters
            if (!packageName || !productId || !purchaseToken) {
                return {
                    valid: false,
                    consumed: false,
                    refunded: false,
                    error: 'invalid_parameters',
                    errorDescription: 'Package name, product ID, and purchase token are required',
                };
            }

            // Construct the API URL
            const url = `${CafeBazaarApiService.BASE_URL}/validate/${packageName}/inapp/${productId}/purchases/${purchaseToken}/`;

            console.log('🌐 Calling Cafe Bazaar API:', {
                url,
                productId,
                packageName,
                hasAccessToken: !!this.accessToken,
            });

            // Make API request
            const response = await axios.get<CafeBazaarPurchaseResponse>(url, {
                headers: {
                    'CAFEBAZAAR-PISHKHAN-API-SECRET': this.accessToken,
                    'Content-Type': 'application/json',
                },
                timeout: 10000, // 10 seconds timeout
            });

            console.log('✅ Cafe Bazaar API response:', {
                status: response.status,
                data: response.data,
            });

            // Parse successful response
            const data = response.data;

            return {
                valid: true,
                consumed: data.consumptionState === 0,
                refunded: data.purchaseState === 1,
                purchaseTime: data.purchaseTime,
                developerPayload: data.developerPayload,
            };

        } catch (error) {
            return this.handleApiError(error);
        }
    }

    /**
     * Check subscription status with Cafe Bazaar
     * متد بررسی وضعیت اشتراک
     * 
     * @param packageName - Package name of the app
     * @param subscriptionId - SKU of the subscription
     * @param purchaseToken - Purchase token from Cafe Bazaar
     * @returns Subscription status result
     */
    async checkSubscriptionStatus(
        packageName: string,
        subscriptionId: string,
        purchaseToken: string
    ): Promise<SubscriptionStatusResult> {
        try {
            // Validate input parameters
            if (!packageName || !subscriptionId || !purchaseToken) {
                return {
                    valid: false,
                    active: false,
                    error: 'invalid_parameters',
                    errorDescription: 'Package name, subscription ID, and purchase token are required',
                };
            }

            // Construct the API URL
            const url = `${CafeBazaarApiService.BASE_URL}/applications/${packageName}/subscriptions/${subscriptionId}/purchases/${purchaseToken}`;

            // Make API request
            const response = await axios.get<CafeBazaarSubscriptionResponse>(url, {
                headers: {
                    'CAFEBAZAAR-PISHKHAN-API-SECRET': this.accessToken,
                    'Content-Type': 'application/json',
                },
                timeout: 10000, // 10 seconds timeout
            });

            // Parse successful response
            const data = response.data;

            // Check if subscription is still active
            const now = Date.now();
            const isActive = data.validUntilTimestampMsec > now;

            return {
                valid: true,
                active: isActive,
                initiationTime: data.initiationTimestampMsec,
                expiryTime: data.validUntilTimestampMsec,
                autoRenewing: data.autoRenewing,
                linkedSubscriptionToken: data.linkedSubscriptionToken,
            };

        } catch (error) {
            return this.handleSubscriptionError(error);
        }
    }

    /**
     * Handle API errors and convert to validation result
     */
    private handleApiError(error: unknown): PurchaseValidationResult {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<CafeBazaarErrorResponse>;

            // Handle HTTP error responses
            if (axiosError.response) {
                const status = axiosError.response.status;
                const errorData = axiosError.response.data;

                // 404 - Purchase not found (could be fraud attempt)
                if (status === 404) {
                    logServiceError('cafeBazaarApiService', 'checkSubscriptionStatus', error as Error, {
                        status,
                        error: errorData?.error,
                        errorDescription: errorData?.error_description,
                        fullResponse: axiosError.response.data,
                    });
                    return {
                        valid: false,
                        consumed: false,
                        refunded: false,
                        error: errorData?.error || 'not_found',
                        errorDescription: errorData?.error_description || 'The requested purchase is not found!',
                    };
                }

                // 401 - Unauthorized (invalid access token)
                if (status === 401) {
                    return {
                        valid: false,
                        consumed: false,
                        refunded: false,
                        error: 'unauthorized',
                        errorDescription: 'Invalid or expired access token',
                    };
                }

                // Other 4xx errors
                if (status >= 400 && status < 500) {
                    return {
                        valid: false,
                        consumed: false,
                        refunded: false,
                        error: errorData?.error || 'client_error',
                        errorDescription: errorData?.error_description || 'Invalid request',
                    };
                }

                // 5xx errors
                if (status >= 500) {
                    return {
                        valid: false,
                        consumed: false,
                        refunded: false,
                        error: 'server_error',
                        errorDescription: 'Cafe Bazaar server error',
                    };
                }
            }

            // Network or timeout errors
            if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
                return {
                    valid: false,
                    consumed: false,
                    refunded: false,
                    error: 'timeout',
                    errorDescription: 'Request timeout',
                };
            }

            // Other network errors
            return {
                valid: false,
                consumed: false,
                refunded: false,
                error: 'network_error',
                errorDescription: 'Network error occurred',
            };
        }

        // Unknown error
        return {
            valid: false,
            consumed: false,
            refunded: false,
            error: 'unknown_error',
            errorDescription: 'An unexpected error occurred',
        };
    }

    /**
     * Handle subscription API errors and convert to subscription status result
     */
    private handleSubscriptionError(error: unknown): SubscriptionStatusResult {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<CafeBazaarErrorResponse>;

            // Handle HTTP error responses
            if (axiosError.response) {
                const status = axiosError.response.status;
                const errorData = axiosError.response.data;

                // 404 - Subscription not found
                if (status === 404) {
                    return {
                        valid: false,
                        active: false,
                        error: errorData?.error || 'not_found',
                        errorDescription: errorData?.error_description || 'Subscription not found',
                    };
                }

                // 401 - Unauthorized (invalid access token)
                if (status === 401) {
                    return {
                        valid: false,
                        active: false,
                        error: 'unauthorized',
                        errorDescription: 'Invalid or expired access token',
                    };
                }

                // Other 4xx errors
                if (status >= 400 && status < 500) {
                    return {
                        valid: false,
                        active: false,
                        error: errorData?.error || 'client_error',
                        errorDescription: errorData?.error_description || 'Invalid request',
                    };
                }

                // 5xx errors
                if (status >= 500) {
                    return {
                        valid: false,
                        active: false,
                        error: 'server_error',
                        errorDescription: 'Cafe Bazaar server error',
                    };
                }
            }

            // Network or timeout errors
            if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
                return {
                    valid: false,
                    active: false,
                    error: 'timeout',
                    errorDescription: 'Request timeout',
                };
            }

            // Other network errors
            return {
                valid: false,
                active: false,
                error: 'network_error',
                errorDescription: 'Network error occurred',
            };
        }

        // Unknown error
        return {
            valid: false,
            active: false,
            error: 'unknown_error',
            errorDescription: 'An unexpected error occurred',
        };
    }

    /**
     * Create service instance from environment variables
     */
    static fromEnvironment(): CafeBazaarApiService {
        const accessToken = process.env.CAFEBAZAAR_ACCESS_TOKEN;

        if (!accessToken) {
            throw new Error('CAFEBAZAAR_ACCESS_TOKEN environment variable is not set');
        }

        return new CafeBazaarApiService(accessToken);
    }
}
