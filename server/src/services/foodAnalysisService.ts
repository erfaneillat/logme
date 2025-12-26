import OpenAI from 'openai';
import sharp from 'sharp';
import { calculateOpenAICostUSD, formatUSD, roundTo6 } from '../utils/cost';
import { logServiceError } from '../utils/errorLogger';

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
    isFood?: boolean;
    error?: string;
    title: string;
    calories: number;
    portions: number;
    proteinGrams: number;
    fatGrams: number;
    carbsGrams: number;
    healthScore: number; // 0..10
    ingredients: IngredientBreakdown[];
}

interface CompressedImageResult {
    base64: string;
    mime: 'image/webp' | 'image/jpeg';
}

export class FoodAnalysisService {
    private client: OpenAI;

    private readonly model: string;
    private readonly temperature: number | undefined;
    private readonly maxTokens: number | undefined;

    constructor() {
        this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.model = process.env.FOOD_ANALYSIS_MODEL || 'gpt-5-mini';
        const tempRaw = process.env.FOOD_ANALYSIS_TEMPERATURE;
        const maxTokensRaw = process.env.FOOD_ANALYSIS_MAX_TOKENS;
        const parsedTemp = tempRaw != null ? Number(tempRaw) : undefined;
        const parsedMax = maxTokensRaw != null ? Number(maxTokensRaw) : undefined;
        this.temperature = Number.isFinite(parsedTemp!) ? parsedTemp : undefined;
        this.maxTokens = Number.isFinite(parsedMax!) ? parsedMax : undefined;
    }

    private async compressBase64Image(originalBase64: string): Promise<CompressedImageResult> {
        try {
            const inputBuffer = Buffer.from(originalBase64, 'base64');
            const image = sharp(inputBuffer, { failOn: 'none' }).rotate();
            const metadata = await image.metadata();
            const maxDimension = 768; // keep good detail while controlling tokens
            const width = metadata.width || maxDimension;
            const height = metadata.height || maxDimension;
            const scale = Math.min(1, maxDimension / Math.max(width, height));
            const targetWidth = Math.max(1, Math.floor(width * scale));
            const targetHeight = Math.max(1, Math.floor(height * scale));

            // Try WebP first for better compression; fallback to JPEG if unsupported
            try {
                const webpBuffer = await image
                    .resize({ width: targetWidth, height: targetHeight, fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 70, effort: 5 })
                    .toBuffer();
                return { base64: webpBuffer.toString('base64'), mime: 'image/webp' };
            } catch (_) {
                // fallback to JPEG
            }

            const outputBuffer = await image
                .resize({ width: targetWidth, height: targetHeight, fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 65, progressive: true, mozjpeg: true })
                .toBuffer();

            return { base64: outputBuffer.toString('base64'), mime: 'image/jpeg' };
        } catch (_) {
            return { base64: originalBase64, mime: 'image/jpeg' }; // fallback without blocking
        }
    }

    private buildChatParams(baseParams: any): any {
        const params: any = { ...baseParams };
        // Only set temperature if not using gpt-5-mini (which only supports default temperature)
        if (this.temperature != null && this.model !== 'gpt-5-mini') {
            params.temperature = this.temperature;
        }
        if (this.maxTokens != null) params.max_completion_tokens = this.maxTokens;
        return params;
    }

    private getLanguageName(locale: string): string {
        const map: Record<string, string> = {
            'fa': 'FARSI',
            'en': 'ENGLISH',
            'ar': 'ARABIC',
            'tr': 'TURKISH',
            'de': 'GERMAN',
            'fr': 'FRENCH',
            'es': 'SPANISH'
        };
        return map[locale] || 'ENGLISH';
    }

