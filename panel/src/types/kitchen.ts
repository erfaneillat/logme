export interface Ingredient {
    name: string;
    amount: string;
}

export interface KitchenItem {
    _id?: string;
    id?: string; // Frontend compatibility
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image: string; // URL or emoji
    prepTime: string; // e.g., "15 min"
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients?: Ingredient[]; // List of ingredients with amounts
    instructions?: string; // How to prepare/cook
}

export interface KitchenSubCategory {
    _id?: string;
    title: string;
    items: KitchenItem[];
}

export interface KitchenCategory {
    _id: string;
    id?: string; // Frontend compatibility
    title: string;
    subCategories: KitchenSubCategory[];
    isActive: boolean;
    order: number;
    createdAt?: string;
    updatedAt?: string;
}

export type CreateKitchenCategoryRequest = Omit<KitchenCategory, '_id' | 'createdAt' | 'updatedAt' | 'id'>;
export type UpdateKitchenCategoryRequest = Partial<CreateKitchenCategoryRequest>;

