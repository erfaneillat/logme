import OpenAI from 'openai';
import { calculateOpenAICostUSD, formatUSD, roundTo6 } from '../utils/cost';
import { logServiceError } from '../utils/errorLogger';

export interface ExerciseAnalysisMeta {
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    costUsd: number | null;
}

type SupportedLocale = 'fa' | 'en' | 'ar' | 'tr' | 'de' | 'fr' | 'es';

export interface ExerciseAnalysisResponse {
    data: ExerciseAnalysisResult;
    meta: ExerciseAnalysisMeta | null;
}

export interface ExerciseAnalysisResult {
    activityName: string;
    caloriesBurned: number;
    duration: number;
    intensity: string; // e.g., "Low", "Moderate", "High"
    tips: string[]; // Helpful tips for the exercise
}

export class ExerciseAnalysisService {
    private client: OpenAI;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        this.client = new OpenAI({ apiKey });
    }

    private getLanguageName(locale: string): string {
        const map: Record<string, string> = {
            'fa': 'PERSIAN (fa-IR)',
            'en': 'ENGLISH',
            'ar': 'ARABIC',
            'tr': 'TURKISH',
            'de': 'GERMAN',
            'fr': 'FRENCH',
            'es': 'SPANISH'
        };
        return map[locale] || 'ENGLISH';
    }

    public async analyzeExercise(
        activityDescription: string,
        duration: number,
        userWeight?: number,
        locale: string = 'fa'
    ): Promise<ExerciseAnalysisResponse> {
        const weightInfo = userWeight ? `User weight: ${userWeight} kg.` : 'User weight is not provided - use average adult weight (70kg) for calculations.';
        const langName = this.getLanguageName(locale);

        const prompt = `Analyze the exercise/activity and calculate calories burned.

Activity description: "${activityDescription}"
Duration: ${duration} minutes
${weightInfo}

Calculate the calories burned and return ONLY JSON (no extra text) with keys: activityName, caloriesBurned, duration, intensity, tips.

Rules: 
- activityName: Clean name in ${langName} 
- caloriesBurned: Integer number based on duration and estimated intensity
- duration: Same as input (${duration})
- intensity: One of "Low", "Moderate", "High" translated to ${langName}
- tips: Array of 2-3 helpful tips in ${langName} about the exercise

Base calculations on standard MET (Metabolic Equivalent) values:
- Walking: 3.0-4.0 METs
- Running: 8.0-12.0 METs  
- Cycling: 6.0-10.0 METs
- Swimming: 6.0-11.0 METs
- Weight training: 3.0-6.0 METs

Formula: Calories = METs × weight(kg) × duration(hours)
Provide realistic calorie estimates based on typical exercise intensities.`;

        const chat = await this.client.chat.completions.create({
            model: 'gpt-5-mini',
            response_format: { type: 'json_object' } as any,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            max_completion_tokens: 800,
        });

        // Log token usage and estimated cost if available
        let meta: ExerciseAnalysisMeta | null = null;
        try {
            const model = (chat as any)?.model as string | undefined;
            const usage = (chat as any)?.usage as any | undefined;
            if (usage) {
                const promptTokens = usage.prompt_tokens ?? 0;
                const completionTokens = usage.completion_tokens ?? 0;
                const totalTokens = usage.total_tokens ?? (promptTokens + completionTokens);
                console.log('ExerciseAnalysis token usage:', {
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
                    console.log('ExerciseAnalysis estimated cost (USD):', formatUSD(rounded));
                } else {
                    console.log('ExerciseAnalysis estimated cost: pricing not configured for model', model);
                }
                meta = {
                    model: model ?? null,
                    promptTokens: promptTokens ?? null,
                    completionTokens: completionTokens ?? null,
                    totalTokens: totalTokens ?? null,
                    costUsd: cost != null ? roundTo6(cost) : null,
                };
            } else {
                console.log('ExerciseAnalysis token usage: not available on response');
            }
        } catch {
            // Swallow logging errors to avoid impacting request flow
        }

        const choice = chat.choices?.[0];
        const message = (choice?.message ?? {}) as any;
        const structured = message?.parsed;
        const fallbackResult = this.buildFallbackResult(activityDescription, duration, locale, userWeight);
        let parsed: ExerciseAnalysisResult;

        if (structured && typeof structured === 'object') {
            parsed = structured as ExerciseAnalysisResult;
        } else {
            const content = typeof message?.content === 'string' ? message.content : '';
            if (!content.trim()) {
                logServiceError('ExerciseAnalysisService', 'analyzeExercise', 'AI response parsing failed. Empty content', {
                    finishReason: choice?.finish_reason,
                });
                console.warn('Falling back to heuristic exercise analysis result.');
                parsed = fallbackResult;
            } else {
                try {
                    // Try to parse the content directly first
                    parsed = JSON.parse(content);
                } catch (err) {
                    logServiceError(
                        'ExerciseAnalysisService',
                        'analyzeExercise',
                        'AI response parsing failed while JSON.parse',
                        { content }
                    );
                    logServiceError(
                        'ExerciseAnalysisService',
                        'analyzeExercise',
                        err,
                        { note: 'parse error' }
                    );

                    // Try to extract JSON from the content if it's wrapped in other text
                    try {
                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            parsed = JSON.parse(jsonMatch[0]);
                            console.log('Successfully extracted JSON from wrapped content');
                        } else {
                            throw new Error('No JSON object found in response');
                        }
                    } catch (extractErr) {
                        logServiceError(
                            'ExerciseAnalysisService',
                            'analyzeExercise',
                            extractErr,
                            { note: 'json extraction failed' }
                        );
                        console.warn('Falling back to heuristic exercise analysis result.');
                        parsed = fallbackResult;
                    }
                }
            }
        }

        // Basic shape enforcement/fallbacks
        parsed.activityName = parsed.activityName || activityDescription;
        parsed.caloriesBurned = Math.max(0, Math.round(Number(parsed.caloriesBurned) || 0));
        parsed.duration = Math.max(0, Math.round(Number(parsed.duration) || duration));
        parsed.intensity = parsed.intensity || (locale === 'fa' ? 'متوسط' : 'Moderate');
        parsed.tips = Array.isArray(parsed.tips) ? parsed.tips : [];

        // Sanity check for calories - ensure it's reasonable
        if (parsed.caloriesBurned <= 0 || parsed.caloriesBurned > (duration * 20)) {
            // Fallback calculation: assume moderate intensity (5 METs) for 70kg person
            const fallbackCalories = Math.round(5 * 70 * (duration / 60));
            parsed.caloriesBurned = fallbackCalories;
        }

        return { data: parsed, meta };
    }

    private buildFallbackResult(activityDescription: string, duration: number, locale: string, userWeight?: number): ExerciseAnalysisResult {
        const met = this.estimateMet(activityDescription);
        const weight = userWeight ?? 70;
        const calories = Math.round(met * weight * (duration / 60));
        const intensity = this.mapMetToIntensity(met, locale);

        const tips = locale === 'fa' ? [
            'قبل از شروع ورزش بدن را گرم کنید',
            'در طول فعالیت آب کافی بنوشید',
            'شدت تمرین را متناسب با توان خود تنظیم کنید',
        ] : [
            'Warm up before starting exercise',
            'Stay hydrated during activity',
            'Adjust intensity according to your ability',
        ];

        return {
            activityName: this.getActivityName(activityDescription, locale),
            caloriesBurned: Math.max(calories, 0),
            duration,
            intensity,
            tips,
        };
    }

    private estimateMet(activityDescription: string): number {
        const activity = activityDescription.toLowerCase();
        if (this.includesAny(activity, ['sprint', 'hiit', 'interval', 'دویدن سریع'])) return 12;
        if (this.includesAny(activity, ['run', 'running', 'دویدن'])) return 9;
        if (this.includesAny(activity, ['walk', 'walking', 'پیاده'])) return 3.5;
        if (this.includesAny(activity, ['cycle', 'cycling', 'bike', 'دوچرخه'])) return 7;
        if (this.includesAny(activity, ['swim', 'swimming', 'شنا'])) return 7.5;
        if (this.includesAny(activity, ['yoga', 'pilates', 'یوگا', 'پیلاتس'])) return 3;
        if (this.includesAny(activity, ['strength', 'weight', 'resistance', 'وزنه'])) return 5;
        if (this.includesAny(activity, ['football', 'soccer', 'فوتبال'])) return 8;
        if (this.includesAny(activity, ['basketball', 'بسکتبال'])) return 6.5;
        if (this.includesAny(activity, ['tennis', 'تنیس'])) return 7;
        return 4.5; // default moderate activity
    }

    private mapMetToIntensity(met: number, locale: string): string {
        const isFa = locale === 'fa';
        if (met < 4) return isFa ? 'کم' : 'Low';
        if (met > 8) return isFa ? 'زیاد' : 'High';
        return isFa ? 'متوسط' : 'Moderate';
    }

    private includesAny(haystack: string, needles: string[]): boolean {
        return needles.some((needle) => haystack.includes(needle));
    }

    private getActivityName(activityDescription: string, locale: string): string {
        const activity = activityDescription.toLowerCase();
        const isFa = locale === 'fa';

        if (this.includesAny(activity, ['run', 'running', 'دویدن'])) return isFa ? 'دویدن' : 'Running';
        if (this.includesAny(activity, ['walk', 'walking', 'پیاده'])) return isFa ? 'پیاده روی' : 'Walking';
        if (this.includesAny(activity, ['cycle', 'cycling', 'bike', 'دوچرخه'])) return isFa ? 'دوچرخه سواری' : 'Cycling';
        if (this.includesAny(activity, ['swim', 'swimming', 'شنا'])) return isFa ? 'شنا کردن' : 'Swimming';
        if (this.includesAny(activity, ['strength', 'weight', 'resistance', 'وزنه'])) return isFa ? 'تمرین قدرتی' : 'Strength Training';
        if (this.includesAny(activity, ['yoga', 'pilates', 'یوگا', 'پیلاتس'])) return isFa ? 'یوگا' : 'Yoga';
        if (this.includesAny(activity, ['football', 'soccer', 'فوتبال'])) return isFa ? 'فوتبال' : 'Football';
        if (this.includesAny(activity, ['basketball', 'بسکتبال'])) return isFa ? 'بسکتبال' : 'Basketball';
        if (this.includesAny(activity, ['tennis', 'تنیس'])) return isFa ? 'تنیس' : 'Tennis';
        return activityDescription;
    }
}