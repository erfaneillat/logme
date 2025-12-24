"use client";

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useTranslation } from '../translations';
import KitchenItemDetailPage from './KitchenItemDetailPage';
import KitchenSeeAllPage from './KitchenSeeAllPage';
import KitchenItemImage from './KitchenItemImage';

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
    prepTime: string;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients?: Ingredient[];
    instructions?: string;
    originalId?: string;
    isFree?: boolean;
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



interface KitchenPageProps {
    onBack?: () => void;
    onAddFood?: (food: any) => void;
    onSubscriptionClick?: () => void;
}

const KitchenPage: React.FC<KitchenPageProps> = ({ onAddFood, onSubscriptionClick }) => {
    const { t, isRTL } = useTranslation();

    const formatNumber = (num: number | string) => {
        if (!isRTL) return String(num);
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
    };

    const [categories, setCategories] = useState<KitchenCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
    const [selectedItem, setSelectedItem] = useState<KitchenItem | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<KitchenSubCategory | null>(null);

    // Saved items state
    const [savedItems, setSavedItems] = useState<KitchenItem[]>([]);
    const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
    const [showSavedList, setShowSavedList] = useState(false);

    // Subscription status
    const [hasSubscription, setHasSubscription] = useState(true); // Default to true to avoid flash of lock

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const [catsData, savedData, subscriptionStatus] = await Promise.all([
                apiService.getKitchenCategories(),
                apiService.getSavedKitchenItems(),
                apiService.getSubscriptionStatus()
            ]);

            // Process saved items
            const processedSavedItems = (savedData || []).map((item: any) => ({
                ...item,
                _id: item.kitchenItemId,
                id: item.kitchenItemId,
                originalId: item._id
            }));

            setSavedItems(processedSavedItems);
            setSavedItemIds(new Set(processedSavedItems.map((i: any) => i._id)));

            // Set categories directly (no saved category prepended)
            setCategories(catsData);

            // Set subscription status
            setHasSubscription(subscriptionStatus?.isActive ?? false);

        } catch (error) {
            console.error('Failed to load kitchen data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    // Handle browser back button for overlays
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            // When back button is pressed, check the state
            if (selectedItem) {
                // If detail page is open, close it
                setSelectedItem(null);
            } else if (selectedSubCategory) {
                // If subcategory page is open, close it
                setSelectedSubCategory(null);
            } else if (showSavedList) {
                // If saved list is open, close it
                setShowSavedList(false);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [selectedItem, selectedSubCategory, showSavedList]);

    // Push/pop history state when opening/closing overlays
    useEffect(() => {
        if (selectedItem) {
            window.history.pushState({ view: 'detail' }, '');
        }
    }, [selectedItem]);

    useEffect(() => {
        if (selectedSubCategory && !selectedItem) {
            window.history.pushState({ view: 'subcategory' }, '');
        }
    }, [selectedSubCategory, selectedItem]);

    useEffect(() => {
        if (showSavedList) {
            window.history.pushState({ view: 'saved' }, '');
        }
    }, [showSavedList]);

    const handleSaveToggle = (item: KitchenItem, isSaved: boolean) => {
        const itemId = item._id || item.id;
        if (!itemId) return;

        if (isSaved) {
            const newItem = { ...item, _id: itemId };
            setSavedItems(prev => [newItem, ...prev]);
            setSavedItemIds(prev => {
                const next = new Set(prev);
                next.add(itemId);
                return next;
            });
        } else {
            setSavedItems(prev => prev.filter(i => (i._id || i.id) !== itemId));
            setSavedItemIds(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    const selectedCategory = categories[selectedCategoryIndex];

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

    // Handle item click with analytics tracking
    const handleItemClick = (item: KitchenItem, categoryContext?: {
        categoryId: string;
        categoryTitle: string;
        subCategoryTitle: string;
    }) => {
        // Record analytics (non-blocking)
        const itemId = item._id || item.id;
        if (itemId && categoryContext) {
            apiService.recordKitchenItemClick({
                kitchenItemId: itemId,
                kitchenItemName: item.name,
                categoryId: categoryContext.categoryId,
                categoryTitle: categoryContext.categoryTitle,
                subCategoryTitle: categoryContext.subCategoryTitle,
            }).catch(() => { }); // Silently ignore errors
        }

        // Show the item detail page
        setSelectedItem(item);
    };

    // Render a single item card (reusable)
    const renderItemCard = (item: KitchenItem, showSavedBadge = false, categoryContext?: {
        categoryId: string;
        categoryTitle: string;
        subCategoryTitle: string;
    }) => (
        <div
            key={item._id || item.id}
            className="snap-center relative shrink-0 w-[220px] bg-white rounded-[32px] p-4 pb-4 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] border border-gray-100/50 hover:border-orange-200 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl"
            onClick={() => handleItemClick(item, categoryContext)}
        >
            <div className="w-full h-32 rounded-[24px] bg-gradient-to-br from-gray-50 to-gray-100 mb-4 flex items-center justify-center shadow-inner relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                <KitchenItemImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    fallback={
                        <svg className="w-14 h-14 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
                        </svg>
                    }
                />

                {(showSavedBadge || savedItemIds.has(item._id || item.id || '')) && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}

                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                    <span>⏱️</span>
                    {formatNumber(item.prepTime)}
                </div>
            </div>

            <div>
                <h3 className="font-bold text-gray-800 mb-1 truncate text-lg">{item.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-orange-500 font-extrabold text-sm flex items-center gap-1">
                        🔥 {formatNumber(item.calories)}
                    </span>
                    <span className="text-gray-300 text-xs">|</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
                        item.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {item.difficulty === 'easy' ? t('kitchen.card.difficulty.easy') : item.difficulty === 'medium' ? t('kitchen.card.difficulty.medium') : t('kitchen.card.difficulty.hard')}
                    </span>
                </div>

                <div className="flex gap-1 mt-2 bg-gray-50 p-2 rounded-2xl justify-between">
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-gray-400 font-medium">{t('kitchen.card.nutrients.protein')}</span>
                        <span className="text-[10px] text-gray-700 font-bold">{formatNumber(item.protein)}g</span>
                    </div>
                    <div className="w-px bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-gray-400 font-medium">{t('kitchen.card.nutrients.carbs')}</span>
                        <span className="text-[10px] text-gray-700 font-bold">{formatNumber(item.carbs)}g</span>
                    </div>
                    <div className="w-px bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-gray-400 font-medium">{t('kitchen.card.nutrients.fat')}</span>
                        <span className="text-[10px] text-gray-700 font-bold">{formatNumber(item.fat)}g</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-[#F8F9FB] overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            {/* Header */}
            <header className="px-6 pt-8 pb-4 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-1">{t('kitchen.title')} 🧑‍🍳</h1>
                        <p className="text-sm text-gray-500 font-medium">{t('kitchen.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Saved Items Button */}
                        <button
                            onClick={() => setShowSavedList(true)}
                            className="relative w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100 hover:bg-red-50 hover:border-red-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </button>
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
                        placeholder={t('kitchen.searchPlaceholder')}
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
                    <div className="space-y-6 animate-pulse">
                        {/* Loading Categories - Mimics the subcategory structure */}
                        {[1, 2].map((i) => (
                            <div key={i}>
                                <div className="px-6 mb-4 flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gray-200 rounded-full"></div>
                                        <div className="h-6 w-32 bg-gray-200 rounded-lg"></div>
                                    </div>
                                </div>
                                <div className="flex overflow-x-hidden px-6 gap-4 pb-4">
                                    {[1, 2, 3].map((j) => (
                                        <div key={j} className="shrink-0 w-[220px] bg-white rounded-[32px] p-4 pb-4 border border-gray-100">
                                            <div className="w-full h-32 rounded-[24px] bg-gray-100 mb-4"></div>
                                            <div className="h-5 w-3/4 bg-gray-100 rounded-lg mb-2"></div>
                                            <div className="h-4 w-1/2 bg-gray-100 rounded-lg mb-4"></div>
                                            <div className="flex gap-1 justify-between">
                                                <div className="h-8 w-12 bg-gray-100 rounded-lg"></div>
                                                <div className="h-8 w-12 bg-gray-100 rounded-lg"></div>
                                                <div className="h-8 w-12 bg-gray-100 rounded-lg"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {getFilteredSubCategories().map((subCat, subIndex) => (
                            <div key={subCat._id || subIndex} className="animate-slide-up" style={{ animationDelay: `${subIndex * 100}ms` }}>
                                <div className="px-6 mb-4 flex justify-between items-end">
                                    <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-orange-500 rounded-full inline-block"></span>
                                        {subCat.title}
                                        <span className="text-xs font-medium text-gray-400 mr-2">
                                            ({formatNumber(subCat.items.length)} {t('kitchen.itemsCount')})
                                        </span>
                                    </h2>
                                    {subCat.items.length > 5 && (
                                        <button
                                            onClick={() => setSelectedSubCategory(subCat)}
                                            className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                                        >
                                            {t('kitchen.seeAll')}
                                        </button>
                                    )}
                                </div>

                                <div className="flex overflow-x-auto px-6 gap-4 pb-4 no-scrollbar -mx-1 pt-1 snap-x snap-mandatory">
                                    {subCat.items.map((item) => renderItemCard(item, false, {
                                        categoryId: selectedCategory?._id || '',
                                        categoryTitle: selectedCategory?.title || '',
                                        subCategoryTitle: subCat.title,
                                    }))}

                                    {subCat.items.length > 5 && (
                                        <div
                                            className="snap-center shrink-0 w-[100px] flex flex-col items-center justify-center cursor-pointer"
                                            onClick={() => setSelectedSubCategory(subCat)}
                                        >
                                            <button className="w-14 h-14 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all duration-300 mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </button>
                                            <span className="text-xs font-bold text-gray-400">{t('kitchen.more')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {categories.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 px-6">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-5xl mb-6">
                                    👨‍🍳
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('kitchen.notAvailable.title')}</h3>
                                <p className="text-sm text-gray-500 text-center max-w-xs">
                                    {t('kitchen.notAvailable.message')}
                                </p>
                            </div>
                        )}

                        {categories.length > 0 && selectedCategory && getFilteredSubCategories().length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 px-6">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-4">
                                    🍽️
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 mb-2">{t('kitchen.notFound.title')}</h3>
                                <p className="text-sm text-gray-500 text-center">
                                    {searchQuery ? t('kitchen.notFound.search') : t('kitchen.notFound.emptyCategory')}
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
                            <h3 className="font-bold text-lg mb-1">{t('kitchen.smartChef.title')}</h3>
                            <p className="text-xs text-gray-300 max-w-[200px] leading-relaxed">
                                {t('kitchen.smartChef.description')}
                            </p>
                        </div>
                    </div>
                    <button className="mt-4 w-full py-3 bg-white text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg active:scale-95">
                        {t('kitchen.smartChef.button')}
                    </button>
                </div>

                <div className="h-10"></div>
            </div>

            {/* Saved Items Overlay */}
            {
                showSavedList && (
                    <div className="fixed inset-0 z-50 bg-[#F8F9FB]">
                        <div className="h-full flex flex-col">
                            {/* Header */}
                            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl px-4 py-4 flex items-center gap-4 border-b border-gray-100">
                                <button
                                    onClick={() => setShowSavedList(false)}
                                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <div className="flex-1">
                                    <h1 className="text-lg font-bold text-gray-900">{t('kitchen.saved.title')}</h1>
                                    <p className="text-xs text-gray-500">{formatNumber(savedItems.length)} {t('kitchen.saved.count')}</p>
                                </div>
                                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </header>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 pb-32">
                                {savedItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-5xl mb-6">
                                            ❤️
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{t('kitchen.saved.empty.title')}</h3>
                                        <p className="text-sm text-gray-500 text-center max-w-xs">
                                            {t('kitchen.saved.empty.message')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {savedItems.map((item) => (
                                            <div
                                                key={item._id || item.id}
                                                className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex gap-4 items-center cursor-pointer hover:shadow-md hover:border-orange-200 transition-all"
                                                onClick={() => handleItemClick(item, {
                                                    categoryId: 'saved',
                                                    categoryTitle: t('kitchen.saved.title'),
                                                    subCategoryTitle: t('kitchen.saved.title'),
                                                })}
                                            >
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                    <KitchenItemImage
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                        fallback={
                                                            <span className="text-3xl">🍽️</span>
                                                        }
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-900 truncate mb-1">{item.name}</h3>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-orange-500 font-bold">🔥 {formatNumber(item.calories)}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="text-gray-500">{formatNumber(item.prepTime)}</span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-500 shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* See All Page */}
            {
                selectedSubCategory && !selectedItem && (
                    <div className="fixed inset-0 z-50 bg-[#F8F9FB]">
                        <KitchenSeeAllPage
                            title={selectedSubCategory.title}
                            items={selectedSubCategory.items}
                            onBack={() => setSelectedSubCategory(null)}
                            onItemClick={(item) => handleItemClick(item, {
                                categoryId: selectedCategory?._id || '',
                                categoryTitle: selectedCategory?.title || '',
                                subCategoryTitle: selectedSubCategory.title,
                            })}
                        />
                    </div>
                )
            }

            {/* Item Detail Page */}
            {
                selectedItem && (
                    <div className="fixed inset-0 z-50 bg-[#F8F9FB]">
                        <KitchenItemDetailPage
                            item={selectedItem}
                            isSaved={savedItemIds.has(selectedItem._id || selectedItem.id || '')}
                            onSaveToggle={handleSaveToggle}
                            onBack={() => setSelectedItem(null)}
                            onAddToLog={(item) => {
                                onAddFood && onAddFood(item);
                                setSelectedItem(null);
                            }}
                            hasSubscription={hasSubscription}
                            onSubscriptionClick={onSubscriptionClick}
                        />
                    </div>
                )
            }
        </div >
    );
};

export default KitchenPage;
