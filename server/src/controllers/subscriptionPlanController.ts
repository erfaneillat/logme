import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import SubscriptionPlan from '../models/SubscriptionPlan';

interface AuthRequest extends Request {
    user?: any;
}

export class SubscriptionPlanController {
    // Get all subscription plans (public - can be accessed by mobile app)
    async getAllPlans(req: Request, res: Response): Promise<void> {
        try {
            const { activeOnly } = req.query;

            const filter: any = {};
            if (activeOnly === 'true') {
                filter.isActive = true;
            }

            console.log('Getting plans with filter:', filter);
            const plans = await SubscriptionPlan.find(filter).sort({ sortOrder: 1 });
            console.log('Found plans:', plans.length);

            res.json({
                success: true,
                data: { plans },
            });
        } catch (error) {
            console.error('Get all plans error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Get a single subscription plan by ID (public)
    async getPlanById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const plan = await SubscriptionPlan.findById(id);
            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: 'Plan not found',
                });
                return;
            }

            res.json({
                success: true,
                data: { plan },
            });
        } catch (error) {
            console.error('Get plan by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Create a new subscription plan (admin only)
    async createPlan(req: AuthRequest, res: Response): Promise<void> {
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
                title,
                duration,
                price,
                originalPrice,
                discountPercentage,
                pricePerMonth,
                cafebazaarProductKey,
                isActive,
                features,
                sortOrder,
            } = req.body;

            // Check if plan with same duration already exists
            const existingPlan = await SubscriptionPlan.findOne({ duration });
            if (existingPlan) {
                res.status(400).json({
                    success: false,
                    message: `A ${duration} plan already exists`,
                });
                return;
            }

            const plan = new SubscriptionPlan({
                name,
                title,
                duration,
                price,
                originalPrice,
                discountPercentage,
                pricePerMonth,
                cafebazaarProductKey,
                isActive: isActive !== undefined ? isActive : true,
                features: features || [],
                sortOrder: sortOrder !== undefined ? sortOrder : 0,
            });

            await plan.save();

            res.status(201).json({
                success: true,
                data: { plan },
                message: 'Plan created successfully',
            });
        } catch (error) {
            console.error('Create plan error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Update plan (admin only)
    async updatePlan(req: AuthRequest, res: Response): Promise<void> {
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
            const {
                name,
                title,
                duration,
                price,
                originalPrice,
                discountPercentage,
                pricePerMonth,
                cafebazaarProductKey,
                isActive,
                features,
                sortOrder,
            } = req.body;

            const plan = await SubscriptionPlan.findById(id);

            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: 'Plan not found',
                });
                return;
            }

            // Update all fields
            if (name !== undefined) plan.name = name;
            if (title !== undefined) plan.title = title;
            if (duration !== undefined) plan.duration = duration;
            if (price !== undefined) plan.price = price;
            if (originalPrice !== undefined) plan.originalPrice = originalPrice;
            if (discountPercentage !== undefined) plan.discountPercentage = discountPercentage;
            if (pricePerMonth !== undefined) plan.pricePerMonth = pricePerMonth;
            if (cafebazaarProductKey !== undefined) plan.cafebazaarProductKey = cafebazaarProductKey;
            if (isActive !== undefined) plan.isActive = isActive;
            if (features !== undefined) plan.features = features;
            if (sortOrder !== undefined) plan.sortOrder = sortOrder;

            await plan.save();

            res.json({
                success: true,
                data: { plan },
                message: 'Plan updated successfully',
            });
        } catch (error) {
            console.error('Update plan error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Update plan price only (admin only) - kept for backward compatibility
    async updatePlanPrice(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
                return;
            }

            const { duration } = req.params; // 'monthly' or 'yearly'
            const { title, price, originalPrice, discountPercentage, pricePerMonth, cafebazaarProductKey } = req.body;

            // Find plan by duration
            const plan = await SubscriptionPlan.findOne({ duration });

            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: `${duration} plan not found`,
                });
                return;
            }

            // Update only price-related fields, title, and cafebazaar product key
            if (title !== undefined) plan.title = title;
            if (price !== undefined) plan.price = price;
            if (originalPrice !== undefined) plan.originalPrice = originalPrice;
            if (discountPercentage !== undefined) plan.discountPercentage = discountPercentage;
            if (pricePerMonth !== undefined) plan.pricePerMonth = pricePerMonth;
            if (cafebazaarProductKey !== undefined) plan.cafebazaarProductKey = cafebazaarProductKey;

            await plan.save();

            res.json({
                success: true,
                data: { plan },
                message: 'Plan price updated successfully',
            });
        } catch (error) {
            console.error('Update plan price error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Delete plan (admin only)
    async deletePlan(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const plan = await SubscriptionPlan.findById(id);

            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: 'Plan not found',
                });
                return;
            }

            await plan.deleteOne();

            res.json({
                success: true,
                message: 'Plan deleted successfully',
            });
        } catch (error) {
            console.error('Delete plan error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Toggle plan active status (admin only)
    async togglePlanStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const plan = await SubscriptionPlan.findById(id);

            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: 'Plan not found',
                });
                return;
            }

            plan.isActive = !plan.isActive;
            await plan.save();

            res.json({
                success: true,
                data: { plan },
                message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
            });
        } catch (error) {
            console.error('Toggle plan status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

}