    private improveImagePrompt(description?: string, locale: string = 'fa'): string {
        const langName = this.getLanguageName(locale);
        let basePrompt = `You are the advanced AI Nutritionist and Computer Vision Engine for "Loqme".

### CORE PROTOCOLS:
1. Language: Process logic in ENGLISH, output user-facing text in ${langName}.
2. Output Format: Return ONLY a valid JSON object.
3. Aggregation Rule: Sum up all nutritional values for the total meal.

### PHASE 1: PHYSICS & TEXTURE ENGINE (The Tie-Breaker)
CRITICAL: Use "Gravity Physics" to distinguish Sangak from Taftoon/Lavash.

* 1. THE "GRAVITY" TEST (Rigidity):
    * Rigid/Stiff: If the bread holds its shape in air or acts like a "lid" over a pot -> SANGAK.
    * Floppy/Draping: If the bread folds easily like fabric -> LAVASH or SOFT TAFTOON.

* 2. THE "MACHINE SANGAK" RULE:
    * If you see a grid pattern BUT the bread is thick/rigid or has large dark burns -> CLASSIFY AS SANGAK.

### PHASE 2: VALIDATION & OUTPUT
IMPORTANT: First check if this image contains FOOD. If the image does not contain food (e.g., objects, people, landscapes, text, etc.), return {"isFood": false, "error": "This image does not contain food. Please take a photo of your meal."}.

If the image contains food, return the following JSON structure:
Required JSON keys: isFood (true), title (string), calories (int), portions (int), proteinGrams (int), fatGrams (int), carbsGrams (int), healthScore (int 0..10), ingredients (array, up to 6, each: {name (string), calories (int), proteinGrams (int), fatGrams (int), carbsGrams (int)}).
Rules:
- Strings MUST be ${langName}. No emoji.
- The 'title' field MUST be in ${langName} (Translated/Localized). Do not use English names.
- All numbers MUST be numeric integers (no units, no text).
- Ensure calorie consistency: calories ≈ proteinGrams*4 + carbsGrams*4 + fatGrams*9 (±20%). Prefer adjusting macros first; then adjust calories if still off.
- Portions: default 1 if unclear.
- healthScore: 0..10 integer. Rate based on balance and quality.
- No explanations, no extra keys, JSON object only.`;

        // If user provided a description, add it to help with analysis
        if (description && description.trim()) {
            basePrompt += `

### USER PROVIDED DESCRIPTION:
The user has provided the following description to help identify the food:
"${description.trim()}"

IMPORTANT: Use this description as a hint to better identify ingredients and estimate portions. The description may clarify what specific dishes are in the image, especially for mixed plates or traditional foods that may be hard to identify visually.`;
        }

        return basePrompt;
    }

