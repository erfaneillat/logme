import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import DailyLog from '../models/DailyLog';

interface AuthRequest extends Request { user?: any }

export class LogController {
    async upsertDailyLog(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, errors: errors.array() });
                return;
            }

            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { date, caloriesConsumed, carbsGrams, proteinGrams, fatsGrams } = req.body || {};
            if (!date || typeof date !== 'string') {
                res.status(400).json({ success: false, message: 'date (YYYY-MM-DD) is required' });
                return;
            }

            const sanitizedDate = date.slice(0, 10);

            const log = await DailyLog.findOneAndUpdate(
                { userId, date: sanitizedDate },
                {
                    userId,
                    date: sanitizedDate,
                    caloriesConsumed: Math.max(0, Math.round(Number(caloriesConsumed ?? 0))),
                    carbsGrams: Math.max(0, Math.round(Number(carbsGrams ?? 0))),
                    proteinGrams: Math.max(0, Math.round(Number(proteinGrams ?? 0))),
                    fatsGrams: Math.max(0, Math.round(Number(fatsGrams ?? 0))),
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            res.json({ success: true, data: { log } });
        } catch (error) {
            console.error('Upsert daily log error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getDailyLog(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const dateParam = (req.query.date as string) || (req.params.date as string);
            if (!dateParam) {
                res.status(400).json({ success: false, message: 'date query param is required (YYYY-MM-DD)' });
                return;
            }

            const sanitizedDate = dateParam.slice(0, 10);
            const log = await DailyLog.findOne({ userId, date: sanitizedDate });
            if (!log) {
                res.json({ success: true, data: { log: { userId, date: sanitizedDate, caloriesConsumed: 0, carbsGrams: 0, proteinGrams: 0, fatsGrams: 0, items: [] } } });
                return;
            }

            res.json({ success: true, data: { log } });
        } catch (error) {
            console.error('Get daily log error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getLogsRange(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const start = (req.query.start as string) || '';
            const end = (req.query.end as string) || '';
            if (!start || !end) {
                res.status(400).json({ success: false, message: 'start and end (YYYY-MM-DD) are required' });
                return;
            }

            const startDate = start.slice(0, 10);
            const endDate = end.slice(0, 10);

            const logs = await DailyLog.find({
                userId,
                date: { $gte: startDate, $lte: endDate },
            }).sort({ date: 1 });

            res.json({ success: true, data: { logs } });
        } catch (error) {
            console.error('Get logs range error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async toggleItemLike(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { date, itemId, liked } = (req.body || {}) as { date?: string; itemId?: string; liked?: boolean };
            if (!date || typeof date !== 'string' || !itemId) {
                res.status(400).json({ success: false, message: 'date (YYYY-MM-DD) and itemId are required' });
                return;
            }

            const sanitizedDate = date.slice(0, 10);
            const updateResult = await DailyLog.updateOne(
                { userId, date: sanitizedDate, 'items._id': itemId },
                { $set: { 'items.$.liked': Boolean(liked) } }
            ).exec();

            // For Mongoose >=6 updateOne result
            const matched = (updateResult as any).matchedCount ?? (updateResult as any).nMatched ?? 0;
            if (matched === 0) {
                res.status(404).json({ success: false, message: 'Log item not found' });
                return;
            }

            res.json({ success: true, data: { itemId, liked: Boolean(liked) } });
        } catch (error) {
            console.error('Toggle item like error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async removeItemFromFavorites(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const itemId = req.params.itemId as string | undefined;
            if (!itemId) {
                res.status(400).json({ success: false, message: 'itemId param is required' });
                return;
            }

            const updateResult = await DailyLog.updateOne(
                { userId, 'items._id': itemId },
                { $set: { 'items.$.liked': false } }
            ).exec();

            const matched = (updateResult as any).matchedCount ?? (updateResult as any).nMatched ?? 0;
            if (matched === 0) {
                res.status(404).json({ success: false, message: 'Log item not found' });
                return;
            }

            res.json({ success: true, data: { itemId, liked: false } });
        } catch (error) {
            console.error('Remove item from favorites error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async addItem(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const {
                date,
                title,
                calories,
                carbsGrams,
                proteinGrams,
                fatsGrams,
                healthScore,
                imageUrl,
                ingredients,
                liked,
            } = (req.body || {}) as any;

            if (!date || typeof date !== 'string') {
                res.status(400).json({ success: false, message: 'date (YYYY-MM-DD) is required' });
                return;
            }
            if (!title || typeof title !== 'string') {
                res.status(400).json({ success: false, message: 'title is required' });
                return;
            }

            const sanitizedDate = (date as string).slice(0, 10);
            const cals = Math.max(0, Math.round(Number(calories ?? 0)));
            const carbs = Math.max(0, Math.round(Number(carbsGrams ?? 0)));
            const protein = Math.max(0, Math.round(Number(proteinGrams ?? 0)));
            const fats = Math.max(0, Math.round(Number(fatsGrams ?? 0)));
            const hsRaw = Number(healthScore ?? 0);
            const hs = isFinite(hsRaw) ? Math.max(0, Math.min(10, Math.round(hsRaw))) : 0;
            const timeIso = new Date().toISOString();

            // Upsert totals
            await DailyLog.findOneAndUpdate(
                { userId, date: sanitizedDate },
                {
                    userId,
                    date: sanitizedDate,
                    $inc: {
                        caloriesConsumed: cals,
                        carbsGrams: carbs,
                        proteinGrams: protein,
                        fatsGrams: fats,
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            ).exec();

            // Build ingredients array safely
            const safeIngredients = Array.isArray(ingredients)
                ? (ingredients as any[]).map((ing) => ({
                    name: String(ing?.name ?? ''),
                    calories: Math.max(0, Math.round(Number(ing?.calories ?? 0))),
                    proteinGrams: Math.max(0, Math.round(Number(ing?.proteinGrams ?? 0))),
                    fatGrams: Math.max(0, Math.round(Number(ing?.fatGrams ?? 0))),
                    carbsGrams: Math.max(0, Math.round(Number(ing?.carbsGrams ?? 0))),
                }))
                : [];

            // Push item and return updated log to extract the appended item
            const updated = await DailyLog.findOneAndUpdate(
                { userId, date: sanitizedDate },
                {
                    $push: {
                        items: {
                            title: String(title),
                            calories: cals,
                            carbsGrams: carbs,
                            proteinGrams: protein,
                            fatsGrams: fats,
                            healthScore: hs,
                            timeIso,
                            imageUrl: imageUrl ? String(imageUrl) : undefined,
                            ingredients: safeIngredients,
                            liked: Boolean(liked ?? false),
                        },
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            ).exec();

            const pushed = updated?.items?.find((it: any) => it.timeIso === timeIso);
            res.json({ success: true, data: { item: pushed ?? null } });
        } catch (error) {
            console.error('Add log item error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}


