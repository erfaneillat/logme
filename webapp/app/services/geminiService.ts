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

// Language configurations for multi-language support
type SupportedLocale = 'fa' | 'en' | 'ar' | 'tr' | 'de' | 'fr' | 'es';

interface LanguageConfig {
    foodNameDescription: string;
    caloriesDescription: string;
    proteinDescription: string;
    carbsDescription: string;
    fatDescription: string;
    confidenceDescription: string;
    imagePrompt: string;
    textPrompt: (description: string) => string;
    chatSystemPrompt: string;
    chatFallback: string;
    chatError: string;
}

const languageConfigs: Record<SupportedLocale, LanguageConfig> = {
    fa: {
        foodNameDescription: "نام کوتاه و توصیفی غذا به فارسی",
        caloriesDescription: "تخمین کل کالری",
        proteinDescription: "تخمین گرم پروتئین",
        carbsDescription: "تخمین گرم کربوهیدرات",
        fatDescription: "تخمین گرم چربی",
        confidenceDescription: "میزان اطمینان شناسایی (High/Medium/Low)",
        imagePrompt: "این تصویر غذا را تحلیل کن. غذای اصلی را شناسایی کن و ارزش غذایی آن را برای یک وعده استاندارد تخمین بزن. واقع‌بین باش. نام غذا را به زبان فارسی برگردان.",
        textPrompt: (desc) => `این توضیحات غذا را تحلیل کن: "${desc}". ارزش غذایی آن را برای یک وعده استاندارد تخمین بزن. نام غذا را به فارسی برگردان.`,
        chatSystemPrompt: "شما 'درسا' هستید، یک مربی تغذیه و رژیم هوشمند، دلسوز و حرفه‌ای. پاسخ‌های شما باید کوتاه، مفید و با لحنی دوستانه و انگیزشی باشد. به فارسی پاسخ دهید. سعی کنید از ایموجی‌های مرتبط استفاده کنید.",
        chatFallback: "متاسفانه نتوانستم پاسخ دهم.",
        chatError: "مشکلی در ارتباط پیش آمده. لطفا دوباره تلاش کنید.",
    },
    en: {
        foodNameDescription: "Short descriptive name of the food in English",
        caloriesDescription: "Estimated total calories",
        proteinDescription: "Estimated protein in grams",
        carbsDescription: "Estimated carbohydrates in grams",
        fatDescription: "Estimated fat in grams",
        confidenceDescription: "Identification confidence level (High/Medium/Low)",
        imagePrompt: "Analyze this food image. Identify the main food item and estimate its nutritional value for a standard serving. Be realistic. Provide the food name in English.",
        textPrompt: (desc) => `Analyze this food description: "${desc}". Estimate its nutritional value for a standard serving. Provide the food name in English.`,
        chatSystemPrompt: "You are 'Darsa', a smart, caring, and professional nutrition and diet coach. Your responses should be brief, helpful, and have a friendly, motivational tone. Respond in English. Try to use relevant emojis.",
        chatFallback: "Sorry, I couldn't respond.",
        chatError: "A connection error occurred. Please try again.",
    },
    ar: {
        foodNameDescription: "اسم قصير ووصفي للطعام بالعربية",
        caloriesDescription: "تقدير السعرات الحرارية الإجمالية",
        proteinDescription: "تقدير البروتين بالجرام",
        carbsDescription: "تقدير الكربوهيدرات بالجرام",
        fatDescription: "تقدير الدهون بالجرام",
        confidenceDescription: "مستوى الثقة في التعرف (عالي/متوسط/منخفض)",
        imagePrompt: "حلل صورة الطعام هذه. حدد الطعام الرئيسي وقدر قيمته الغذائية لحصة قياسية. كن واقعياً. قدم اسم الطعام بالعربية.",
        textPrompt: (desc) => `حلل وصف الطعام هذا: "${desc}". قدر قيمته الغذائية لحصة قياسية. قدم اسم الطعام بالعربية.`,
        chatSystemPrompt: "أنت 'درسا'، مدرب تغذية ذكي ومهتم ومحترف. يجب أن تكون ردودك مختصرة ومفيدة وبنبرة ودية ومحفزة. أجب بالعربية. حاول استخدام الرموز التعبيرية ذات الصلة.",
        chatFallback: "عذراً، لم أتمكن من الرد.",
        chatError: "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
    },
    tr: {
        foodNameDescription: "Yiyeceğin Türkçe kısa açıklayıcı adı",
        caloriesDescription: "Tahmini toplam kalori",
        proteinDescription: "Tahmini protein gram",
        carbsDescription: "Tahmini karbonhidrat gram",
        fatDescription: "Tahmini yağ gram",
        confidenceDescription: "Tanımlama güven düzeyi (Yüksek/Orta/Düşük)",
        imagePrompt: "Bu yemek görselini analiz et. Ana yiyeceği tanımla ve standart porsiyon için besin değerini tahmin et. Gerçekçi ol. Yiyecek adını Türkçe olarak ver.",
        textPrompt: (desc) => `Bu yemek açıklamasını analiz et: "${desc}". Standart porsiyon için besin değerini tahmin et. Yiyecek adını Türkçe olarak ver.`,
        chatSystemPrompt: "Sen 'Darsa'sın, akıllı, şefkatli ve profesyonel bir beslenme ve diyet koçusun. Yanıtların kısa, faydalı ve samimi, motive edici bir tonda olmalı. Türkçe yanıt ver. İlgili emojiler kullanmaya çalış.",
        chatFallback: "Üzgünüm, yanıt veremedim.",
        chatError: "Bir bağlantı hatası oluştu. Lütfen tekrar deneyin.",
    },
    de: {
        foodNameDescription: "Kurzer beschreibender Name des Essens auf Deutsch",
        caloriesDescription: "Geschätzte Gesamtkalorien",
        proteinDescription: "Geschätztes Protein in Gramm",
        carbsDescription: "Geschätzte Kohlenhydrate in Gramm",
        fatDescription: "Geschätztes Fett in Gramm",
        confidenceDescription: "Erkennungssicherheit (Hoch/Mittel/Niedrig)",
        imagePrompt: "Analysiere dieses Essenbild. Identifiziere das Hauptgericht und schätze den Nährwert für eine Standardportion. Sei realistisch. Gib den Namen auf Deutsch an.",
        textPrompt: (desc) => `Analysiere diese Essensbeschreibung: "${desc}". Schätze den Nährwert für eine Standardportion. Gib den Namen auf Deutsch an.`,
        chatSystemPrompt: "Du bist 'Darsa', ein intelligenter, fürsorglicher und professioneller Ernährungs- und Diätcoach. Deine Antworten sollten kurz, hilfreich und in einem freundlichen, motivierenden Ton sein. Antworte auf Deutsch. Verwende passende Emojis.",
        chatFallback: "Entschuldigung, ich konnte nicht antworten.",
        chatError: "Ein Verbindungsfehler ist aufgetreten. Bitte versuchen Sie es erneut.",
    },
    fr: {
        foodNameDescription: "Nom court et descriptif de l'aliment en français",
        caloriesDescription: "Calories totales estimées",
        proteinDescription: "Protéines estimées en grammes",
        carbsDescription: "Glucides estimés en grammes",
        fatDescription: "Lipides estimés en grammes",
        confidenceDescription: "Niveau de confiance d'identification (Élevé/Moyen/Faible)",
        imagePrompt: "Analyse cette image d'aliment. Identifie l'aliment principal et estime sa valeur nutritive pour une portion standard. Sois réaliste. Donne le nom en français.",
        textPrompt: (desc) => `Analyse cette description d'aliment: "${desc}". Estime sa valeur nutritive pour une portion standard. Donne le nom en français.`,
        chatSystemPrompt: "Tu es 'Darsa', un coach nutrition intelligent, bienveillant et professionnel. Tes réponses doivent être brèves, utiles et avec un ton amical et motivant. Réponds en français. Utilise des emojis pertinents.",
        chatFallback: "Désolé, je n'ai pas pu répondre.",
        chatError: "Une erreur de connexion s'est produite. Veuillez réessayer.",
    },
    es: {
        foodNameDescription: "Nombre corto y descriptivo del alimento en español",
        caloriesDescription: "Calorías totales estimadas",
        proteinDescription: "Proteína estimada en gramos",
        carbsDescription: "Carbohidratos estimados en gramos",
        fatDescription: "Grasa estimada en gramos",
        confidenceDescription: "Nivel de confianza de identificación (Alto/Medio/Bajo)",
        imagePrompt: "Analiza esta imagen de comida. Identifica el alimento principal y estima su valor nutricional para una porción estándar. Sé realista. Proporciona el nombre en español.",
        textPrompt: (desc) => `Analiza esta descripción de comida: "${desc}". Estima su valor nutricional para una porción estándar. Proporciona el nombre en español.`,
        chatSystemPrompt: "Eres 'Darsa', un coach de nutrición inteligente, atento y profesional. Tus respuestas deben ser breves, útiles y con un tono amigable y motivador. Responde en español. Usa emojis relevantes.",
        chatFallback: "Lo siento, no pude responder.",
        chatError: "Se produjo un error de conexión. Por favor, inténtalo de nuevo.",
    },
};