    private improveTextPrompt(description: string, locale: string = 'fa'): string {
        const langName = this.getLanguageName(locale);
        return `You are the advanced AI Nutritionist Engine for "Loqme".

### CORE PROTOCOLS:
1. Language: Process logic in ENGLISH, output user-facing text in ${langName}.
2. Output Format: Return ONLY a valid JSON object.
3. Aggregation Rule: Sum up all nutritional values for the total meal.

### PHASE 1: FOOD IDENTIFICATION & PORTION ESTIMATION
CRITICAL: Accurately identify the food from the user's description.

* 1. PERSIAN FOOD KNOWLEDGE BASE:
    * Rice dishes (پلو): Zereshk Polo, Baghali Polo, Sabzi Polo, etc. Avg portion: 200-300g cooked rice.
    * Stews (خورشت): Ghormeh Sabzi, Gheimeh, Fesenjan, etc. Avg portion: 150-250g.
    * Kebabs: Koobideh (~100g each), Joojeh (~150g), Barg (~180g).
    * Breads: Sangak (~150g), Barbari (~100g), Lavash (~50g), Taftoon (~80g).
    * Soups/Ash: Ash Reshteh, Ash-e Doogh. Avg bowl: 300-400ml.
    * Fast food: Pizza slice (~150g), Sandwich (~250g), Burger (~200g patty).

* 2. PORTION SIZE CUES:
    * "یک بشقاب" / "یک پرس" = 1 standard portion
    * "نصف" / "نیم" = 0.5 portion
    * "کم" / "یک کم" = 0.7 portion
    * "زیاد" / "پر" = 1.3-1.5 portion
    * Numbers like "۲ عدد" or "2 pieces" = multiply accordingly
    * If unit specified (گرم/gram), use exact weight

* 3. COMMON ABBREVIATIONS & COLLOQUIAL TERMS:
    * "چلو" = plain rice; "پلو" = rice with ingredients
    * "گوشت" alone usually means beef/lamb
    * "مرغ" = chicken; "جوجه" = chicken kebab
    * "ماست" = yogurt; "دوغ" = yogurt drink
    * "نون" = bread (colloquial for نان)

### PHASE 2: NUTRITIONAL CALCULATION
* Use standard nutritional databases.
* For composite dishes (e.g., "چلو خورشت"), calculate components separately then aggregate.
* Default cooking oil: 1-2 tbsp per portion unless specified.
* Rice absorption: Account for cooked weight (~3x dry weight).

### PHASE 3: VALIDATION & OUTPUT
User's food description: "${description}"

Required JSON keys: title (string), calories (int), portions (int), proteinGrams (int), fatGrams (int), carbsGrams (int), healthScore (int 0..10), ingredients (array, up to 6, each: {name (string), calories (int), proteinGrams (int), fatGrams (int), carbsGrams (int)}).

Rules:
- Strings MUST be ${langName}. No emoji.
- The 'title' field MUST be in ${langName} (Translated/Localized). Do not use English names.
- All numbers MUST be numeric integers (no units, no text).
- Ensure calorie consistency: calories ≈ proteinGrams*4 + carbsGrams*4 + fatGrams*9 (±20%). Prefer adjusting macros first; then adjust calories if still off.
- Portions: Infer from description, default 1 if unclear.
- healthScore: 0..10 integer. Rate based on nutritional balance, protein density, fiber content, and processing level.
  * 8-10: High protein, balanced macros, whole foods
  * 5-7: Moderate balance, some processed ingredients
  * 2-4: High carb/fat ratio, processed foods
  * 0-1: Very unhealthy, mostly empty calories
- No explanations, no extra keys, JSON object only.`;
    }

    private sanitizeIngredient(ing: any): IngredientBreakdown | null {
        const name = typeof ing?.name === 'string' && ing.name.trim().length > 0 ? ing.name.trim() : '';
        const calories = Math.max(0, Math.round(Number(ing?.calories ?? 0)));
        const proteinGrams = Math.max(0, Math.round(Number(ing?.proteinGrams ?? 0)));
        const fatGrams = Math.max(0, Math.round(Number(ing?.fatGrams ?? 0)));
        const carbsGrams = Math.max(0, Math.round(Number(ing?.carbsGrams ?? 0)));
        if (!name) return null;
        return { name, calories, proteinGrams, fatGrams, carbsGrams };
    }

    private reconcileCaloriesAndMacros(result: FoodAnalysisResult): FoodAnalysisResult {
        const protein = Math.max(0, Math.round(Number(result.proteinGrams) || 0));
        const fat = Math.max(0, Math.round(Number(result.fatGrams) || 0));
        const carbs = Math.max(0, Math.round(Number(result.carbsGrams) || 0));
        const macroCalories = protein * 4 + carbs * 4 + fat * 9;
        let calories = Math.max(0, Math.round(Number(result.calories) || 0));

        if (macroCalories > 0) {
            const diff = Math.abs(macroCalories - calories);
            const tolerance = Math.max(50, Math.round(macroCalories * 0.2));
            if (calories <= 0) {
                calories = macroCalories;
            } else if (diff > tolerance) {
                // Scale macros proportionally to match calories if difference is large
                const scale = calories / macroCalories;
                const scaledProtein = Math.max(0, Math.round(protein * scale));
                const scaledCarbs = Math.max(0, Math.round(carbs * scale));
                const scaledFat = Math.max(0, Math.round(fat * scale));
                const rescaledMacroCalories = scaledProtein * 4 + scaledCarbs * 4 + scaledFat * 9;
                const rescaledDiff = Math.abs(rescaledMacroCalories - calories);
                if (rescaledDiff <= tolerance) {
                    result.proteinGrams = scaledProtein;
                    result.carbsGrams = scaledCarbs;
                    result.fatGrams = scaledFat;
                } else {
                    calories = macroCalories; // fallback to macro-driven calories
                }
            }
        }

        result.calories = calories;
        result.proteinGrams = protein;
        result.fatGrams = fat;
        result.carbsGrams = carbs;
        return result;
    }

