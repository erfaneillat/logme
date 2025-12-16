"use client";

import React, { useState, useRef, useEffect } from 'react';
import { apiService, FoodAnalysisResponse, LikedFood, fixImageUrl } from '../services/apiService';
import { useToast } from '../context/ToastContext';

interface AddFoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddFood: (food: FoodAnalysisResponse, image?: string) => void;
    onStartAnalysis?: (imageFile: File | null, textInput: string | null, previewImage: string | null, imageDescription?: string) => Promise<void>;
}

type ModalView = 'menu' | 'preview' | 'text' | 'analyzing' | 'result' | 'favorites';

// Helper to convert English numbers to Persian/Farsi numerals
const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

const AddFoodModal: React.FC<AddFoodModalProps> = ({ isOpen, onClose, onAddFood, onStartAnalysis }) => {
    const [view, setView] = useState<ModalView>('menu');
    const [image, setImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [textInput, setTextInput] = useState('');
    const [imageDescription, setImageDescription] = useState('');
    const [analysis, setAnalysis] = useState<FoodAnalysisResponse | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    // Liked foods state
    const [likedFoods, setLikedFoods] = useState<LikedFood[]>([]);
    const [isLoadingLiked, setIsLoadingLiked] = useState(false);

    if (!isOpen) return null;

    const resetAndClose = () => {
        setImage(null);
        setImageFile(null);
        setTextInput('');
        setImageDescription('');
        setAnalysis(null);
        setView('menu');
        onClose();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Store the file for backend upload
            setImageFile(file);
            // Also create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setView('preview');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (onStartAnalysis) {
            // Background analysis flow
            onStartAnalysis(imageFile, textInput, image, imageDescription || undefined);
            resetAndClose();
            return;
        }

        // Legacy flow (blocking)
        setView('analyzing');
        try {
            let result: FoodAnalysisResponse;
            // Get today's date for the backend
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            if (imageFile) {
                // Use backend API for image analysis (like Flutter does)
                result = await apiService.analyzeFoodImage(imageFile, dateStr, imageDescription || undefined);
            } else if (textInput) {
                // Use backend API for text analysis (like Flutter does)
                result = await apiService.analyzeFoodText(textInput, dateStr);
            } else {
                throw new Error("No input provided");
            }
            setAnalysis(result);
            setView('result');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'خطا در تحلیل. لطفا مجدد تلاش کنید.';
            showToast(errorMessage, 'error');
            setView(image ? 'preview' : 'text');
        }
    };

    const handleConfirm = async () => {
        if (analysis) {
            try {
                // Get today's date for storage
                const today = new Date();
                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                // Add to database
                await apiService.addItem({
                    date: dateStr,
                    title: analysis.title,
                    calories: analysis.calories,
                    carbsGrams: analysis.carbsGrams,
                    proteinGrams: analysis.proteinGrams,
                    fatsGrams: analysis.fatGrams,
                    portions: 1,
                    healthScore: analysis.healthScore,
                    imageUrl: image,
                    ingredients: analysis.ingredients
                });

                onAddFood(analysis, image || undefined);
                resetAndClose();
            } catch (error) {
                console.error("Failed to add food:", error);
                showToast("خطا در ثبت وعده. لطفا مجدد تلاش کنید.", 'error');
            }
        }
    };

    const handleOpenFavorites = async () => {
        setView('favorites');
        setIsLoadingLiked(true);
        try {
            const foods = await apiService.getLikedFoods();
            setLikedFoods(foods);
        } catch (error) {
            console.error('Failed to load liked foods:', error);
            setLikedFoods([]);
        } finally {
            setIsLoadingLiked(false);
        }
    };

    const handleSelectLikedFood = async (food: LikedFood) => {
        try {
            // Get today's date for storage
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            // Add to database
            await apiService.addItem({
                date: dateStr,
                title: food.title,
                calories: food.calories,
                carbsGrams: food.carbsGrams,
                proteinGrams: food.proteinGrams,
                fatsGrams: food.fatsGrams,
                portions: food.portions, // Use original portions
                healthScore: food.healthScore,
                imageUrl: food.imageUrl,
                ingredients: food.ingredients,
                liked: true // Maintain liked status
            });

            // Convert LikedFood to FoodAnalysisResponse format for callback (refresh)
            const analysisFormat: FoodAnalysisResponse = {
                title: food.title,
                calories: food.calories,
                carbsGrams: food.carbsGrams,
                proteinGrams: food.proteinGrams,
                fatGrams: food.fatsGrams,
                healthScore: food.healthScore,
                ingredients: food.ingredients,
            };
            onAddFood(analysisFormat, food.imageUrl);
            resetAndClose();
        } catch (error) {
            console.error("Failed to add liked food:", error);
            showToast("خطا در ثبت وعده. لطفا مجدد تلاش کنید.", 'error');
        }
    };

    // --- Render Functions ---

    const renderMenu = () => (
        <div className="space-y-6 animate-slide-up">
            <div className="text-center">
                <h2 className="text-2xl font-black text-gray-800 mb-2">افزودن وعده</h2>
                <p className="text-gray-400 text-sm">روش ثبت وعده غذایی خود را انتخاب کنید</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Gallery */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-50 p-5 rounded-[24px] border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 group"
                >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="font-bold text-gray-800 mb-0.5">گالری</span>
                    <span className="text-[10px] text-gray-400">انتخاب تصویر</span>
                </button>

                {/* Camera */}
                <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="bg-gray-50 p-5 rounded-[24px] border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 group"
                >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <span className="font-bold text-gray-800 mb-0.5">دوربین</span>
                    <span className="text-[10px] text-gray-400">عکس‌برداری</span>
                </button>

                {/* Text Input */}
                <button
                    onClick={() => setView('text')}
                    className="bg-gray-50 p-5 rounded-[24px] border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 group"
                >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <span className="font-bold text-gray-800 mb-0.5">نوشتاری</span>
                    <span className="text-[10px] text-gray-400">تایپ دستی</span>
                </button>

                {/* Favorites */}
                <button
                    className="bg-gradient-to-br from-pink-50 to-red-50 p-5 rounded-[24px] border border-pink-100 flex flex-col items-center text-center hover:from-pink-100 hover:to-red-100 hover:shadow-lg hover:shadow-pink-200/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 group"
                    onClick={handleOpenFavorites}
                >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className="font-bold text-gray-800 mb-0.5">محبوب‌ها</span>
                    <span className="text-[10px] text-gray-400">وعده‌های رایج</span>
                </button>
            </div>
        </div>
    );

    const renderFavorites = () => (
        <div className="space-y-4 animate-slide-up">
            <div className="flex justify-between items-center">
                <button onClick={() => setView('menu')} className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
                <h2 className="text-xl font-bold text-gray-800">محبوب‌ها</h2>
                <div className="w-8"></div>
            </div>

            {isLoadingLiked ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 text-sm">در حال بارگذاری...</p>
                </div>
            ) : likedFoods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-gray-700 mb-2">هنوز غذای محبوبی ندارید</h3>
                    <p className="text-sm text-gray-400 max-w-[250px]">
                        با زدن دکمه ❤️ روی غذاها، آن‌ها را به لیست محبوب‌ها اضافه کنید
                    </p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-4">
                    {likedFoods.map((food, index) => (
                        <button
                            key={`${food.title}-${index}`}
                            onClick={() => handleSelectLikedFood(food)}
                            className="w-full bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm hover:shadow-lg hover:border-pink-200 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center gap-4 text-right"
                        >
                            {/* Food Image or Icon */}
                            <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                                {food.imageUrl ? (
                                    <img
                                        src={fixImageUrl(food.imageUrl)}
                                        alt={food.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl">🍽️</span>
                                )}
                            </div>

                            {/* Food Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm truncate mb-1">
                                    {food.title}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span className="font-bold text-gray-600">{toPersianNumbers(food.calories)} کالری</span>
                                    <span className="bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-medium">
                                        P {toPersianNumbers(food.proteinGrams)}
                                    </span>
                                    <span className="bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded font-medium">
                                        C {toPersianNumbers(food.carbsGrams)}
                                    </span>
                                    <span className="bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded font-medium">
                                        F {toPersianNumbers(food.fatsGrams)}
                                    </span>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="shrink-0 text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderPreview = () => (
        <div className="space-y-5 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-800 text-center">تایید تصویر</h2>
            <div className="relative h-56 w-full rounded-[32px] overflow-hidden bg-gray-900 shadow-xl shadow-gray-200">
                <img src={image!} alt="Preview" className="w-full h-full object-cover" />
                <button
                    onClick={() => { setImage(null); setImageDescription(''); setView('menu'); }}
                    className="absolute top-4 left-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2.5 rounded-full transition-all active:scale-90"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Optional Description Field */}
            <div className="bg-gray-50 rounded-[20px] p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-bold text-gray-700">توضیحات (اختیاری)</span>
                </div>
                <textarea
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="مثال: این غذا مخلوط چلو خورشت قیمه با برنج و سالاد است..."
                    className="w-full bg-white border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none text-gray-800 text-right rounded-xl p-3 min-h-[80px] resize-none placeholder-gray-400 text-sm leading-relaxed transition-all"
                />
                <p className="text-xs text-gray-400 mt-2 text-right">
                    💡 اگر غذا مخلوط یا ترکیبی است، توضیح دادن کمک می‌کند تا تحلیل دقیق‌تری داشته باشید
                </p>
            </div>

            <button
                onClick={handleAnalyze}
                className="w-full py-5 bg-gray-900 text-white rounded-[20px] font-bold text-lg shadow-xl shadow-gray-300 hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <span>شروع تحلیل</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-180" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );

    const renderTextInput = () => (
        <div className="space-y-6 animate-slide-up">
            <div className="flex justify-between items-center">
                <button onClick={() => setView('menu')} className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
                <h2 className="text-xl font-bold text-gray-800">توضیح غذا</h2>
                <div className="w-8"></div>
            </div>

            <div className="bg-gray-50 rounded-[24px] p-5 border border-gray-100 focus-within:ring-2 focus-within:ring-orange-200 focus-within:border-orange-300 transition-all">
                <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="مثال: یک سیخ کباب کوبیده با برنج و گوجه..."
                    className="w-full bg-transparent border-none focus:ring-0 outline-none text-gray-800 text-right min-h-[160px] resize-none placeholder-gray-400 text-lg leading-relaxed"
                    autoFocus
                />
            </div>

            <button
                onClick={handleAnalyze}
                disabled={!textInput.trim()}
                className="w-full py-5 bg-orange-500 text-white rounded-[20px] font-bold text-lg shadow-xl shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <span>تحلیل متن</span>
            </button>
        </div>
    );

    const renderAnalyzing = () => (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="relative w-28 h-28 mb-8">
                <div className="absolute inset-0 border-[6px] border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-[6px] border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl animate-pulse">✨</span>
                </div>
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">هوش مصنوعی در حال بررسی...</h3>
            <p className="text-gray-400 text-base">در حال شناسایی کالری و درشت‌مغذی‌ها</p>
        </div>
    );

    const renderResult = () => (
        <div className="bg-white rounded-3xl animate-slide-up">
            {analysis && (
                <>
                    <div className="text-center mb-8">
                        {analysis.healthScore !== undefined && (
                            <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-green-100">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span>امتیاز سلامت: {analysis.healthScore}/10</span>
                            </div>
                        )}
                        <h3 className="text-3xl font-black text-gray-800 leading-tight">{analysis.title}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 p-6 rounded-[24px] text-center border border-gray-100 flex flex-col justify-center items-center">
                            <div className="text-4xl font-black text-gray-900 mb-1">{analysis.calories}</div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wide">کالری</div>
                        </div>
                        <div className="space-y-2.5">
                            <div className="bg-blue-50 p-3 rounded-[18px] flex justify-between px-4 items-center border border-blue-100">
                                <span className="text-xs font-bold text-blue-500">پروتئین</span>
                                <span className="font-bold text-gray-800 text-sm">{analysis.proteinGrams} گرم</span>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-[18px] flex justify-between px-4 items-center border border-yellow-100">
                                <span className="text-xs font-bold text-yellow-600">کربو</span>
                                <span className="font-bold text-gray-800 text-sm">{analysis.carbsGrams} گرم</span>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-[18px] flex justify-between px-4 items-center border border-purple-100">
                                <span className="text-xs font-bold text-purple-500">چربی</span>
                                <span className="font-bold text-gray-800 text-sm">{analysis.fatGrams} گرم</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3 space-x-reverse">
                        <button
                            onClick={handleConfirm}
                            className="flex-1 py-5 bg-gray-900 text-white rounded-[20px] font-bold text-lg shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95"
                        >
                            افزودن به برنامه
                        </button>
                        <button
                            onClick={() => setView('menu')}
                            className="px-6 py-5 bg-gray-100 text-gray-600 rounded-[20px] font-bold hover:bg-gray-200 transition-colors"
                        >
                            لغو
                        </button>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-md transition-opacity duration-300"
            onClick={resetAndClose}
        >
            <div
                className="bg-white w-full max-w-md max-h-[90vh] sm:rounded-[48px] rounded-t-[40px] p-6 shadow-2xl overflow-y-auto relative animate-slide-up-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle Bar */}
                <div className="w-14 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 cursor-grab active:cursor-grabbing hover:bg-gray-300 transition-colors" onClick={resetAndClose}></div>

                {/* Hidden Inputs */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                <input
                    type="file"
                    ref={cameraInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                />

                {/* Views */}
                {view === 'menu' && renderMenu()}
                {view === 'favorites' && renderFavorites()}
                {view === 'preview' && renderPreview()}
                {view === 'text' && renderTextInput()}
                {view === 'analyzing' && renderAnalyzing()}
                {view === 'result' && renderResult()}

            </div>

            <style>{`
        @keyframes slide-up-modal {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up-modal {
            animation: slide-up-modal 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
            animation: slide-up 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
        </div>
    );
};

export default AddFoodModal;

