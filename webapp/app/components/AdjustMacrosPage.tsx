"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiService, Plan } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../translations';

interface AdjustMacrosPageProps {
    onClose: () => void;
}

const MacroInput = ({
    title,
    value,
    onChange,
    icon,
    color,
    unit
}: {
    title: string;
    value: string;
    onChange: (val: string) => void;
    icon: React.ReactNode;
    color: string;
    unit?: string;
}) => (
    <div className="bg-gray-50 rounded-[20px] p-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-[16px] ${color} bg-opacity-10 flex items-center justify-center shrink-0`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <label className="text-xs font-bold text-gray-500 mb-1 block truncate">{title}</label>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full text-xl font-black text-gray-800 bg-transparent border-none p-0 focus:ring-0 placeholder-gray-300 min-w-0"
                    placeholder="0"
                />
                <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-100 shrink-0">{unit}</span>
            </div>
        </div>
    </div>
);

const AdjustMacrosPage: React.FC<AdjustMacrosPageProps> = ({ onClose }) => {
    const { t, isRTL } = useTranslation();
    const [plan, setPlan] = useState<Plan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form States
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fats, setFats] = useState('');

    const [isCalculating, setIsCalculating] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchPlan();
    }, []);

    const fetchPlan = async () => {
        try {
            const data = await apiService.getLatestPlan();
            if (data) {
                setPlan(data);
                setCalories(data.calories.toString());
                setProtein(data.proteinGrams.toString());
                setCarbs(data.carbsGrams.toString());
                setFats(data.fatsGrams.toString());
            }
        } catch (error) {
            console.error('Failed to fetch plan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoCalculate = async () => {
        try {
            setIsCalculating(true);
            const generatedPlan = await apiService.generatePlan();
            if (generatedPlan) {
                setPlan(generatedPlan);
                setCalories(generatedPlan.calories.toString());
                setProtein(generatedPlan.proteinGrams.toString());
                setCarbs(generatedPlan.carbsGrams.toString());
                setFats(generatedPlan.fatsGrams.toString());
            }
        } catch (error: any) {
            console.error('Failed to auto calculate:', error);
            showToast(error.message || 'Error generating plan', 'error');
        } finally {
            setIsCalculating(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await apiService.updatePlanManual({
                calories: Number(calories),
                proteinGrams: Number(protein),
                carbsGrams: Number(carbs),
                fatsGrams: Number(fats)
            });
            onClose();
        } catch (error) {
            console.error('Failed to save macros:', error);
            showToast(t('macros.errorSaving'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-0 sm:p-4"
            dir={isRTL ? 'rtl' : 'ltr'}
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-gray-50 bg-white z-10 shrink-0">
                    <div className="w-8"></div>
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mb-3 sm:hidden"></div>
                        <h2 className="text-lg font-black text-gray-800">{t('macros.title')}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors text-gray-400"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-[20px] flex gap-3 items-start">
                        <div className="text-xl">💡</div>
                        <p className="text-xs text-blue-700 leading-relaxed font-medium">
                            {t('macros.info')}
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-20 bg-gray-50 rounded-[20px] animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            <MacroInput
                                title={t('macros.calorieGoal')}
                                value={calories}
                                onChange={setCalories}
                                unit={t('macros.units.calories')}
                                color="bg-blue-500 text-blue-600"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12a3 3 0 10-4.24-4.24 3 3 0 004.24 4.24z" clipRule="evenodd" />
                                    </svg>
                                }
                            />

                            <MacroInput
                                title={t('macros.protein')}
                                value={protein}
                                onChange={setProtein}
                                unit={t('macros.units.grams')}
                                color="bg-red-500 text-red-600"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                    </svg>
                                }
                            />

                            <MacroInput
                                title={t('macros.carbs')}
                                value={carbs}
                                onChange={setCarbs}
                                unit={t('macros.units.grams')}
                                color="bg-yellow-500 text-yellow-600"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                    </svg>
                                }
                            />

                            <MacroInput
                                title={t('macros.fats')}
                                value={fats}
                                onChange={setFats}
                                unit={t('macros.units.grams')}
                                color="bg-green-500 text-green-600"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 10-2 0v2a1 1 0 01-1 1H8a1 1 0 010-2l-4-12V4zm2 4a2 2 0 104 0 2 2 0 00-4 0zm0 4a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
                                    </svg>
                                }
                            />
                        </div>
                    )}
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-gray-100 bg-white space-y-3 pb-8 sm:pb-4">
                    <button
                        onClick={handleAutoCalculate}
                        disabled={isCalculating || isSaving}
                        className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-[20px] font-bold text-base hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isCalculating ? (
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                                {t('macros.autoCalculate')}
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-4 bg-gray-900 text-white rounded-[20px] font-bold text-lg shadow-xl shadow-gray-200 hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            t('macros.saveChanges')
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AdjustMacrosPage;
