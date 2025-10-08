import crypto from 'crypto';

interface PurchaseAttempt {
    userId: string;
    timestamp: number;
    success: boolean;
}

export class PurchaseVerificationService {
    private static purchaseAttempts: Map<string, PurchaseAttempt[]> = new Map();
    private static readonly MAX_ATTEMPTS_PER_HOUR = 10;
    private static readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

    constructor() {
        // Cleanup old attempts periodically
        setInterval(() => this.cleanupOldAttempts(), PurchaseVerificationService.CLEANUP_INTERVAL);
    }

    /**
     * Check if user has exceeded purchase attempt limit
     */
    static canAttemptPurchase(userId: string): boolean {
        const attempts = this.getUserAttempts(userId);
        const recentAttempts = attempts.filter(
            attempt => Date.now() - attempt.timestamp < 60 * 60 * 1000 // Last hour
        );

        return recentAttempts.length < this.MAX_ATTEMPTS_PER_HOUR;
    }

    /**
     * Record a purchase attempt
     */
    static recordAttempt(userId: string, success: boolean): void {
        const attempts = this.getUserAttempts(userId);
        attempts.push({
            userId,
            timestamp: Date.now(),
            success,
        });

        this.purchaseAttempts.set(userId, attempts);
    }

    /**
     * Get user's purchase attempts
     */
    private static getUserAttempts(userId: string): PurchaseAttempt[] {
        return this.purchaseAttempts.get(userId) || [];
    }

    /**
     * Cleanup attempts older than 1 hour
     */
    private cleanupOldAttempts(): void {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        for (const [userId, attempts] of PurchaseVerificationService.purchaseAttempts.entries()) {
            const recentAttempts = attempts.filter(
                attempt => attempt.timestamp > oneHourAgo
            );

            if (recentAttempts.length === 0) {
                PurchaseVerificationService.purchaseAttempts.delete(userId);
            } else {
                PurchaseVerificationService.purchaseAttempts.set(userId, recentAttempts);
            }
        }
    }

    /**
     * Validate purchase data integrity
     */
    static validatePurchaseData(data: {
        productKey: string;
        purchaseToken: string;
        orderId: string;
        payload?: string;
    }): { valid: boolean; error?: string } {
        // Validate product key format
        if (!this.isValidProductKey(data.productKey)) {
            return { valid: false, error: 'Invalid product key format' };
        }

        // Validate purchase token
        if (!this.isValidPurchaseToken(data.purchaseToken)) {
            return { valid: false, error: 'Invalid purchase token format' };
        }

        // Validate order ID
        if (!this.isValidOrderId(data.orderId)) {
            return { valid: false, error: 'Invalid order ID format' };
        }

        // Validate payload if provided
        if (data.payload && !this.isValidPayload(data.payload)) {
            return { valid: false, error: 'Invalid or expired payload' };
        }

        return { valid: true };
    }

    /**
     * Validate product key format
     */
    private static isValidProductKey(productKey: string): boolean {
        if (!productKey || typeof productKey !== 'string') {
            return false;
        }

        // Product key should be alphanumeric with underscores/hyphens
        const validPattern = /^[a-zA-Z0-9_\-]+$/;
        return validPattern.test(productKey) && productKey.length >= 3 && productKey.length <= 100;
    }

    /**
     * Validate purchase token format
     */
    private static isValidPurchaseToken(token: string): boolean {
        if (!token || typeof token !== 'string') {
            return false;
        }

        // CafeBazaar tokens are typically long alphanumeric strings
        if (token.length < 20 || token.length > 500) {
            return false;
        }

        // Token should only contain valid characters
        const validPattern = /^[a-zA-Z0-9\-_.=]+$/;
        return validPattern.test(token);
    }

    /**
     * Validate order ID format
     */
    private static isValidOrderId(orderId: string): boolean {
        if (!orderId || typeof orderId !== 'string') {
            return false;
        }

        // Order ID should be alphanumeric
        const validPattern = /^[a-zA-Z0-9\-_.]+$/;
        return validPattern.test(orderId) && orderId.length >= 5 && orderId.length <= 100;
    }

    /**
     * Validate payload (timestamp-based)
     */
    private static isValidPayload(payload: string): boolean {
        if (!payload) return true;

        // Check if payload is a valid timestamp
        const timestamp = parseInt(payload, 10);
        if (isNaN(timestamp)) return false;

        // Check if timestamp is within acceptable range (last 24 hours)
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);

        return timestamp >= oneDayAgo && timestamp <= now;
    }

    /**
     * Generate secure hash for purchase token (for logging)
     */
    static hashPurchaseToken(token: string): string {
        return crypto
            .createHash('sha256')
            .update(token)
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * Check if purchase token has been used before
     */
    static async isPurchaseTokenUnique(
        purchaseToken: string,
        checkFunction: (token: string) => Promise<boolean>
    ): Promise<boolean> {
        return await checkFunction(purchaseToken);
    }

    /**
     * Calculate subscription expiry date
     */
    static calculateExpiryDate(planType: 'monthly' | 'yearly', startDate: Date = new Date()): Date {
        const expiryDate = new Date(startDate);

        if (planType === 'yearly') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
        }

        return expiryDate;
    }

    /**
     * Validate subscription dates
     */
    static validateSubscriptionDates(startDate: Date, expiryDate: Date): boolean {
        const now = new Date();

        // Start date should not be in the future
        if (startDate > now) {
            return false;
        }

        // Expiry date should be after start date
        if (expiryDate <= startDate) {
            return false;
        }

        // Expiry date should not be more than 2 years in the future
        const twoYearsFromNow = new Date();
        twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

        if (expiryDate > twoYearsFromNow) {
            return false;
        }

        return true;
    }
}

