import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { calculateAICostUSD, roundTo6, formatUSD } from '../utils/cost';
import { logServiceError } from '../utils/errorLogger';
import NutritionChatMessage from '../models/NutritionChatMessage';
import Settings, { IAiChatSettings } from '../models/Settings';

export interface NutritionChatMeta {
    model: string | null;
    provider: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    costUsd: number | null;
    usedFallback: boolean;
}

export interface NutritionChatResult {
    reply: string;
}

export interface NutritionChatResponse {
    data: NutritionChatResult;
    meta: NutritionChatMeta | null;
}

export interface ChatHistoryTurn {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface NutritionChatContext {
    user: any;
    additionalInfo: any;
    plan: any;
    todayLog: any;
    summary: any;
}

export interface NutritionChatInput {
    userMessage: string;
    context: NutritionChatContext;
    userId: string | mongoose.Types.ObjectId;
    imageUrl?: string | null;
}

interface ProviderConfig {
    name: string;
    client: OpenAI;
    model: string;
}

const SYSTEM_PROMPT =
    'Your name is Dorsa (درسا). You are an expert nutrition coach for a fitness & calorie tracking app.' +
    '\n- IMPORTANT: Detect the language of the user\'s message and ALWAYS reply in that SAME language. If the user writes in English, respond in English. If the user writes in Persian/Farsi, respond in Persian. If in any other language, respond in that language.' +
    '\n- Be natural and friendly in your responses.' +
    "\n- You are ONLY a chat assistant and cannot change or edit any data inside the app. You CANNOT add, edit, or delete food logs or any other records for the user." +
    "\n- If the user asks you to log food, change logs, or do anything inside the app, clearly explain that you cannot do it and that they must do it manually inside the app themselves." +
    "\n- When the latest user message includes JSON context about the user, their plan, or today's logs, carefully use that JSON to give precise, personalized advice." +
    "\n- RESPONSE LENGTH RULES:" +
    "\n  * For simple questions (greetings, single numbers, yes/no): answer VERY briefly (1-2 sentences max)." +
    "\n  * For detailed requests (meal plans, weekly schedules, recipes, workout plans, shopping lists): provide the FULL, COMPLETE, and DETAILED answer immediately. Do NOT stall, do NOT ask for extra confirmation, and do NOT break it into multiple messages. Deliver everything in one response." +
    "\n- If the user is clearly asking for a single number or value (for example daily calories or grams), answer ONLY that number or a very short range, plus at most one short sentence if really needed." +
    "\n- If there is no JSON context in the latest user message, treat it as a normal chat or a simple question and respond briefly without over-analyzing their logs or plan." +
    '\n- Give practical, short, and actionable advice (meals, timing, corrections).' +
    "\n- If essential information is missing, ask at most 1-2 clarifying questions. But if you already have enough info to answer, ANSWER IMMEDIATELY without asking more questions." +
    "\n- NEVER repeat what the user already told you. NEVER re-confirm details the user already provided. Just deliver the answer." +
    "\n- Be encouraging, never judgmental." +
    '\n- When you list more than one tip or suggestion, format them as short Markdown bullet points using "-" at the beginning of each line.' +
    '\n- Use Markdown **bold** only for very important numbers or keywords so the answer stays clean and easy to scan.';

const MAX_TOKENS = 4096;

export class NutritionChatService {
    private openaiClient: OpenAI | null = null;
    private deepseekClient: OpenAI | null = null;

    constructor() {
        // Initialize OpenAI client if key exists
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
            this.openaiClient = new OpenAI({ apiKey: openaiKey });
        }

        // Initialize DeepSeek client if key exists (uses OpenAI-compatible API)
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        if (deepseekKey) {
            this.deepseekClient = new OpenAI({
                apiKey: deepseekKey,
                baseURL: 'https://api.deepseek.com',
            });
        }

        if (!this.openaiClient && !this.deepseekClient) {
            console.warn('⚠️  No AI API keys configured (OPENAI_API_KEY or DEEPSEEK_API_KEY). Chat will not work.');
        }
    }

    private async getAiSettings(): Promise<IAiChatSettings> {
        try {
            const settings = await Settings.findOne().lean();
            if (settings?.aiChat) {
                return settings.aiChat as IAiChatSettings;
            }
        } catch (error) {
            logServiceError('NutritionChatService', 'getAiSettings', error as Error);
        }
        // Defaults
        return {
            provider: 'openai',
            openaiModel: 'gpt-5-mini',
            deepseekModel: 'deepseek-chat',
            enableFallback: true,
        };
    }

    private getProviderConfig(providerName: 'openai' | 'deepseek', aiSettings: IAiChatSettings): ProviderConfig | null {
        if (providerName === 'openai' && this.openaiClient) {
            return {
                name: 'openai',
                client: this.openaiClient,
                model: aiSettings.openaiModel || 'gpt-5-mini',
            };
        }
        if (providerName === 'deepseek' && this.deepseekClient) {
            return {
                name: 'deepseek',
                client: this.deepseekClient,
                model: aiSettings.deepseekModel || 'deepseek-chat',
            };
        }
        return null;
    }

