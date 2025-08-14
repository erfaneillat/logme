import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { FoodAnalysisService } from '../services/foodAnalysisService';
import DailyLog from '../models/DailyLog';
import User from '../models/User';

interface AuthRequest extends Request { user?: any }

export class FoodController {
    private _service: FoodAnalysisService | null = null;

    private get service(): FoodAnalysisService {
        if (!this._service) {
            this._service = new FoodAnalysisService();
        }
        return this._service;
    }

    public analyzeImage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
        // multer stores file info at req.file
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
            res.status(400).json({ success: false, error: 'Image file is required', timestamp: new Date() });
            return;
        }

        // Debug: log what multer is giving us
        console.log('Multer file info:', {
            mimetype: file.mimetype,
            originalname: file.originalname,
            filename: file.filename,
            size: file.size
        });

        // Read file buffer for OpenAI analysis
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(file.path);
        const base64 = fileBuffer.toString('base64');

        const analysis = await this.service.analyze(base64);
        const result = analysis.data;

        // Save to daily logs (upsert) using provided date (YYYY-MM-DD),
        // falling back to server local date if not provided
        const userId = req.user?.userId;
        if (userId) {
            const bodyDate = (req.body as any)?.date as string | undefined;
            let targetDate: string;
            if (bodyDate && typeof bodyDate === 'string') {
                targetDate = bodyDate.slice(0, 10);
            } else {
                // Local date in server timezone
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                targetDate = `${y}-${m}-${d}`;
            }
            const todayIso = targetDate;
            const timeIso = new Date().toISOString();

            // Create image URL
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const imageUrl = `${baseUrl}/api/food/images/${file.filename}`;

            console.log('Saving image URL:', imageUrl);

            // Step 1: upsert totals
            await DailyLog.findOneAndUpdate(
                { userId, date: todayIso },
                {
                    userId,
                    date: todayIso,
                    $inc: {
                        caloriesConsumed: Math.round(result.calories || 0),
                        carbsGrams: Math.round(result.carbsGrams || 0),
                        proteinGrams: Math.round(result.proteinGrams || 0),
                        fatsGrams: Math.round(result.fatGrams || 0),
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // Step 2: ensure items array receives the entry
            await DailyLog.updateOne(
                { userId, date: todayIso },
                {
                    $push: {
                        items: {
                            title: result.title,
                            calories: Math.round(result.calories || 0),
                            carbsGrams: Math.round(result.carbsGrams || 0),
                            proteinGrams: Math.round(result.proteinGrams || 0),
                            fatsGrams: Math.round(result.fatGrams || 0),
                            healthScore: Math.max(0, Math.min(10, Math.round(result.healthScore || 0))),
                            timeIso,
                            imageUrl,
                            ingredients: result.ingredients?.map(ing => ({
                                name: ing.name,
                                calories: Math.round(ing.calories || 0),
                                proteinGrams: Math.round(ing.proteinGrams || 0),
                                fatGrams: Math.round(ing.fatGrams || 0),
                                carbsGrams: Math.round(ing.carbsGrams || 0),
                            })) || [],
                        },
                    },
                }
            );

            // Increment user's cumulative AI cost if available
            const cost = analysis.meta?.costUsd;
            if (typeof cost === 'number' && isFinite(cost) && cost > 0) {
                await User.findByIdAndUpdate(userId, { $inc: { aiCostUsdTotal: cost } }).exec();
            }
        }

        res.status(200).json({ success: true, data: result, meta: analysis.meta, timestamp: new Date() });
    });
}