    private sanitizeResult(raw: any): FoodAnalysisResult {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            throw new Error('Invalid AI response structure');
        }
        // Check if this is a non-food image response
        if (raw?.isFood === false) {
            return {
                isFood: false,
                error: typeof raw?.error === 'string' ? raw.error : 'This image does not contain food. Please take a photo of your meal.',
                title: '',
                calories: 0,
                portions: 1,
                proteinGrams: 0,
                fatGrams: 0,
                carbsGrams: 0,
                healthScore: 0,
                ingredients: [],
            };
        }

        const title = typeof raw?.title === 'string' && raw.title.trim().length > 0 ? raw.title.trim() : 'غذا';
        const portions = Math.max(1, Math.round(Number(raw?.portions ?? 1)));
        const calories = Math.max(0, Math.round(Number(raw?.calories ?? 0)));
        const proteinGrams = Math.max(0, Math.round(Number(raw?.proteinGrams ?? 0)));
        const fatGrams = Math.max(0, Math.round(Number(raw?.fatGrams ?? 0)));
        const carbsGrams = Math.max(0, Math.round(Number(raw?.carbsGrams ?? 0)));
        const healthScoreRaw = Number(raw?.healthScore);
        let healthScore = Number.isFinite(healthScoreRaw) ? Math.max(0, Math.min(10, Math.round(healthScoreRaw))) : 0;

        let ingredients: IngredientBreakdown[] = [];
        if (Array.isArray(raw?.ingredients)) {
            for (const ing of raw.ingredients.slice(0, 6)) {
                const s = this.sanitizeIngredient(ing);
                if (s) ingredients.push(s);
            }
        }

        let result: FoodAnalysisResult = {
            isFood: true,
            title,
            calories,
            portions,
            proteinGrams,
            fatGrams,
            carbsGrams,
            healthScore,
            ingredients,
        };

        result = this.reconcileCaloriesAndMacros(result);

        // Recompute/blend health score
        const computed = this.computeHealthScore(result);
        if (!Number.isFinite(healthScore) || healthScore <= 0) {
            result.healthScore = computed;
        } else {
            result.healthScore = Math.round(Math.max(0, Math.min(10, (healthScore + computed) / 2)));
        }

