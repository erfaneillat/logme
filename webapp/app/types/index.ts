export interface FoodItem {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    timestamp: Date;
    imageUrl?: string;
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
}
