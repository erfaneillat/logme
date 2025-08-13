import OpenAI from 'openai';
import sharp from 'sharp';

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

    public async analyze(base64Image: string): Promise<FoodAnalysisResult> {
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
            temperature: 0.2,
            max_tokens: 450,
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
        parsed.healthScore = Math.max(0, Math.min(10, Math.round(parsed.healthScore)));
        parsed.ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];

        return parsed;
    }
}


