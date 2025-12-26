/**
 * Error codes returned by the API
 * These codes are language-independent and should be used for logic decisions
 */

// Subscription/Limit related errors
export const ERROR_CODES = {
    // Daily limits
    DAILY_MESSAGE_LIMIT_REACHED: 'DAILY_MESSAGE_LIMIT_REACHED',
    DAILY_ANALYSIS_LIMIT_REACHED: 'DAILY_ANALYSIS_LIMIT_REACHED',
    DAILY_EXERCISE_LIMIT_REACHED: 'DAILY_EXERCISE_LIMIT_REACHED',

    // Subscription required
    SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
    SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',

    // Authentication
    UNAUTHORIZED: 'UNAUTHORIZED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    // Generic
    RATE_LIMITED: 'RATE_LIMITED',
    INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Check if an error code indicates a subscription-related issue
 * that should redirect to the subscription page
 */
export const isSubscriptionError = (errorCode: string | undefined): boolean => {
    if (!errorCode) return false;

    const subscriptionRelatedCodes: string[] = [
        ERROR_CODES.DAILY_MESSAGE_LIMIT_REACHED,
        ERROR_CODES.DAILY_ANALYSIS_LIMIT_REACHED,
        ERROR_CODES.DAILY_EXERCISE_LIMIT_REACHED,
        ERROR_CODES.SUBSCRIPTION_REQUIRED,
        ERROR_CODES.SUBSCRIPTION_EXPIRED,
        ERROR_CODES.INSUFFICIENT_CREDITS,
    ];

    return subscriptionRelatedCodes.includes(errorCode);
};

/**
 * Custom error class that includes an error code
 */
export class ApiError extends Error {
    code?: string;

    constructor(message: string, code?: string) {
        super(message);
        this.code = code;
        this.name = 'ApiError';
    }
}
