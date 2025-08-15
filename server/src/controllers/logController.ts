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

            // Ensure items are ordered newest to oldest by timeIso
            try {
                if (Array.isArray((log as any).items)) {
                    (log as any).items.sort((a: any, b: any) => {
                        const ta = new Date(a?.timeIso ?? 0).getTime();
                        const tb = new Date(b?.timeIso ?? 0).getTime();
                        return tb - ta;
                    });
                }
            } catch (_) {}

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
            }).sort({ date: -1 });

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
                portions,
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
            const portionsSanitized = Math.max(1, Math.round(Number(portions ?? 1)));
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
                            portions: portionsSanitized,
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

    async deleteItem(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const itemId = req.params.itemId as string | undefined;
            const dateParam = (req.query.date as string) || (req.body?.date as string);
            if (!itemId || !dateParam) {
                res.status(400).json({ success: false, message: 'date (YYYY-MM-DD) and itemId are required' });
                return;
            }

            const sanitizedDate = dateParam.slice(0, 10);

            // Fetch the log and the specific item to compute new totals
            const log: any = await DailyLog.findOne(
                { userId, date: sanitizedDate, 'items._id': itemId },
                {
                    caloriesConsumed: 1,
                    carbsGrams: 1,
                    proteinGrams: 1,
                    fatsGrams: 1,
                    items: { $elemMatch: { _id: itemId } },
                }
            ).lean();

            const matchedItem = log?.items?.[0];
            if (!matchedItem) {
                res.status(404).json({ success: false, message: 'Log item not found' });
                return;
            }

            const newTotals = {
                caloriesConsumed: Math.max(0, Number(log?.caloriesConsumed ?? 0) - Number(matchedItem.calories ?? 0)),
                carbsGrams: Math.max(0, Number(log?.carbsGrams ?? 0) - Number(matchedItem.carbsGrams ?? 0)),
                proteinGrams: Math.max(0, Number(log?.proteinGrams ?? 0) - Number(matchedItem.proteinGrams ?? 0)),
                fatsGrams: Math.max(0, Number(log?.fatsGrams ?? 0) - Number(matchedItem.fatsGrams ?? 0)),
            };

            await DailyLog.updateOne(
                { userId, date: sanitizedDate },
                {
                    $pull: { items: { _id: itemId } },
                    $set: newTotals,
                }
            ).exec();

            res.json({ success: true, data: { itemId } });
        } catch (error) {
            console.error('Delete log item error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async updateItem(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const itemId = req.params.itemId as string | undefined;
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
                portions,
            } = (req.body || {}) as any;

            if (!itemId) {
                res.status(400).json({ success: false, message: 'itemId param is required' });
                return;
            }
            if (!date || typeof date !== 'string') {
                res.status(400).json({ success: false, message: 'date (YYYY-MM-DD) is required' });
                return;
            }

            const sanitizedDate = (date as string).slice(0, 10);

            // Debug logging

            // Fetch the existing item and current totals
            const log: any = await DailyLog.findOne(
                { userId, date: sanitizedDate, 'items._id': itemId },
                {
                    caloriesConsumed: 1,
                    carbsGrams: 1,
                    proteinGrams: 1,
                    fatsGrams: 1,
                    items: { $elemMatch: { _id: itemId } },
                }
            ).lean();


            const matchedItem = log?.items?.[0];
            if (!matchedItem) {
                // Try to find the item across all dates for this user
                const allLogs = await DailyLog.find({ userId, 'items._id': itemId }, { date: 1, 'items._id': 1 }).lean();

                // Also check what dates exist for this user
                const userLogs = await DailyLog.find({ userId }, { date: 1, 'items._id': 1 }).lean();

                res.status(404).json({ success: false, message: 'Log item not found' });
                return;
            }

            // Sanitize incoming values
            const cals = Math.max(0, Math.round(Number(calories ?? matchedItem.calories ?? 0)));
            const carbs = Math.max(0, Math.round(Number(carbsGrams ?? matchedItem.carbsGrams ?? 0)));
            const protein = Math.max(0, Math.round(Number(proteinGrams ?? matchedItem.proteinGrams ?? 0)));
            const fats = Math.max(0, Math.round(Number(fatsGrams ?? matchedItem.fatsGrams ?? 0)));
            const hsRaw = healthScore ?? matchedItem.healthScore;
            const hs = hsRaw == null ? undefined : Math.max(0, Math.min(10, Math.round(Number(hsRaw))));
            const portionsSanitized = portions == null
                ? undefined
                : Math.max(1, Math.round(Number(portions)));

            const safeIngredients = Array.isArray(ingredients)
                ? (ingredients as any[]).map((ing) => ({
                    name: String(ing?.name ?? ''),
                    calories: Math.max(0, Math.round(Number(ing?.calories ?? 0))),
                    proteinGrams: Math.max(0, Math.round(Number(ing?.proteinGrams ?? 0))),
                    fatGrams: Math.max(0, Math.round(Number(ing?.fatGrams ?? 0))),
                    carbsGrams: Math.max(0, Math.round(Number(ing?.carbsGrams ?? 0))),
                }))
                : undefined; // undefined means keep existing

            // Compute new totals by removing old and adding new
            const newTotals = {
                caloriesConsumed: Math.max(0, Number(log?.caloriesConsumed ?? 0) - Number(matchedItem.calories ?? 0) + cals),
                carbsGrams: Math.max(0, Number(log?.carbsGrams ?? 0) - Number(matchedItem.carbsGrams ?? 0) + carbs),
                proteinGrams: Math.max(0, Number(log?.proteinGrams ?? 0) - Number(matchedItem.proteinGrams ?? 0) + protein),
                fatsGrams: Math.max(0, Number(log?.fatsGrams ?? 0) - Number(matchedItem.fatsGrams ?? 0) + fats),
            };

            const setPayload: any = {
                ...newTotals,
                'items.$.title': title != null ? String(title) : matchedItem.title,
                'items.$.calories': cals,
                'items.$.carbsGrams': carbs,
                'items.$.proteinGrams': protein,
                'items.$.fatsGrams': fats,
                'items.$.imageUrl': imageUrl != null ? String(imageUrl) : matchedItem.imageUrl,
                'items.$.liked': liked != null ? Boolean(liked) : matchedItem.liked,
            };
            if (hs !== undefined) setPayload['items.$.healthScore'] = hs;
            if (safeIngredients !== undefined) setPayload['items.$.ingredients'] = safeIngredients;
            if (portionsSanitized !== undefined) setPayload['items.$.portions'] = portionsSanitized;

            await DailyLog.updateOne(
                { userId, date: sanitizedDate, 'items._id': itemId },
                { $set: setPayload }
            ).exec();

            // Return updated item
            const updated: any = await DailyLog.findOne(
                { userId, date: sanitizedDate, 'items._id': itemId },
                { items: { $elemMatch: { _id: itemId } } }
            ).lean();
            const updatedItem = updated?.items?.[0] ?? null;
            res.json({ success: true, data: { item: updatedItem } });
        } catch (error) {
            console.error('Update log item error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}