        return result;
    }

    public async analyze(base64Image: string, options?: { signal?: AbortSignal; description?: string; locale?: string }): Promise<FoodAnalysisResponse> {
        const locale = options?.locale || 'fa';
        const prompt = this.improveImagePrompt(options?.description, locale);

        const { base64, mime } = await this.compressBase64Image(base64Image);
        const imageUrl = `data:${mime};base64,${base64}`;

        const baseParams = {
            model: this.model,
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
        };
        const chat = await this.client.chat.completions.create(this.buildChatParams(baseParams), { signal: options?.signal });

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
            const raw = JSON.parse(content);
            parsed = this.sanitizeResult(raw);
        } catch (err) {
            throw new Error('AI response parsing failed');
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

    public async fixAnalysis(originalData: any, userDescription: string, locale: string = 'fa'): Promise<FoodAnalysisResponse> {
        const langName = this.getLanguageName(locale);
        const prompt = `Fix the food analysis based on user feedback and output STRICT JSON only.

Original analysis:
${JSON.stringify(originalData, null, 2)}

User feedback: "${userDescription}"

Return the same JSON keys: title, calories (int), portions (int), proteinGrams (int), fatGrams (int), carbsGrams (int), healthScore (int 0..10), ingredients (array, up to 6, items with name, calories (int), proteinGrams (int), fatGrams (int), carbsGrams (int)).
Rules:
- IMPORTANT: If the current title is inaccurate or vague, REPLACE it with a correct and specific title in ${langName}.
- Strings MUST be ${langName}. No emoji.
- The 'title' field MUST be in ${langName} (Translated/Localized). Do not use English names.
- Ensure calories ≈ protein*4 + carbs*4 + fat*9 (±20%). Prefer adjusting macros first; then calories if needed.
- Portions default to 1 if unclear.
- No explanations, no extra keys.`;

        const baseParams = {
            model: this.model,
            response_format: { type: 'json_object' } as any,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        };
        const chat = await this.client.chat.completions.create(this.buildChatParams(baseParams));

        // Log token usage and estimated cost if available
        let meta: FoodAnalysisMeta | null = null;
        try {
            const model = (chat as any)?.model as string | undefined;
            const usage = (chat as any)?.usage as any | undefined;
            if (usage) {
                const promptTokens = usage.prompt_tokens ?? 0;
                const completionTokens = usage.completion_tokens ?? 0;
                const totalTokens = usage.total_tokens ?? (promptTokens + completionTokens);
                console.log('FoodAnalysisFix token usage:', {
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
                    console.log('FoodAnalysisFix estimated cost (USD):', formatUSD(rounded));
                } else {
                    console.log('FoodAnalysisFix estimated cost: pricing not configured for model', model);
                }
                meta = {
                    model: model ?? null,
                    promptTokens: promptTokens ?? null,
                    completionTokens: completionTokens ?? null,
                    totalTokens: totalTokens ?? null,
                    costUsd: cost != null ? roundTo6(cost) : null,
                };
            } else {
                console.log('FoodAnalysisFix token usage: not available on response');
            }
        } catch {
            // Swallow logging errors to avoid impacting request flow
        }

        const content = chat.choices?.[0]?.message?.content ?? '';
        let parsed: FoodAnalysisResult;
        try {
            const raw = JSON.parse(content);
            parsed = this.sanitizeResult(raw);
        } catch (err) {
            throw new Error('AI response parsing failed');
        }

        return { data: parsed, meta };
    }

    public async analyzeFromDescription(description: string, locale: string = 'fa'): Promise<FoodAnalysisResponse> {
        const prompt = this.improveTextPrompt(description, locale);

        const baseParams = {
            model: this.model,
            response_format: { type: 'json_object' } as any,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        };
        const chat = await this.client.chat.completions.create(this.buildChatParams(baseParams));

        // Log token usage and estimated cost if available
        let meta: FoodAnalysisMeta | null = null;
        try {
            const model = (chat as any)?.model as string | undefined;
            const usage = (chat as any)?.usage as any | undefined;
            if (usage) {
                const promptTokens = usage.prompt_tokens ?? 0;
                const completionTokens = usage.completion_tokens ?? 0;
                const totalTokens = usage.total_tokens ?? (promptTokens + completionTokens);
                console.log('FoodAnalysisText token usage:', {
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
                    console.log('FoodAnalysisText estimated cost (USD):', formatUSD(rounded));
                } else {
                    console.log('FoodAnalysisText estimated cost: pricing not configured for model', model);
                }
                meta = {
                    model: model ?? null,
                    promptTokens: promptTokens ?? null,
                    completionTokens: completionTokens ?? null,
                    totalTokens: totalTokens ?? null,
                    costUsd: cost != null ? roundTo6(cost) : null,
                };
            } else {
                console.log('FoodAnalysisText token usage: not available on response');
            }
        } catch {
            // Swallow logging errors to avoid impacting request flow
        }

        const content = chat.choices?.[0]?.message?.content ?? '';
        let parsed: FoodAnalysisResult;
        try {
            const raw = JSON.parse(content);
            parsed = this.sanitizeResult(raw);
        } catch (err) {
            throw new Error('AI response parsing failed');
        }

        return { data: parsed, meta };
    }
}


