import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import OpenAI from 'openai';
import { calculateOpenAICostUSD, formatUSD } from '../utils/cost';
import User from '../models/User';
import AdditionalInfo from '../models/AdditionalInfo';
import Plan from '../models/Plan';

interface AuthRequest extends Request { user?: any }

const buildPrompt = (user: any, info: any): string => {
    const gender = info?.gender ?? 'unspecified';
    const age = info?.age as number | undefined;
    const height = info?.height as number | undefined;
    const weight = info?.weight as number | undefined;
    const activity = info?.activityLevel ?? 'moderately_active';
    const goal = info?.weightGoal ?? 'maintain_weight';
    const speed = info?.weightLossSpeed ?? 0.5;
    const diet = info?.diet ?? 'classic';
    const targetWeight = info?.targetWeight as number | undefined;

    // Calculate maintenance calories using Mifflin-St Jeor equation
    let bmr = 0;
    if (age && weight && height) {
        if (gender === 'male') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else if (gender === 'female') {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        } else {
            // Use average of male and female for 'other'
            const maleBmr = 10 * weight + 6.25 * height - 5 * age + 5;
            const femaleBmr = 10 * weight + 6.25 * height - 5 * age - 161;
            bmr = (maleBmr + femaleBmr) / 2;
        }
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725
    };

    const maintenanceCalories = Math.round(bmr * (activityMultipliers[activity] || 1.55));

    return `You are a daily nutrition planning engine. Based on the comprehensive user profile, produce a compact JSON with fields: calories (number), carbsGrams (number), proteinGrams (number), fatsGrams (number), healthScore (0..10 integer), targetChangeLbs (number), targetDateIso (ISO date string), maintenanceCalories (number), calorieDeficit (number), dailyGoal (string).

Complete User Profile:
- gender: ${gender}
- age: ${age} years
- height: ${height} cm
- current weight: ${weight} kg
- target weight: ${targetWeight ? `${targetWeight} kg` : 'unspecified'}
- weight to lose/gain: ${targetWeight && weight ? `${weight - targetWeight} kg` : 'unspecified'}
- activityLevel: ${activity} (sedentary=1.2, lightly_active=1.375, moderately_active=1.55, very_active=1.725)
- weightGoal: ${goal}
- workoutFrequency: ${info?.workoutFrequency ?? 'unspecified'} (0-2, 3-5, or 6+ sessions per week)
- weightLossSpeed: ${speed} kg per week
- diet: ${diet} (classic, pescatarian, vegetarian, vegan)
- accomplishment: ${info?.accomplishment ?? 'unspecified'} (eat_healthier, boost_energy, stay_motivated, feel_better)

Calculated Values:
- BMR (Basal Metabolic Rate): ${bmr} calories/day
- Maintenance calories: ${maintenanceCalories} calories/day
- Weekly calorie adjustment needed: ${speed * 7700} calories (${speed} kg × 7700 cal/kg)

Nutrition Planning Rules:
- For weight loss: Set calories BELOW maintenance (deficit of 300-500 calories/day)
- For weight gain: Set calories ABOVE maintenance (surplus of 300-500 calories/day)
- For weight maintenance: Set calories EQUAL to maintenance
- Protein requirements:
  * Weight loss: 1.2-1.6g per kg body weight
  * Weight maintenance: 1.4-1.8g per kg body weight
  * Weight gain/muscle building: 1.6-2.2g per kg body weight
- Carbohydrates: 45-65% of total calories (lower for weight loss, higher for weight gain)
- Fats: 20-35% of total calories
- Consider workout frequency for protein and calorie distribution
- Account for diet restrictions (vegan/vegetarian may need more protein from plant sources)
- healthScore: Rate the plan's nutritional quality (7-10 for good plans)
- targetChangeLbs: Convert ${speed} kg/week to lbs and calculate total target
- targetDateIso: Set realistic target date based on weight difference and weekly rate
- dailyGoal: "lose_weight", "gain_weight", or "maintain_weight"
- calorieDeficit: Positive for weight loss, negative for weight gain, 0 for maintenance
- Prefer integers and realistic values
- Respond with ONLY raw JSON object.`;
};

