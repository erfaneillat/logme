import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../middleware/authMiddleware';
import { PurchaseVerificationService } from '../services/purchaseVerificationService';

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

            if (!productKey || !purchaseToken || !orderId) {
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
                PurchaseVerificationService.recordAttempt(userId, false);
                res.status(400).json({
                    success: false,
                    message: 'Purchase token already used',
                });
                return;
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

            // Create new subscription
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
}

