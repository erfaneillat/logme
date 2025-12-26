import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { FoodAnalysisService } from '../services/foodAnalysisService';
import DailyLog from '../models/DailyLog';
import User from '../models/User';
import { updateStreakIfEligible, updateStreakOnFirstMeal } from '../services/streakService';
import sharp from 'sharp';
import path from 'path';
import errorLogger from '../services/errorLoggerService';
import { ImageAnalysisLimitService } from '../services/imageAnalysisLimitService';

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

        const userId = req.user?.userId;

        // Get today's date in YYYY-MM-DD format
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

        // Check daily analysis limit for free users
        if (userId) {
            // Detect if this is a global market request via X-Market header
            const marketHeader = req.headers['x-market'] as string | undefined;
            const isGlobal = marketHeader === 'global';

            const limitCheck = await ImageAnalysisLimitService.checkAndTrackAnalysis(userId, targetDate, isGlobal);

            if (!limitCheck.canAnalyze) {
                const tomorrowDate = ImageAnalysisLimitService.getTomorrowDateFormatted();

                // For global users, return subscription required message
                if (isGlobal || limitCheck.requiresSubscription) {
                    const message = ImageAnalysisLimitService.getGlobalSubscriptionRequiredMessage('en');
                    res.status(429).json({
                        success: false,
                        error: 'subscription_required',
                        code: 'SUBSCRIPTION_REQUIRED',
                        message: message,
                        needsSubscription: true,
                        timestamp: new Date()
                    });
                    return;
                }

                // For non-global users (Iran), return daily limit message
                const lang = req.headers['accept-language']?.includes('fa') ? 'fa' : 'en';
                const message = lang === 'fa'
                    ? ImageAnalysisLimitService.getPersianErrorMessage()
                    : ImageAnalysisLimitService.getEnglishErrorMessage(tomorrowDate);

                res.status(429).json({
                    success: false,
                    error: `free_tier_limit_reached`,
                    message: message,
                    messageFa: ImageAnalysisLimitService.getPersianErrorMessage(),
                    messageEn: ImageAnalysisLimitService.getEnglishErrorMessage(tomorrowDate),
                    needsSubscription: true,
                    nextResetDate: tomorrowDate,
                    nextResetDateJalaliFa: require('../utils/jalali_date').getTomorrowJalaliPersian(),
                    serverTimeFa: require('../utils/jalali_date').getCurrentTimePersian(),
                    timestamp: new Date()
                });
                return;
            }
        }

        // Setup abort handling: if client disconnects, abort downstream work
        const ac = new AbortController();
        let aborted = false;
        const onAbort = () => {
            if (!ac.signal.aborted) ac.abort();
            aborted = true;
        };
        req.on('aborted', onAbort);
        req.on('close', onAbort);

        // Debug: log what multer is giving us
        console.log('Multer file info:', {
            mimetype: file.mimetype,
            originalname: file.originalname,
            filename: file.filename,
            size: file.size
        });

        // Read/convert file buffer for OpenAI analysis
        const fs = require('fs');
        try {
            // Convert HEIC/HEIF to JPEG for compatibility and serving
            const originalExt = (path.extname(file.originalname || file.filename || '') || '').toLowerCase();
            const isHeif = originalExt === '.heic' || originalExt === '.heif' || /heic|heif/i.test(file.mimetype || '');
            if (isHeif) {
                const base = path.basename(file.filename, path.extname(file.filename));
                const newFilename = `${base}.jpg`;
                const newPath = path.join(path.dirname(file.path), newFilename);
                try {
                    const inputBuffer = fs.readFileSync(file.path);
                    const outputBuffer = await sharp(inputBuffer, { failOn: 'none' })
                        .rotate()
                        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
                        .toBuffer();
                    fs.writeFileSync(newPath, outputBuffer);
                    try { fs.unlinkSync(file.path); } catch { }
                    (file as any).filename = newFilename;
                    (file as any).path = newPath;
                    (file as any).mimetype = 'image/jpeg';
                } catch (convErr) {
                    console.warn('HEIC/HEIF conversion failed, proceeding with original file:', convErr);
                }
            }
        } catch (convWrapErr) {
            console.warn('Image conversion wrapper error:', convWrapErr);
        }

        const fileBuffer = fs.readFileSync(file.path);
        if (aborted) {
            // Client disconnected before analysis; cleanup and stop.
            try { fs.unlinkSync(file.path); } catch { }
            return;
        }
        const base64 = fileBuffer.toString('base64');

        // Extract optional description from form data
        const description = (req.body as any)?.description as string | undefined;

        let analysis: any;
        try {
            const options: { signal: AbortSignal; description?: string; locale?: string } = { signal: ac.signal };
            if (description) {
                options.description = description;
            }
            // Extract locale from Accept-Language header
            options.locale = req.headers['accept-language']?.includes('fa') ? 'fa' : req.headers['accept-language']?.split(',')[0] || 'en';

            analysis = await this.service.analyze(base64, options);
        } catch (err: any) {
            // Abort triggered or other error before persistence
            if (aborted || err?.name === 'AbortError') {
                try { fs.unlinkSync(file.path); } catch { }
                return; // Do not send a response; client is gone
            }
            throw err;
        } finally {
            // Remove listeners
            req.off('aborted', onAbort);
            req.off('close', onAbort);
        }

        if (aborted) {
            try { fs.unlinkSync(file.path); } catch { }
            return;
        }
        const result = analysis.data;

        // Check if the image contains food
        if (result.isFood === false) {
            res.status(400).json({
                success: false,
                error: result.error || 'This image does not contain food. Please take a photo of your meal.',
                timestamp: new Date()
            });
            return;
        }

        // Save to daily logs (upsert) using provided date (YYYY-MM-DD),
        // falling back to server local date if not provided
        if (userId) {
            const todayIso = targetDate;
            const timeIso = new Date().toISOString();

            // Create image URL - use APP_URL in production for correct public URL
            const appUrl = process.env.APP_URL;
            const baseUrl = appUrl || `${req.protocol}://${req.get('host')}`;
            const imageUrl = `${baseUrl}/api/food/images/${file.filename}`;

            console.log('Saving image URL:', imageUrl);

            // Step 1: upsert totals
            if (aborted) { try { fs.unlinkSync(file.path); } catch { }; return; }
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
            if (aborted) { try { fs.unlinkSync(file.path); } catch { }; return; }
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
                            description: description || undefined,
                            ingredients: result.ingredients?.map((ing: any) => ({
                                name: ing.name,
                                calories: Math.round(ing.calories || 0),
                                proteinGrams: Math.round(ing.proteinGrams || 0),
                                fatGrams: Math.round(ing.fatGrams || 0),
                                carbsGrams: Math.round(ing.carbsGrams || 0),
                            })) || [],
                            liked: false,
                        },
                    },
                }
            );

            // Increment analysis count for the day
            await ImageAnalysisLimitService.incrementAnalysisCount(userId, todayIso);

            // Check if this is the first meal of the day and update streak accordingly
            try {
                // Check if there are any existing items for today before this meal
                const existingLog = await DailyLog.findOne({ userId, date: todayIso }).lean();
                const isFirstMealOfDay = !existingLog || !existingLog.items || existingLog.items.length === 0;

                if (isFirstMealOfDay) {
                    // First meal of the day - update streak
                    await updateStreakOnFirstMeal(String(userId), todayIso);
                } else {
                    // Not first meal - check if goal is met for streak
                    await updateStreakIfEligible(String(userId), todayIso);
                }
            } catch (e) {
                errorLogger.error('Streak update (food) error:', e);
            }

            // Increment user's cumulative AI cost if available
            const cost = analysis.meta?.costUsd;
            if (typeof cost === 'number' && isFinite(cost) && cost > 0) {
                await User.findByIdAndUpdate(userId, { $inc: { aiCostUsdTotal: cost } }).exec();
            }
        }

        res.status(200).json({ success: true, data: result, meta: analysis.meta, timestamp: new Date() });
    });

    public fixResult = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
        const { originalData, userDescription } = req.body;

        if (!originalData || !userDescription) {
            res.status(400).json({
                success: false,
                error: 'Original data and user description are required',
                timestamp: new Date()
            });
            return;
        }

        try {
            // Extract locale from Accept-Language header
            const locale = req.headers['accept-language']?.includes('fa') ? 'fa' : req.headers['accept-language']?.split(',')[0] || 'en';
            const analysis = await this.service.fixAnalysis(originalData, userDescription, locale);

            // Increment user's cumulative AI cost if available
            const userId = req.user?.userId;
            const cost = analysis.meta?.costUsd;
            if (userId && typeof cost === 'number' && isFinite(cost) && cost > 0) {
                await User.findByIdAndUpdate(userId, { $inc: { aiCostUsdTotal: cost } }).exec();
            }

            res.status(200).json({
                success: true,
                data: analysis.data,
                meta: analysis.meta,
                timestamp: new Date()
            });
        } catch (error: any) {
            errorLogger.error('Fix result error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fix result',
                timestamp: new Date()
            });
        }
    });

    public analyzeDescription = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
        const { description } = req.body;

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: 'Food description is required',
                timestamp: new Date()
            });
            return;
        }

        const userId = req.user?.userId;

        // Get today's date in YYYY-MM-DD format
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

        // Check daily analysis limit for free users
        if (userId) {
            // Detect if this is a global market request via X-Market header
            const marketHeader = req.headers['x-market'] as string | undefined;
            const isGlobal = marketHeader === 'global';

            const limitCheck = await ImageAnalysisLimitService.checkAndTrackAnalysis(userId, targetDate, isGlobal);

            if (!limitCheck.canAnalyze) {
                const tomorrowDate = ImageAnalysisLimitService.getTomorrowDateFormatted();

                // For global users, return subscription required message
                if (isGlobal || limitCheck.requiresSubscription) {
                    const message = ImageAnalysisLimitService.getGlobalSubscriptionRequiredMessage('en');
                    res.status(429).json({
                        success: false,
                        error: 'subscription_required',
                        code: 'SUBSCRIPTION_REQUIRED',
                        message: message,
                        needsSubscription: true,
                        timestamp: new Date()
                    });
                    return;
                }

                // For non-global users (Iran), return daily limit message
                const lang = req.headers['accept-language']?.includes('fa') ? 'fa' : 'en';
                const message = lang === 'fa'
                    ? ImageAnalysisLimitService.getPersianErrorMessage()
                    : ImageAnalysisLimitService.getEnglishErrorMessage(tomorrowDate);

                res.status(429).json({
                    success: false,
                    error: `free_tier_limit_reached`,
                    message: message,
                    messageFa: ImageAnalysisLimitService.getPersianErrorMessage(),
                    messageEn: ImageAnalysisLimitService.getEnglishErrorMessage(tomorrowDate),
                    needsSubscription: true,
                    nextResetDate: tomorrowDate,
                    nextResetDateJalaliFa: require('../utils/jalali_date').getTomorrowJalaliPersian(),
                    serverTimeFa: require('../utils/jalali_date').getCurrentTimePersian(),
                    timestamp: new Date()
                });
                return;
            }
        }

        try {
            // Extract locale from Accept-Language header
            const locale = req.headers['accept-language']?.includes('fa') ? 'fa' : req.headers['accept-language']?.split(',')[0] || 'en';
            const analysis = await this.service.analyzeFromDescription(description.trim(), locale);
            const analysisData = analysis.data;

            // Get the user ID from the authenticated request
            if (userId) {
                const todayIso = targetDate;
                const timeIso = new Date().toISOString();

                // Step 1: upsert totals (similar to image analysis)
                await DailyLog.findOneAndUpdate(
                    { userId, date: todayIso },
                    {
                        userId,
                        date: todayIso,
                        $inc: {
                            caloriesConsumed: Math.round(analysisData.calories || 0),
                            carbsGrams: Math.round(analysisData.carbsGrams || 0),
                            proteinGrams: Math.round(analysisData.proteinGrams || 0),
                            fatsGrams: Math.round(analysisData.fatGrams || 0),
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
                                title: analysisData.title,
                                calories: Math.round(analysisData.calories || 0),
                                carbsGrams: Math.round(analysisData.carbsGrams || 0),
                                proteinGrams: Math.round(analysisData.proteinGrams || 0),
                                fatsGrams: Math.round(analysisData.fatGrams || 0),
                                healthScore: Math.max(0, Math.min(10, Math.round(analysisData.healthScore || 0))),
                                timeIso,
                                imageUrl: null, // No image for text-based analysis
                                ingredients: analysisData.ingredients?.map((ing: any) => ({
                                    name: ing.name,
                                    calories: Math.round(ing.calories || 0),
                                    proteinGrams: Math.round(ing.proteinGrams || 0),
                                    fatGrams: Math.round(ing.fatGrams || 0),
                                    carbsGrams: Math.round(ing.carbsGrams || 0),
                                })) || [],
                                liked: false,
                            },
                        },
                    }
                );

                // Increment analysis count for the day
                await ImageAnalysisLimitService.incrementAnalysisCount(userId, todayIso);

                // Check if this is the first meal of the day and update streak accordingly
                try {
                    // Check if there are any existing items for today before this meal
                    const existingLog = await DailyLog.findOne({ userId, date: todayIso }).lean();
                    const isFirstMealOfDay = !existingLog || !existingLog.items || existingLog.items.length === 0;

                    if (isFirstMealOfDay) {
                        // First meal of the day - update streak
                        await updateStreakOnFirstMeal(String(userId), todayIso);
                    } else {
                        // Not first meal - check if goal is met for streak
                        await updateStreakIfEligible(String(userId), todayIso);
                    }
                } catch (e) {
                    errorLogger.error('Streak update (food description) error:', e);
                }

                // Increment user's cumulative AI cost if available
                const cost = analysis.meta?.costUsd;
                if (typeof cost === 'number' && isFinite(cost) && cost > 0) {
                    await User.findByIdAndUpdate(userId, { $inc: { aiCostUsdTotal: cost } }).exec();
                }
            }

            res.status(200).json({
                success: true,
                data: analysisData,
                meta: analysis.meta,
                timestamp: new Date()
            });
        } catch (error: any) {
            errorLogger.error('Analyze description error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to analyze food description',
                timestamp: new Date()
            });
        }
    });
    public addFoodItem = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
        const { title, calories, proteinGrams, carbsGrams, fatsGrams, ingredients, imageUrl, date } = req.body;
        const userId = req.user?.userId;

        if (!title) {
            res.status(400).json({ success: false, error: 'Title is required', timestamp: new Date() });
            return;
        }

        // Determine date in YYYY-MM-DD format
        let targetDate: string;
        if (date && typeof date === 'string') {
            targetDate = date.slice(0, 10);
        } else {
            // Local date in server timezone
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            targetDate = `${y}-${m}-${d}`;
        }

        if (userId) {
            const todayIso = targetDate;
            const timeIso = new Date().toISOString();

            // Step 1: upsert totals
            await DailyLog.findOneAndUpdate(
                { userId, date: todayIso },
                {
                    userId,
                    date: todayIso,
                    $inc: {
                        caloriesConsumed: Math.round(calories || 0),
                        carbsGrams: Math.round(carbsGrams || 0),
                        proteinGrams: Math.round(proteinGrams || 0),
                        fatsGrams: Math.round(fatsGrams || 0),
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
                            title: title,
                            calories: Math.round(calories || 0),
                            carbsGrams: Math.round(carbsGrams || 0),
                            proteinGrams: Math.round(proteinGrams || 0),
                            fatsGrams: Math.round(fatsGrams || 0),
                            healthScore: 8, // Set a default good score for kitchen items
                            timeIso,
                            imageUrl: imageUrl || null,
                            ingredients: ingredients || [],
                            liked: false,
                        },
                    },
                }
            );

            // Check if this is the first meal of the day and update streak accordingly
            try {
                // Check existing items for today
                const existingLog = await DailyLog.findOne({ userId, date: todayIso }).lean();
                // Since we just added an item, valid check is if we have exactly 1 item
                const isFirstMealOfDay = !existingLog || !existingLog.items || existingLog.items.length <= 1;

                if (isFirstMealOfDay) {
                    // First meal of the day - update streak
                    await updateStreakOnFirstMeal(String(userId), todayIso);
                } else {
                    // Not first meal - check if goal is met for streak
                    await updateStreakIfEligible(String(userId), todayIso);
                }
            } catch (e) {
                errorLogger.error('Streak update (add food) error:', e);
            }
        }

        res.status(200).json({ success: true, timestamp: new Date() });
    });
}


