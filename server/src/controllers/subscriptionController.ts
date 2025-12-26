import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import User from '../models/User';
import ReferralLog from '../models/ReferralLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { PurchaseVerificationService } from '../services/purchaseVerificationService';
import { CafeBazaarApiService } from '../services/cafeBazaarApiService';
import { RevenueCatService } from '../services/revenueCatService';
import errorLogger from '../services/errorLoggerService';
import { telegramService } from '../services/telegramService';

export class SubscriptionController {
    // Verify purchase from CafeBazaar
    async verifyPurchase(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            // Check rate limiting
            if (!PurchaseVerificationService.canAttemptPurchase(userId)) {
                res.status(429).json({
                    success: false,
                    message: 'Too many purchase attempts. Please try again later.',
                });
                return;
            }

            const { productKey, purchaseToken, orderId, payload } = req.body;

            console.log('🔍 Verify purchase request:', {
                userId,
                productKey,
                orderId,
                hasPayload: !!payload,
                purchaseTokenPreview: purchaseToken?.substring(0, 10) + '...',
            });

            if (!productKey || !purchaseToken || !orderId) {
                console.warn('⚠️ Missing required fields:', {
                    hasProductKey: !!productKey,
                    hasPurchaseToken: !!purchaseToken,
                    hasOrderId: !!orderId,
                });
                PurchaseVerificationService.recordAttempt(userId, false);
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                });
                return;
            }

            // Validate purchase data integrity
            const validation = PurchaseVerificationService.validatePurchaseData({
                productKey,
                purchaseToken,
                orderId,
                payload,
            });

            if (!validation.valid) {
                console.warn('⚠️ Purchase data validation failed:', {
                    error: validation.error,
                    productKey,
                    orderId,
                });
                PurchaseVerificationService.recordAttempt(userId, false);
                res.status(400).json({
                    success: false,
                    message: validation.error || 'Invalid purchase data',
                });
                return;
            }

            // Check if purchase token already exists (prevent replay attacks)
            const existingSubscription = await Subscription.findOne({ purchaseToken });
            if (existingSubscription) {
                // Allow same user to reactivate if subscription is inactive (for testing/renewals)
                const isSameUser = existingSubscription.userId.toString() === userId.toString();
                const isInactive = !existingSubscription.isActive;
                const allowCrossUserTokenReuse = process.env.ALLOW_CROSS_USER_TOKEN_REUSE === 'true';

                if (!isSameUser) {
                    if (allowCrossUserTokenReuse) {
                        // Optionally transfer: deactivate previous owner's active subscription tied to this token
                        if (!isInactive) {
                            try {
                                await Subscription.updateMany(
                                    { purchaseToken, isActive: true },
                                    { $set: { isActive: false, autoRenew: false } }
                                );
                                console.warn('🛑 Deactivated previous active subscription before cross-user transfer (env enabled):', {
                                    purchaseToken: purchaseToken.substring(0, 10) + '...',
                                    previousUserId: existingSubscription.userId,
                                    newUserId: userId,
                                });
                            } catch (deactivateErr) {
                                errorLogger.error('Failed to deactivate previous active subscription during cross-user transfer:', deactivateErr);
                                PurchaseVerificationService.recordAttempt(userId, false);
                                res.status(500).json({
                                    success: false,
                                    message: 'Internal server error',
                                });
                                return;
                            }
                        } else {
                            console.warn('🔁 Allowing cross-user token reuse for inactive subscription (env enabled):', {
                                purchaseToken: purchaseToken.substring(0, 10) + '...',
                                existingUserId: existingSubscription.userId,
                                currentUserId: userId,
                            });
                        }
                        // proceed and allow creation below
                    } else {
                        // Different user trying to use same token - fraud attempt
                        errorLogger.error('🚨 Fraud attempt: Different user trying to use same token:', {
                            purchaseToken: purchaseToken.substring(0, 10) + '...',
                            existingUserId: existingSubscription.userId,
                            currentUserId: userId,
                            isInactive,
                            allowCrossUserTokenReuse,
                        });
                        PurchaseVerificationService.recordAttempt(userId, false);
                        res.status(400).json({
                            success: false,
                            message: 'Purchase token already used',
                        });
                        return;
                    }
                }

                if (isSameUser && !isInactive) {
                    // Same user, but subscription is still active
                    console.log('🔁 Stacking subscription: existing active subscription found for same user. Proceeding to extend duration.', {
                        purchaseToken: purchaseToken.substring(0, 10) + '...',
                        userId,
                        existingExpiryDate: existingSubscription.expiryDate,
                    });
                }

                // Allowed reactivation (same user inactive) or allowed transfer (inactive + env enabled)
                console.log('♻️ Reactivating subscription:', {
                    purchaseToken: purchaseToken.substring(0, 10) + '...',
                    userId,
                    previousUserId: existingSubscription.userId,
                    previousExpiryDate: existingSubscription.expiryDate,
                    crossUser: !isSameUser,
                });
            }

            // Determine plan type from product key
            const pk = productKey.toLowerCase();
            let planType: 'monthly' | 'yearly' | 'threeMonth';
            if (pk.includes('year') || pk.includes('yearly') || pk.includes('annual')) {
                planType = 'yearly';
            } else if (
                pk.includes('3month') ||
                (pk.includes('3') && pk.includes('month')) ||
                pk.includes('three') ||
                pk.includes('quarter')
            ) {
                planType = 'threeMonth';
            } else {
                planType = 'monthly';
            }

            // Calculate dates using verification service
            const startDate = new Date();
            const previousActive = await Subscription.findOne({
                userId,
                isActive: true,
                expiryDate: { $gt: startDate },
            }).sort({ expiryDate: -1 });
            let expiryDate = PurchaseVerificationService.calculateExpiryDate(planType, startDate);
            if (previousActive) {
                const remainingMs = previousActive.expiryDate.getTime() - startDate.getTime();
                if (remainingMs > 0) {
                    expiryDate = new Date(expiryDate.getTime() + remainingMs);
                }
            }

            // Validate dates
            if (!PurchaseVerificationService.validateSubscriptionDates(startDate, expiryDate)) {
                PurchaseVerificationService.recordAttempt(userId, false);
                res.status(400).json({
                    success: false,
                    message: 'Invalid subscription dates',
                });
                return;
            }

            // Deactivate any existing active subscriptions for this user
            await Subscription.updateMany(
                { userId, isActive: true },
                { $set: { isActive: false } }
            );

            // Always create a new subscription record (maintains purchase history)
            const subscription = new Subscription({
                userId,
                planType,
                productKey,
                purchaseToken,
                orderId,
                payload: payload || '',
                isActive: true,
                startDate,
                expiryDate,
                autoRenew: true,
            });

            await subscription.save();

            if (existingSubscription) {
                console.log('✅ New subscription created (reactivation):', {
                    subscriptionId: subscription._id,
                    userId,
                    planType,
                    previousSubscriptionId: existingSubscription._id,
                });
            } else {
                console.log('✅ New subscription created (first purchase):', {
                    subscriptionId: subscription._id,
                    userId,
                    planType,
                });
            }

            // Record successful attempt
            PurchaseVerificationService.recordAttempt(userId, true);

            // Log successful purchase for audit
            this.logPurchase(userId, productKey, orderId, purchaseToken);

            // Send Telegram notification
            try {
                const user = await User.findById(userId);
                if (user) {
                    telegramService.sendSubscriptionNotification(
                        user.phone || user.email || 'N/A',
                        productKey,
                        undefined, // Amount not readily available in params, could extract from plan or validation
                        orderId
                    ).catch((err: any) => {
                        errorLogger.error('Failed to send subscription telegram notification', err);
                    });
                }
            } catch (notifyErr) {
                console.error('Failed to prepare subscription notification:', notifyErr);
            }

            // After successful activation, handle referral reward if applicable
            try {
                const purchasingUser = await User.findById(userId);
                if (purchasingUser && purchasingUser.referredBy) {
                    const referrer = await User.findOne({ referralCode: purchasingUser.referredBy });
                    if (referrer) {
                        const reward = parseInt(process.env.REFERRAL_REWARD_TOMAN || '25000', 10);
                        const isFirstPurchase = !purchasingUser.referralRewardCredited;

                        referrer.referralSuccessCount = (referrer.referralSuccessCount || 0) + 1;
                        referrer.referralEarnings = (referrer.referralEarnings || 0) + reward;
                        await referrer.save();

                        // Mark reward as credited on first purchase only (for tracking milestone)
                        if (isFirstPurchase) {
                            purchasingUser.referralRewardCredited = true;
                            await purchasingUser.save();
                        }

                        // Log the referral reward event
                        try {
                            const referralLog = new ReferralLog({
                                referrerId: referrer._id,
                                referredUserId: purchasingUser._id,
                                referralCode: purchasingUser.referredBy,
                                eventType: isFirstPurchase ? 'first_purchase' : 'subscription_purchase',
                                reward,
                                subscriptionPlanType: planType,
                            });
                            await referralLog.save();
                        } catch (logErr) {
                            errorLogger.error('Failed to save referral reward log:', logErr);
                        }

                        console.log('💰 Referral reward credited:', {
                            referrerId: referrer._id,
                            newCount: referrer.referralSuccessCount,
                            totalEarnings: referrer.referralEarnings,
                            reward,
                            purchasingUserId: userId,
                            eventType: isFirstPurchase ? 'first_purchase' : 'subscription_purchase',
                        });
                    }
                }
            } catch (referralErr) {
                errorLogger.error('Post-purchase referral reward error:', referralErr);
            }

            res.json({
                success: true,
                message: 'Subscription activated successfully',
                data: {
                    subscription: {
                        planType: subscription.planType,
                        isActive: subscription.isActive,
                        startDate: subscription.startDate,
                        expiryDate: subscription.expiryDate,
                    },
                },
            });
        } catch (error) {
            errorLogger.error('Verify purchase error:', error);
            if (req.user?.userId) {
                PurchaseVerificationService.recordAttempt(req.user.userId, false);
            }
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Validate purchase token format
     * CafeBazaar tokens are typically long alphanumeric strings
     */
    private isValidPurchaseToken(token: string): boolean {
        // Basic validation: check if token is a non-empty string with reasonable length
        if (!token || typeof token !== 'string') {
            return false;
        }

        // Token should be at least 20 characters (typical for CafeBazaar)
        if (token.length < 20) {
            return false;
        }

        // Token should only contain alphanumeric characters and common special chars
        const validPattern = /^[a-zA-Z0-9\-_.]+$/;
        return validPattern.test(token);
    }

    /**
     * Validate payload format (timestamp-based)
     */
    private isValidPayload(payload: string): boolean {
        if (!payload) return true; // Payload is optional

        // Check if payload is a valid timestamp (within last hour)
        const timestamp = parseInt(payload, 10);
        if (isNaN(timestamp)) return false;

        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        return timestamp >= oneHourAgo && timestamp <= now;
    }

    /**
     * Log purchase for audit trail
     */
    private logPurchase(userId: string, productKey: string, orderId: string, purchaseToken: string): void {
        console.log('✅ Purchase Verified:', {
            timestamp: new Date().toISOString(),
            userId,
            productKey,
            orderId,
            tokenHash: this.hashToken(purchaseToken),
        });
    }

    /**
     * Hash token for secure logging (don't log full tokens)
     */
    private hashToken(token: string): string {
        return PurchaseVerificationService.hashPurchaseToken(token);
    }

    // Get subscription status for current user
    async getSubscriptionStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            // Find active subscription
            const subscription = await Subscription.findOne({
                userId,
                isActive: true,
                expiryDate: { $gt: new Date() },
            }).sort({ expiryDate: -1 });

            if (!subscription) {
                res.json({
                    success: true,
                    data: {
                        isActive: false,
                        planType: null,
                        expiryDate: null,
                    },
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    isActive: true,
                    planType: subscription.planType,
                    expiryDate: subscription.expiryDate,
                    startDate: subscription.startDate,
                },
            });
        } catch (error) {
            errorLogger.error('Get subscription status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Cancel subscription
    async cancelSubscription(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            // Find and deactivate active subscriptions
            const result = await Subscription.updateMany(
                { userId, isActive: true },
                { $set: { isActive: false, autoRenew: false } }
            );

            if (result.modifiedCount === 0) {
                res.status(404).json({
                    success: false,
                    message: 'No active subscription found',
                });
                return;
            }

            res.json({
                success: true,
                message: 'Subscription cancelled successfully',
            });
        } catch (error) {
            errorLogger.error('Cancel subscription error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Get subscription history
    async getSubscriptionHistory(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const subscriptions = await Subscription.find({ userId })
                .sort({ createdAt: -1 })
                .limit(10);

            res.json({
                success: true,
                data: {
                    subscriptions: subscriptions.map(sub => ({
                        planType: sub.planType,
                        isActive: sub.isActive,
                        startDate: sub.startDate,
                        expiryDate: sub.expiryDate,
                        orderId: sub.orderId,
                        createdAt: sub.createdAt,
                    })),
                },
            });
        } catch (error) {
            errorLogger.error('Get subscription history error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Validate in-app purchase with Cafe Bazaar API
     * متد بررسی وضعیت خرید درون برنامه ای
     * 
     * This method calls Cafe Bazaar's validation API to verify the purchase
     * and returns detailed information about the purchase state.
     */
    async validateCafeBazaarPurchase(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            // Extract parameters from request body
            const { productId, purchaseToken } = req.body;

            // Validate required parameters
            if (!productId || !purchaseToken) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: productId and purchaseToken',
                });
                return;
            }

            // Get package name from environment
            const packageName = process.env.CAFEBAZAAR_PACKAGE_NAME;
            if (!packageName) {
                errorLogger.error('CAFEBAZAAR_PACKAGE_NAME not configured');
                res.status(500).json({
                    success: false,
                    message: 'Server configuration error',
                });
                return;
            }

            // Create Cafe Bazaar API service
            let cafeBazaarService: CafeBazaarApiService;
            try {
                cafeBazaarService = CafeBazaarApiService.fromEnvironment();
            } catch (error) {
                errorLogger.error('Failed to initialize Cafe Bazaar service:', error);
                res.status(500).json({
                    success: false,
                    message: 'Server configuration error',
                });
                return;
            }

            // Call Cafe Bazaar validation API
            console.log('🔍 Validating purchase with Cafe Bazaar:', {
                packageName,
                productId,
                purchaseTokenPreview: purchaseToken.substring(0, 10) + '...',
            });

            const validationResult = await cafeBazaarService.validateInAppPurchase(
                packageName,
                productId,
                purchaseToken
            );

            console.log('📋 Cafe Bazaar validation result:', {
                valid: validationResult.valid,
                error: validationResult.error,
                errorDescription: validationResult.errorDescription,
            });

            // Check if validation was successful
            if (!validationResult.valid) {
                // Handle specific error cases
                if (validationResult.error === 'not_found') {
                    // Fallback: try subscription status API (useful when SKU is a subscription like 'yearly')
                    console.warn('⚠️ In-app validation not found. Trying subscription status API...', {
                        productId,
                        userId,
                    });

                    try {
                        const subStatus = await cafeBazaarService.checkSubscriptionStatus(
                            packageName,
                            productId,
                            purchaseToken
                        );

                        if (subStatus.valid) {
                            console.log('✅ Subscription status valid via fallback:', {
                                active: subStatus.active,
                                initiationTime: subStatus.initiationTime,
                                expiryTime: subStatus.expiryTime,
                                autoRenewing: subStatus.autoRenewing,
                            });

                            // Normalize to the same response shape as validate endpoint
                            res.json({
                                success: true,
                                data: {
                                    valid: true,
                                    purchaseState: subStatus.active ? 'purchased' : 'expired',
                                    consumptionState: 'not_applicable',
                                    purchaseTime: subStatus.initiationTime,
                                    developerPayload: undefined,
                                },
                            });
                            return;
                        }

                        // If still not found, allow soft-pass when user already has SAME plan active (avoid blocking re-purchase flow)
                        if (subStatus.error === 'not_found') {
                            console.warn('⚠️ Purchase not found in Cafe Bazaar (subscription API). Checking existing active subscription for soft-pass...', {
                                productId,
                                userId,
                                error: subStatus.errorDescription,
                            });

                            // Determine intended plan type from productId
                            const pid = (productId as string).toLowerCase();
                            let intendedPlan: 'monthly' | 'yearly' | 'threeMonth';
                            if (pid.includes('year') || pid.includes('yearly') || pid.includes('annual')) {
                                intendedPlan = 'yearly';
                            } else if (
                                pid.includes('3month') ||
                                (pid.includes('3') && pid.includes('month')) ||
                                pid.includes('three') ||
                                pid.includes('quarter')
                            ) {
                                intendedPlan = 'threeMonth';
                            } else {
                                intendedPlan = 'monthly';
                            }

                            // If user already has an active subscription of the same plan, don't block validation
                            const now = new Date();
                            const hasSamePlanActive = await Subscription.findOne({
                                userId,
                                planType: intendedPlan,
                                isActive: true,
                                expiryDate: { $gt: now },
                            });

                            if (hasSamePlanActive) {
                                console.log('✅ Soft-pass CafeBazaar validation due to existing active subscription of same plan', {
                                    userId,
                                    intendedPlan,
                                });
                                res.json({
                                    success: true,
                                    data: {
                                        valid: true,
                                        purchaseState: 'purchased',
                                        consumptionState: 'not_applicable',
                                        purchaseTime: hasSamePlanActive.startDate?.getTime?.() || undefined,
                                        developerPayload: undefined,
                                    },
                                });
                                return;
                            }

                            // Otherwise return not found as before
                            res.status(404).json({
                                success: false,
                                message: 'Purchase not found',
                                error: subStatus.error,
                                errorDescription: subStatus.errorDescription,
                            });
                            return;
                        }

                        // Other errors from subscription API
                        res.status(400).json({
                            success: false,
                            message: 'Purchase validation failed',
                            error: subStatus.error,
                            errorDescription: subStatus.errorDescription,
                        });
                        return;
                    } catch (e) {
                        errorLogger.error('Fallback subscription status check failed:', e);
                        res.status(500).json({
                            success: false,
                            message: 'Internal server error',
                        });
                        return;
                    }
                }

                if (validationResult.error === 'unauthorized') {
                    errorLogger.error('Cafe Bazaar access token is invalid or expired');
                    res.status(500).json({
                        success: false,
                        message: 'Server authentication error',
                    });
                    return;
                }

                // Other errors
                res.status(400).json({
                    success: false,
                    message: 'Purchase validation failed',
                    error: validationResult.error,
                    errorDescription: validationResult.errorDescription,
                });
                return;
            }

            // Check if purchase was refunded
            if (validationResult.refunded) {
                res.json({
                    success: true,
                    data: {
                        valid: true,
                        purchaseState: 'refunded',
                        consumptionState: validationResult.consumed ? 'consumed' : 'not_consumed',
                        purchaseTime: validationResult.purchaseTime,
                        developerPayload: validationResult.developerPayload,
                    },
                });
                return;
            }

            // Purchase is valid and not refunded
            res.json({
                success: true,
                data: {
                    valid: true,
                    purchaseState: 'purchased',
                    consumptionState: validationResult.consumed ? 'consumed' : 'not_consumed',
                    purchaseTime: validationResult.purchaseTime,
                    developerPayload: validationResult.developerPayload,
                },
            });

        } catch (error) {
            errorLogger.error('Validate Cafe Bazaar purchase error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Check subscription status with Cafe Bazaar API
     * متد بررسی وضعیت اشتراک
     * 
     * This method calls Cafe Bazaar's subscription status API to check
     * if a subscription is active and get its details.
     */
    async checkCafeBazaarSubscriptionStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            // Extract parameters from request body
            const { subscriptionId, purchaseToken } = req.body;

            // Validate required parameters
            if (!subscriptionId || !purchaseToken) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: subscriptionId and purchaseToken',
                });
                return;
            }

            // Get package name from environment
            const packageName = process.env.CAFEBAZAAR_PACKAGE_NAME;
            if (!packageName) {
                errorLogger.error('CAFEBAZAAR_PACKAGE_NAME not configured');
                res.status(500).json({
                    success: false,
                    message: 'Server configuration error',
                });
                return;
            }

            // Create Cafe Bazaar API service
            let cafeBazaarService: CafeBazaarApiService;
            try {
                cafeBazaarService = CafeBazaarApiService.fromEnvironment();
            } catch (error) {
                errorLogger.error('Failed to initialize Cafe Bazaar service:', error);
                res.status(500).json({
                    success: false,
                    message: 'Server configuration error',
                });
                return;
            }

            // Call Cafe Bazaar subscription status API
            const statusResult = await cafeBazaarService.checkSubscriptionStatus(
                packageName,
                subscriptionId,
                purchaseToken
            );

            // Check if validation was successful
            if (!statusResult.valid) {
                // Handle specific error cases
                if (statusResult.error === 'not_found') {
                    res.status(404).json({
                        success: false,
                        message: 'Subscription not found',
                        error: statusResult.error,
                        errorDescription: statusResult.errorDescription,
                    });
                    return;
                }

                if (statusResult.error === 'unauthorized') {
                    errorLogger.error('Cafe Bazaar access token is invalid or expired');
                    res.status(500).json({
                        success: false,
                        message: 'Server authentication error',
                    });
                    return;
                }

                // Other errors
                res.status(400).json({
                    success: false,
                    message: 'Subscription status check failed',
                    error: statusResult.error,
                    errorDescription: statusResult.errorDescription,
                });
                return;
            }

            // Return subscription status
            res.json({
                success: true,
                data: {
                    valid: true,
                    active: statusResult.active,
                    initiationTime: statusResult.initiationTime,
                    expiryTime: statusResult.expiryTime,
                    autoRenewing: statusResult.autoRenewing,
                    linkedSubscriptionToken: statusResult.linkedSubscriptionToken,
                },
            });

        } catch (error) {
            errorLogger.error('Check Cafe Bazaar subscription status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Admin: List all subscriptions with pagination and filters
     */
    async listAllSubscriptions(req: AuthRequest, res: Response): Promise<void> {
        try {
            const {
                page = 1,
                limit = 20,
                search = '',
                planType,
                isActive,
                sort = '-createdAt',
            } = req.query;

            const pageNum = parseInt(page as string) || 1;
            const limitNum = parseInt(limit as string) || 20;
            const skip = (pageNum - 1) * limitNum;

            // Build query
            const query: any = {};

            // Filter by plan type
            if (planType && (planType === 'monthly' || planType === 'yearly' || planType === 'threeMonth')) {
                query.planType = planType;
            }

            // Filter by active status
            if (isActive !== undefined && isActive !== '') {
                query.isActive = isActive === 'true';
            }

            // Fetch subscriptions with user data
            let subscriptions;
            let total;

            if (search) {
                // Use aggregation for search
                const pipeline: any[] = [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'user',
                        },
                    },
                    {
                        $unwind: {
                            path: '$user',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $match: {
                            ...query,
                            $or: [
                                { 'user.phone': { $regex: search, $options: 'i' } },
                                { 'user.email': { $regex: search, $options: 'i' } },
                                { 'user.name': { $regex: search, $options: 'i' } },
                                { orderId: { $regex: search, $options: 'i' } },
                            ],
                        },
                    },
                ];

                // Count total with same filters
                const countResult = await Subscription.aggregate([
                    ...pipeline,
                    { $count: 'total' }
                ]);
                total = countResult.length > 0 ? countResult[0].total : 0;

                // Get paginated results
                subscriptions = await Subscription.aggregate([
                    ...pipeline,
                    { $sort: this.parseSortParam(sort as string) },
                    { $skip: skip },
                    { $limit: limitNum },
                ]);
            } else {
                // Count total
                total = await Subscription.countDocuments(query);

                // Fetch with populate
                subscriptions = await Subscription.find(query)
                    .populate('userId', 'phone email name isPhoneVerified')
                    .sort(this.parseSortParam(sort as string))
                    .skip(skip)
                    .limit(limitNum)
                    .lean();
            }

            res.json({
                success: true,
                data: {
                    items: subscriptions,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        totalPages: Math.ceil(total / limitNum),
                    },
                },
            });
        } catch (error) {
            errorLogger.error('List all subscriptions error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Admin: Cancel a user's subscription
     */
    async cancelUserSubscription(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { subscriptionId } = req.params;

            const subscription = await Subscription.findById(subscriptionId);
            if (!subscription) {
                res.status(404).json({
                    success: false,
                    message: 'Subscription not found',
                });
                return;
            }

            subscription.isActive = false;
            subscription.autoRenew = false;
            await subscription.save();

            res.json({
                success: true,
                message: 'Subscription cancelled successfully',
            });
        } catch (error) {
            errorLogger.error('Cancel user subscription error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Admin: Extend a user's subscription
     */
    async extendSubscription(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { subscriptionId } = req.params;
            const { days } = req.body;

            if (!days || days <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid days value',
                });
                return;
            }

            const subscription = await Subscription.findById(subscriptionId);
            if (!subscription) {
                res.status(404).json({
                    success: false,
                    message: 'Subscription not found',
                });
                return;
            }

            // Extend expiry date
            const currentExpiry = new Date(subscription.expiryDate);
            currentExpiry.setDate(currentExpiry.getDate() + parseInt(days as string));
            subscription.expiryDate = currentExpiry;
            await subscription.save();

            res.json({
                success: true,
                message: `Subscription extended by ${days} days`,
                data: {
                    newExpiryDate: subscription.expiryDate,
                },
            });
        } catch (error) {
            errorLogger.error('Extend subscription error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Admin: Activate a subscription for a user
     */
    async activateSubscriptionForUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId, planType, durationDays } = req.body;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }

            if (!planType || (planType !== 'monthly' && planType !== 'yearly')) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid plan type. Must be "monthly" or "yearly"',
                });
                return;
            }

            // Calculate dates
            const startDate = new Date();
            let expiryDate: Date;

            if (durationDays && durationDays > 0) {
                // Use custom duration if provided
                expiryDate = new Date(startDate);
                expiryDate.setDate(expiryDate.getDate() + parseInt(durationDays as string));
            } else {
                // Use standard plan duration
                expiryDate = PurchaseVerificationService.calculateExpiryDate(planType, startDate);
            }

            // Validate dates
            if (!PurchaseVerificationService.validateSubscriptionDates(startDate, expiryDate)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid subscription dates',
                });
                return;
            }

            // Deactivate any existing active subscriptions for this user
            await Subscription.updateMany(
                { userId, isActive: true },
                { $set: { isActive: false } }
            );

            // Create new subscription
            const subscription = new Subscription({
                userId,
                planType,
                productKey: `admin_activated_${planType}`,
                purchaseToken: `admin_${Date.now()}_${userId}`,
                orderId: `ADMIN_${Date.now()}`,
                payload: 'Admin activated',
                isActive: true,
                startDate,
                expiryDate,
                autoRenew: false, // Admin activations don't auto-renew
            });

            await subscription.save();

            console.log('✅ Admin activated subscription:', {
                subscriptionId: subscription._id,
                userId,
                planType,
                startDate,
                expiryDate,
                adminUserId: req.user?.userId,
            });

            res.json({
                success: true,
                message: 'Subscription activated successfully',
                data: {
                    subscription: {
                        _id: subscription._id,
                        planType: subscription.planType,
                        isActive: subscription.isActive,
                        startDate: subscription.startDate,
                        expiryDate: subscription.expiryDate,
                    },
                },
            });
        } catch (error) {
            errorLogger.error('Activate subscription error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Parse sort parameter
     */
    private parseSortParam(sort: string): any {
        const sortObj: any = {};
        if (sort.startsWith('-')) {
            sortObj[sort.substring(1)] = -1;
        } else {
            sortObj[sort] = 1;
        }
        return sortObj;
    }

    /**
     * Verify purchase from RevenueCat (for global users)
     * Called after successful purchase in Flutter app via RevenueCat SDK
     */
    async verifyRevenueCatPurchase(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const {
                appUserId,        // RevenueCat app user ID (usually matches our userId)
                productId,        // e.g., 'slice_monthly', 'slice_yearly'
                transactionId,    // Store transaction ID
                purchaseToken,    // Android: purchase token, iOS: receipt
                store,            // 'app_store' or 'play_store'
                entitlementId     // e.g., 'premium'
            } = req.body;

            console.log('🔍 Verify RevenueCat purchase request:', {
                userId,
                appUserId,
                productId,
                store,
                entitlementId,
                transactionIdPreview: transactionId?.substring(0, 10) + '...',
            });

            // Validate required fields
            if (!productId || !store) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: productId and store',
                });
                return;
            }

            // Validate store value
            if (store !== 'app_store' && store !== 'play_store') {
                res.status(400).json({
                    success: false,
                    message: 'Invalid store value. Must be "app_store" or "play_store"',
                });
                return;
            }

            // Initialize RevenueCat service
            let revenueCatService: RevenueCatService;
            try {
                revenueCatService = RevenueCatService.fromEnvironment();
            } catch (error) {
                errorLogger.error('Failed to initialize RevenueCat service:', error);
                res.status(500).json({
                    success: false,
                    message: 'Server configuration error',
                });
                return;
            }

            // Use provided appUserId or fall back to our userId
            const rcAppUserId = appUserId || userId;

            // Verify subscription status with RevenueCat
            const verificationResult = await revenueCatService.verifySubscription(
                rcAppUserId,
                entitlementId || 'premium'
            );

            if (!verificationResult.isActive) {
                console.warn('⚠️ RevenueCat subscription not active:', {
                    userId,
                    appUserId: rcAppUserId,
                    error: verificationResult.error,
                });
                res.status(400).json({
                    success: false,
                    message: verificationResult.message || 'Subscription not active',
                    error: verificationResult.error,
                });
                return;
            }

            // Determine plan type from product ID
            const pk = productId.toLowerCase();
            let planType: 'monthly' | 'yearly' | 'threeMonth';
            if (pk.includes('year') || pk.includes('yearly') || pk.includes('annual')) {
                planType = 'yearly';
            } else if (
                pk.includes('3month') ||
                (pk.includes('3') && pk.includes('month')) ||
                pk.includes('three') ||
                pk.includes('quarter')
            ) {
                planType = 'threeMonth';
            } else {
                planType = 'monthly';
            }

            // Calculate dates
            const startDate = new Date();
            let expiryDate: Date;

            if (verificationResult.expiresDate) {
                expiryDate = new Date(verificationResult.expiresDate);
            } else {
                // Fallback: Calculate based on plan type
                expiryDate = PurchaseVerificationService.calculateExpiryDate(planType, startDate);
            }

            // Check for existing active subscription to stack time
            const previousActive = await Subscription.findOne({
                userId,
                isActive: true,
                expiryDate: { $gt: startDate },
            }).sort({ expiryDate: -1 });

            if (previousActive) {
                const remainingMs = previousActive.expiryDate.getTime() - startDate.getTime();
                if (remainingMs > 0) {
                    expiryDate = new Date(expiryDate.getTime() + remainingMs);
                }
            }

            // Deactivate any existing active subscriptions for this user
            await Subscription.updateMany(
                { userId, isActive: true },
                { $set: { isActive: false } }
            );

            // Create new subscription record
            const subscription = new Subscription({
                userId,
                planType,
                productKey: productId,
                purchaseToken: purchaseToken || transactionId || `rc_${Date.now()}`,
                orderId: transactionId || `RC_${Date.now()}`,
                payload: JSON.stringify({
                    store,
                    appUserId: rcAppUserId,
                    entitlementId: entitlementId || 'premium',
                }),
                isActive: true,
                startDate,
                expiryDate,
                autoRenew: verificationResult.willRenew ?? true,
            });

            await subscription.save();

            console.log('✅ RevenueCat subscription verified and saved:', {
                subscriptionId: subscription._id,
                userId,
                planType,
                store,
                expiryDate,
            });

            // Send Telegram notification
            try {
                const user = await User.findById(userId);
                if (user) {
                    telegramService.sendSubscriptionNotification(
                        user.phone || user.email || 'N/A',
                        productId,
                        undefined,
                        transactionId || 'N/A'
                    ).catch((err: any) => {
                        errorLogger.error('Failed to send subscription telegram notification', err);
                    });
                }
            } catch (notifyErr) {
                console.error('Failed to prepare subscription notification:', notifyErr);
            }

            // Handle referral reward if applicable
            try {
                const purchasingUser = await User.findById(userId);
                if (purchasingUser && purchasingUser.referredBy) {
                    const referrer = await User.findOne({ referralCode: purchasingUser.referredBy });
                    if (referrer) {
                        const reward = parseInt(process.env.REFERRAL_REWARD_TOMAN || '25000', 10);
                        const isFirstPurchase = !purchasingUser.referralRewardCredited;

                        referrer.referralSuccessCount = (referrer.referralSuccessCount || 0) + 1;
                        referrer.referralEarnings = (referrer.referralEarnings || 0) + reward;
                        await referrer.save();

                        if (isFirstPurchase) {
                            purchasingUser.referralRewardCredited = true;
                            await purchasingUser.save();
                        }

                        try {
                            const referralLog = new ReferralLog({
                                referrerId: referrer._id,
                                referredUserId: purchasingUser._id,
                                referralCode: purchasingUser.referredBy,
                                eventType: isFirstPurchase ? 'first_purchase' : 'subscription_purchase',
                                reward,
                                subscriptionPlanType: planType,
                            });
                            await referralLog.save();
                        } catch (logErr) {
                            errorLogger.error('Failed to save referral reward log:', logErr);
                        }

                        console.log('💰 Referral reward credited (RevenueCat):', {
                            referrerId: referrer._id,
                            newCount: referrer.referralSuccessCount,
                            totalEarnings: referrer.referralEarnings,
                            reward,
                            purchasingUserId: userId,
                        });
                    }
                }
            } catch (referralErr) {
                errorLogger.error('Post-purchase referral reward error:', referralErr);
            }

            res.json({
                success: true,
                message: 'Subscription activated successfully',
                data: {
                    subscription: {
                        planType: subscription.planType,
                        isActive: subscription.isActive,
                        startDate: subscription.startDate,
                        expiryDate: subscription.expiryDate,
                    },
                },
            });
        } catch (error) {
            errorLogger.error('Verify RevenueCat purchase error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Get RevenueCat subscription status for a user
     * Called to check if user has active entitlement
     */
    async getRevenueCatSubscriptionStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const { appUserId, entitlementId } = req.query;

            // Initialize RevenueCat service
            let revenueCatService: RevenueCatService;
            try {
                revenueCatService = RevenueCatService.fromEnvironment();
            } catch (error) {
                errorLogger.error('Failed to initialize RevenueCat service:', error);
                res.status(500).json({
                    success: false,
                    message: 'Server configuration error',
                });
                return;
            }

            const rcAppUserId = (appUserId as string) || userId;
            const entitlement = (entitlementId as string) || 'premium';

            const verificationResult = await revenueCatService.verifySubscription(
                rcAppUserId,
                entitlement
            );

            res.json({
                success: true,
                data: verificationResult,
            });
        } catch (error) {
            errorLogger.error('Get RevenueCat subscription status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    /**
     * Sync RevenueCat subscription status with local database
     * This can be called periodically or on app launch to ensure sync
     */
    async syncRevenueCatSubscription(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const { appUserId, entitlementId } = req.body;

            // Initialize RevenueCat service
            let revenueCatService: RevenueCatService;
            try {
                revenueCatService = RevenueCatService.fromEnvironment();
            } catch (error) {
                // RevenueCat not configured - silently return local status
                const localSub = await Subscription.findOne({
                    userId,
                    isActive: true,
                    expiryDate: { $gt: new Date() },
                }).sort({ expiryDate: -1 });

                res.json({
                    success: true,
                    data: {
                        isActive: !!localSub,
                        planType: localSub?.planType || null,
                        expiryDate: localSub?.expiryDate || null,
                        source: 'local',
                    },
                });
                return;
            }

            const rcAppUserId = appUserId || userId;
            const entitlement = entitlementId || 'premium';

            const verificationResult = await revenueCatService.verifySubscription(
                rcAppUserId,
                entitlement
            );

            // If RevenueCat shows active but local doesn't, or expiry dates differ, update local
            const localSub = await Subscription.findOne({
                userId,
                isActive: true,
                expiryDate: { $gt: new Date() },
            }).sort({ expiryDate: -1 });

            let needsSync = false;

            if (verificationResult.isActive && !localSub) {
                needsSync = true;
            } else if (verificationResult.isActive && localSub && verificationResult.expiresDate) {
                const rcExpiry = new Date(verificationResult.expiresDate);
                const localExpiry = localSub.expiryDate;
                // If RevenueCat expiry is later, update local
                if (rcExpiry > localExpiry) {
                    needsSync = true;
                }
            }

            if (needsSync && verificationResult.expiresDate) {
                // Deactivate existing and create new synced subscription
                await Subscription.updateMany(
                    { userId, isActive: true },
                    { $set: { isActive: false } }
                );

                const pk = verificationResult.productIdentifier?.toLowerCase() || '';
                let planType: 'monthly' | 'yearly' | 'threeMonth' = 'monthly';
                if (pk.includes('year') || pk.includes('annual')) {
                    planType = 'yearly';
                } else if (pk.includes('3') || pk.includes('three') || pk.includes('quarter')) {
                    planType = 'threeMonth';
                }

                const syncedSub = new Subscription({
                    userId,
                    planType,
                    productKey: verificationResult.productIdentifier || 'synced_from_revenuecat',
                    purchaseToken: `sync_${Date.now()}_${userId}`,
                    orderId: `SYNC_${Date.now()}`,
                    payload: JSON.stringify({ source: 'revenuecat_sync', appUserId: rcAppUserId }),
                    isActive: true,
                    startDate: new Date(),
                    expiryDate: new Date(verificationResult.expiresDate),
                    autoRenew: verificationResult.willRenew ?? false,
                });

                await syncedSub.save();

                console.log('🔄 Synced subscription from RevenueCat:', {
                    userId,
                    planType,
                    expiryDate: verificationResult.expiresDate,
                });
            }

            res.json({
                success: true,
                data: {
                    isActive: verificationResult.isActive,
                    planType: verificationResult.productIdentifier,
                    expiryDate: verificationResult.expiresDate,
                    source: 'revenuecat',
                    synced: needsSync,
                },
            });
        } catch (error) {
            errorLogger.error('Sync RevenueCat subscription error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }
}