export class PlanController {
    async generatePlan(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, errors: errors.array() });
                return;
            }

            const userId = req.user.userId;
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            const info = await AdditionalInfo.findOne({ userId });
            if (!info) {
                res.status(400).json({ success: false, message: 'Additional info not found' });
                return;
            }

            const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const prompt = buildPrompt(user, info);

            // Use chat.completions with JSON mode
            const chat = await client.chat.completions.create({
                model: 'gpt-5-mini',
                response_format: { type: 'json_object' } as any,
                messages: [
                    { role: 'system', content: 'You are an assistant that outputs only JSON.' },
                    { role: 'user', content: prompt },
                ],

            });
            // Log token usage and estimated cost
            try {
                const model = (chat as any)?.model;
                const usage = (chat as any)?.usage;
                if (usage) {
                    console.log('PlanGeneration token usage:', {
                        model,
                        promptTokens: usage.prompt_tokens,
                        completionTokens: usage.completion_tokens,
                        totalTokens: usage.total_tokens,
                    });
                    const cost = calculateOpenAICostUSD(
                        model,
                        usage.prompt_tokens ?? 0,
                        usage.completion_tokens ?? 0
                    );
                    if (cost != null) {
                        // Round to 6 decimals for storage/logging consistency
                        const roundedCost = Math.round(cost * 1e6) / 1e6;
                        console.log('PlanGeneration estimated cost (USD):', formatUSD(roundedCost));
                        // Persist cumulative cost to user
                        try {
                            await User.findByIdAndUpdate(userId, { $inc: { aiCostUsdTotal: roundedCost } }).exec();
                        } catch (persistErr) {
                            console.error('Failed to increment user AI cost:', persistErr);
                        }
                    } else {
                        console.log('PlanGeneration estimated cost: pricing not configured for model', model);
                    }
                } else {
                    console.log('PlanGeneration token usage: not available on response');
                }
            } catch (_) {
                // ignore logging errors
            }
            const content = chat.choices?.[0]?.message?.content ?? '';
            let parsed: any;
            try {
                parsed = JSON.parse(content);
            } catch {
                res.status(502).json({ success: false, message: 'AI response parsing failed', raw: content });
                return;
            }

            const plan = await Plan.findOneAndUpdate(
                { userId },
                {
                    userId,
                    calories: Math.round(parsed.calories ?? 2000),
                    carbsGrams: Math.round(parsed.carbsGrams ?? 200),
                    proteinGrams: Math.round(parsed.proteinGrams ?? 120),
                    fatsGrams: Math.round(parsed.fatsGrams ?? 70),
                    healthScore: Math.max(0, Math.min(10, Math.round(parsed.healthScore ?? 7))),
                    targetChangeLbs: parsed.targetChangeLbs ?? 0,
                    targetDateIso: parsed.targetDateIso ?? null,
                    maintenanceCalories: parsed.maintenanceCalories ? Math.round(parsed.maintenanceCalories) : null,
                    calorieDeficit: parsed.calorieDeficit ? Math.round(parsed.calorieDeficit) : null,
                    dailyGoal: parsed.dailyGoal ?? null,
                },
                { new: true, upsert: true }
            );

            user.hasGeneratedPlan = true;
            await user.save();

            res.json({ success: true, data: { plan } });
        } catch (error) {
            console.error('Generate plan error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getLatestPlan(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const plan = await Plan.findOne({ userId }).sort({ updatedAt: -1 });
            if (!plan) {
                res.status(404).json({ success: false, message: 'Plan not found' });
                return;
            }

            res.json({ success: true, data: { plan } });
        } catch (error) {
            console.error('Get latest plan error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async updatePlanManual(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const body = req.body ?? {};
            const patch: any = {};
            const keys = [
                { in: 'calories', out: 'calories' },
                { in: 'proteinGrams', out: 'proteinGrams' },
                { in: 'carbsGrams', out: 'carbsGrams' },
                { in: 'fatsGrams', out: 'fatsGrams' },
            ];
            for (const k of keys) {
                if (body[k.in] !== undefined && body[k.in] !== null) {
                    const v = Number(body[k.in]);
                    if (!Number.isFinite(v)) {
                        res.status(400).json({ success: false, message: `Invalid ${k.in}` });
                        return;
                    }
                    patch[k.out] = Math.round(v);
                }
            }

            if (Object.keys(patch).length === 0) {
                res.status(400).json({ success: false, message: 'No valid fields to update' });
                return;
            }

            const plan = await Plan.findOneAndUpdate(
                { userId },
                { $set: patch },
                { new: true }
            );

            if (!plan) {
                res.status(404).json({ success: false, message: 'Plan not found' });
                return;
            }

            res.json({ success: true, data: { plan } });
        } catch (error) {
            console.error('Update plan manual error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}


