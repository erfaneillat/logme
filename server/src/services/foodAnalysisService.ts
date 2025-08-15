import OpenAI from 'openai';
import sharp from 'sharp';
import { calculateOpenAICostUSD, formatUSD, roundTo6 } from '../utils/cost';

export interface FoodAnalysisMeta {
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    costUsd: number | null;
}

export interface FoodAnalysisResponse {
    data: FoodAnalysisResult;
    meta: FoodAnalysisMeta | null;
}

export interface IngredientBreakdown {
    name: string;
    calories: number;
    proteinGrams: number;
    fatGrams: number;
    carbsGrams: number;
}

export interface FoodAnalysisResult {
    title: string;
    calories: number;
    portions: number;
    proteinGrams: number;
    fatGrams: number;
    carbsGrams: number;
    healthScore: number; // 0..10
    ingredients: IngredientBreakdown[];
}

export class FoodAnalysisService {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    private async compressBase64Image(originalBase64: string): Promise<string> {
        try {
            const inputBuffer = Buffer.from(originalBase64, 'base64');
            const outputBuffer = await sharp(inputBuffer)
                .rotate()
                .resize({
                    width: 250,
                    height: 250,
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .jpeg({ quality: 60, progressive: true, mozjpeg: true })
                .toBuffer();
            return outputBuffer.toString('base64');
        } catch (error) {
            return originalBase64; // fallback without blocking
        }
    }

    public async analyze(base64Image: string, options?: { signal?: AbortSignal }): Promise<FoodAnalysisResponse> {
        const prompt = `Analyze the meal photo.
Return ONLY JSON (no extra text) with keys: title, calories, portions, proteinGrams, fatGrams, carbsGrams, healthScore, ingredients (array of {name, calories, proteinGrams, fatGrams, carbsGrams}).
Rules: strings MUST be Persian (fa-IR); numbers numeric; healthScore 0..10 integer; up to 6 ingredients; macros roughly consistent (4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat) ±20%.`;

        const compressedBase64 = await this.compressBase64Image(base64Image);
        const imageUrl = `data:image/jpeg;base64,${compressedBase64}`;

        const chat = await this.client.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' } as any,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: imageUrl } },
                    ] as any,
                },
            ],
            // temperature: 0.2,
            // max_tokens: 450,
        }, { signal: options?.signal });

        // Log token usage and estimated cost if available
        let meta: FoodAnalysisMeta | null = null;
        try {
            const model = (chat as any)?.model as string | undefined;
            const usage = (chat as any)?.usage as any | undefined;
            if (usage) {
                const promptTokens = usage.prompt_tokens ?? 0;
                const completionTokens = usage.completion_tokens ?? 0;
                const totalTokens = usage.total_tokens ?? (promptTokens + completionTokens);
                console.log('FoodAnalysis token usage:', {
                    model,
                    promptTokens,
                    completionTokens,
                    totalTokens,
                });
                const cost = model != null ? calculateOpenAICostUSD(
                    model,
                    promptTokens,
                    completionTokens
                ) : null;
                if (cost != null) {
                    const rounded = roundTo6(cost);
                    console.log('FoodAnalysis estimated cost (USD):', formatUSD(rounded));
                } else {
                    console.log('FoodAnalysis estimated cost: pricing not configured for model', model);
                }
                meta = {
                    model: model ?? null,
                    promptTokens: promptTokens ?? null,
                    completionTokens: completionTokens ?? null,
                    totalTokens: totalTokens ?? null,
                    costUsd: cost != null ? roundTo6(cost) : null,
                };
            } else {
                console.log('FoodAnalysis token usage: not available on response');
            }
        } catch {
            // Swallow logging errors to avoid impacting request flow
        }

        const content = chat.choices?.[0]?.message?.content ?? '';
        let parsed: FoodAnalysisResult;
        try {
            parsed = JSON.parse(content);
        } catch (err) {
            throw new Error('AI response parsing failed');
        }

        // Basic shape enforcement/fallbacks
        parsed.portions = parsed.portions || 1;
        parsed.ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];

        // Compute a deterministic health score using macros as a fallback
        const computed = this.computeHealthScore(parsed);
        const aiScore = Number(parsed.healthScore);
        if (!Number.isFinite(aiScore) || aiScore <= 0) {
            parsed.healthScore = computed;
        } else {
            // Blend AI score with computed score for stability
            parsed.healthScore = Math.round(Math.max(0, Math.min(10, (aiScore + computed) / 2)));
        }

        return { data: parsed, meta };
    }

    /**
     * Compute a simple health score 0..10 from macro balance, calorie density, and variety.
     * This is intentionally lightweight and deterministic to keep server costs low.
     */
    private computeHealthScore(result: FoodAnalysisResult): number {
        const calories = Math.max(0, Number(result.calories) || 0);
        const protein = Math.max(0, Number(result.proteinGrams) || 0);
        const fat = Math.max(0, Number(result.fatGrams) || 0);
        const carbs = Math.max(0, Number(result.carbsGrams) || 0);

        const energyFromMacros = protein * 4 + carbs * 4 + fat * 9;
        const totalEnergy = energyFromMacros > 0 ? energyFromMacros : calories;
        const proteinPct = totalEnergy > 0 ? (protein * 4) / totalEnergy : 0;
        const fatPct = totalEnergy > 0 ? (fat * 9) / totalEnergy : 0;
        const carbsPct = totalEnergy > 0 ? (carbs * 4) / totalEnergy : 0;

        // Target macro distribution: Protein 25%, Fat 30%, Carbs 45%
        const diff = Math.abs(proteinPct - 0.25) + Math.abs(fatPct - 0.30) + Math.abs(carbsPct - 0.45);
        // Map total deviation (max ~= 2) to a 0..8 base score
        const macroScore = Math.max(0, 8 * (1 - diff / 1.5));

        // Calorie density: prefer meals around 300-700 kcal per portion
        let kcalScore = 1.0; // 0..2
        if (calories <= 0) {
            kcalScore = 0.5;
        } else if (calories > 900) {
            kcalScore = 0.2;
        } else if (calories > 750) {
            kcalScore = 0.6;
        } else if (calories < 250) {
            kcalScore = 1.2;
        } else {
            kcalScore = 1.6;
        }

        // Protein density bonus (g per 100 kcal)
        const proteinPer100 = calories > 0 ? (protein / (calories / 100)) : 0;
        const proteinBonus = Math.max(0, Math.min(1.5, (proteinPer100 - 2) * 0.5)); // up to +1.5 for >=5g/100kcal

        // Ingredient variety bonus up to +0.5
        const varietyBonus = Math.min(0.5, Math.max(0, (result.ingredients?.length || 0) * 0.1));

        const raw = macroScore + kcalScore + proteinBonus + varietyBonus; // 0..~12
        return Math.max(0, Math.min(10, Math.round(raw)));
    }

    public async fixAnalysis(originalData: any, userDescription: string): Promise<FoodAnalysisResult> {
        const prompt = `Fix the food analysis based on user feedback.

Original analysis:
${JSON.stringify(originalData, null, 2)}

User feedback: "${userDescription}"

Based on the user's description, correct the analysis and return ONLY JSON (no extra text) with the same structure: title, calories, portions, proteinGrams, fatGrams, carbsGrams, healthScore, ingredients (array of {name, calories, proteinGrams, fatGrams, carbsGrams}).

Rules: 
- Keep strings in Persian (fa-IR) 
- Numbers must be numeric
- healthScore 0..10 integer
- Up to 6 ingredients
- Macros should be roughly consistent (4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat) ±20%
- Make reasonable adjustments based on user feedback about portion size, ingredients, or other details`;

        const chat = await this.client.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' } as any,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3,
        });

        const content = chat.choices?.[0]?.message?.content ?? '';
        let parsed: FoodAnalysisResult;
        try {
            parsed = JSON.parse(content);
        } catch (err) {
            throw new Error('AI response parsing failed');
        }

        // Basic shape enforcement/fallbacks
        parsed.portions = parsed.portions || 1;
        parsed.ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];

        // Compute health score with fallback
        const computed = this.computeHealthScore(parsed);
        const aiScore = Number(parsed.healthScore);
        if (!Number.isFinite(aiScore) || aiScore <= 0) {
            parsed.healthScore = computed;
        } else {
            parsed.healthScore = Math.round(Math.max(0, Math.min(10, (aiScore + computed) / 2)));
        }

        return parsed;
    }
}


