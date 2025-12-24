"use client";

import React from 'react';
import { useTranslation } from '../translations';
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

interface KitchenSeeAllPageProps {
    title: string;
    items: KitchenItem[];
    onBack: () => void;
    onItemClick: (item: KitchenItem) => void;
}



const KitchenSeeAllPage: React.FC<KitchenSeeAllPageProps> = ({
    title,
    items,
    onBack,
    onItemClick
}) => {
    const { t, isRTL } = useTranslation();

    const formatNumber = (num: number | string) => {
        if (!isRTL) return String(num);
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
    };

    const difficultyConfig = {
        easy: { label: t('kitchen.card.difficulty.easy'), color: 'bg-green-50 text-green-600' },
        medium: { label: t('kitchen.card.difficulty.medium'), color: 'bg-amber-50 text-amber-600' },
        hard: { label: t('kitchen.card.difficulty.hard'), color: 'bg-red-50 text-red-600' }
    };

    return (
        <div className="h-full flex flex-col bg-[#F8F9FB]" dir={isRTL ? "rtl" : "ltr"}>
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl px-5 py-4 flex items-center gap-4 border-b border-gray-100">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900">{title}</h1>
                    <p className="text-xs text-gray-400">{formatNumber(items.length)} {t('kitchen.itemsCount')}</p>
                </div>
            </header>

            {/* Grid of Items */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="grid grid-cols-2 gap-4">
                    {items.map((item, index) => {
                        const difficulty = difficultyConfig[item.difficulty] || difficultyConfig.medium;

                        return (
                            <div
                                key={item._id || item.id || index}
                                className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
                                onClick={() => onItemClick(item)}
                            >
                                {/* Image */}
                                <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 mb-3 flex items-center justify-center overflow-hidden">
                                    <KitchenItemImage
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        fallback={
                                            <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
                                            </svg>
                                        }
                                    />
                                </div>

                                {/* Info */}
                                <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 leading-tight">{item.name}</h3>

                                {/* Calories & Difficulty */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1">
                                        <span className="text-orange-500 text-sm">🔥</span>
                                        <span className="text-sm font-bold text-gray-700">{formatNumber(item.calories)}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${difficulty.color}`}>
                                        {difficulty.label}
                                    </span>
                                </div>

                                {/* Macros Row */}
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <span>🥩</span>
                                        <span>{formatNumber(item.protein)}g</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>🌾</span>
                                        <span>{formatNumber(item.carbs)}g</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>🧈</span>
                                        <span>{formatNumber(item.fat)}g</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <svg className="w-16 h-16 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5" />
                        </svg>
                        <p className="text-gray-400 text-sm">{t('kitchen.notFound.title')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KitchenSeeAllPage;
