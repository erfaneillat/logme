"use client";

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import KitchenItemDetailPage from './KitchenItemDetailPage';
import KitchenSeeAllPage from './KitchenSeeAllPage';

// Types for our kitchen items (matching backend)
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
    prepTime: string; // e.g., "15 min"
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients?: Ingredient[];
    instructions?: string;
}

interface KitchenSubCategory {
    _id?: string;
    title: string;
    items: KitchenItem[];
}

interface KitchenCategory {
    _id: string;
    id?: string;
    title: string;
    subCategories: KitchenSubCategory[];
}

// Helper to convert English numbers to Persian/Farsi numerals
const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

interface KitchenPageProps {
    onBack?: () => void;
    onAddFood?: (food: any) => void;
}

const KitchenPage: React.FC<KitchenPageProps> = ({ onAddFood }) => {
    const [categories, setCategories] = useState<KitchenCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
    const [selectedItem, setSelectedItem] = useState<KitchenItem | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<KitchenSubCategory | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await apiService.getKitchenCategories();
                setCategories(data);
            } catch (error) {
                console.error('Failed to load kitchen data', error);
                setCategories([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Get the currently selected category
    const selectedCategory = categories[selectedCategoryIndex];

    // Filter items by search across all subcategories
    const getFilteredSubCategories = () => {
        if (!selectedCategory) return [];
        if (!searchQuery.trim()) return selectedCategory.subCategories || [];

        return (selectedCategory.subCategories || [])
            .map(subCat => ({
                ...subCat,
                items: subCat.items.filter(item =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            }))
            .filter(subCat => subCat.items.length > 0);
    };

    return (
        <div className="h-full flex flex-col bg-[#F8F9FB] overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            {/* Header */}
            <header className="px-6 pt-8 pb-4 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-1">آشپزخانه 🧑‍🍳</h1>
                        <p className="text-sm text-gray-500 font-medium">پیشنهادهای خوشمزه و سالم برای شما</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100">
                        <span className="text-xl">🥗</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="w-full h-12 pr-12 pl-4 rounded-[20px] bg-white border border-gray-100 focus:border-orange-200 focus:ring-4 focus:ring-orange-50 text-gray-800 placeholder-gray-400 transition-all outline-none font-medium shadow-sm"
                        placeholder="جستجو در غذاها..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar space-y-6 animate-fade-in relative z-10">

                {/* Main Category Tabs */}
                <div className="px-6 flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {categories.map((cat, i) => (
                        <button
                            key={cat._id || cat.id || i}
                            onClick={() => setSelectedCategoryIndex(i)}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${i === selectedCategoryIndex
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            {cat.title}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Subcategories with items */}
                        {getFilteredSubCategories().map((subCat, subIndex) => (
                            <div key={subCat._id || subIndex} className="animate-slide-up" style={{ animationDelay: `${subIndex * 100}ms` }}>
                                <div className="px-6 mb-4 flex justify-between items-end">
                                    <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-orange-500 rounded-full inline-block"></span>
                                        {subCat.title}
                                        <span className="text-xs font-medium text-gray-400 mr-2">
                                            ({toPersianNumbers(subCat.items.length)} مورد)
                                        </span>
                                    </h2>
                                    <button
                                        onClick={() => setSelectedSubCategory(subCat)}
                                        className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                                    >
                                        مشاهده همه
                                    </button>
                                </div>

                                {/* Horizontal List */}
                                <div className="flex overflow-x-auto px-6 gap-4 pb-4 no-scrollbar -mx-1 pt-1 snap-x snap-mandatory">
                                    {subCat.items.map((item) => (
                                        <div
                                            key={item._id || item.id}
                                            className="snap-center relative shrink-0 w-[220px] bg-white rounded-[32px] p-4 pb-4 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] border border-gray-100/50 hover:border-orange-200 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl"
                                            onClick={() => setSelectedItem(item)}
                                        >
                                            {/* Image Area */}
                                            <div className="w-full h-32 rounded-[24px] bg-gradient-to-br from-gray-50 to-gray-100 mb-4 flex items-center justify-center shadow-inner relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                                                {item.image?.startsWith('http') ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <svg className="w-14 h-14 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
                                                    </svg>
                                                )}

                                                {/* Add overlay button */}
                                                <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-orange-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                    </svg>
                                                </div>

                                                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                                                    <span>⏱️</span>
                                                    {toPersianNumbers(item.prepTime)}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div>
                                                <h3 className="font-bold text-gray-800 mb-1 truncate text-lg">{item.name}</h3>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-orange-500 font-extrabold text-sm flex items-center gap-1">
                                                        🔥 {toPersianNumbers(item.calories)}
                                                    </span>
                                                    <span className="text-gray-300 text-xs">|</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
                                                        item.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                                                        }`}>
                                                        {item.difficulty === 'easy' ? 'آسان' : item.difficulty === 'medium' ? 'متوسط' : 'سخت'}
                                                    </span>
                                                </div>

                                                {/* Macros Mini Bar */}
                                                <div className="flex gap-1 mt-2 bg-gray-50 p-2 rounded-2xl justify-between">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] text-gray-400 font-medium">پروتئین</span>
                                                        <span className="text-[10px] text-gray-700 font-bold">{toPersianNumbers(item.protein)}g</span>
                                                    </div>
                                                    <div className="w-px bg-gray-200"></div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] text-gray-400 font-medium">کربو</span>
                                                        <span className="text-[10px] text-gray-700 font-bold">{toPersianNumbers(item.carbs)}g</span>
                                                    </div>
                                                    <div className="w-px bg-gray-200"></div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] text-gray-400 font-medium">چربی</span>
                                                        <span className="text-[10px] text-gray-700 font-bold">{toPersianNumbers(item.fat)}g</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* "See More" Card */}
                                    <div
                                        className="snap-center shrink-0 w-[100px] flex flex-col items-center justify-center cursor-pointer"
                                        onClick={() => setSelectedSubCategory(subCat)}
                                    >
                                        <button className="w-14 h-14 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all duration-300 mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </button>
                                        <span className="text-xs font-bold text-gray-400">بیشتر</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Empty state when no subcategories */}
                        {selectedCategory && getFilteredSubCategories().length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 px-6">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-4">
                                    🍽️
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 mb-2">موردی یافت نشد</h3>
                                <p className="text-sm text-gray-500 text-center">
                                    {searchQuery ? 'نتیجه‌ای برای جستجوی شما پیدا نشد' : 'هنوز غذایی در این دسته اضافه نشده است'}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Floating Promo Card */}
                <div className="mx-6 p-6 mt-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-[32px] text-white relative overflow-hidden shadow-xl animate-scale-up">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>

                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">
                            👨‍🍳
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1">سرآشپز هوشمند</h3>
                            <p className="text-xs text-gray-300 max-w-[200px] leading-relaxed">
                                با مواد اولیه‌ای که داری، بگو چی بپزم تا بهت دستور پخت بدم!
                            </p>
                        </div>
                    </div>
                    <button className="mt-4 w-full py-3 bg-white text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg active:scale-95">
                        درخواست دستور پخت
                    </button>
                </div>

                <div className="h-10"></div>
            </div>

            {/* See All Page - overlays the kitchen page */}
            {selectedSubCategory && !selectedItem && (
                <div className="fixed inset-0 z-50 bg-[#F8F9FB]">
                    <KitchenSeeAllPage
                        title={selectedSubCategory.title}
                        items={selectedSubCategory.items}
                        onBack={() => setSelectedSubCategory(null)}
                        onItemClick={(item) => setSelectedItem(item)}
                    />
                </div>
            )}

            {/* Item Detail Page - overlays the kitchen page */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-[#F8F9FB]">
                    <KitchenItemDetailPage
                        item={selectedItem}
                        onBack={() => setSelectedItem(null)}
                        onAddToLog={(item) => {
                            onAddFood && onAddFood(item);
                            setSelectedItem(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default KitchenPage;