    private getFallbackProvider(primary: 'openai' | 'deepseek'): 'openai' | 'deepseek' {
        return primary === 'openai' ? 'deepseek' : 'openai';
    }

    private resolveMimeTypeFromFilename(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        if (ext === '.png') return 'image/png';
        if (ext === '.webp') return 'image/webp';
        if (ext === '.gif') return 'image/gif';
        if (ext === '.bmp') return 'image/bmp';
        return 'image/jpeg';
    }

    private async buildImageDataUrl(imageUrl?: string | null): Promise<string | null> {
        const raw = (imageUrl || '').trim();
        if (!raw) return null;

        if (raw.startsWith('data:')) {
            return raw;
        }

        if (/^https?:\/\//i.test(raw)) {
            try {
                const url = new URL(raw);
                if (!url.pathname.includes('/api/food/images/')) {
                    return raw;
                }

                const filename = url.pathname.split('/').pop();
                if (!filename) return raw;

                const uploadsDir = path.join(__dirname, '../../uploads');
                const filepath = path.join(uploadsDir, filename);
                if (!fs.existsSync(filepath)) {
                    return raw;
                }

                const buffer = fs.readFileSync(filepath);
                const mime = this.resolveMimeTypeFromFilename(filename);
                const base64 = buffer.toString('base64');
                return `data:${mime};base64,${base64}`;
            } catch {
                return raw;
            }
        }

        return raw;
    }

