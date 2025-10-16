import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import SubscriptionPlan from '../models/SubscriptionPlan';
import fs from 'fs';
import path from 'path';
import errorLogger from '../services/errorLoggerService';

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
            errorLogger.error('Get all plans error:', error);
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
            errorLogger.error('Get plan by ID error:', error);
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
                imageUrl,
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
                imageUrl,
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
            errorLogger.error('Create plan error:', error);
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
                imageUrl,
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
            if (imageUrl !== undefined) plan.imageUrl = imageUrl;
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
            errorLogger.error('Update plan error:', error);
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
            errorLogger.error('Update plan price error:', error);
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

            // Delete associated image if exists
            if (plan.imageUrl) {
                this.deleteImageFile(plan.imageUrl);
            }

            await plan.deleteOne();

            res.json({
                success: true,
                message: 'Plan deleted successfully',
            });
        } catch (error) {
            errorLogger.error('Delete plan error:', error);
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
            errorLogger.error('Toggle plan status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Upload plan image (admin only)
    async uploadPlanImage(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const file = (req as any).file as Express.Multer.File | undefined;

            if (!file) {
                res.status(400).json({
                    success: false,
                    message: 'Image file is required',
                });
                return;
            }

            const plan = await SubscriptionPlan.findById(id);

            if (!plan) {
                // Delete uploaded file if plan not found
                try {
                    fs.unlinkSync(file.path);
                } catch (err) {
                    errorLogger.error('Error deleting file:', err);
                }
                res.status(404).json({
                    success: false,
                    message: 'Plan not found',
                });
                return;
            }

            // Delete old image if exists
            if (plan.imageUrl) {
                this.deleteImageFile(plan.imageUrl);
            }

            // Update plan with new image URL
            plan.imageUrl = `/api/subscription-plans/images/${file.filename}`;
            await plan.save();

            res.json({
                success: true,
                data: { plan },
                message: 'Image uploaded successfully',
            });
        } catch (error) {
            errorLogger.error('Upload plan image error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Delete plan image (admin only)
    async deletePlanImage(req: AuthRequest, res: Response): Promise<void> {
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

            if (!plan.imageUrl) {
                res.status(400).json({
                    success: false,
                    message: 'Plan has no image',
                });
                return;
            }

            // Delete image file
            this.deleteImageFile(plan.imageUrl);

            // Remove image URL from plan using $unset
            plan.set({ imageUrl: undefined });
            await plan.save();

            res.json({
                success: true,
                data: { plan },
                message: 'Image deleted successfully',
            });
        } catch (error) {
            errorLogger.error('Delete plan image error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    // Helper method to delete image file from disk
    private deleteImageFile(imageUrl: string): void {
        try {
            // Extract filename from URL
            const filename = imageUrl.split('/').pop();
            if (filename) {
                const uploadsDir = path.join(__dirname, '../../uploads/plans');
                const filepath = path.join(uploadsDir, filename);
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
            }
        } catch (err) {
            errorLogger.error('Error deleting image file:', err);
        }
    }

}

