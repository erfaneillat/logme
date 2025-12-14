import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Payment from '../models/Payment';
import Subscription from '../models/Subscription';
import SubscriptionPlan from '../models/SubscriptionPlan';
import Offer from '../models/Offer';
import User from '../models/User';
import ReferralLog from '../models/ReferralLog';
import { ZarinpalService } from '../services/zarinpalService';
import { PurchaseVerificationService } from '../services/purchaseVerificationService';
import errorLogger from '../services/errorLoggerService';
import mongoose from 'mongoose';

export class PaymentController {
    private zarinpalService: ZarinpalService;

    constructor() {
        this.zarinpalService = ZarinpalService.fromEnvironment();
    }

    /**
     * Create a new Zarinpal payment request
     * POST /api/payment/zarinpal/create
     * 
     * Body: { planId: string, offerId?: string }
     */
    async createZarinpalPayment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const { planId, offerId } = req.body;

            if (!planId) {
                res.status(400).json({
                    success: false,
                    message: 'Plan ID is required',
                });
                return;
            }

            // Validate plan exists and is active
            const plan = await SubscriptionPlan.findById(planId);
            if (!plan || !plan.isActive) {
                res.status(404).json({
                    success: false,
                    message: 'پلن اشتراک یافت نشد',
                });
                return;
            }

            // Calculate final price
            let finalPrice = plan.price;
            let offer = null;

            if (offerId) {
                offer = await Offer.findById(offerId);
                if (offer && offer.isActive) {
                    // Check if offer applies to this plan
                    const planIdStr = String(plan._id);
                    const applicablePlanIds = offer.applicablePlans.map((p: any) =>
                        typeof p === 'object' && p !== null ? String(p._id || p) : String(p)
                    );
                    const offerApplies = offer.applyToAllPlans || applicablePlanIds.includes(planIdStr);

                    if (offerApplies) {
                        // Check for plan-specific pricing
                        const planPricing = offer.planPricing?.find((pp: any) => {
                            const ppPlanId = typeof pp.planId === 'object' && pp.planId !== null
                                ? String(pp.planId._id || pp.planId)
                                : String(pp.planId);
                            return ppPlanId === planIdStr;
                        });

                        if (planPricing && planPricing.discountedPrice !== undefined) {
                            finalPrice = planPricing.discountedPrice;
                        } else if (offer.offerType === 'percentage' && offer.discountPercentage) {
                            finalPrice = Math.round(plan.price * (1 - offer.discountPercentage / 100));
                        } else if (offer.offerType === 'fixed_amount' && offer.discountAmount) {
                            finalPrice = Math.max(0, plan.price - offer.discountAmount);
                        }
                    }
                }
            }

            // Minimum amount check (Zarinpal minimum is 1000 Tomans)
            if (finalPrice < 1000) {
                res.status(400).json({
                    success: false,
                    message: 'مبلغ پرداخت باید حداقل ۱۰۰۰ تومان باشد',
                });
                return;
            }

            // Get user info for payment metadata
            const user = await User.findById(userId);
            const userPhone = user?.phone || '';

            // Generate callback URL - use environment variable or appropriate default
            const isDev = process.env.NODE_ENV === 'development';
            const defaultAppUrl = isDev ? 'http://localhost:9000' : 'https://loqmeapp.ir';
            const baseUrl = process.env.APP_URL || defaultAppUrl;
            const callbackUrl = `${baseUrl}/api/payment/zarinpal/callback`;

            // Convert to Rials for Zarinpal
            const amountRials = ZarinpalService.tomansToRials(finalPrice);

            // Create payment request with Zarinpal
            const description = `خرید اشتراک ${plan.title || plan.name} - لقمه`;

            const paymentResponse = await this.zarinpalService.createPayment({
                amount: amountRials,
                description,
                callbackUrl,
                mobile: userPhone,
                orderId: `${userId}-${Date.now()}`,
                metadata: {
                    userId: userId.toString(),
                    planId: planId,
                    offerId: offerId || null,
                    planName: plan.name,
                    planDuration: plan.duration,
                },
            });

