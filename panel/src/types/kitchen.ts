export interface Ingredient {
    name: string;
    amount: string;
}

export interface KitchenItem {
    _id?: string;
    id?: string; // Frontend compatibility
    name: string;
    name_fa?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image: string; // URL or emoji
    imagePrompt?: string; // AI generation prompt
    prepTime: string; // e.g., "15 min"
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients?: Ingredient[]; // List of ingredients with amounts
    ingredients_fa?: Ingredient[];
    instructions?: string; // How to prepare/cook
    instructions_fa?: string;
    isFree?: boolean; // If true, no subscription required
}

export interface KitchenSubCategory {
    _id?: string;
    title: string;
    title_fa?: string;
    items: KitchenItem[];
}

export interface KitchenCategory {
    _id: string;
    id?: string; // Frontend compatibility
    title: string;
    title_fa?: string;
    subCategories: KitchenSubCategory[];
    isActive: boolean;
    order: number;
    createdAt?: string;
    updatedAt?: string;
}

export type CreateKitchenCategoryRequest = Omit<KitchenCategory, '_id' | 'createdAt' | 'updatedAt' | 'id'>;
export type UpdateKitchenCategoryRequest = Partial<CreateKitchenCategoryRequest>;

