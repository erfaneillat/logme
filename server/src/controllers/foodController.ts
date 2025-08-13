import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { FoodAnalysisService } from '../services/foodAnalysisService';
import DailyLog from '../models/DailyLog';

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

        const result = await this.service.analyze(base64);

        // Save to daily logs (upsert) using today's local date (YYYY-MM-DD)
        const userId = req.user?.userId;
        if (userId) {
            const todayIso = new Date().toISOString().slice(0, 10);
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
                            timeIso,
                            imageUrl,
                        },
                    },
                }
            );
        }

        res.status(200).json({ success: true, data: result, timestamp: new Date() });
    });
}


