"use client";

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import KitchenItemImage from './KitchenItemImage';

interface Ingredient {
    name: string;
    amount: string;
}

interface KitchenItem {
    _id?: string;
    id?: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image: string;
    prepTime: string;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients?: Ingredient[];
    instructions?: string;
}

interface KitchenItemDetailPageProps {
    item: KitchenItem;
    onBack: () => void;
    onAddToLog?: (item: KitchenItem) => void;
    isSaved?: boolean;
    onSaveToggle?: (item: KitchenItem, saved: boolean) => void;
}

// Helper to convert English numbers to Persian/Farsi numerals
const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

const KitchenItemDetailPage: React.FC<KitchenItemDetailPageProps> = ({
    item,
    onBack,
    onAddToLog,
    isSaved: initialIsSaved = false,
    onSaveToggle
}) => {
    const [isSaved, setIsSaved] = useState(initialIsSaved);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setIsSaved(initialIsSaved);
    }, [initialIsSaved]);

    const difficultyConfig = {
        easy: { label: 'آسان', color: 'text-green-600 bg-green-50' },
        medium: { label: 'متوسط', color: 'text-amber-600 bg-amber-50' },
        hard: { label: 'سخت', color: 'text-red-600 bg-red-50' }
    };

    const difficulty = difficultyConfig[item.difficulty] || difficultyConfig.medium;

    const handleSaveToggle = async () => {
        const itemId = item._id || item.id || item.name;
        setIsSaving(true);
        try {
            if (isSaved) {
                await apiService.unsaveKitchenItem(itemId);
                setIsSaved(false);
                onSaveToggle?.(item, false);
            } else {
                await apiService.saveKitchenItem({
                    kitchenItemId: itemId,
                    name: item.name,
                    calories: item.calories,
                    protein: item.protein,
                    carbs: item.carbs,
                    fat: item.fat,
                    image: item.image,
                    prepTime: item.prepTime,
                    difficulty: item.difficulty,
                    ingredients: item.ingredients,
                    instructions: item.instructions
                });
                setIsSaved(true);
                onSaveToggle?.(item, true);
            }
        } catch (error) {
            console.error('Save toggle error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white" dir="rtl">
            {/* Minimal Header */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl px-4 py-4 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-gray-900 flex-1 text-right truncate">{item.name}</h1>

                {/* Save Button in Header */}
                <button
                    onClick={handleSaveToggle}
                    disabled={isSaving}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSaved
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        } ${isSaving ? 'opacity-50' : ''}`}
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isSaved ? 0 : 2}>
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-28">
                {/* Hero Image */}
                <div className="px-6 pt-2 pb-6">
                    <div className="w-full aspect-square max-h-[280px] rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                        <KitchenItemImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            fallback={
                                <svg className="w-24 h-24 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
                                </svg>
                            }
                        />
                    </div>
                </div>

                {/* Quick Info Row */}
                <div className="px-6 flex items-center justify-center gap-4 mb-8">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                        <span className="text-lg">⏱️</span>
                        <span className="font-semibold text-gray-700">{toPersianNumbers(item.prepTime)}</span>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${difficulty.color}`}>
                        <span className="font-semibold">{difficulty.label}</span>
                    </div>
                </div>

                {/* Calories - Big & Bold */}
                <div className="px-6 mb-8 text-center">
                    <div className="text-6xl font-black text-gray-900">{toPersianNumbers(item.calories)}</div>
                    <div className="text-gray-500 font-medium mt-1">کالری</div>
                </div>

                {/* Macros - Minimal Row */}
                <div className="px-6 mb-10">
                    <div className="flex justify-between items-center max-w-sm mx-auto">
                        <div className="text-center flex-1">
                            <div className="text-2xl mb-1">🥩</div>
                            <div className="text-xl font-bold text-gray-900">{toPersianNumbers(item.protein)}</div>
                            <div className="text-xs text-gray-400 font-medium">پروتئین</div>
                        </div>
                        <div className="w-px h-12 bg-gray-200"></div>
                        <div className="text-center flex-1">
                            <div className="text-2xl mb-1">🌾</div>
                            <div className="text-xl font-bold text-gray-900">{toPersianNumbers(item.carbs)}</div>
                            <div className="text-xs text-gray-400 font-medium">کربوهیدرات</div>
                        </div>
                        <div className="w-px h-12 bg-gray-200"></div>
                        <div className="text-center flex-1">
                            <div className="text-2xl mb-1">🧈</div>
                            <div className="text-xl font-bold text-gray-900">{toPersianNumbers(item.fat)}</div>
                            <div className="text-xs text-gray-400 font-medium">چربی</div>
                        </div>
                    </div>
                </div>

                {/* Ingredients Section */}
                {item.ingredients && item.ingredients.length > 0 && (
                    <div className="px-6 mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 text-right">مواد لازم</h3>
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <div className="space-y-2">
                                {item.ingredients.map((ing, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-gray-700 font-medium">{ing.name}</span>
                                        <span className="text-gray-500 font-medium text-sm">{ing.amount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions Section */}
                {item.instructions && (
                    <div className="px-6 mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 text-right">طرز تهیه</h3>
                        <div className="bg-gray-50 rounded-2xl p-5">
                            <p className="text-gray-700 text-right leading-loose whitespace-pre-line">{item.instructions}</p>
                        </div>
                    </div>
                )}

                {/* No content placeholder */}
                {(!item.ingredients || item.ingredients.length === 0) && !item.instructions && (
                    <div className="px-6 text-center py-8">
                        <p className="text-gray-400 text-sm">دستور پخت بزودی اضافه می‌شود</p>
                    </div>
                )}
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100">
                <button
                    onClick={() => onAddToLog && onAddToLog(item)}
                    className="w-full py-4 bg-gray-900 text-white font-bold text-base rounded-2xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>افزودن به گزارش</span>
                </button>
            </div>
        </div>
    );
};

export default KitchenItemDetailPage;
