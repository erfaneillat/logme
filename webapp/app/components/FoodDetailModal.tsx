"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FoodItem, Ingredient } from '../types';
import CircularProgress from './CircularProgress';
import { apiService } from '../services/apiService';
import { useToast } from '../context/ToastContext';

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

    // Editable ingredients
    const [editableIngredients, setEditableIngredients] = useState<Ingredient[]>([]);

    // Edit dialog state
    const [editDialog, setEditDialog] = useState<{
        isOpen: boolean;
        title: string;
        value: number;
        onSave: (value: number) => void;
    } | null>(null);

    // Ingredient dialog state
    const [ingredientDialog, setIngredientDialog] = useState<{
        isOpen: boolean;
        mode: 'add' | 'edit';
        index?: number;
        ingredient: Ingredient;
    } | null>(null);

    // Fix result dialog state
    const [fixResultDialog, setFixResultDialog] = useState<{
        isOpen: boolean;
        isLoading: boolean;
    }>({ isOpen: false, isLoading: false });

    // Ref to store description (survives re-renders)
    const fixResultDescriptionRef = useRef('');
    const fixResultTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [fixResultIsEmpty, setFixResultIsEmpty] = useState(true);

    // Track first render to avoid initial save
    const isFirstRender = useRef(true);
    const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
    const { showToast } = useToast();
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

            // Initialize editable ingredients
            setEditableIngredients(food.ingredients ? [...food.ingredients] : []);

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
            healthScore: food.healthScore,
            ingredients: editableIngredients, // Include edited ingredients
        };

        try {
            await apiService.updateLogItem(food.id, updateData);
            console.log('Saved changes for', food.name);
        } catch (error) {
            console.error('Failed to save changes:', error);
        }
    };

    // Recalculate base values from ingredients sum
    const recalculateTotalsFromIngredients = (ingredients: Ingredient[]) => {
        if (ingredients.length === 0) return;

        const totals = ingredients.reduce((acc, ing) => ({
            calories: acc.calories + (ing.calories || 0),
            protein: acc.protein + (ing.proteinGrams || 0),
            fat: acc.fat + (ing.fatGrams || 0),
            carbs: acc.carbs + (ing.carbsGrams || 0),
        }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

        setBaseCalories(totals.calories);
        setBaseProtein(totals.protein);
        setBaseFat(totals.fat);
        setBaseCarbs(totals.carbs);
    };

    // Ingredient management functions
    const handleDeleteIngredient = (index: number) => {
        const newIngredients = editableIngredients.filter((_, i) => i !== index);
        setEditableIngredients(newIngredients);
        recalculateTotalsFromIngredients(newIngredients);
    };

    const handleEditIngredient = (index: number) => {
        setIngredientDialog({
            isOpen: true,
            mode: 'edit',
            index,
            ingredient: { ...editableIngredients[index] }
        });
    };

    const handleAddIngredient = () => {
        setIngredientDialog({
            isOpen: true,
            mode: 'add',
            ingredient: { name: '', calories: 0, proteinGrams: 0, fatGrams: 0, carbsGrams: 0 }
        });
    };

    const handleSaveIngredient = (ingredient: Ingredient) => {
        let newIngredients: Ingredient[];
        if (ingredientDialog?.mode === 'edit' && ingredientDialog.index !== undefined) {
            newIngredients = [...editableIngredients];
            newIngredients[ingredientDialog.index!] = ingredient;
        } else {
            newIngredients = [...editableIngredients, ingredient];
        }
        setEditableIngredients(newIngredients);
        recalculateTotalsFromIngredients(newIngredients);
        setIngredientDialog(null);
    };

    // Handle fix result with AI
    const handleFixResultWithDescription = async (description: string) => {
        if (!description.trim() || !food) return;

        setFixResultDialog(prev => ({ ...prev, isLoading: true }));

        try {
            // Calculate effective values inline
            const currentCalories = Math.round(baseCalories * quantity);
            const currentProtein = Math.round(baseProtein * quantity);
            const currentFat = Math.round(baseFat * quantity);
            const currentCarbs = Math.round(baseCarbs * quantity);

            const originalData = {
                title: food.name,
                calories: currentCalories,
                proteinGrams: currentProtein,
                fatGrams: currentFat,
                carbsGrams: currentCarbs,
                healthScore: food.healthScore || 0,
                portions: quantity,
                ingredients: editableIngredients.map(ing => ({
                    name: ing.name,
                    calories: ing.calories,
                    proteinGrams: ing.proteinGrams,
                    fatGrams: ing.fatGrams,
                    carbsGrams: ing.carbsGrams,
                })),
                imageUrl: food.imageUrl,
            };

            const fixedData = await apiService.fixResult(originalData, description);

            // Update state with fixed data
            if (fixedData) {
                if (fixedData.calories) setBaseCalories(Math.round(fixedData.calories / quantity));
                if (fixedData.proteinGrams) setBaseProtein(Math.round(fixedData.proteinGrams / quantity));
                if (fixedData.fatGrams) setBaseFat(Math.round(fixedData.fatGrams / quantity));
                if (fixedData.carbsGrams) setBaseCarbs(Math.round(fixedData.carbsGrams / quantity));

                if (fixedData.ingredients && Array.isArray(fixedData.ingredients)) {
                    setEditableIngredients(fixedData.ingredients.map((ing: any) => ({
                        name: ing.name || '',
                        calories: ing.calories || 0,
                        proteinGrams: ing.proteinGrams || 0,
                        fatGrams: ing.fatGrams || 0,
                        carbsGrams: ing.carbsGrams || 0,
                    })));
                }
            }

            setFixResultDialog({ isOpen: false, isLoading: false });
        } catch (error) {
            console.error('Fix result error:', error);
            setFixResultDialog(prev => ({ ...prev, isLoading: false }));
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
    }, [quantity, isFavorite, baseCalories, baseProtein, baseFat, baseCarbs, editableIngredients]);

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
        const varietyBonus = Math.min(0.5, editableIngredients.length * 0.1);

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

    // Ingredient Dialog Component
    const IngredientDialog = () => {
        // Use strings for form fields to allow empty values
        const [formData, setFormData] = useState({
            name: '',
            calories: '',
            proteinGrams: '',
            fatGrams: '',
            carbsGrams: '',
        });

        useEffect(() => {
            if (ingredientDialog?.isOpen) {
                const ing = ingredientDialog.ingredient;
                setFormData({
                    name: ing.name || '',
                    calories: ing.calories ? String(ing.calories) : '',
                    proteinGrams: ing.proteinGrams ? String(ing.proteinGrams) : '',
                    fatGrams: ing.fatGrams ? String(ing.fatGrams) : '',
                    carbsGrams: ing.carbsGrams ? String(ing.carbsGrams) : '',
                });
            }
        }, [ingredientDialog?.isOpen]);

        if (!ingredientDialog?.isOpen) return null;

        // Convert form data to Ingredient on save
        const handleSave = () => {
            const ingredient: Ingredient = {
                name: formData.name,
                calories: parseInt(formData.calories) || 0,
                proteinGrams: parseInt(formData.proteinGrams) || 0,
                fatGrams: parseInt(formData.fatGrams) || 0,
                carbsGrams: parseInt(formData.carbsGrams) || 0,
            };
            handleSaveIngredient(ingredient);
        };

        return (
            <div className="fixed inset-0 z-[100] flex items-end justify-center">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={() => setIngredientDialog(null)}
                />

                {/* Dialog */}
                <div className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 pb-10 animate-slide-up shadow-2xl max-h-[85vh] overflow-y-auto">
                    {/* Handle bar */}
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

                    {/* Title */}
                    <h3 className="text-xl font-black text-center text-gray-800 mb-6">
                        {ingredientDialog.mode === 'add' ? 'افزودن ماده اولیه' : 'ویرایش ماده اولیه'}
                    </h3>

                    {/* Form */}
                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">نام</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-right font-bold text-gray-800 focus:border-orange-400 focus:outline-none"
                                placeholder="نام ماده اولیه"
                            />
                        </div>

                        {/* Calories */}
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">کالری</label>
                            <input
                                type="number"
                                value={formData.calories}
                                onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center font-bold text-gray-800 focus:border-orange-400 focus:outline-none"
                                placeholder="۰"
                            />
                        </div>

                        {/* Macros Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Protein */}
                            <div>
                                <label className="block text-xs font-bold text-blue-500 mb-2 text-center">پروتئین (گرم)</label>
                                <input
                                    type="number"
                                    value={formData.proteinGrams}
                                    onChange={(e) => setFormData(prev => ({ ...prev, proteinGrams: e.target.value }))}
                                    className="w-full p-3 bg-blue-50 rounded-xl border border-blue-200 text-center font-bold text-blue-600 focus:border-blue-400 focus:outline-none"
                                    placeholder="۰"
                                />
                            </div>

                            {/* Fat */}
                            <div>
                                <label className="block text-xs font-bold text-purple-500 mb-2 text-center">چربی (گرم)</label>
                                <input
                                    type="number"
                                    value={formData.fatGrams}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fatGrams: e.target.value }))}
                                    className="w-full p-3 bg-purple-50 rounded-xl border border-purple-200 text-center font-bold text-purple-600 focus:border-purple-400 focus:outline-none"
                                    placeholder="۰"
                                />
                            </div>

                            {/* Carbs */}
                            <div>
                                <label className="block text-xs font-bold text-yellow-600 mb-2 text-center">کربو (گرم)</label>
                                <input
                                    type="number"
                                    value={formData.carbsGrams}
                                    onChange={(e) => setFormData(prev => ({ ...prev, carbsGrams: e.target.value }))}
                                    className="w-full p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-center font-bold text-yellow-600 focus:border-yellow-400 focus:outline-none"
                                    placeholder="۰"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => setIngredientDialog(null)}
                            className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                        >
                            انصراف
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!formData.name.trim()}
                            className="flex-[2] py-4 rounded-2xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ذخیره
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleDelete = async () => {
        if (!food?.id) return;

        // We'll use a custom confirmation logic or simply showToast after action if undo is supported, 
        // but for now, replacing native confirm with a safer check or assuming intent if clicked (or maybe keep confirm for critical delete?)
        // The user asked to remove "alerts". Native confirm is also ugly. 
        // Let's assume for this specific action (Deletion) we might want a better UI later, 
        // but since I can't easily build a ConfirmModal right now, I'll stick to a non-blocking flow 
        // OR better: use showToast to say "Deleted" and maybe handle errors better.
        // Actually adhering to "good ui", I should probably not use confirm(). 
        // However, deleting without confirmation is bad UX.
        // Given constraints, I will leave confirm() if it's strictly about "alerts" from the user request (which showed an alert box), 
        // but I will definitely change the error alert.
        // Wait, the user said "it shows this" referring to a native dialog. confirm() is also a native dialog.
        // But building a custom confirm dialog is out of scope for a quick fix unless I reuse existing modals.
        // I'll keep confirm() for now as it's a safety feature, but strictly replace checking failure alerts.

        if (confirm('آیا از حذف این وعده اطمینان دارید؟')) {
            // Cancel any pending save
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = undefined;
            }
            try {
                // food.date is typically YYYY-MM-DD from the API
                const dateParam = food.date || new Date().toISOString().slice(0, 10);
                await apiService.deleteLogItem(food.id, dateParam);
                setIsOpen(false);
                setTimeout(onClose, 500);
                showToast('وعده غذایی حذف شد', 'success');
            } catch (error) {
                console.error('Delete error:', error);
                showToast('خطا در حذف وعده', 'error');
            }
        }
    };

    return (
        <div className={`fixed inset-0 z-[60] bg-[#F8F9FB] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>

            {/* Edit Dialog */}
            <EditNumberDialog />

            {/* Ingredient Dialog */}
            <IngredientDialog />

            {/* Fix Result Dialog - Inline to prevent re-mount issues */}
            {fixResultDialog.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => !fixResultDialog.isLoading && setFixResultDialog({ isOpen: false, isLoading: false })}
                    />

                    {/* Dialog */}
                    <div className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 pb-10 animate-slide-up shadow-2xl">
                        {/* Handle bar */}
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

                        {/* Title with magic icon */}
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-800">اصلاح با هوش مصنوعی</h3>
                        </div>

                        {/* Input area */}
                        <div className="mb-4">
                            <textarea
                                ref={fixResultTextareaRef}
                                onChange={(e) => setFixResultIsEmpty(!e.target.value.trim())}
                                placeholder="مشکل غذا را شرح دهید...&#10;مثلاً: این غذا دو برابر بیشتر بود یا فقط نصف غذا خوردم"
                                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-right font-medium text-gray-800 focus:border-purple-400 focus:outline-none resize-none h-32"
                                disabled={fixResultDialog.isLoading}
                                dir="rtl"
                            />
                        </div>

                        {/* Info box */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6 border border-purple-100">
                            <p className="text-sm text-gray-600 text-right leading-relaxed">
                                🤖 هوش مصنوعی تغییرات شما را بررسی کرده و کالری و مواد مغذی را اصلاح می‌کند
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setFixResultDialog({ isOpen: false, isLoading: false })}
                                disabled={fixResultDialog.isLoading}
                                className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={() => {
                                    const description = fixResultTextareaRef.current?.value || '';
                                    if (description.trim()) {
                                        handleFixResultWithDescription(description);
                                    }
                                }}
                                disabled={fixResultIsEmpty || fixResultDialog.isLoading}
                                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {fixResultDialog.isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>در حال اصلاح...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                                        </svg>
                                        <span>اصلاح کن</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    {/* Centered Title (Absolute Layer) */}
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
                        style={{ opacity: isScrolled ? 1 : 0 }}
                    >
                        <div className="px-28 w-full text-center">
                            <h3 className="font-black text-gray-800 text-sm truncate">
                                {displayFood.name}
                            </h3>
                        </div>
                    </div>

                    {/* Back Button */}
                    <button
                        onClick={handleClose}
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isScrolled
                            ? 'bg-gray-100 text-gray-800 shadow-sm'
                            : 'bg-white/20 backdrop-blur-md text-white border border-white/10'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>

                    {/* Actions */}
                    <div className="relative z-10 flex gap-2">
                        {/* Delete Button */}
                        <button
                            onClick={handleDelete}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isScrolled
                                ? 'bg-red-50 text-red-500 shadow-sm hover:bg-red-100'
                                : 'bg-white/20 backdrop-blur-md text-white border border-white/10 hover:bg-red-500/20'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {/* Favorite Button */}
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isScrolled
                                ? 'bg-gray-100 shadow-sm hover:bg-gray-200'
                                : 'bg-white/20 backdrop-blur-md border border-white/10 hover:bg-white/30'
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
                            <button
                                onClick={() => { fixResultDescriptionRef.current = ''; setFixResultDialog({ isOpen: true, isLoading: false }); }}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_100%] text-white rounded-[20px] font-bold text-lg shadow-xl shadow-purple-200 hover:shadow-purple-300 active:scale-95 transition-all mb-10 flex items-center justify-center gap-3 animate-gradient"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                                </svg>
                                <span>اصلاح با هوش مصنوعی</span>
                            </button>

                            {/* Ingredients Header */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-xl text-gray-800">مواد اولیه</h3>
                                <button
                                    onClick={handleAddIngredient}
                                    className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-colors"
                                >
                                    + افزودن
                                </button>
                            </div>

                            {/* Ingredients List */}
                            <div className="space-y-4 pb-20">
                                {editableIngredients.length > 0 ? (
                                    editableIngredients.map((item, idx) => (
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
                                                    <button
                                                        onClick={() => handleEditIngredient(idx)}
                                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteIngredient(idx)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                    >
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

                                <button
                                    onClick={handleAddIngredient}
                                    className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-[24px] font-bold text-sm hover:border-orange-200 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                                >
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
