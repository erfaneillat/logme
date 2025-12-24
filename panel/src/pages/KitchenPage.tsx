"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { kitchenService } from '../services/kitchen.service';
import { KitchenCategory } from '../types/kitchen';
import Sidebar from '../components/Sidebar';
import KitchenCategoryModal from '../components/KitchenCategoryModal';

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fa', name: 'Persian (Farsi)', flag: '🇮🇷' },
];

const KitchenPage = () => {
    const { token } = useAuth();
    const [categories, setCategories] = useState<KitchenCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<KitchenCategory | null>(null);

    // Translation state
    const [isTranslating, setIsTranslating] = useState<string | null>(null);
    const [translationProgress, setTranslationProgress] = useState<string>('');
    const [showTranslateMenu, setShowTranslateMenu] = useState<string | null>(null);

    const fetchCategories = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await kitchenService.getAllCategories(token);
            if (response.success && response.data) {
                setCategories(response.data);
            } else {
                setError(response.message || 'Failed to fetch categories');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [token]);

    const handleAdd = () => {
        setSelectedCategory(null);
        setIsModalOpen(true);
    };

    const handleEdit = (category: KitchenCategory) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!token || !window.confirm('Are you sure you want to delete this category?')) return;

        try {
            const response = await kitchenService.deleteCategory(token, id);
            if (response.success) {
                fetchCategories();
            } else {
                alert(response.message || 'Failed to delete category');
            }
        } catch (err) {
            alert('Failed to delete category');
        }
    };

    const handleSave = async () => {
        await fetchCategories();
        setIsModalOpen(false);
    };

    const handleTranslate = async (categoryId: string, targetLanguage: string) => {
        if (!token) return;

        setShowTranslateMenu(null);
        setIsTranslating(categoryId);
        setTranslationProgress('Starting translation...');

        try {
            const response = await kitchenService.translateCategory(token, categoryId, targetLanguage);

            if (response.success) {
                setTranslationProgress(`Done! Translated ${response.translatedCount} items.`);
                await fetchCategories();
                setTimeout(() => {
                    setIsTranslating(null);
                    setTranslationProgress('');
                }, 2000);
            } else {
                setTranslationProgress(`Error: ${response.message}`);
                setTimeout(() => {
                    setIsTranslating(null);
                    setTranslationProgress('');
                }, 3000);
            }
        } catch (err: any) {
            setTranslationProgress(`Error: ${err.message}`);
            setTimeout(() => {
                setIsTranslating(null);
                setTranslationProgress('');
            }, 3000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex bg-gray-50">
                <Sidebar />
                <div className="flex flex-1 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Kitchen Management</h1>
                            <p className="mt-1 text-sm text-gray-500">Manage kitchen categories and recipes</p>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="flex items-center space-x-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 active:scale-95"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add Category</span>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {categories.map((category) => {
                            const subCount = category.subCategories?.length || 0;
                            const totalItems = category.subCategories?.reduce((sum, sub) => sum + (sub.items?.length || 0), 0) || 0;
                            const isCurrentlyTranslating = isTranslating === category._id;

                            return (
                                <div key={category._id || category.id} className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-orange-200">
                                                    {category.title.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{category.title}</h3>
                                                    <p className="text-xs text-gray-500">{subCount} subcategories • {totalItems} items</p>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {category.isActive ? 'Active' : 'Inactive'}
                                            </div>
                                        </div>

                                        {/* Subcategories preview */}
                                        {subCount > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {category.subCategories!.slice(0, 3).map((sub, idx) => (
                                                    <span key={idx} className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md text-xs font-medium">
                                                        {sub.title}
                                                    </span>
                                                ))}
                                                {subCount > 3 && (
                                                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-xs font-medium">
                                                        +{subCount - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Translation Progress */}
                                        {isCurrentlyTranslating && (
                                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                                    <span className="text-xs text-blue-700 font-medium">{translationProgress}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="mt-4 flex gap-2 pt-4 border-t border-gray-50">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="flex-1 rounded-lg bg-gray-50 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                                                disabled={isCurrentlyTranslating}
                                            >
                                                Edit
                                            </button>

                                            {/* Translate Button with Dropdown */}
                                            <div className="relative flex-1">
                                                <button
                                                    onClick={() => setShowTranslateMenu(showTranslateMenu === category._id ? null : category._id!)}
                                                    className="w-full rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                                                    disabled={isCurrentlyTranslating}
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                                    </svg>
                                                    Translate
                                                </button>

                                                {/* Language Dropdown */}
                                                {showTranslateMenu === category._id && (
                                                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                        {SUPPORTED_LANGUAGES.map((lang) => (
                                                            <button
                                                                key={lang.code}
                                                                onClick={() => handleTranslate(category._id!, lang.code)}
                                                                className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
                                                            >
                                                                <span>{lang.flag}</span>
                                                                <span>{lang.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleDelete(category._id!)}
                                                className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                                                disabled={isCurrentlyTranslating}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <KitchenCategoryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    initialData={selectedCategory}
                />
            )}
        </div>
    );
};

export default KitchenPage;
