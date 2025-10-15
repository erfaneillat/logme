import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Offer from '../models/Offer';
import SubscriptionPlan from '../models/SubscriptionPlan';
import User from '../models/User';
import Subscription from '../models/Subscription';

interface AuthRequest extends Request {
    user?: any;
}

export class OfferController {
    // Get all offers (admin)
    async getAllOffers(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { activeOnly } = req.query;

            const filter: any = {};
            if (activeOnly === 'true') {
                filter.isActive = true;
            }

            const offers = await Offer.find(filter)
                .populate('applicablePlans', 'name title duration')
                .sort({ priority: -1, createdAt: -1 });

            res.json({
                success: true,
                data: { offers },
            });
        } catch (error) {
            console.error('Get all offers error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Get active offers for a user (public - with user context)
    async getActiveOffersForUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            // Get user information
            let userCreatedAt = new Date();
            let hasActiveSubscription = false;
            let hasExpiredSubscription = false;

            if (userId) {
                const user = await User.findById(userId);
                if (user) {
                    userCreatedAt = user.createdAt;
                }

                // Check for active subscription
                const activeSubscription = await Subscription.findOne({
                    userId,
                    status: 'active',
                });
                hasActiveSubscription = !!activeSubscription;

                // Check for expired subscription
                const expiredSubscription = await Subscription.findOne({
                    userId,
                    status: { $in: ['expired', 'cancelled'] },
                });
                hasExpiredSubscription = !!expiredSubscription;
            }

            const now = new Date();

            // Get all active offers
            const allOffers = await Offer.find({
                isActive: true,
                $or: [
                    { isTimeLimited: false },
                    {
                        $and: [
                            { isTimeLimited: true },
                            {
                                $or: [
                                    { startDate: { $exists: false } },
                                    { startDate: { $lte: now } },
                                ],
                            },
                            {
                                $or: [
                                    { endDate: { $exists: false } },
                                    { endDate: { $gte: now } },
                                ],
                            },
                        ],
                    },
                ],
            })
                .populate('applicablePlans', 'name title duration price originalPrice discountPercentage')
                .sort({ priority: -1 });

            // Build set of product keys already purchased by the user (to hide such offers)
            let purchasedKeys = new Set<string>();
            if (userId) {
                try {
                    const keys = await Subscription.distinct('productKey', { userId });
                    purchasedKeys = new Set((keys as string[]).filter(Boolean));
                } catch (_) {}
            }

            // Filter offers that apply to this user and are not previously purchased
            const applicableOffers = allOffers.filter((offer: any) => {
                // Check usage limit
                if (offer.maxUsageLimit && offer.usageCount >= offer.maxUsageLimit) {
                    return false;
                }
                // Exclude if the user has already purchased this offer's product key
                if (offer.cafebazaarProductKey && purchasedKeys.has(offer.cafebazaarProductKey)) {
                    return false;
                }

                return offer.appliesTo(userCreatedAt, hasActiveSubscription, hasExpiredSubscription);
            });

            res.json({
                success: true,
                data: { offers: applicableOffers },
            });
        } catch (error) {
            console.error('Get active offers for user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Get offer by ID or slug
    async getOfferById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Offer ID or slug is required',
                });
                return;
            }

