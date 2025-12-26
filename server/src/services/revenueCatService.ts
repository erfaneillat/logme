import axios from 'axios';
import errorLogger from './errorLoggerService';

/**
 * RevenueCat API Service
 * Handles validation and verification of RevenueCat purchases for global users
 */
export class RevenueCatService {
    private apiKey: string;
    private baseUrl: string = 'https://api.revenuecat.com/v1';

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('RevenueCat API key is required');
        }
        this.apiKey = apiKey;
    }

    /**
     * Create instance from environment variables
     */
    static fromEnvironment(): RevenueCatService {
        const apiKey = process.env.REVENUECAT_API_KEY;
        if (!apiKey) {
            throw new Error('REVENUECAT_API_KEY environment variable is not set');
        }
        return new RevenueCatService(apiKey);
    }

    /**
     * Get subscriber information from RevenueCat
     * @param appUserId - The app user ID (usually Firebase UID or custom user ID)
     */
    async getSubscriber(appUserId: string): Promise<RevenueCatSubscriberResponse | null> {
        try {
            console.log('🔍 Fetching RevenueCat subscriber:', { appUserId });

            const response = await axios.get(
                `${this.baseUrl}/subscribers/${encodeURIComponent(appUserId)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('✅ RevenueCat subscriber fetched successfully');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.log('ℹ️ RevenueCat subscriber not found:', { appUserId });
                return null;
            }
            errorLogger.error('RevenueCat getSubscriber error:', error);
            throw error;
        }
    }

    /**
     * Verify if a user has an active subscription
     * @param appUserId - The app user ID
     * @param entitlementIdentifier - The entitlement to check (e.g., 'premium', 'pro')
     */
    async verifySubscription(
        appUserId: string,
        entitlementIdentifier: string = 'premium'
    ): Promise<SubscriptionVerificationResult> {
        try {
            const subscriber = await this.getSubscriber(appUserId);

            if (!subscriber) {
                return {
                    isActive: false,
                    error: 'subscriber_not_found',
                    message: 'Subscriber not found in RevenueCat',
                };
            }

            const entitlement = subscriber.subscriber?.entitlements?.[entitlementIdentifier];

            if (!entitlement) {
                return {
                    isActive: false,
                    error: 'no_entitlement',
                    message: 'User does not have the specified entitlement',
                };
            }

            const expiresDate = entitlement.expires_date
                ? new Date(entitlement.expires_date)
                : null;
            const isActive = !!expiresDate && expiresDate > new Date();

            const result: SubscriptionVerificationResult = {
                isActive,
                productIdentifier: entitlement.product_identifier,
                purchaseDate: entitlement.purchase_date,
                store: entitlement.store,
                isSandbox: entitlement.is_sandbox,
                willRenew: !entitlement.unsubscribe_detected_at,
            };
            if (expiresDate) {
                result.expiresDate = expiresDate.toISOString();
            }
            return result;
        } catch (error: any) {
            errorLogger.error('RevenueCat verifySubscription error:', error);
            return {
                isActive: false,
                error: 'verification_failed',
                message: error.message || 'Failed to verify subscription',
            };
        }
    }

    /**
     * Verify a purchase transaction with RevenueCat
     * @param appUserId - The app user ID
     * @param receipt - The receipt/token from the store
     * @param productId - The product ID purchased
     * @param store - The store source ('app_store', 'play_store')
     */
    async verifyPurchase(
        appUserId: string,
        receipt: string,
        productId: string,
        store: 'app_store' | 'play_store'
    ): Promise<PurchaseVerificationResult> {
        try {
            console.log('🔍 Verifying RevenueCat purchase:', {
                appUserId,
                productId,
                store,
                receiptPreview: receipt.substring(0, 20) + '...'
            });

            // Post receipt to RevenueCat
            const response = await axios.post(
                `${this.baseUrl}/receipts`,
                {
                    app_user_id: appUserId,
                    fetch_token: receipt,
                    product_id: productId,
                    ...(store === 'app_store' ? { is_restore: false } : {}),
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'X-Platform': store === 'app_store' ? 'ios' : 'android',
                    },
                }
            );

            console.log('✅ RevenueCat purchase verified');

            // Get the subscriber info to find entitlements
            const subscriberInfo = response.data?.subscriber;

            if (!subscriberInfo) {
                return {
                    valid: false,
                    error: 'no_subscriber_info',
                    message: 'No subscriber info returned',
                };
            }

            // Find the premium entitlement
            const entitlement = subscriberInfo.entitlements?.premium;

            return {
                valid: true,
                isActive: !!entitlement?.expires_date && new Date(entitlement.expires_date) > new Date(),
                expiresDate: entitlement?.expires_date,
                productIdentifier: productId,
                store,
                originalPurchaseDate: subscriberInfo.original_purchase_date,
                managementUrl: subscriberInfo.management_url,
            };
        } catch (error: any) {
            errorLogger.error('RevenueCat verifyPurchase error:', error);

            if (error.response?.status === 400) {
                return {
                    valid: false,
                    error: 'invalid_receipt',
                    message: 'Invalid receipt or purchase token',
                };
            }

            return {
                valid: false,
                error: 'verification_failed',
                message: error.message || 'Failed to verify purchase',
            };
        }
    }

    /**
     * Grant a promotional entitlement to a user
     * Useful for admin-activated subscriptions
     */
    async grantPromotionalEntitlement(
        appUserId: string,
        duration: 'daily' | 'three_day' | 'weekly' | 'monthly' | 'two_month' | 'three_month' | 'six_month' | 'yearly' | 'lifetime',
        entitlementIdentifier: string = 'premium'
    ): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('🎁 Granting RevenueCat promotional entitlement:', {
                appUserId,
                duration,
                entitlementIdentifier,
            });

            await axios.post(
                `${this.baseUrl}/subscribers/${encodeURIComponent(appUserId)}/entitlements/${entitlementIdentifier}/promotional`,
                {
                    duration,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('✅ RevenueCat promotional entitlement granted');
            return { success: true };
        } catch (error: any) {
            errorLogger.error('RevenueCat grantPromotionalEntitlement error:', error);
            return {
                success: false,
                error: error.message || 'Failed to grant promotional entitlement',
            };
        }
    }

    /**
     * Revoke access to a user's entitlements
     */
    async revokeEntitlement(
        appUserId: string,
        entitlementIdentifier: string = 'premium'
    ): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('🚫 Revoking RevenueCat entitlement:', {
                appUserId,
                entitlementIdentifier,
            });

            await axios.post(
                `${this.baseUrl}/subscribers/${encodeURIComponent(appUserId)}/entitlements/${entitlementIdentifier}/revoke_promotionals`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('✅ RevenueCat entitlement revoked');
            return { success: true };
        } catch (error: any) {
            errorLogger.error('RevenueCat revokeEntitlement error:', error);
            return {
                success: false,
                error: error.message || 'Failed to revoke entitlement',
            };
        }
    }
}

// Types

export interface RevenueCatSubscriberResponse {
    request_date: string;
    request_date_ms: number;
    subscriber: {
        entitlements: Record<string, RevenueCatEntitlement>;
        first_seen: string;
        last_seen: string;
        management_url: string | null;
        non_subscriptions: Record<string, any>;
        original_app_user_id: string;
        original_application_version: string | null;
        original_purchase_date: string;
        other_purchases: Record<string, any>;
        subscriptions: Record<string, RevenueCatSubscription>;
    };
}

export interface RevenueCatEntitlement {
    expires_date: string | null;
    grace_period_expires_date: string | null;
    product_identifier: string;
    purchase_date: string;
    store: 'app_store' | 'play_store' | 'stripe' | 'promotional';
    is_sandbox: boolean;
    unsubscribe_detected_at: string | null;
    billing_issues_detected_at: string | null;
}

export interface RevenueCatSubscription {
    auto_resume_date: string | null;
    billing_issues_detected_at: string | null;
    expires_date: string;
    grace_period_expires_date: string | null;
    is_sandbox: boolean;
    original_purchase_date: string;
    ownership_type: 'PURCHASED' | 'FAMILY_SHARED';
    period_type: 'normal' | 'trial' | 'intro';
    purchase_date: string;
    refunded_at: string | null;
    store: 'app_store' | 'play_store' | 'stripe';
    unsubscribe_detected_at: string | null;
}

export interface SubscriptionVerificationResult {
    isActive: boolean;
    expiresDate?: string;
    productIdentifier?: string;
    purchaseDate?: string;
    store?: string;
    isSandbox?: boolean;
    willRenew?: boolean;
    error?: string;
    message?: string;
}

export interface PurchaseVerificationResult {
    valid: boolean;
    isActive?: boolean;
    expiresDate?: string;
    productIdentifier?: string;
    store?: string;
    originalPurchaseDate?: string;
    managementUrl?: string;
    error?: string;
    message?: string;
}

export default RevenueCatService;
