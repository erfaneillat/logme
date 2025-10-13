import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../middleware/authMiddleware';
import { PurchaseVerificationService } from '../services/purchaseVerificationService';
import { CafeBazaarApiService } from '../services/cafeBazaarApiService';

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
                
                if (!isSameUser) {
                    // Different user trying to use same token - fraud attempt
                    console.error('🚨 Fraud attempt: Different user trying to use same token:', {
                        purchaseToken: purchaseToken.substring(0, 10) + '...',
                        existingUserId: existingSubscription.userId,
                        currentUserId: userId,
                    });
                    PurchaseVerificationService.recordAttempt(userId, false);
                    res.status(400).json({
                        success: false,
                        message: 'Purchase token already used',
                    });
                    return;
                }
                
                if (!isInactive) {
                    // Same user, but subscription is still active
                    console.warn('⚠️ Purchase token already used for active subscription:', {
                        purchaseToken: purchaseToken.substring(0, 10) + '...',
                        userId,
                        isActive: existingSubscription.isActive,
                        expiryDate: existingSubscription.expiryDate,
                    });
                    PurchaseVerificationService.recordAttempt(userId, false);
                    res.status(400).json({
                        success: false,
                        message: 'You already have an active subscription',
                    });
                    return;
                }
                
                // Same user, inactive subscription - allow reactivation
                console.log('♻️ Reactivating subscription for same user:', {
                    purchaseToken: purchaseToken.substring(0, 10) + '...',
                    userId,
                    previousExpiryDate: existingSubscription.expiryDate,
                });
            }

            // Determine plan type from product key
            const planType = productKey.toLowerCase().includes('yearly') ? 'yearly' : 'monthly';

            // Calculate dates using verification service
            const startDate = new Date();
            const expiryDate = PurchaseVerificationService.calculateExpiryDate(planType, startDate);

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
            console.error('Verify purchase error:', error);
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
            console.error('Get subscription status error:', error);
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
            console.error('Cancel subscription error:', error);
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
            console.error('Get subscription history error:', error);
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
                console.error('CAFEBAZAAR_PACKAGE_NAME not configured');
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
                console.error('Failed to initialize Cafe Bazaar service:', error);
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

                        // If still not found, return 404 as before
                        if (subStatus.error === 'not_found') {
                            console.warn('⚠️ Purchase not found in Cafe Bazaar (subscription API):', {
                                productId,
                                userId,
                                error: subStatus.errorDescription,
                            });
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
                        console.error('Fallback subscription status check failed:', e);
                        res.status(500).json({
                            success: false,
                            message: 'Internal server error',
                        });
                        return;
                    }
                }

                if (validationResult.error === 'unauthorized') {
                    console.error('Cafe Bazaar access token is invalid or expired');
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
            console.error('Validate Cafe Bazaar purchase error:', error);
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
                console.error('CAFEBAZAAR_PACKAGE_NAME not configured');
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
                console.error('Failed to initialize Cafe Bazaar service:', error);
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
                    console.error('Cafe Bazaar access token is invalid or expired');
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
            console.error('Check Cafe Bazaar subscription status error:', error);
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
            if (planType && (planType === 'monthly' || planType === 'yearly')) {
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
            console.error('List all subscriptions error:', error);
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
            console.error('Cancel user subscription error:', error);
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
            console.error('Extend subscription error:', error);
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
            console.error('Activate subscription error:', error);
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
}
