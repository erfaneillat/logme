import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { calculateOpenAICostUSD, roundTo6, formatUSD } from '../utils/cost';
import { logServiceError } from '../utils/errorLogger';
import NutritionChatMessage from '../models/NutritionChatMessage';

export interface NutritionChatMeta {
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    costUsd: number | null;
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

export class NutritionChatService {
    private client: OpenAI;
    private readonly model: string;
    private readonly maxTokens: number | undefined;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }

        this.client = new OpenAI({ apiKey });
        this.model = process.env.NUTRITION_CHAT_MODEL || 'gpt-5-mini';

        const maxTokensRaw = process.env.NUTRITION_CHAT_MAX_TOKENS;
        const parsedMax = maxTokensRaw != null ? Number(maxTokensRaw) : undefined;
        this.maxTokens = Number.isFinite(parsedMax!) ? parsedMax : undefined;
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

        // Already a data URL
        if (raw.startsWith('data:')) {
            return raw;
        }

        // If it's a normal public HTTP(S) URL that is not our local image endpoint, pass through
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
                .limit(30) // Fetch 30 messages (15 turns = 15 user + 15 assistant)
                .lean();

            // Convert to ChatHistoryTurn format and reverse to chronological order
            const history: ChatHistoryTurn[] = messages
                .reverse()
                .map((msg: any) => ({
                    role: (msg.senderRole === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                    content: msg.message || '',
                }))
                .filter((turn) => turn.content.trim().length > 0);

            // Take only last 15 turns
            return history.slice(-10);
        } catch (error) {
            logServiceError('NutritionChatService', 'fetchMessageHistory', error as Error);
            return [];
        }
    }

    public async chat(input: NutritionChatInput): Promise<NutritionChatResponse> {
        const { userMessage, context, userId, imageUrl } = input;

        const systemPrompt =
            'Your name is Dorsa (درسا). You are an expert nutrition coach for a fitness & calorie tracking app.' +
            '\n- IMPORTANT: Detect the language of the user\'s message and ALWAYS reply in that SAME language. If the user writes in English, respond in English. If the user writes in Persian/Farsi, respond in Persian. If in any other language, respond in that language.' +
            '\n- Be natural and friendly in your responses.' +
            "\n- You are ONLY a chat assistant and cannot change or edit any data inside the app. You CANNOT add, edit, or delete food logs or any other records for the user." +
            "\n- If the user asks you to log food, change logs, or do anything inside the app, clearly explain that you cannot do it and that they must do it manually inside the app themselves." +
            "\n- When the latest user message includes JSON context about the user, their plan, or today's logs, carefully use that JSON to give precise, personalized advice." +
            "\n- For simple and direct questions, always answer VERY briefly (maximum 1-2 short sentences)." +
            "\n- If the user is clearly asking for a single number or value (for example daily calories or grams), answer ONLY that number or a very short range, plus at most one short sentence if really needed." +
            "\n- If there is no JSON context in the latest user message, treat it as a normal chat or a simple question and respond briefly without over-analyzing their logs or plan." +
            '\n- Give practical, short, and actionable advice (meals, timing, corrections).' +
            "\n- If information is missing, ask 1-2 clarifying questions instead of guessing." +
            "\n- Be encouraging, never judgmental." +
            '\n- When you list more than one tip or suggestion, format them as short Markdown bullet points using "-" at the beginning of each line.' +
            '\n- Use Markdown **bold** only for very important numbers or keywords so the answer stays clean and easy to scan.';

        const messages: any[] = [
            { role: 'system', content: systemPrompt },
        ];

        // Fetch message history from database
        const history = await this.fetchMessageHistory(userId);
        for (const turn of history) {
            if (!turn || typeof turn.content !== 'string') continue;
            if (turn.role !== 'user' && turn.role !== 'assistant' && turn.role !== 'system') continue;
            messages.push({ role: turn.role, content: turn.content });
        }

        const rawUser = (userMessage ?? '').trim();
        const contextJson = JSON.stringify(context, null, 2);

        const userText =
            '[Context: The following JSON contains user info and today\'s log. Use it for personalized advice.]' +
            '\n[Keep your answer very brief: 1-2 sentences max, unless the user asks for more detail.]' +
            '\n[If the question is about a specific number (calories, protein, etc.), just give that number or range.]' +
            '\n[If this is just a greeting or casual chat, just reply briefly and friendly.]' +
            '\n\nUser message: ' + rawUser +
            '\n\nJSON:' +
            '\n' +
            contextJson;

        const userContent: any[] = [
            { type: 'text', text: userText },
        ];

        const imageDataUrl = await this.buildImageDataUrl(imageUrl);
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

        const params: any = {
            model: this.model,
            messages,
        };

        if (this.maxTokens != null) {
            params.max_completion_tokens = this.maxTokens;
        }

        const chat = await this.client.chat.completions.create(params);

        // Token usage and cost meta
        let meta: NutritionChatMeta | null = null;
        try {
            const model = (chat as any)?.model as string | undefined;
            const usage = (chat as any)?.usage as any | undefined;
            if (usage) {
                const promptTokens = usage.prompt_tokens ?? 0;
                const completionTokens = usage.completion_tokens ?? 0;
                const totalTokens = usage.total_tokens ?? promptTokens + completionTokens;
                const cost = model != null ? calculateOpenAICostUSD(model, promptTokens, completionTokens) : null;

                if (cost != null) {
                    const rounded = roundTo6(cost);
                    console.log('NutritionChat estimated cost (USD):', formatUSD(rounded));
                } else {
                    console.log('NutritionChat estimated cost: pricing not configured for model', model);
                }

                meta = {
                    model: model ?? null,
                    promptTokens: promptTokens ?? null,
                    completionTokens: completionTokens ?? null,
                    totalTokens: totalTokens ?? null,
                    costUsd: cost != null ? roundTo6(cost) : null,
                };
            } else {
                console.log('NutritionChat token usage: not available on response');
            }
        } catch (error) {
            logServiceError('NutritionChatService', 'chat(meta)', error as Error);
        }

        const choice = chat.choices?.[0];
        const message = choice?.message as any;
        const content = typeof message?.content === 'string' ? message.content.trim() : '';

        const reply = content ||
            'I couldn\'t respond properly right now. Please try asking your question again with more details.';

        return {
            data: { reply },
            meta,
        };
    }

    public async chatStream(input: NutritionChatInput): Promise<AsyncIterable<any>> {
        const { userMessage, context, userId, imageUrl } = input;

        const systemPrompt =
            'Your name is Dorsa (درسا). You are an expert nutrition coach for a fitness & calorie tracking app.' +
            '\n- IMPORTANT: Detect the language of the user\'s message and ALWAYS reply in that SAME language. If the user writes in English, respond in English. If the user writes in Persian/Farsi, respond in Persian. If in any other language, respond in that language.' +
            '\n- Be natural and friendly in your responses.' +
            "\n- You are ONLY a chat assistant and cannot change or edit any data inside the app. You CANNOT add, edit, or delete food logs or any other records for the user." +
            "\n- If the user asks you to log food, change logs, or do anything inside the app, clearly explain that you cannot do it and that they must do it manually inside the app themselves." +
            "\n- When the latest user message includes JSON context about the user, their plan, or today's logs, carefully use that JSON to give precise, personalized advice." +
            "\n- For simple and direct questions, always answer VERY briefly (maximum 1-2 short sentences)." +
            "\n- If the user is clearly asking for a single number or value (for example daily calories or grams), answer ONLY that number or a very short range, plus at most one short sentence if really needed." +
            "\n- If there is no JSON context in the latest user message, treat it as a normal chat or a simple question and respond briefly without over-analyzing their logs or plan." +
            '\n- Give practical, short, and actionable advice (meals, timing, corrections).' +
            "\n- If information is missing, ask 1-2 clarifying questions instead of guessing." +
            "\n- Be encouraging, never judgmental." +
            '\n- When you list more than one tip or suggestion, format them as short Markdown bullet points using "-" at the beginning of each line.' +
            '\n- Use Markdown **bold** only for very important numbers or keywords so the answer stays clean and easy to scan.';

        const messages: any[] = [
            { role: 'system', content: systemPrompt },
        ];

        // Fetch message history from database
        const history = await this.fetchMessageHistory(userId);
        for (const turn of history) {
            if (!turn || typeof turn.content !== 'string') continue;
            if (turn.role !== 'user' && turn.role !== 'assistant' && turn.role !== 'system') continue;
            messages.push({ role: turn.role, content: turn.content });
        }

        const rawUser = (userMessage ?? '').trim();
        const contextJson = JSON.stringify(context, null, 2);

        const userText =
            '[Context: The following JSON contains user info and today\'s log. Use it for personalized advice.]' +
            '\n[Keep your answer very brief: 1-2 sentences max, unless the user asks for more detail.]' +
            '\n[If the question is about a specific number (calories, protein, etc.), just give that number or range.]' +
            '\n[If this is just a greeting or casual chat, just reply briefly and friendly.]' +
            '\n\nUser message: ' + rawUser +
            '\n\nJSON:' +
            '\n' +
            contextJson;

        const userContent: any[] = [
            { type: 'text', text: userText },
        ];

        const imageDataUrl = await this.buildImageDataUrl(imageUrl);
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

        const params: any = {
            model: this.model,
            messages,
            stream: true,
        };

        if (this.maxTokens != null) {
            params.max_completion_tokens = this.maxTokens;
        }

        const stream = await this.client.chat.completions.create(params);
        return stream as any;
    }
}
