import { Request, Response } from 'express';
import DailyLog from '../models/DailyLog';
import User from '../models/User';
import AdditionalInfo from '../models/AdditionalInfo';
import Plan from '../models/Plan';
import NutritionChatMessage from '../models/NutritionChatMessage';
import Subscription from '../models/Subscription';
import errorLogger from '../services/errorLoggerService';
import { NutritionChatService, NutritionChatContext } from '../services/nutritionChatService';

interface AuthRequest extends Request {
    user?: any;
    file?: any;
}

export class NutritionChatController {
    private service: NutritionChatService | null = null;

    private getService(): NutritionChatService {
        if (!this.service) {
            this.service = new NutritionChatService();
        }
        return this.service;
    }

    private async handleStreamingChat(
        req: AuthRequest,
        res: Response,
        params: { userId: string; message: string; imageUrl: string | null; chatInput: any },
    ): Promise<void> {
        const { userId, message, imageUrl, chatInput } = params;

        try {
            // Check subscription status and daily message limit for free users
            const activeSubscription = await Subscription.findOne({
                userId,
                isActive: true,
                expiryDate: { $gt: new Date() },
            }).sort({ expiryDate: -1 });

            const isSubscribed = !!activeSubscription;

            // For free users, check daily message limit (max 2 messages per day)
            if (!isSubscribed) {
                const today = new Date();
                const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

                const todayMessageCount = await NutritionChatMessage.countDocuments({
                    userId,
                    senderRole: 'user',
                    createdAt: {
                        $gte: startOfToday,
                        $lte: endOfToday,
                    },
                });

                const MAX_FREE_MESSAGES_PER_DAY = 2;
                if (todayMessageCount >= MAX_FREE_MESSAGES_PER_DAY) {
                    if (!res.headersSent) {
                        res.status(403).json({
                            success: false,
                            message: 'Daily message limit reached',
                            code: 'DAILY_MESSAGE_LIMIT_REACHED',
                            limit: MAX_FREE_MESSAGES_PER_DAY,
                        });
                    } else {
                        try {
                            const payload = JSON.stringify({
                                error: 'Daily message limit reached',
                                code: 'DAILY_MESSAGE_LIMIT_REACHED',
                                limit: MAX_FREE_MESSAGES_PER_DAY,
                            });
                            res.write(`data: ${payload}\n\n`);
                            res.end();
                        } catch {
                            // ignore secondary errors while ending stream
                        }
                    }
                    return;
                }
            }

            const service = this.getService();
            const { stream } = await service.chatStream(chatInput);

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Initial event to open the stream on some proxies/clients
            res.write('event: open\n');
            res.write('data: {}\n\n');

            let fullReply = '';

            for await (const chunk of stream as any) {
                const choice = chunk?.choices?.[0];
                const delta: any = choice?.delta ?? {};
                const contentPiece: string = typeof delta?.content === 'string' ? delta.content : '';

                if (!contentPiece) {
                    continue;
                }

                fullReply += contentPiece;
                const payload = JSON.stringify({ token: contentPiece });
                res.write(`data: ${payload}\n\n`);
            }

            // Persist chat messages after full reply is assembled
            try {
                const userDoc: any = {
                    userId,
                    senderRole: 'user',
                    message,
                };
                if (imageUrl) {
                    userDoc.imageUrl = imageUrl;
                }

                const assistantDoc: any = {
                    userId,
                    senderRole: 'assistant',
                    message: fullReply,
                };

                await NutritionChatMessage.insertMany([userDoc, assistantDoc]);
            } catch (persistErr) {
                errorLogger.error('Failed to persist nutrition chat messages (stream)', persistErr as Error, req, {
                    userId,
                });
            }

            const donePayload = JSON.stringify({ done: true, full: fullReply });
            res.write(`data: ${donePayload}\n\n`);
            res.end();
        } catch (error: any) {
            errorLogger.error('Nutrition chat streaming error:', error, req);

            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Internal server error' });
            } else {
                try {
                    const payload = JSON.stringify({ error: 'Internal server error' });
                    res.write(`data: ${payload}\n\n`);
                    res.end();
                } catch {
                    // ignore secondary errors while ending stream
                }
            }
        }
    }

    public async chat(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const body = (req.body || {}) as {
                message?: string;
                date?: string;
                imageUrl?: string;
            };

            const message = (body.message || '').trim();
            if (!message) {
                res.status(400).json({ success: false, message: 'message is required' });
                return;
            }

            const rawImageUrl = (body.imageUrl || '').trim();
            const imageUrl = rawImageUrl.length > 0 ? rawImageUrl : null;

            const rawDate = body.date || (req.query.date as string | undefined) || '';
            const today = new Date();
            const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
                today.getDate(),
            ).padStart(2, '0')}`;
            const date = (rawDate || defaultDate).slice(0, 10);

            // Check subscription status and daily message limit for free users
            const activeSubscription = await Subscription.findOne({
                userId,
                isActive: true,
                expiryDate: { $gt: new Date() },
            }).sort({ expiryDate: -1 });

            const isSubscribed = !!activeSubscription;

            // For free users, check daily message limit (max 2 messages per day)
            if (!isSubscribed) {
                const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

                const todayMessageCount = await NutritionChatMessage.countDocuments({
                    userId,
                    senderRole: 'user',
                    createdAt: {
                        $gte: startOfToday,
                        $lte: endOfToday,
                    },
                });

                const MAX_FREE_MESSAGES_PER_DAY = 2;
                if (todayMessageCount >= MAX_FREE_MESSAGES_PER_DAY) {
                    res.status(403).json({
                        success: false,
                        message: 'Daily message limit reached',
                        code: 'DAILY_MESSAGE_LIMIT_REACHED',
                        limit: MAX_FREE_MESSAGES_PER_DAY,
                    });
                    return;
                }
            }

            const [user, info, todayLog, plan] = await Promise.all([
                User.findById(userId)
                    .select('name hasCompletedAdditionalInfo hasGeneratedPlan streakCount lastStreakDate lastActivity addBurnedCalories rolloverCalories')
                    .lean(),
                AdditionalInfo.findOne({ userId }).lean(),
                DailyLog.findOne({ userId, date }).lean(),
                Plan.findOne({ userId }).sort({ updatedAt: -1 }).lean(),
            ]);

            const caloriesConsumed = Math.max(0, Number((todayLog as any)?.caloriesConsumed ?? 0));
            const burnedCalories = Math.max(0, Number((todayLog as any)?.burnedCalories ?? 0));
            const carbsGrams = Math.max(0, Number((todayLog as any)?.carbsGrams ?? 0));
            const proteinGrams = Math.max(0, Number((todayLog as any)?.proteinGrams ?? 0));
            const fatsGrams = Math.max(0, Number((todayLog as any)?.fatsGrams ?? 0));
            const goalCalories = Math.max(0, Number((plan as any)?.calories ?? 0));
            const maintenanceCalories = Math.max(0, Number((plan as any)?.maintenanceCalories ?? 0));

            const addBurned = (user as any)?.addBurnedCalories ?? true;
            const netCalories = caloriesConsumed - (addBurned ? burnedCalories : 0);

            const context: NutritionChatContext = {
                user: user
                    ? {
                        id: String((user as any)._id),
                        name: (user as any).name ?? null,
                        hasCompletedAdditionalInfo: (user as any).hasCompletedAdditionalInfo ?? false,
                        hasGeneratedPlan: (user as any).hasGeneratedPlan ?? false,
                        streakCount: (user as any).streakCount ?? 0,
                        lastStreakDate: (user as any).lastStreakDate ?? null,
                        lastActivity: (user as any).lastActivity ?? null,
                        preferences: {
                            addBurnedCalories: addBurned,
                            rolloverCalories: (user as any).rolloverCalories ?? true,
                        },
                    }
                    : null,
                additionalInfo: info
                    ? {
                        gender: (info as any).gender,
                        age: (info as any).age,
                        weight: (info as any).weight,
                        height: (info as any).height,
                        activityLevel: (info as any).activityLevel,
                        weightGoal: (info as any).weightGoal,
                        workoutFrequency: (info as any).workoutFrequency,
                        weightLossSpeed: (info as any).weightLossSpeed,
                        diet: (info as any).diet,
                        accomplishment: (info as any).accomplishment,
                        targetWeight: (info as any).targetWeight,
                    }
                    : null,
                plan: plan
                    ? {
                        calories: (plan as any).calories,
                        carbsGrams: (plan as any).carbsGrams,
                        proteinGrams: (plan as any).proteinGrams,
                        fatsGrams: (plan as any).fatsGrams,
                        healthScore: (plan as any).healthScore,
                        targetChangeLbs: (plan as any).targetChangeLbs,
                        targetDateIso: (plan as any).targetDateIso,
                        maintenanceCalories: (plan as any).maintenanceCalories,
                        calorieDeficit: (plan as any).calorieDeficit,
                        dailyGoal: (plan as any).dailyGoal,
                    }
                    : null,
                todayLog: todayLog
                    ? {
                        date,
                        caloriesConsumed,
                        burnedCalories,
                        carbsGrams,
                        proteinGrams,
                        fatsGrams,
                        items: Array.isArray((todayLog as any).items)
                            ? (todayLog as any).items.map((it: any) => ({
                                title: it.title,
                                calories: it.calories,
                                carbsGrams: it.carbsGrams,
                                proteinGrams: it.proteinGrams,
                                fatsGrams: it.fatsGrams,
                                healthScore: it.healthScore,
                                timeIso: it.timeIso,
                                liked: it.liked,
                            }))
                            : [],
                    }
                    : {
                        date,
                        caloriesConsumed: 0,
                        burnedCalories: 0,
                        carbsGrams: 0,
                        proteinGrams: 0,
                        fatsGrams: 0,
                        items: [],
                    },
                summary: {
                    date,
                    caloriesConsumed,
                    burnedCalories,
                    netCalories,
                    goalCalories,
                    maintenanceCalories,
                    overGoal: goalCalories > 0 ? netCalories - goalCalories : null,
                    remainingToGoal: goalCalories > 0 ? goalCalories - netCalories : null,
                },
            };

            const chatInput: any = {
                userMessage: message,
                context,
                userId,
            };

            if (imageUrl) {
                chatInput.imageUrl = imageUrl;
            }

            const streamFlag = String(((req.query as any)?.stream ?? (body as any)?.stream ?? '') || '').toLowerCase();
            const useStream = streamFlag === '1' || streamFlag === 'true';

            if (useStream) {
                await this.handleStreamingChat(req, res, {
                    userId: String(userId),
                    message,
                    imageUrl,
                    chatInput,
                });
                return;
            }

            const result = await this.getService().chat(chatInput);

            // Persist chat messages (user question + assistant reply)
            try {
                const userDoc: any = {
                    userId,
                    senderRole: 'user',
                    message,
                };
                if (imageUrl) {
                    userDoc.imageUrl = imageUrl;
                }

                const assistantDoc: any = {
                    userId,
                    senderRole: 'assistant',
                    message: result.data.reply,
                };

                await NutritionChatMessage.insertMany([userDoc, assistantDoc]);
            } catch (persistErr) {
                errorLogger.error('Failed to persist nutrition chat messages', persistErr as Error, req, {
                    userId,
                });
            }

            const cost = result.meta?.costUsd;
            if (typeof cost === 'number' && isFinite(cost) && cost > 0) {
                try {
                    await User.findByIdAndUpdate(userId, { $inc: { aiCostUsdTotal: cost } }).exec();
                } catch (persistErr) {
                    errorLogger.error('Failed to increment user AI cost (nutrition chat):', persistErr as Error, req, {
                        userId,
                    });
                }
            }

            res.status(200).json({
                success: true,
                data: { reply: result.data.reply },
                meta: result.meta,
                timestamp: new Date(),
            });
        } catch (error: any) {
            if (error?.message === 'OpenAI API key is not configured') {
                errorLogger.error('Nutrition chat error (missing API key):', error, req);
                res.status(503).json({ success: false, message: 'AI service is not configured' });
                return;
            }

            errorLogger.error('Nutrition chat error:', error, req);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async history(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const query = (req.query || {}) as { before?: string; limit?: string };
            const rawLimit = query.limit || '20';
            const limitNum = Math.min(Math.max(parseInt(rawLimit, 10) || 20, 1), 100);

            const filter: any = { userId };
            if (query.before) {
                const beforeDate = new Date(query.before);
                if (!isNaN(beforeDate.getTime())) {
                    filter.createdAt = { $lt: beforeDate };
                }
            }

            const docs = await NutritionChatMessage.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .limit(limitNum + 1)
                .lean();

            const hasMore = docs.length > limitNum;
            const limited = hasMore ? docs.slice(0, limitNum) : docs;
            limited.reverse();

            let nextCursor: string | null = null;
            if (hasMore && limited.length > 0) {
                const oldest = limited[0] as any;
                const createdAt = oldest.createdAt instanceof Date
                    ? oldest.createdAt
                    : new Date(oldest.createdAt);
                if (!isNaN(createdAt.getTime())) {
                    nextCursor = createdAt.toISOString();
                }
            }

            res.status(200).json({
                success: true,
                data: {
                    items: limited,
                    pagination: {
                        hasMore,
                        nextCursor,
                        limit: limitNum,
                    },
                },
            });
        } catch (error: any) {
            errorLogger.error('Nutrition chat history error:', error, req);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async adminUserHistory(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req.params as any)?.userId;
            if (!userId) {
                res.status(400).json({ success: false, message: 'userId is required' });
                return;
            }

            const query = (req.query || {}) as { page?: string; limit?: string };
            const rawPage = query.page || '1';
            const rawLimit = query.limit || '50';
            const pageNum = Math.max(parseInt(rawPage, 10) || 1, 1);
            const limitNum = Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 100);

            const filter: any = { userId };

            const [total, docs] = await Promise.all([
                NutritionChatMessage.countDocuments(filter),
                NutritionChatMessage.find(filter)
                    .sort({ createdAt: 1, _id: 1 })
                    .skip((pageNum - 1) * limitNum)
                    .limit(limitNum)
                    .lean(),
            ]);

            const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

            res.status(200).json({
                success: true,
                data: {
                    items: docs,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        totalPages,
                    },
                },
            });
        } catch (error: any) {
            errorLogger.error('Admin nutrition chat history error:', error, req as any);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async uploadImage(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const file = (req as any).file as any;
            if (!file || !file.filename) {
                res.status(400).json({ success: false, message: 'image file is required' });
                return;
            }

            // Use APP_URL in production for correct public URL
            const appUrl = process.env.APP_URL;
            const host = req.get('host');
            const protocol = req.protocol;
            const baseUrl = appUrl || `${protocol}://${host}`;
            const imageUrl = `${baseUrl}/api/food/images/${file.filename}`;

            res.status(200).json({
                success: true,
                data: { imageUrl },
                timestamp: new Date(),
            });
        } catch (error: any) {
            errorLogger.error('Nutrition chat image upload error:', error, req);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}
