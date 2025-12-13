export interface Ingredient {
    name: string;
    calories: number;
    proteinGrams: number;
    fatGrams: number;
    carbsGrams: number;
}

export interface FoodItem {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    timestamp: Date;
    imageUrl?: string;
    portions?: number;
    healthScore?: number;
    ingredients?: Ingredient[];
    liked?: boolean;
    date?: string; // YYYY-MM-DD format for API
}

export interface DailyGoals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface DayStatus {
    day: string;
    date: number;
    isToday: boolean;
    isComplete: boolean;
}

export interface ChatMessage {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    imageUrl?: string;
    isSending?: boolean;
}
