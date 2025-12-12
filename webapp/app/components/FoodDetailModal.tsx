"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FoodItem, Ingredient } from '../types';
import CircularProgress from './CircularProgress';
import { apiService } from '../services/apiService';

interface FoodDetailModalProps {
    food: FoodItem | null;
    onClose: () => void;
}

// Helper to convert English numbers to Persian/Farsi numerals
const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ food, onClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    // Editable base values (per portion)
    const [baseCalories, setBaseCalories] = useState(0);
    const [baseProtein, setBaseProtein] = useState(0);
    const [baseFat, setBaseFat] = useState(0);
    const [baseCarbs, setBaseCarbs] = useState(0);

    // Edit dialog state
    const [editDialog, setEditDialog] = useState<{
        isOpen: boolean;
        title: string;
        value: number;
        onSave: (value: number) => void;
    } | null>(null);

    // Track first render to avoid initial save
    const isFirstRender = useRef(true);
    const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (food) {
            setIsOpen(true);
            // Use portions from API, default to 1
            const portions = food.portions || 1;
            setQuantity(portions);
            // Use liked status from API
            setIsFavorite(food.liked || false);
            setScrollProgress(0);

            // Initialize base values (per portion)
            setBaseCalories(Math.round(food.calories / portions));
            setBaseProtein(Math.round(food.protein / portions));
            setBaseFat(Math.round(food.fat / portions));
            setBaseCarbs(Math.round(food.carbs / portions));

            isFirstRender.current = true; // Reset on new food open
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
        } else {
            const timer = setTimeout(() => setIsOpen(false), 300);
            return () => clearTimeout(timer);
        }
    }, [food]);

    // Save function to be called by debounce or close
    const saveChanges = async () => {
        if (!food) return;

        // Calculate totals based on edited base values * quantity
        const newCalories = Math.round(baseCalories * quantity);
        const newProtein = Math.round(baseProtein * quantity);
        const newFat = Math.round(baseFat * quantity);
        const newCarbs = Math.round(baseCarbs * quantity);

        const updateData = {
            date: food.date, // Required by API
            title: food.name,
            calories: newCalories,
            proteinGrams: newProtein,
            fatsGrams: newFat,
            carbsGrams: newCarbs,
            portions: quantity,
            liked: isFavorite,
            healthScore: food.healthScore
        };

        try {
            await apiService.updateLogItem(food.id, updateData);
            console.log('Saved changes for', food.name);
        } catch (error) {
            console.error('Failed to save changes:', error);
        }
    };

    // Handle real-time saving
    useEffect(() => {
        if (!food) return;

        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(saveChanges, 1000);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [quantity, isFavorite, baseCalories, baseProtein, baseFat, baseCarbs]);

    if (!food && !isOpen) return null;

    const displayFood = food || {
        id: '',
        name: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        imageUrl: '',
        timestamp: new Date(),
        portions: 1,
        healthScore: 0,
        ingredients: [] as Ingredient[],
        liked: false,
    };

    // Use real ingredients from API, or empty array if none
    const ingredients: Ingredient[] = displayFood.ingredients || [];

    // Calculate health score - use from API if available, otherwise compute fallback
    const computeHealthScore = (): number => {
        if (displayFood.healthScore && displayFood.healthScore > 0) {
            return displayFood.healthScore;
        }

        // Fallback calculation similar to Flutter
        const calories = displayFood.calories;
        const protein = displayFood.protein;
        const fat = displayFood.fat;
        const carbs = displayFood.carbs;

        const totalEnergy = protein * 4 + carbs * 4 + fat * 9;
        if (totalEnergy <= 0) return 5;

        const pPct = (protein * 4) / totalEnergy;
        const fPct = (fat * 9) / totalEnergy;
        const cPct = (carbs * 4) / totalEnergy;

        const diff = Math.abs(pPct - 0.25) + Math.abs(fPct - 0.30) + Math.abs(cPct - 0.45);
        const macroScore = Math.min(8, Math.max(0, 8 * (1 - diff / 1.5)));

        let kcalScore = 0.5;
        if (calories > 900) kcalScore = 0.2;
        else if (calories > 750) kcalScore = 0.6;
        else if (calories < 250) kcalScore = 1.2;
        else kcalScore = 1.6;

        const proteinPer100 = calories > 0 ? (protein / (calories / 100)) : 0;
        const proteinBonus = Math.min(1.5, Math.max(0, (proteinPer100 - 2) * 0.5));
        const varietyBonus = Math.min(0.5, ingredients.length * 0.1);

        const raw = macroScore + kcalScore + proteinBonus + varietyBonus;
        return Math.round(Math.min(10, Math.max(0, raw)));
    };

    const healthScore = computeHealthScore();

    const handleClose = () => {
        // If there's a pending save, execute it immediately
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            saveChanges();
            debounceTimer.current = undefined;
        }
        setIsOpen(false);
        setTimeout(onClose, 300);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const triggerHeight = window.innerHeight * 0.3;
        const progress = Math.min(1, Math.max(0, scrollTop / triggerHeight));
        setScrollProgress(progress);
    };

    const isScrolled = scrollProgress > 0.8;
    const headerBgOpacity = Math.max(0, (scrollProgress - 0.2) / 0.8);

    // Calculate effective values based on base values * quantity
    const effectiveCalories = Math.round(baseCalories * quantity);
    const effectiveProtein = Math.round(baseProtein * quantity);
    const effectiveFat = Math.round(baseFat * quantity);
    const effectiveCarbs = Math.round(baseCarbs * quantity);

    // Edit dialog opener helper
    const openEditDialog = (title: string, value: number, onSave: (v: number) => void) => {
        setEditDialog({ isOpen: true, title, value, onSave });
    };

    // Edit Number Dialog Component
    const EditNumberDialog = () => {
        const [localValue, setLocalValue] = useState(editDialog?.value || 0);
        const inputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
            if (editDialog?.isOpen) {
                setLocalValue(editDialog.value);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        }, [editDialog?.isOpen, editDialog?.value]);

        if (!editDialog?.isOpen) return null;

        const quickAdjustments = [-100, -50, -10, 10, 50, 100];

        const handleSave = () => {
            editDialog.onSave(localValue);
            setEditDialog(null);
        };

        return (
            <div className="fixed inset-0 z-[100] flex items-end justify-center">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={() => setEditDialog(null)}
                />

                {/* Dialog */}
                <div className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 pb-10 animate-slide-up shadow-2xl">
                    {/* Handle bar */}
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

                    {/* Title */}
                    <h3 className="text-xl font-black text-center text-gray-800 mb-6">
                        {editDialog.title}
                    </h3>

                    {/* Current value display */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-center border border-gray-100">
                        <span className="text-3xl font-black text-gray-800">
                            {toPersianNumbers(localValue)}
                        </span>
                    </div>

                    {/* Main controls */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => setLocalValue(v => Math.max(0, v - 1))}
                            className="w-14 h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 transition-colors"
                        >
                            -
                        </button>
                        <input
                            ref={inputRef}
                            type="number"
                            value={localValue}
                            onChange={(e) => setLocalValue(Math.max(0, Math.min(100000, parseInt(e.target.value) || 0)))}
                            className="flex-1 h-14 rounded-2xl border-2 border-gray-200 text-center text-xl font-bold text-gray-800 focus:border-orange-400 focus:outline-none transition-colors"
                        />
                        <button
                            onClick={() => setLocalValue(v => Math.min(100000, v + 1))}
                            className="w-14 h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 transition-colors"
                        >
                            +
                        </button>
                    </div>

                    {/* Quick adjust chips */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                        <p className="text-xs font-bold text-gray-400 text-center mb-3">تغییر سریع</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {quickAdjustments.map(delta => (
                                <button
                                    key={delta}
                                    onClick={() => setLocalValue(v => Math.max(0, Math.min(100000, v + delta)))}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${delta > 0
                                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                >
                                    {delta > 0 ? `+${toPersianNumbers(delta)}` : toPersianNumbers(delta)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setEditDialog(null)}
                            className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                        >
                            انصراف
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-[2] py-4 rounded-2xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors"
                        >
                            ذخیره
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`fixed inset-0 z-[60] bg-[#F8F9FB] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>

            {/* Edit Dialog */}
            <EditNumberDialog />

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto no-scrollbar relative w-full"
            >
                {/* Fixed Background Image (Parallax Layer) */}
                <div className="fixed top-0 left-0 right-0 h-[45vh] z-0 pointer-events-none overflow-hidden">
                    <div className="relative w-full h-full">
                        {displayFood.imageUrl ? (
                            <img
                                src={displayFood.imageUrl}
                                alt={displayFood.name}
                                className="w-full h-full object-cover transition-transform duration-75 will-change-transform"
                                style={{
                                    transform: `scale(${1 + scrollProgress * 0.1}) translateY(${scrollProgress * 40}px)`
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl bg-gray-900">🍲</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/30"></div>
                    </div>
                </div>

                {/* Sticky Header Bar */}
                <div
                    className="fixed top-0 left-0 right-0 z-50 px-5 pt-4 pb-3 flex justify-between items-center transition-all duration-300"
                    style={{
                        backgroundColor: `rgba(255, 255, 255, ${headerBgOpacity > 0.95 ? 0.95 : headerBgOpacity})`,
                        backdropFilter: headerBgOpacity > 0.1 ? 'blur(12px)' : 'none',
                        borderBottom: headerBgOpacity > 0.9 ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                        boxShadow: headerBgOpacity > 0.9 ? '0 4px 20px -5px rgba(0,0,0,0.05)' : 'none',
                    }}
                >
                    <button
                        onClick={handleClose}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isScrolled
                            ? 'bg-gray-100 text-gray-800 shadow-sm'
                            : 'bg-white/20 backdrop-blur-md text-white border border-white/10'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>

                    {/* Collapsed Title */}
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-gray-800 text-sm transition-all duration-300 pointer-events-none"
                        style={{
                            opacity: isScrolled ? 1 : 0,
                            transform: isScrolled ? 'translate(-50%, -50%) translateY(0)' : 'translate(-50%, -50%) translateY(10px)'
                        }}
                    >
                        {displayFood.name.split(' ').slice(0, 3).join(' ')}...
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isScrolled
                                ? 'bg-gray-100 shadow-sm'
                                : 'bg-white/20 backdrop-blur-md border border-white/10'
                                } ${isFavorite ? 'text-red-500' : (isScrolled ? 'text-gray-600' : 'text-white')}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Scrolling Content Wrapper */}
                <div className="relative w-full z-10 flex flex-col min-h-screen">
                    {/* Spacer matching desired initial image visibility */}
                    <div className="h-[38vh] w-full shrink-0"></div>

                    {/* White Card Content */}
                    <div className="flex-1 bg-[#F8F9FB] rounded-t-[40px] -mt-10 pb-10 shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.15)] relative">

                        {/* Pull Bar */}
                        <div className="w-12 h-1.5 bg-gray-300/50 rounded-full mx-auto mt-3 mb-6"></div>

                        <div className="px-6">
                            {/* Title */}
                            <h1 className="text-2xl font-black text-center text-gray-900 leading-tight mb-8">
                                {displayFood.name}
                            </h1>

                            {/* Controls & Summary */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {/* Quantity Control */}
                                <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <span className="text-xs font-bold text-gray-400 mb-2">تعداد وعده</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setQuantity(q => q + 0.25)} className="w-8 h-8 rounded-xl bg-gray-50 text-gray-800 flex items-center justify-center hover:bg-gray-100 font-bold text-lg">+</button>
                                        <span className="text-xl font-black text-gray-900 w-12 text-center">{toPersianNumbers(quantity)}</span>
                                        <button onClick={() => setQuantity(q => Math.max(0.25, q - 0.25))} className="w-8 h-8 rounded-xl bg-gray-50 text-gray-800 flex items-center justify-center hover:bg-gray-100 font-bold text-lg">-</button>
                                    </div>
                                </div>

                                {/* Calories Control */}
                                <div
                                    onClick={() => openEditDialog('کالری کل', effectiveCalories, (v) => setBaseCalories(Math.round(v / quantity)))}
                                    className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                                >
                                    <div className="absolute top-3 left-3 text-gray-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 mb-1">کالری کل</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-gray-900">{toPersianNumbers(effectiveCalories)}</span>
                                        <span className="text-xs font-bold text-gray-500">کالری</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Macros Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {/* Fat */}
                                <div
                                    onClick={() => openEditDialog('چربی', effectiveFat, (v) => setBaseFat(Math.round(v / quantity)))}
                                    className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                                >
                                    <span className="text-xs font-bold text-gray-400 mb-2">چربی</span>
                                    <div className="text-xl font-black text-purple-600 mb-1">{toPersianNumbers(effectiveFat)} <span className="text-xs text-gray-400">گرم</span></div>
                                    <div className="w-full h-1.5 bg-purple-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (effectiveFat / 70) * 100)}%` }}></div>
                                    </div>
                                    <div className="absolute top-3 left-3 text-gray-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Protein */}
                                <div
                                    onClick={() => openEditDialog('پروتئین', effectiveProtein, (v) => setBaseProtein(Math.round(v / quantity)))}
                                    className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                                >
                                    <span className="text-xs font-bold text-gray-400 mb-2">پروتئین</span>
                                    <div className="text-xl font-black text-blue-600 mb-1">{toPersianNumbers(effectiveProtein)} <span className="text-xs text-gray-400">گرم</span></div>
                                    <div className="w-full h-1.5 bg-blue-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (effectiveProtein / 150) * 100)}%` }}></div>
                                    </div>
                                    <div className="absolute top-3 left-3 text-gray-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Health Score */}
                                <div className="bg-white p-3 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <span className="text-xs font-bold text-gray-400 mb-2">امتیاز سلامت</span>
                                    <div className="relative flex items-center justify-center">
                                        <CircularProgress
                                            value={healthScore} max={10} size={50} strokeWidth={5} color="#10B981"
                                            showValue={false}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-black text-gray-800">{toPersianNumbers(healthScore)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Carbs */}
                                <div
                                    onClick={() => openEditDialog('کربوهیدرات', effectiveCarbs, (v) => setBaseCarbs(Math.round(v / quantity)))}
                                    className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                                >
                                    <span className="text-xs font-bold text-gray-400 mb-2">کربوهیدرات</span>
                                    <div className="text-xl font-black text-yellow-600 mb-1">{toPersianNumbers(effectiveCarbs)} <span className="text-xs text-gray-400">گرم</span></div>
                                    <div className="w-full h-1.5 bg-yellow-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min(100, (effectiveCarbs / 250) * 100)}%` }}></div>
                                    </div>
                                    <div className="absolute top-3 left-3 text-gray-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Fix Button */}
                            <button className="w-full py-4 bg-gray-900 text-white rounded-[20px] font-bold text-lg shadow-xl shadow-gray-300 hover:bg-gray-800 active:scale-95 transition-all mb-10 flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                                اصلاح نتیجه
                            </button>

                            {/* Ingredients Header */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-xl text-gray-800">مواد اولیه</h3>
                                <button className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-colors">
                                    + افزودن
                                </button>
                            </div>

                            {/* Ingredients List - Real data from API */}
                            <div className="space-y-4 pb-20">
                                {ingredients.length > 0 ? (
                                    ingredients.map((item, idx) => (
                                        <div
                                            key={`${item.name}-${idx}`}
                                            className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col gap-3 animate-slide-up"
                                            style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-gray-800 text-lg">{item.name}</h4>
                                                <div className="text-sm font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">
                                                    {toPersianNumbers(item.calories)} <span className="text-[10px] text-gray-500 font-bold">کالری</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-end">
                                                <div className="flex gap-2">
                                                    <span className="text-[10px] font-bold bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded-lg border border-yellow-100">
                                                        {toPersianNumbers(item.carbsGrams)} گرم C
                                                    </span>
                                                    <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg border border-purple-100">
                                                        {toPersianNumbers(item.fatGrams)} گرم F
                                                    </span>
                                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100">
                                                        {toPersianNumbers(item.proteinGrams)} گرم P
                                                    </span>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-gray-50 rounded-[24px] p-8 text-center border-2 border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span className="text-3xl">🥗</span>
                                        </div>
                                        <h4 className="font-bold text-gray-700 mb-1">مواد اولیه ثبت نشده</h4>
                                        <p className="text-sm text-gray-400">اطلاعات مواد اولیه برای این غذا موجود نیست</p>
                                    </div>
                                )}

                                <button className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-[24px] font-bold text-sm hover:border-orange-200 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
                                    <span>+</span>
                                    <span>افزودن ماده اولیه</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
            animation: slide-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            opacity: 0;
        }
      `}</style>
        </div>
    );
};

export default FoodDetailModal;