            if (!paymentResponse.success || !paymentResponse.authority) {
                console.error('❌ Failed to create Zarinpal payment:', paymentResponse);
                res.status(400).json({
                    success: false,
                    message: paymentResponse.message || 'خطا در ایجاد پرداخت',
                    code: paymentResponse.code,
                });
                return;
            }

            // Save payment record
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

            const payment = new Payment({
                userId,
                planId: plan._id,
                offerId: offer?._id,
                gateway: 'zarinpal',
                authority: paymentResponse.authority,
                amount: finalPrice,
                amountRials,
                status: 'pending',
                description,
                callbackUrl,
                expiresAt,
                metadata: {
                    planName: plan.name,
                    planDuration: plan.duration,
                    offerName: offer?.name,
                },
            });

            await payment.save();

            console.log('✅ Zarinpal payment created:', {
                paymentId: payment._id,
                userId,
                planId,
                amount: finalPrice,
                authority: paymentResponse.authority,
            });

            res.json({
                success: true,
                data: {
                    authority: paymentResponse.authority,
                    paymentUrl: paymentResponse.paymentUrl,
                    amount: finalPrice,
                    amountRials,
                    expiresAt,
                },
            });
        } catch (error) {
            errorLogger.error('Create Zarinpal payment error:', error);
            res.status(500).json({
                success: false,
                message: 'خطای داخلی سرور',
            });
        }
    }

    /**
     * Zarinpal payment callback handler
     * GET /api/payment/zarinpal/callback
     * 
     * Query: { Authority: string, Status: string }
     */
    async zarinpalCallback(req: Request, res: Response): Promise<void> {
        try {
            const { Authority, Status } = req.query;
            const authority = Authority as string;
            const status = Status as string;

            console.log('🔔 Zarinpal callback received:', {
                authority,
                status,
            });

            // Determine redirect base URL for webapp
            // IMPORTANT: Must end with trailing slash to prevent Next.js from stripping query params
            const isDev = process.env.NODE_ENV === 'development';
            // Force hardcoded URL in dev to be safe
            let webappBaseUrl = isDev ? 'http://localhost:3000/app/' : (process.env.WEBAPP_URL || 'https://loqmeapp.ir/app/');

            // Ensure trailing slash just in case
            if (!webappBaseUrl.endsWith('/')) {
                webappBaseUrl += '/';
            }

            console.log('🔗 Redirect Base URL:', webappBaseUrl);

            if (!authority) {
                const redirectUrl = `${webappBaseUrl}#payment=error&message=invalid_authority`;
                console.log('⚠️ Redirecting to:', redirectUrl);
                res.redirect(redirectUrl);
                return;
            }

            // Find the payment record
            const payment = await Payment.findOne({ authority });
            if (!payment) {
                console.error('❌ Payment not found for authority:', authority);
                res.redirect(`${webappBaseUrl}#payment=error&message=payment_not_found`);
                return;
            }

            // Check if payment is already processed
            if (payment.status !== 'pending') {
                console.log('⚠️ Payment already processed:', {
                    authority,
                    status: payment.status,
                });

                if (payment.status === 'success') {
                    res.redirect(`${webappBaseUrl}#payment=success&refId=${payment.refId}`);
                } else {
                    res.redirect(`${webappBaseUrl}#payment=failed&status=${payment.status}`);
                }
                return;
            }

            // Check if user cancelled
            if (status !== 'OK') {
                console.log('❌ Payment cancelled by user:', { authority, status });

                payment.status = 'cancelled';
                await payment.save();

                res.redirect(`${webappBaseUrl}#payment=cancelled`);
                return;
            }

            // Verify payment with Zarinpal
            const verifyResponse = await this.zarinpalService.verifyPayment({
                authority,
                amount: payment.amountRials,
            });

            if (!verifyResponse.success) {
                console.error('❌ Payment verification failed:', verifyResponse);

                payment.status = 'failed';
                await payment.save();

                res.redirect(`${webappBaseUrl}#payment=failed&code=${verifyResponse.code}`);
                return;
            }

            // Payment successful!
            payment.status = 'success';
            payment.refId = String(verifyResponse.refId);
            if (verifyResponse.cardPan) {
                payment.cardPan = verifyResponse.cardPan;
            }
            if (verifyResponse.cardHash) {
                payment.cardHash = verifyResponse.cardHash;
            }
            payment.verifiedAt = new Date();
            await payment.save();

            console.log('✅ Payment verified successfully:', {
                authority,
                refId: verifyResponse.refId,
                cardPan: verifyResponse.cardPan,
            });

            // Activate subscription
            await this.activateSubscription(payment);

            // Redirect to success page using Hash Fragment (#) to survive redirects
            // Example: http://localhost:3000/app/#payment=success&refId=...
            const redirectUrl = `${webappBaseUrl}#payment=success&refId=${verifyResponse.refId}`;
            console.log('✅ Redirecting to (SUCCESS, HASH):', redirectUrl);
            res.redirect(redirectUrl);
        } catch (error) {
            errorLogger.error('Zarinpal callback error:', error);

            const webappBaseUrl = process.env.WEBAPP_URL || 'https://loqmeapp.ir/app';
            res.redirect(`${webappBaseUrl}#payment=error&message=internal_error`);
        }
    }

    /**
     * Verify payment status (for frontend polling/checking)
     * POST /api/payment/zarinpal/verify
     * 
     * Body: { authority: string }
     */
    async verifyZarinpalPayment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const { authority } = req.body;

            if (!authority) {
                res.status(400).json({
                    success: false,
                    message: 'Authority is required',
                });
                return;
            }

            // Find payment
            const payment = await Payment.findOne({
                authority,
                userId,
            });

            if (!payment) {
                res.status(404).json({
                    success: false,
                    message: 'پرداخت یافت نشد',
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    status: payment.status,
                    refId: payment.refId,
                    amount: payment.amount,
                    verifiedAt: payment.verifiedAt,
                    planId: payment.planId,
                },
            });
        } catch (error) {
            errorLogger.error('Verify Zarinpal payment error:', error);
            res.status(500).json({
                success: false,
                message: 'خطای داخلی سرور',
            });
        }
    }

    /**
     * Get pending payments for user
     * GET /api/payment/pending
     */
    async getPendingPayments(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const payments = await Payment.find({
                userId,
                status: 'pending',
                expiresAt: { $gt: new Date() },
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('planId', 'name title duration price');

            res.json({
                success: true,
                data: {
                    payments: payments.map(p => ({
                        authority: p.authority,
                        amount: p.amount,
                        status: p.status,
                        expiresAt: p.expiresAt,
                        plan: p.planId,
                        createdAt: p.createdAt,
                    })),
                },
            });
        } catch (error) {
            errorLogger.error('Get pending payments error:', error);
            res.status(500).json({
                success: false,
                message: 'خطای داخلی سرور',
            });
        }
    }

    /**
     * Get payment history for user
     * GET /api/payment/history
     */
    async getPaymentHistory(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const payments = await Payment.find({
                userId,
            })
                .sort({ createdAt: -1 })
                .limit(20)
                .populate('planId', 'name title duration price');

            res.json({
                success: true,
                data: {
                    payments: payments.map(p => ({
                        authority: p.authority,
                        amount: p.amount,
                        status: p.status,
                        refId: p.refId,
                        cardPan: p.cardPan,
                        plan: p.planId,
                        verifiedAt: p.verifiedAt,
                        createdAt: p.createdAt,
                    })),
                },
            });
        } catch (error) {
            errorLogger.error('Get payment history error:', error);
            res.status(500).json({
                success: false,
                message: 'خطای داخلی سرور',
            });
        }
    }

    /**
     * Activate subscription after successful payment
     */
    private async activateSubscription(payment: any): Promise<void> {
        try {
            const userId = payment.userId;
            const planId = payment.planId;

            // Get plan details
            const plan = await SubscriptionPlan.findById(planId);
            if (!plan) {
                errorLogger.error('Plan not found for subscription activation:', { planId });
                return;
            }

            // Determine plan type
            let planType: 'monthly' | 'yearly' | 'threeMonth';
            switch (plan.duration) {
                case 'yearly':
                    planType = 'yearly';
                    break;
                case '3month':
                    planType = 'threeMonth';
                    break;
                default:
                    planType = 'monthly';
            }

            // Calculate dates
            const startDate = new Date();

            // Check for existing active subscription to stack
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
                    console.log('📅 Stacking subscription time:', {
                        previousExpiry: previousActive.expiryDate,
                        newExpiry: expiryDate,
                        addedDays: Math.round(remainingMs / (1000 * 60 * 60 * 24)),
                    });
                }
            }

            // Deactivate existing subscriptions
            await Subscription.updateMany(
                { userId, isActive: true },
                { $set: { isActive: false } }
            );

            // Create new subscription
            const subscription = new Subscription({
                userId,
                planType,
                productKey: `zarinpal_${plan.duration}_${payment.refId}`,
                purchaseToken: payment.authority,
                orderId: payment.refId || payment.authority,
                payload: JSON.stringify({
                    paymentId: payment._id,
                    gateway: 'zarinpal',
                    amount: payment.amount,
                    cardPan: payment.cardPan,
                }),
                isActive: true,
                startDate,
                expiryDate,
                autoRenew: false, // Zarinpal payments don't auto-renew
            });

            await subscription.save();

            console.log('✅ Subscription activated:', {
                subscriptionId: subscription._id,
                userId,
                planType,
                startDate,
                expiryDate,
            });

            // Handle referral reward
            await this.handleReferralReward(userId, planType, payment);

        } catch (error) {
            errorLogger.error('Activate subscription error:', error);
            throw error;
        }
    }

    /**
     * Handle referral reward after successful purchase
     */
    private async handleReferralReward(
        userId: mongoose.Types.ObjectId | string,
        planType: string,
        payment: any
    ): Promise<void> {
        try {
            const purchasingUser = await User.findById(userId);
            if (!purchasingUser || !purchasingUser.referredBy) {
                return;
            }

            const referrer = await User.findOne({ referralCode: purchasingUser.referredBy });
            if (!referrer) {
                return;
            }

            const reward = parseInt(process.env.REFERRAL_REWARD_TOMAN || '25000', 10);
            const isFirstPurchase = !purchasingUser.referralRewardCredited;

            referrer.referralSuccessCount = (referrer.referralSuccessCount || 0) + 1;
            referrer.referralEarnings = (referrer.referralEarnings || 0) + reward;
            await referrer.save();

            if (isFirstPurchase) {
                purchasingUser.referralRewardCredited = true;
                await purchasingUser.save();
            }

            // Log the referral reward
            const referralLog = new ReferralLog({
                referrerId: referrer._id,
                referredUserId: purchasingUser._id,
                referralCode: purchasingUser.referredBy,
                eventType: isFirstPurchase ? 'first_purchase' : 'subscription_purchase',
                reward,
                subscriptionPlanType: planType,
                metadata: {
                    gateway: 'zarinpal',
                    paymentId: payment._id,
                    refId: payment.refId,
                },
            });
            await referralLog.save();

            console.log('💰 Referral reward credited (Zarinpal):', {
                referrerId: referrer._id,
                purchasingUserId: userId,
                reward,
                eventType: isFirstPurchase ? 'first_purchase' : 'subscription_purchase',
            });
        } catch (error) {
            errorLogger.error('Handle referral reward error:', error);
        }
    }
}

export const paymentController = new PaymentController();
