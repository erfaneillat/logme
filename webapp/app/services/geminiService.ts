"use client";

import { GoogleGenAI, Type } from "@google/genai";

// Get API key from environment variable
const getApiKey = () => {
    if (typeof window !== 'undefined') {
        // Client-side: use NEXT_PUBLIC_ prefix
        return process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    }
    return process.env.GEMINI_API_KEY || "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface FoodAnalysisResult {
    foodName: string;
    estimatedCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    confidence: string;
}

const RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        foodName: { type: Type.STRING, description: "نام کوتاه و توصیفی غذا به فارسی" },
        estimatedCalories: { type: Type.NUMBER, description: "تخمین کل کالری" },
        proteinGrams: { type: Type.NUMBER, description: "تخمین گرم پروتئین" },
        carbsGrams: { type: Type.NUMBER, description: "تخمین گرم کربوهیدرات" },
        fatGrams: { type: Type.NUMBER, description: "تخمین گرم چربی" },
        confidence: { type: Type.STRING, description: "میزان اطمینان شناسایی (High/Medium/Low)" },
    },
    required: ["foodName", "estimatedCalories", "proteinGrams", "carbsGrams", "fatGrams"],
};

export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysisResult> => {
    try {
        const cleanBase64 = base64Image.split(',')[1] || base64Image;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
                    { text: "این تصویر غذا را تحلیل کن. غذای اصلی را شناسایی کن و ارزش غذایی آن را برای یک وعده استاندارد تخمین بزن. واقع‌بین باش. نام غذا را به زبان فارسی برگردان." },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
            },
        });

        if (response.text) {
            return JSON.parse(response.text) as FoodAnalysisResult;
        }
        throw new Error("No response text from Gemini");
    } catch (error) {
        console.error("Error analyzing food image:", error);
        throw error;
    }
};

export const analyzeFoodText = async (description: string): Promise<FoodAnalysisResult> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { text: `این توضیحات غذا را تحلیل کن: "${description}". ارزش غذایی آن را برای یک وعده استاندارد تخمین بزن. نام غذا را به فارسی برگردان.` },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
            },
        });

        if (response.text) {
            return JSON.parse(response.text) as FoodAnalysisResult;
        }
        throw new Error("No response text from Gemini");
    } catch (error) {
        console.error("Error analyzing food text:", error);
        throw error;
    }
};

export const chatWithNutritionist = async (message: string, history: { role: string, parts: { text: string }[] }[] = []): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                ...history,
                { role: 'user', parts: [{ text: message }] }
            ],
            config: {
                systemInstruction: "شما 'درسا' هستید، یک مربی تغذیه و رژیم هوشمند، دلسوز و حرفه‌ای. پاسخ‌های شما باید کوتاه، مفید و با لحنی دوستانه و انگیزشی باشد. به فارسی پاسخ دهید. سعی کنید از ایموجی‌های مرتبط استفاده کنید.",
            }
        });
        return response.text || "متاسفانه نتوانستم پاسخ دهم.";
    } catch (error) {
        console.error("Error calling chat API", error);
        return "مشکلی در ارتباط پیش آمده. لطفا دوباره تلاش کنید.";
    }
}