    private async fetchMessageHistory(userId: string | mongoose.Types.ObjectId): Promise<ChatHistoryTurn[]> {
        try {
            const messages = await NutritionChatMessage.find({ userId })
                .sort({ createdAt: -1 })
                .limit(30)
                .lean();

            const history: ChatHistoryTurn[] = messages
                .reverse()
                .map((msg: any) => ({
                    role: (msg.senderRole === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                    content: msg.message || '',
                }))
                .filter((turn) => turn.content.trim().length > 0);

            return history.slice(-10);
        } catch (error) {
            logServiceError('NutritionChatService', 'fetchMessageHistory', error as Error);
            return [];
        }
    }

    private buildMessages(userMessage: string, context: NutritionChatContext, history: ChatHistoryTurn[], imageDataUrl: string | null): any[] {
        const messages: any[] = [
            { role: 'system', content: SYSTEM_PROMPT },
        ];

        for (const turn of history) {
            if (!turn || typeof turn.content !== 'string') continue;
            if (turn.role !== 'user' && turn.role !== 'assistant' && turn.role !== 'system') continue;
            messages.push({ role: turn.role, content: turn.content });
        }

        const rawUser = (userMessage ?? '').trim();
        const contextJson = JSON.stringify(context, null, 2);

        const userText =
            '[Context: The following JSON contains user info and today\'s log. Use it for personalized advice.]' +
            '\n[If the user asks for detailed content like meal plans or recipes, provide the FULL answer immediately without asking for more confirmation.]' +
            '\n[For simple questions or greetings, keep it brief.]' +
            '\n\nUser message: ' + rawUser +
            '\n\nJSON:' +
            '\n' +
            contextJson;

        const userContent: any[] = [
            { type: 'text', text: userText },
        ];

        if (imageDataUrl) {
            userContent.push({
                type: 'image_url',
                image_url: { url: imageDataUrl },
            });
        }

        messages.push({
            role: 'user',
            content: userContent,
        });

        return messages;
    }

    private buildMeta(model: string | undefined, provider: string, usage: any, usedFallback: boolean): NutritionChatMeta | null {
        try {
            if (!usage) {
                console.log('NutritionChat token usage: not available on response');
                return null;
            }

            const promptTokens = usage.prompt_tokens ?? 0;
            const completionTokens = usage.completion_tokens ?? 0;
            const totalTokens = usage.total_tokens ?? promptTokens + completionTokens;
            const cost = model != null ? calculateAICostUSD(model, promptTokens, completionTokens) : null;

            if (cost != null) {
                const rounded = roundTo6(cost);
                console.log(`NutritionChat [${provider}] estimated cost (USD):`, formatUSD(rounded));
            } else {
                console.log(`NutritionChat [${provider}] estimated cost: pricing not configured for model`, model);
            }

            return {
                model: model ?? null,
                provider,
                promptTokens,
                completionTokens,
                totalTokens,
                costUsd: cost != null ? roundTo6(cost) : null,
                usedFallback,
            };
        } catch (error) {
            logServiceError('NutritionChatService', 'buildMeta', error as Error);
            return null;
        }
    }

    public async chat(input: NutritionChatInput): Promise<NutritionChatResponse> {
        const { userMessage, context, userId, imageUrl } = input;
        const aiSettings = await this.getAiSettings();

        const history = await this.fetchMessageHistory(userId);
        const imageDataUrl = await this.buildImageDataUrl(imageUrl);
        const messages = this.buildMessages(userMessage, context, history, imageDataUrl);

        // Try primary provider
        const primaryConfig = this.getProviderConfig(aiSettings.provider, aiSettings);
        const fallbackName = this.getFallbackProvider(aiSettings.provider);
        const fallbackConfig = aiSettings.enableFallback ? this.getProviderConfig(fallbackName, aiSettings) : null;

        const tryChat = async (config: ProviderConfig) => {
            console.log(`NutritionChat: attempting provider [${config.name}] with model [${config.model}]`);
            const chat = await config.client.chat.completions.create({
                model: config.model,
                messages,
                max_completion_tokens: MAX_TOKENS,
            });
            return chat;
        };

        let result: any;
        let usedProvider: ProviderConfig;
        let usedFallback = false;

        if (primaryConfig) {
            try {
                result = await tryChat(primaryConfig);
                usedProvider = primaryConfig;
            } catch (primaryError: any) {
                console.error(`NutritionChat: primary provider [${primaryConfig.name}] failed:`, primaryError?.message || primaryError);

                if (fallbackConfig) {
                    console.log(`NutritionChat: falling back to [${fallbackConfig.name}]`);
                    try {
                        result = await tryChat(fallbackConfig);
                        usedProvider = fallbackConfig;
                        usedFallback = true;
                    } catch (fallbackError: any) {
                        console.error(`NutritionChat: fallback provider [${fallbackConfig.name}] also failed:`, fallbackError?.message || fallbackError);
                        throw new Error(`Both AI providers failed. Primary (${primaryConfig.name}): ${primaryError?.message}. Fallback (${fallbackConfig.name}): ${fallbackError?.message}`);
                    }
                } else {
                    throw primaryError;
                }
            }
        } else if (fallbackConfig) {
            // Primary not available (no API key), try fallback directly
            console.log(`NutritionChat: primary [${aiSettings.provider}] not available, using [${fallbackName}] directly`);
            result = await tryChat(fallbackConfig);
            usedProvider = fallbackConfig;
            usedFallback = true;
        } else {
            throw new Error('No AI provider configured. Please set OPENAI_API_KEY or DEEPSEEK_API_KEY.');
        }

        const meta = this.buildMeta(
            (result as any)?.model,
            usedProvider!.name,
            (result as any)?.usage,
            usedFallback
        );

        const choice = result.choices?.[0];
        const message = choice?.message as any;
        const content = typeof message?.content === 'string' ? message.content.trim() : '';

        const reply = content ||
            'I couldn\'t respond properly right now. Please try asking your question again with more details.';

        return {
            data: { reply },
            meta,
        };
    }

    public async chatStream(input: NutritionChatInput): Promise<{ stream: AsyncIterable<any>; provider: string; model: string; usedFallback: boolean }> {
        const { userMessage, context, userId, imageUrl } = input;
        const aiSettings = await this.getAiSettings();

        const history = await this.fetchMessageHistory(userId);
        const imageDataUrl = await this.buildImageDataUrl(imageUrl);
        const messages = this.buildMessages(userMessage, context, history, imageDataUrl);

        const primaryConfig = this.getProviderConfig(aiSettings.provider, aiSettings);
        const fallbackName = this.getFallbackProvider(aiSettings.provider);
        const fallbackConfig = aiSettings.enableFallback ? this.getProviderConfig(fallbackName, aiSettings) : null;

        const tryStream = async (config: ProviderConfig) => {
            console.log(`NutritionChat stream: attempting provider [${config.name}] with model [${config.model}]`);
            const stream = await config.client.chat.completions.create({
                model: config.model,
                messages,
                stream: true,
                max_completion_tokens: MAX_TOKENS,
            });
            return stream;
        };

        if (primaryConfig) {
            try {
                const stream = await tryStream(primaryConfig);
                return { stream: stream as any, provider: primaryConfig.name, model: primaryConfig.model, usedFallback: false };
            } catch (primaryError: any) {
                console.error(`NutritionChat stream: primary provider [${primaryConfig.name}] failed:`, primaryError?.message || primaryError);

                if (fallbackConfig) {
                    console.log(`NutritionChat stream: falling back to [${fallbackConfig.name}]`);
                    try {
                        const stream = await tryStream(fallbackConfig);
                        return { stream: stream as any, provider: fallbackConfig.name, model: fallbackConfig.model, usedFallback: true };
                    } catch (fallbackError: any) {
                        console.error(`NutritionChat stream: fallback [${fallbackConfig.name}] also failed:`, fallbackError?.message || fallbackError);
                        throw new Error(`Both AI providers failed. Primary (${primaryConfig.name}): ${primaryError?.message}. Fallback (${fallbackConfig.name}): ${fallbackError?.message}`);
                    }
                } else {
                    throw primaryError;
                }
            }
        } else if (fallbackConfig) {
            console.log(`NutritionChat stream: primary [${aiSettings.provider}] not available, using [${fallbackName}] directly`);
            const stream = await tryStream(fallbackConfig);
            return { stream: stream as any, provider: fallbackConfig.name, model: fallbackConfig.model, usedFallback: true };
        }

        throw new Error('No AI provider configured. Please set OPENAI_API_KEY or DEEPSEEK_API_KEY.');
    }
}
