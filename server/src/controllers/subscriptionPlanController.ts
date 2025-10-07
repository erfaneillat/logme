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

    // Update plan price only (admin only)
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
            const { price, originalPrice, discountPercentage, pricePerMonth, cafebazaarProductKey } = req.body;

            // Find plan by duration
            const plan = await SubscriptionPlan.findOne({ duration });

            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: `${duration} plan not found`,
                });
                return;
            }

            // Update only price-related fields and cafebazaar product key
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

}

