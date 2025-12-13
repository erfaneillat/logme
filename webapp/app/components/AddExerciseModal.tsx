"use client";

import React, { useState, useEffect } from 'react';
import { apiService, ExerciseAnalysisResponse } from '../services/apiService';

interface AddExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddExercise: (calories: number) => void;
}

// Helper to convert English numbers to Persian/Farsi numerals
const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

type ModalView = 'form' | 'analyzing' | 'result';

const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ isOpen, onClose, onAddExercise }) => {
    const [view, setView] = useState<ModalView>('form');
    const [exerciseInput, setExerciseInput] = useState('');
    const [durationInput, setDurationInput] = useState('');
    const [caloriesInput, setCaloriesInput] = useState('');
    const [showManualCalories, setShowManualCalories] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<ExerciseAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setView('form');
            setExerciseInput('');
            setDurationInput('');
            setCaloriesInput('');
            setShowManualCalories(false);
            setAnalysisResult(null);
            setIsLoading(false);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const resetAndClose = () => {
        onClose();
    };

    const handleAnalyze = async () => {
        if (!exerciseInput.trim()) {
            setError('نوع ورزش را وارد کنید');
            return;
        }
        const duration = parseInt(durationInput);
        if (!duration || duration <= 0) {
            setError('مدت زمان معتبر وارد کنید');
            return;
        }

        setError(null);
        setView('analyzing');

        try {
            const result = await apiService.analyzeExercise(exerciseInput.trim(), duration);
            setAnalysisResult(result);
            setCaloriesInput(result.caloriesBurned.toString());
            setView('result');
        } catch (err: any) {
            setError(err.message || 'خطا در تحلیل ورزش');
            setView('form');
        }
    };

    const handleSave = async () => {
        const calories = parseInt(caloriesInput);
        if (!calories || calories <= 0) {
            setError('کالری معتبر وارد کنید');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Get today's date
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            await apiService.updateBurnedCalories(dateStr, calories);
            onAddExercise(calories);
            resetAndClose();
        } catch (err: any) {
            setError(err.message || 'خطا در ثبت ورزش');
        } finally {
            setIsLoading(false);
        }
    };

    // Pre-defined exercise suggestions
    const exerciseSuggestions = [
        { icon: '🏃', name: 'دویدن', nameEn: 'running' },
        { icon: '🚶', name: 'پیاده‌روی', nameEn: 'walking' },
        { icon: '🚴', name: 'دوچرخه‌سواری', nameEn: 'cycling' },
        { icon: '🏊', name: 'شنا', nameEn: 'swimming' },
        { icon: '🏋️', name: 'وزنه', nameEn: 'weight training' },
        { icon: '🧘', name: 'یوگا', nameEn: 'yoga' },
    ];

    // Duration presets
    const durationPresets = [15, 30, 45, 60, 90];

    const renderForm = () => (
        <div className="space-y-6 animate-slide-up">
            {/* Header */}
            <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200 animate-bounce-gentle">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-1">ثبت ورزش</h2>
                <p className="text-gray-400 text-sm">کالری سوزانده شده را محاسبه و ثبت کنید</p>
            </div>

            {/* Exercise Input */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 block">نوع ورزش یا فعالیت</label>
                <div className="relative">
                    <input
                        type="text"
                        value={exerciseInput}
                        onChange={(e) => setExerciseInput(e.target.value)}
                        placeholder="مثال: ۳۰ دقیقه دویدن..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-right text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all outline-none text-lg"
                        dir="rtl"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🏃</div>
                </div>

                {/* Quick Suggestions */}
                <div className="flex flex-wrap gap-2">
                    {exerciseSuggestions.map((exercise) => (
                        <button
                            key={exercise.nameEn}
                            onClick={() => setExerciseInput(exercise.name)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${exerciseInput === exercise.name
                                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                }`}
                        >
                            <span>{exercise.icon}</span>
                            <span>{exercise.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Duration Input */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 block">مدت زمان (دقیقه)</label>
                <div className="relative">
                    <input
                        type="number"
                        value={durationInput}
                        onChange={(e) => setDurationInput(e.target.value)}
                        placeholder="مثال: ۳۰"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-right text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all outline-none text-lg"
                        dir="ltr"
                        min="1"
                        max="600"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">دقیقه</div>
                </div>

                {/* Duration Presets */}
                <div className="flex gap-2">
                    {durationPresets.map((duration) => (
                        <button
                            key={duration}
                            onClick={() => setDurationInput(duration.toString())}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${durationInput === duration.toString()
                                    ? 'bg-green-500 text-white shadow-md shadow-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {toPersianNumbers(duration)}
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Hint */}
            <div className="flex items-start gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <span className="text-xl">✨</span>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-purple-700 mb-1">محاسبه هوشمند</p>
                    <p className="text-xs text-purple-500">هوش مصنوعی کالری سوزانده شما را بر اساس نوع و مدت فعالیت محاسبه می‌کند</p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium text-center border border-red-100 animate-shake">
                    {error}
                </div>
            )}

            {/* Analyze Button */}
            <button
                onClick={handleAnalyze}
                disabled={!exerciseInput.trim() || !durationInput}
                className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-green-200 hover:from-green-600 hover:to-emerald-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>محاسبه کالری</span>
            </button>
        </div>
    );

    const renderAnalyzing = () => (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="relative w-32 h-32 mb-8">
                {/* Outer ring */}
                <div className="absolute inset-0 border-[6px] border-gray-100 rounded-full"></div>
                {/* Spinning ring */}
                <div className="absolute inset-0 border-[6px] border-green-500 rounded-full border-t-transparent animate-spin"></div>
                {/* Pulse ring */}
                <div className="absolute inset-2 border-4 border-green-200 rounded-full animate-pulse"></div>
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl animate-bounce-gentle">🏃</span>
                </div>
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">در حال محاسبه...</h3>
            <p className="text-gray-400 text-base text-center max-w-[250px]">
                هوش مصنوعی در حال تحلیل فعالیت و محاسبه کالری سوزانده شده است
            </p>

            {/* Progress dots */}
            <div className="flex gap-2 mt-6">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce-dot" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce-dot" style={{ animationDelay: '300ms' }}></div>
            </div>
        </div>
    );

    const renderResult = () => (
        <div className="space-y-6 animate-slide-up">
            {analysisResult && (
                <>
                    {/* Success Animation */}
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200 animate-success-pop">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mb-1">{analysisResult.activityName}</h2>
                        <p className="text-gray-400 text-sm mb-2">
                            مدت: {toPersianNumbers(analysisResult.duration)} دقیقه • شدت: {analysisResult.intensity}
                        </p>
                    </div>

                    {/* Calories Card */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-3xl border border-orange-100 text-center relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-200/30 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="text-sm text-orange-600 font-bold mb-2">کالری سوزانده شده</div>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-5xl">🔥</span>
                                <span className="text-6xl font-black text-gray-900">{toPersianNumbers(analysisResult.caloriesBurned)}</span>
                            </div>
                            <div className="text-gray-500 text-sm mt-2">کیلوکالری</div>
                        </div>
                    </div>

                    {/* Tips Section */}
                    {analysisResult.tips && analysisResult.tips.length > 0 && (
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">💡</span>
                                <span className="font-bold text-gray-700 text-sm">نکات ورزشی</span>
                            </div>
                            <div className="space-y-2">
                                {analysisResult.tips.map((tip, index) => (
                                    <div key={index} className="flex items-start gap-2 text-right">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0"></div>
                                        <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Manual Edit Toggle */}
                    <button
                        onClick={() => setShowManualCalories(!showManualCalories)}
                        className="w-full flex items-center justify-center gap-2 text-green-600 text-sm font-bold hover:bg-green-50 py-3 rounded-xl transition-colors"
                    >
                        {showManualCalories ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>استفاده از محاسبه هوش مصنوعی</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                <span>ویرایش دستی کالری</span>
                            </>
                        )}
                    </button>

                    {/* Manual Calories Input */}
                    {showManualCalories && (
                        <div className="animate-slide-up">
                            <div className="relative">
                                <input
                                    type="number"
                                    value={caloriesInput}
                                    onChange={(e) => setCaloriesInput(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-center text-gray-800 focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all outline-none text-2xl font-bold"
                                    dir="ltr"
                                    min="1"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">کالری</div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-gray-300 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>ثبت ورزش</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setView('form')}
                            className="px-6 py-5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            برگشت
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
                <div
                    className="w-14 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 cursor-grab active:cursor-grabbing hover:bg-gray-300 transition-colors"
                    onClick={resetAndClose}
                ></div>

                {/* Views */}
                {view === 'form' && renderForm()}
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
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2s ease-in-out infinite;
                }
                @keyframes bounce-dot {
                    0%, 100% { transform: translateY(0); opacity: 0.5; }
                    50% { transform: translateY(-8px); opacity: 1; }
                }
                .animate-bounce-dot {
                    animation: bounce-dot 1s ease-in-out infinite;
                }
                @keyframes success-pop {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-success-pop {
                    animation: success-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default AddExerciseModal;