            let offer;
            // Check if id is a valid ObjectId or slug
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                offer = await Offer.findById(id).populate('applicablePlans', 'name title duration');
            } else {
                offer = await Offer.findOne({ slug: id }).populate('applicablePlans', 'name title duration');
            }

            if (!offer) {
                res.status(404).json({
                    success: false,
                    message: 'Offer not found',
                });
                return;
            }

            res.json({
                success: true,
                data: { offer },
            });
        } catch (error) {
            console.error('Get offer by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Create offer (admin only)
    async createOffer(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
                return;
            }

            const {
                name,
                slug,
                description,
                display,
                offerType,
                discountPercentage,
                discountAmount,
                startDate,
                endDate,
                isTimeLimited,
                targetUserType,
                conditions,
                applicablePlans,
                applyToAllPlans,
                priority,
                isActive,
                maxUsageLimit,
            } = req.body;

            // Check if slug already exists
            const existingOffer = await Offer.findOne({ slug });
            if (existingOffer) {
                res.status(400).json({
                    success: false,
                    message: 'An offer with this slug already exists',
                });
                return;
            }

            // Validate applicable plans exist
            if (!applyToAllPlans && applicablePlans && applicablePlans.length > 0) {
                const plans = await SubscriptionPlan.find({ _id: { $in: applicablePlans } });
                if (plans.length !== applicablePlans.length) {
                    res.status(400).json({
                        success: false,
                        message: 'Some subscription plans do not exist',
                    });
                    return;
                }
            }

            const offer = new Offer({
                name,
                slug,
                description,
                display,
                offerType,
                discountPercentage,
                discountAmount,
                startDate,
                endDate,
                isTimeLimited: isTimeLimited !== undefined ? isTimeLimited : false,
                targetUserType: targetUserType || 'all',
                conditions: conditions || {},
                applicablePlans: applyToAllPlans ? [] : applicablePlans || [],
                applyToAllPlans: applyToAllPlans !== undefined ? applyToAllPlans : false,
                priority: priority !== undefined ? priority : 0,
                isActive: isActive !== undefined ? isActive : true,
                maxUsageLimit,
                usageCount: 0,
                createdBy: req.user?.userId,
            });

            await offer.save();

            res.status(201).json({
                success: true,
                data: { offer },
                message: 'Offer created successfully',
            });
        } catch (error) {
            console.error('Create offer error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Update offer (admin only)
    async updateOffer(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
                return;
            }

            const { id } = req.params;
            const updateData = req.body;

            const offer = await Offer.findById(id);

            if (!offer) {
                res.status(404).json({
                    success: false,
                    message: 'Offer not found',
                });
                return;
            }

            // Check if slug is being changed and if new slug already exists
            if (updateData.slug && updateData.slug !== offer.slug) {
                const existingOffer = await Offer.findOne({ slug: updateData.slug });
                if (existingOffer) {
                    res.status(400).json({
                        success: false,
                        message: 'An offer with this slug already exists',
                    });
                    return;
                }
            }

            // Validate applicable plans exist
            if (updateData.applicablePlans && updateData.applicablePlans.length > 0) {
                const plans = await SubscriptionPlan.find({ _id: { $in: updateData.applicablePlans } });
                if (plans.length !== updateData.applicablePlans.length) {
                    res.status(400).json({
                        success: false,
                        message: 'Some subscription plans do not exist',
                    });
                    return;
                }
            }

            // Update fields
            Object.keys(updateData).forEach((key) => {
                if (key !== '_id' && key !== 'usageCount' && key !== 'createdAt') {
                    (offer as any)[key] = updateData[key];
                }
            });

            await offer.save();

            res.json({
                success: true,
                data: { offer },
                message: 'Offer updated successfully',
            });
        } catch (error) {
            console.error('Update offer error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Delete offer (admin only)
    async deleteOffer(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const offer = await Offer.findById(id);

            if (!offer) {
                res.status(404).json({
                    success: false,
                    message: 'Offer not found',
                });
                return;
            }

            await offer.deleteOne();

            res.json({
                success: true,
                message: 'Offer deleted successfully',
            });
        } catch (error) {
            console.error('Delete offer error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Toggle offer active status (admin only)
    async toggleOfferStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const offer = await Offer.findById(id);

            if (!offer) {
                res.status(404).json({
                    success: false,
                    message: 'Offer not found',
                });
                return;
            }

            offer.isActive = !offer.isActive;
            await offer.save();

            res.json({
                success: true,
                data: { offer },
                message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
            });
        } catch (error) {
            console.error('Toggle offer status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Increment usage count (internal use)
    async incrementUsageCount(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const offer = await Offer.findById(id);

            if (!offer) {
                res.status(404).json({
                    success: false,
                    message: 'Offer not found',
                });
                return;
            }

            offer.usageCount += 1;
            await offer.save();

            res.json({
                success: true,
                data: { offer },
                message: 'Usage count incremented',
            });
        } catch (error) {
            console.error('Increment usage count error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }
}