// Get the current user locale
const getLocale = (): SupportedLocale => {
    if (typeof window === 'undefined') {
        return (process.env.NEXT_PUBLIC_MARKET === 'global' ? 'en' : 'fa') as SupportedLocale;
    }

    const savedLocale = localStorage.getItem('app_locale');
    if (savedLocale && savedLocale in languageConfigs) {
        return savedLocale as SupportedLocale;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const marketParam = searchParams.get('market') || hashParams.get('market');

    if (marketParam === 'global' || process.env.NEXT_PUBLIC_MARKET === 'global') {
        return 'en';
    }

    return 'fa';
};

// Get language config for current locale
const getLangConfig = (): LanguageConfig => {
    const locale = getLocale();
    return languageConfigs[locale] || languageConfigs.en;
};

// Dynamic response schema based on language
const getResponseSchema = () => {
    const lang = getLangConfig();
    return {
        type: Type.OBJECT,
        properties: {
            foodName: { type: Type.STRING, description: lang.foodNameDescription },
            estimatedCalories: { type: Type.NUMBER, description: lang.caloriesDescription },
            proteinGrams: { type: Type.NUMBER, description: lang.proteinDescription },
            carbsGrams: { type: Type.NUMBER, description: lang.carbsDescription },
            fatGrams: { type: Type.NUMBER, description: lang.fatDescription },
            confidence: { type: Type.STRING, description: lang.confidenceDescription },
        },
        required: ["foodName", "estimatedCalories", "proteinGrams", "carbsGrams", "fatGrams"],
    };
};

export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysisResult> => {
    try {
        const cleanBase64 = base64Image.split(',')[1] || base64Image;
        const lang = getLangConfig();

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
                    { text: lang.imagePrompt },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: getResponseSchema(),
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
        const lang = getLangConfig();

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { text: lang.textPrompt(description) },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: getResponseSchema(),
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
        const lang = getLangConfig();

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                ...history,
                { role: 'user', parts: [{ text: message }] }
            ],
            config: {
                systemInstruction: lang.chatSystemPrompt,
            }
        });
        return response.text || lang.chatFallback;
    } catch (error) {
        console.error("Error calling chat API", error);
        const lang = getLangConfig();
        return lang.chatError;
    }
}

