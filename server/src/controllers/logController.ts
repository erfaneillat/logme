import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import DailyLog from '../models/DailyLog';
import User from '../models/User';
import AdditionalInfo from '../models/AdditionalInfo';
import { updateStreakIfEligible, updateStreakOnFirstMeal, updateUserLastActivity } from '../services/streakService';
import { ExerciseAnalysisService } from '../services/exerciseAnalysisService';
import errorLogger from '../services/errorLoggerService';
import Plan from '../models/Plan';
import notificationService from '../services/notificationService';
import Notification, { NotificationType } from '../models/Notification';

interface AuthRequest extends Request { user?: any }

export class LogController {
    private exerciseAnalysisService: ExerciseAnalysisService | null = null;

    constructor() {
        // Initialize service lazily to ensure environment variables are loaded
    }

    private getExerciseAnalysisService(): ExerciseAnalysisService {
        if (!this.exerciseAnalysisService) {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OpenAI API key is not configured');
            }
            this.exerciseAnalysisService = new ExerciseAnalysisService();
        }
        return this.exerciseAnalysisService;
    }
    private async checkCalorieNotifications(userId: string, date: string): Promise<void> {
        try {
            const plan = await Plan.findOne({ userId }).sort({ createdAt: -1 }).lean();
            if (!plan || typeof (plan as any).calories !== 'number') return;
            const goal = Math.max(0, Number((plan as any).calories));
            const log = await DailyLog.findOne({ userId, date }).select('caloriesConsumed').lean();
            const consumed = Math.max(0, Number((log as any)?.caloriesConsumed ?? 0));
            if (consumed <= 0) return;
            if (consumed > goal) {
                const exists = await Notification.findOne({ userId, type: NotificationType.ALERT_CALORIE_OVER, 'data.date': date }).lean();
                if (!exists) {
                    await notificationService.createNotification(userId, NotificationType.ALERT_CALORIE_OVER, 'هشدار کالری', 'مراقب باش! توی این وعده بیش از حد مجاز کالری مصرف کردی.', { date });
                }
                return;
            }
            const remaining = Math.max(0, goal - consumed);
            if (remaining > 0) {
                const existsRemain = await Notification.findOne({ userId, type: NotificationType.ALERT_CALORIE_REMAINING, 'data.date': date }).lean();
                if (!existsRemain) {
                    const remainPercent = Math.round((remaining / goal) * 100);
                    const pick = Math.random() < 0.5;
                    const body = pick
                        ? `تو هنوز ${remainPercent}% از سهم روزانه کالریت رو داری، یادت نره استفاده کنی!`
                        : `امروز فقط ${remaining} کالری دیگه اجازه داری`;
                    await notificationService.createNotification(userId, NotificationType.ALERT_CALORIE_REMAINING, 'یادآوری کالری', body, { date, remainPercent, remaining, goal });
                }
            }
        } catch (error) {
            errorLogger.error('checkCalorieNotifications error:', error);
        }
    }
    private async checkStreakMilestone(userId: string): Promise<void> {
        try {
            const user = await User.findById(userId).select('streakCount').lean();
            const streak = Math.max(0, Number((user as any)?.streakCount ?? 0));
            if (streak === 10) {
                const exists = await Notification.findOne({ userId, type: NotificationType.MOTIVATION, 'data.streak': 10 }).lean();
                if (!exists) {
                    await notificationService.createNotification(userId, NotificationType.MOTIVATION, 'تبریک', 'عالیه! شما 10 وعده پشت سر هم ثبت کردید', { streak: 10 });
                }
            }
        } catch (error) {
            errorLogger.error('checkStreakMilestone error:', error);
        }
    }
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

            const { date, caloriesConsumed, carbsGrams, proteinGrams, fatsGrams, burnedCalories } = req.body || {};
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
                    burnedCalories: Math.max(0, Math.round(Number(burnedCalories ?? 0))),
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // Trigger streak update after totals change
            try { await updateStreakIfEligible(userId, sanitizedDate); } catch (_) { }

            // Update user's last activity
            try { await updateUserLastActivity(userId); } catch (_) { }
            await this.checkCalorieNotifications(userId, sanitizedDate);
            await this.checkStreakMilestone(userId);
            res.json({ success: true, data: { log } });
        } catch (error) {
            errorLogger.error('Upsert daily log error:', error);
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
                res.json({ success: true, data: { log: { userId, date: sanitizedDate, caloriesConsumed: 0, carbsGrams: 0, proteinGrams: 0, fatsGrams: 0, burnedCalories: 0, items: [] } } });
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
            } catch (_) { }

            res.json({ success: true, data: { log } });
        } catch (error) {
            errorLogger.error('Get daily log error:', error);
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
            errorLogger.error('Get logs range error:', error);
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
            errorLogger.error('Toggle item like error:', error);
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
            errorLogger.error('Remove item from favorites error:', error);
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
            // Portions: allow fractional > 0
            const portionsSanitized = (() => {
                const p = Number(portions ?? 1);
                return isFinite(p) && p > 0 ? p : 1;
            })();

            // If ingredients are provided, treat their sum as base-per-portion, then multiply by portions
            const rawIngredients = Array.isArray(ingredients) ? ingredients : [];
            const baseFromIngredients = rawIngredients.reduce((acc: any, ing: any) => {
                const c = Math.max(0, Math.round(Number(ing?.calories ?? 0)));
                const cb = Math.max(0, Math.round(Number(ing?.carbsGrams ?? 0)));
                const pr = Math.max(0, Math.round(Number(ing?.proteinGrams ?? 0)));
                const ft = Math.max(0, Math.round(Number(ing?.fatGrams ?? 0)));
                acc.calories += c;
                acc.carbsGrams += cb;
                acc.proteinGrams += pr;
                acc.fatsGrams += ft;
                return acc;
            }, { calories: 0, carbsGrams: 0, proteinGrams: 0, fatsGrams: 0 });

            // Prefer explicit totals if provided; else use ingredients sum scaled by portions
            const cals = Math.max(0, Math.round(Number(calories ?? (baseFromIngredients.calories * portionsSanitized))));
            const carbs = Math.max(0, Math.round(Number(carbsGrams ?? (baseFromIngredients.carbsGrams * portionsSanitized))));
            const protein = Math.max(0, Math.round(Number(proteinGrams ?? (baseFromIngredients.proteinGrams * portionsSanitized))));
            const fats = Math.max(0, Math.round(Number(fatsGrams ?? (baseFromIngredients.fatsGrams * portionsSanitized))));
            const hsRaw = Number(healthScore ?? 0);
            const hs = isFinite(hsRaw) ? Math.max(0, Math.min(10, Math.round(hsRaw))) : 0;
            const timeIso = new Date().toISOString();

            // Check if this is the first item of the day for streak calculation
            const existingLog = await DailyLog.findOne({ userId, date: sanitizedDate }).lean();
            const isFirstItemOfDay = !existingLog || !existingLog.items || existingLog.items.length === 0;

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

            // Trigger streak update after totals change
            try {
                if (isFirstItemOfDay) {
                    // First item of the day - update streak regardless of calories
                    await updateStreakOnFirstMeal(userId, sanitizedDate);
                } else {
                    // Not first item - always update streak (no calorie requirement)
                    await updateStreakIfEligible(userId, sanitizedDate);
                }
            } catch (error) {
                errorLogger.error(`Error updating streak for user ${userId}:`, error);
            }

            // Update user's last activity
            try { await updateUserLastActivity(userId); } catch (_) { }
            await this.checkCalorieNotifications(userId, sanitizedDate);
            await this.checkStreakMilestone(userId);
            res.json({ success: true, data: { item: pushed ?? null } });
        } catch (error) {
            errorLogger.error('Add log item error:', error);
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

            // Trigger streak update after totals change
            try { await updateStreakIfEligible(userId, sanitizedDate); } catch (_) { }

            // Update user's last activity
            try { await updateUserLastActivity(userId); } catch (_) { }
            await this.checkCalorieNotifications(userId, sanitizedDate);
            await this.checkStreakMilestone(userId);
            res.json({ success: true, data: { itemId } });
        } catch (error) {
            errorLogger.error('Delete log item error:', error);
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
            // Portions: allow fractional > 0 (no rounding). If omitted, undefined to keep existing.
            const portionsSanitized = portions == null
                ? undefined
                : (() => {
                    const p = Number(portions);
                    return isFinite(p) && p > 0 ? p : matchedItem.portions ?? 1;
                })();

            // When editing: compute new item macros
            const editIngredients = Array.isArray(ingredients) ? ingredients : undefined;
            const baseFromEditIngredients = (editIngredients ?? []).reduce((acc: any, ing: any) => {
                const c = Math.max(0, Math.round(Number(ing?.calories ?? 0)));
                const cb = Math.max(0, Math.round(Number(ing?.carbsGrams ?? 0)));
                const pr = Math.max(0, Math.round(Number(ing?.proteinGrams ?? 0)));
                const ft = Math.max(0, Math.round(Number(ing?.fatGrams ?? 0)));
                acc.calories += c;
                acc.carbsGrams += cb;
                acc.proteinGrams += pr;
                acc.fatsGrams += ft;
                return acc;
            }, { calories: 0, carbsGrams: 0, proteinGrams: 0, fatsGrams: 0 });

            // Determine target portions for calculation
            const targetPortions = portionsSanitized ?? matchedItem.portions ?? 1;

            // Helper: scale existing item per-portion if only portions changed and no totals provided
            const perPortionFromExisting = {
                calories: Number(matchedItem.calories ?? 0) / Math.max(1e-6, Number(matchedItem.portions ?? 1)),
                carbsGrams: Number(matchedItem.carbsGrams ?? 0) / Math.max(1e-6, Number(matchedItem.portions ?? 1)),
                proteinGrams: Number(matchedItem.proteinGrams ?? 0) / Math.max(1e-6, Number(matchedItem.portions ?? 1)),
                fatsGrams: Number(matchedItem.fatsGrams ?? 0) / Math.max(1e-6, Number(matchedItem.portions ?? 1)),
            };

            // Priority:
            // 1) If explicit totals provided, use them directly.
            // 2) Else if ingredients provided, sum as base-per-portion and multiply by targetPortions.
            // 3) Else if only portions changed, scale existing per-portion by targetPortions.
            const computedFromIngredients = editIngredients
                ? {
                    calories: baseFromEditIngredients.calories * targetPortions,
                    carbsGrams: baseFromEditIngredients.carbsGrams * targetPortions,
                    proteinGrams: baseFromEditIngredients.proteinGrams * targetPortions,
                    fatsGrams: baseFromEditIngredients.fatsGrams * targetPortions,
                }
                : null;

            const cals = Math.max(0, Math.round(Number(
                calories ?? computedFromIngredients?.calories ?? (portionsSanitized != null ? perPortionFromExisting.calories * targetPortions : matchedItem.calories)
            )));
            const carbs = Math.max(0, Math.round(Number(
                carbsGrams ?? computedFromIngredients?.carbsGrams ?? (portionsSanitized != null ? perPortionFromExisting.carbsGrams * targetPortions : matchedItem.carbsGrams)
            )));
            const protein = Math.max(0, Math.round(Number(
                proteinGrams ?? computedFromIngredients?.proteinGrams ?? (portionsSanitized != null ? perPortionFromExisting.proteinGrams * targetPortions : matchedItem.proteinGrams)
            )));
            const fats = Math.max(0, Math.round(Number(
                fatsGrams ?? computedFromIngredients?.fatsGrams ?? (portionsSanitized != null ? perPortionFromExisting.fatsGrams * targetPortions : matchedItem.fatsGrams)
            )));
            const hsRaw = healthScore ?? matchedItem.healthScore;
            const hs = hsRaw == null ? undefined : Math.max(0, Math.min(10, Math.round(Number(hsRaw))));

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

            // Trigger streak update after totals change
            try { await updateStreakIfEligible(userId, sanitizedDate); } catch (_) { }

            // Update user's last activity
            try { await updateUserLastActivity(userId); } catch (_) { }
            await this.checkCalorieNotifications(userId, sanitizedDate);
            await this.checkStreakMilestone(userId);
            res.json({ success: true, data: { item: updatedItem } });
        } catch (error) {
            errorLogger.error('Update log item error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async updateBurnedCalories(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { date, burnedCalories } = req.body || {};
            if (!date || typeof date !== 'string') {
                res.status(400).json({ success: false, message: 'date (YYYY-MM-DD) is required' });
                return;
            }

            const sanitizedDate = date.slice(0, 10);
            const burnedCals = Math.max(0, Math.round(Number(burnedCalories ?? 0)));

            // Check user preference for adding burned calories
            const user = await User.findById(userId).select('addBurnedCalories');
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            // Always save burned calories to database for tracking purposes
            // First, try to find existing log
            let log = await DailyLog.findOne({ userId, date: sanitizedDate });

            if (log) {
                // Log exists, just increment burned calories
                log = await DailyLog.findOneAndUpdate(
                    { userId, date: sanitizedDate },
                    { $inc: { burnedCalories: burnedCals } },
                    { new: true }
                );
            } else {
                // Log doesn't exist, create new one with initial burned calories
                log = await DailyLog.findOneAndUpdate(
                    { userId, date: sanitizedDate },
                    {
                        $setOnInsert: {
                            userId,
                            date: sanitizedDate,
                            caloriesConsumed: 0,
                            carbsGrams: 0,
                            proteinGrams: 0,
                            fatsGrams: 0,
                            burnedCalories: burnedCals, // Set initial value directly
                            items: [],
                        }
                    },
                    { upsert: true, new: true }
                );
            }

            // Trigger streak update after totals change
            try { await updateStreakIfEligible(userId, sanitizedDate); } catch (_) { }

            // Update user's last activity
            try { await updateUserLastActivity(userId); } catch (_) { }
            await this.checkCalorieNotifications(userId, sanitizedDate);

            // Return response indicating preference status for frontend feedback
            const preferenceEnabled = user.addBurnedCalories ?? true;
            res.json({
                success: true,
                data: {
                    log,
                    preferenceEnabled,
                    message: preferenceEnabled
                        ? 'Exercise added and will be included in daily goal'
                        : 'Exercise logged but not added to daily goal (preference disabled)'
                }
            });
        } catch (error) {
            errorLogger.error('Update burned calories error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async analyzeExercise(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { exercise, duration } = req.body || {};
            if (!exercise || typeof exercise !== 'string') {
                res.status(400).json({ success: false, message: 'exercise description is required' });
                return;
            }
            if (!duration || typeof duration !== 'number' || duration <= 0) {
                res.status(400).json({ success: false, message: 'duration (minutes) must be a positive number' });
                return;
            }

            // Check if OpenAI API key is available
            if (!process.env.OPENAI_API_KEY) {
                // Fallback calculation without AI
                const fallbackCalories = Math.round(duration * 5); // 5 calories per minute estimate
                res.json({
                    success: true,
                    data: {
                        activityName: exercise,
                        caloriesBurned: fallbackCalories,
                        duration: duration,
                        intensity: 'متوسط', // 'Moderate' in Persian
                        tips: ['این محاسبه تخمینی است', 'برای محاسبه دقیق‌تر وزن خود را تکمیل کنید']
                    },
                    meta: null
                });
                return;
            }

            // Get user weight for more accurate calorie calculation
            const additionalInfo = await AdditionalInfo.findOne({ userId }).select('weight');
            const userWeight = additionalInfo?.weight;

            // Analyze exercise using AI
            const analysisResult = await this.getExerciseAnalysisService().analyzeExercise(
                exercise,
                duration,
                userWeight
            );

            // Increment user's cumulative AI cost if available
            const cost = analysisResult.meta?.costUsd;
            if (typeof cost === 'number' && isFinite(cost) && cost > 0) {
                await User.findByIdAndUpdate(userId, { $inc: { aiCostUsdTotal: cost } }).exec();
            }

            res.json({
                success: true,
                data: analysisResult.data,
                meta: analysisResult.meta
            });
        } catch (error) {
            errorLogger.error('Analyze exercise error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}
