"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiService, WeightEntry, DailyLog, AdditionalInfo } from '../services/apiService';
import { format } from 'date-fns-jalali';
import { faIR } from 'date-fns/locale';

// --- Text Utility ---
const toPersianDigits = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '';
    const str = num.toString();
    return str.replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 1728));
};

// --- Sub-Components ---

// 1. Log/Update Weight Modal
interface LogWeightModalProps {
    isOpen: boolean;
    mode: 'current' | 'goal';
    onClose: () => void;
    onSave: (weight: number) => Promise<void>;
    initialWeight?: number;
}

const LogWeightModal: React.FC<LogWeightModalProps> = ({ isOpen, mode, onClose, onSave, initialWeight }) => {
    const [weight, setWeight] = useState<string>('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setWeight(initialWeight?.toString() || '');
        }
    }, [isOpen, initialWeight]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const w = parseFloat(weight);
        if (!w || isNaN(w) || w < 20 || w > 400) return;

        setSaving(true);
        try {
            await onSave(w);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const title = mode === 'current' ? 'ثبت وزن جدید' : 'تغییر هدف وزنی';
    const buttonText = mode === 'current' ? 'ثبت وزن' : 'بروزرسانی هدف';

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-[32px] p-6 animate-slide-up sm:animate-fade-in"
                onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <div className="flex items-center justify-center gap-2">
                            <input
                                type="number"
                                inputMode="decimal"
                                autoFocus
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                                className="text-6xl font-black text-center text-gray-900 w-full bg-transparent outline-none placeholder-gray-200"
                                placeholder="0"
                                step="0.1"
                            />
                            <span className="text-xl font-bold text-gray-400 mt-4">kg</span>
                        </div>
                    </div>

                    <p className="text-center text-gray-400 text-sm font-medium">
                        {mode === 'current'
                            ? 'وزن فعلی خود را وارد کنید'
                            : 'وزنی که می‌خواهید به آن برسید را وارد کنید'
                        }
                    </p>

                    <button
                        type="submit"
                        disabled={saving || !weight}
                        className="w-full py-4 bg-black text-white rounded-[20px] font-bold text-lg shadow-lg active:scale-95 transition-transform hover:bg-gray-800 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center"
                    >
                        {saving ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            buttonText
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Link Main Component ---

const AnalysisSkeleton = () => (
    <div className="px-5 pt-8 pb-32 space-y-6 overflow-y-auto h-full no-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center">
            <div className="h-9 w-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-7 w-24 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Weight Goal Summary */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded-xl animate-pulse" />
            </div>

            <div className="mb-6 flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>

            <div className="w-full h-4 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-gray-200 rounded-full animate-pulse w-1/2" />
            </div>

            <div className="w-full h-14 bg-gray-200 rounded-[20px] animate-pulse" />
        </div>

        {/* Weight Chart Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-32 bg-gray-200 rounded-xl animate-pulse" />
            </div>
            <div className="h-[180px] bg-gray-50 rounded-2xl animate-pulse flex items-center justify-center">
                {/* Optional: Add some internal simple shape to mimic chart area if needed */}
            </div>
        </div>

        {/* BMI Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-20 bg-gray-200 rounded-2xl animate-pulse" />
            </div>

            <div className="flex justify-center mb-8 relative">
                <div className="h-16 w-32 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="h-4 w-full bg-gray-200 rounded-full mb-6 animate-pulse" />
            <div className="flex justify-between">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-3 w-10 bg-gray-200 rounded animate-pulse" />)}
            </div>
        </div>

        {/* Nutrition Chart */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <div className="mb-6">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-end justify-between h-48 px-2 space-x-2 space-x-reverse">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="flex flex-col items-center flex-1 space-y-3">
                        <div className="relative w-full flex items-end justify-center h-40 bg-gray-50 rounded-[14px] overflow-hidden border border-gray-50 animate-pulse">
                            <div className="w-full mx-1 rounded-t-[10px] bg-gray-200" style={{ height: '40%' }}></div>
                        </div>
                        <div className="h-3 w-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const AnalysisPage: React.FC = () => {
    // State
    const [loading, setLoading] = useState(true);
    const [animate, setAnimate] = useState(false);

    // Data
    const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);
    const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
    const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo | null>(null);
    const [weeklyLogs, setWeeklyLogs] = useState<DailyLog[]>([]);

    // UI State
    const [weightRange, setWeightRange] = useState<'3m' | '6m' | '1y'>('3m');
    const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'current' | 'goal' }>({ isOpen: false, mode: 'current' });

    // Helpers
    const getRangeDate = useCallback((range: '3m' | '6m' | '1y') => {
        const d = new Date();
        if (range === '3m') d.setMonth(d.getMonth() - 3);
        else if (range === '6m') d.setMonth(d.getMonth() - 6);
        else if (range === '1y') d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().split('T')[0];
    }, []);

    // Fetch Data
    const fetchData = useCallback(async () => {
        try {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const rangeStart = getRangeDate(weightRange);

            const [latestW, weights, info, logs] = await Promise.all([
                apiService.getLatestWeight(),
                apiService.getWeightRange(rangeStart, todayStr),
                apiService.getAdditionalInfo(),
                apiService.getLogsRange(
                    new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
                    todayStr
                )
            ]);

            setLatestWeight(latestW);
            setWeightHistory(weights);
            setAdditionalInfo(info);
            setWeeklyLogs(logs);
        } catch (error) {
            console.error('Failed to load analysis data:', error);
        } finally {
            setLoading(false);
        }
    }, [weightRange, getRangeDate]);

    // Initial Load & Animation
    useEffect(() => {
        fetchData();
        const timer = setTimeout(() => setAnimate(true), 100);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleSave = async (w: number) => {
        try {
            if (modalState.mode === 'current') {
                const dateStr = new Date().toISOString().split('T')[0];
                await apiService.upsertWeight(dateStr, w);
            } else {
                await apiService.updateAdditionalInfo({ targetWeight: w });
            }
            await fetchData(); // Refresh data
        } catch (error) {
            console.error('Failed to save:', error);
            alert('متاسفانه خطایی رخ داد.');
        }
    };

    const openModal = (mode: 'current' | 'goal') => {
        setModalState({ isOpen: true, mode });
    };

    // --- Calculations ---

    // 1. Weight Stats
    const currentWeight = latestWeight?.weightKg ?? additionalInfo?.weight ?? 0;
    const goalWeight = additionalInfo?.targetWeight ?? 0;

    // Heuristic for start weight: first weight in history or current if no history
    const startWeight = useMemo(() => {
        if (weightHistory.length > 0) return weightHistory[0].weightKg;
        return additionalInfo?.weight ?? currentWeight;
    }, [weightHistory, additionalInfo, currentWeight]);

    const isLosing = goalWeight < startWeight;
    const progressPercent = useMemo(() => {
        if (startWeight === goalWeight) return 100;
        const totalDiff = Math.abs(startWeight - goalWeight);
        const currentDiff = Math.abs(currentWeight - goalWeight);
        const p = ((totalDiff - currentDiff) / totalDiff) * 100;
        return Math.min(100, Math.max(0, p));
    }, [startWeight, goalWeight, currentWeight]);

    // 2. BMI
    const heightM = (additionalInfo?.height ?? 0) / 100;
    const bmi = heightM > 0 ? (currentWeight / (heightM * heightM)) : 0;
    let bmiStatus = 'نامشخص';
    let bmiColor = 'text-gray-500';
    let bmiBg = 'bg-gray-50';
    if (bmi > 0) {
        if (bmi < 18.5) { bmiStatus = 'کم‌وزن'; bmiColor = 'text-blue-500'; bmiBg = 'bg-blue-50'; }
        else if (bmi < 25) { bmiStatus = 'نرمال'; bmiColor = 'text-green-500'; bmiBg = 'bg-green-50'; }
        else if (bmi < 30) { bmiStatus = 'اضافه وزن'; bmiColor = 'text-orange-500'; bmiBg = 'bg-orange-50'; }
        else { bmiStatus = 'چاق'; bmiColor = 'text-red-500'; bmiBg = 'bg-red-50'; }
    }

    // 3. Charts Preparation
    const renderWeightChart = () => {
        if (weightHistory.length < 2) {
            return (
                <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    داده‌های کافی برای نمایش نمودار موجود نیست
                </div>
            );
        }

        const data = weightHistory.map(w => w.weightKg);
        const chartHeight = 120;
        const chartWidth = 300;
        const maxW = Math.max(...data) + 1;
        const minW = Math.min(...data) - 1;

        const getCoords = (idx: number, val: number) => {
            const x = (idx / (data.length - 1)) * chartWidth;
            const y = ((maxW - val) / (maxW - minW)) * chartHeight;
            return { x, y: isNaN(y) ? chartHeight / 2 : y }; // Safety chart
        };

        const points = data.map((val, i) => getCoords(i, val));
        const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
        const areaD = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

        // Labels
        const startDate = new Date(weightHistory[0].date);
        const endDate = new Date(weightHistory[weightHistory.length - 1].date);
        const startLabel = format(startDate, 'd MMMM', { locale: faIR });
        const endLabel = format(endDate, 'd MMMM', { locale: faIR });

        return (
            <div className="relative w-full h-[180px]" dir="ltr">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Grid */}
                    {[0, 1, 2, 3].map(i => (
                        <line key={i} x1="0" y1={(chartHeight / 3) * i} x2={chartWidth} y2={(chartHeight / 3) * i} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />
                    ))}

                    <path d={areaD} fill="url(#chartGradient)" className="transition-all duration-1000 ease-out" style={{ opacity: animate ? 1 : 0 }} />
                    <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        className="drop-shadow-sm transition-all duration-1000 ease-out" strokeDasharray={1000} strokeDashoffset={animate ? 0 : 1000} />

                    {/* Points (only show first and last to avoid clutter if many points) */}
                    {(points.length < 10 ? points : [points[0], points[points.length - 1]]).map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r={4} fill="white" stroke="#3B82F6" strokeWidth={2} />
                    ))}

                    <text x={0} y={chartHeight + 25} textAnchor="start" className="text-[10px] fill-gray-400 font-bold" style={{ fontFamily: 'Vazirmatn' }}>{toPersianDigits(startLabel)}</text>
                    <text x={chartWidth} y={chartHeight + 25} textAnchor="end" className="text-[10px] fill-gray-400 font-bold" style={{ fontFamily: 'Vazirmatn' }}>{toPersianDigits(endLabel)}</text>
                </svg>
            </div>
        );
    };

    const renderNutritionChart = () => {
        // Create last 7 days array
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const log = weeklyLogs.find(l => l.date === dateStr);
            days.push({
                label: format(d, 'EE', { locale: faIR }).charAt(0),
                val: log ? log.caloriesConsumed : 0,
                isToday: i === 0
            });
        }

        const maxCal = Math.max(...days.map(d => d.val), 2000); // at least 2000 scale

        return (
            <div className="flex items-end justify-between h-48 px-2 space-x-2 space-x-reverse">
                {days.map((day, i) => {
                    const heightPct = (day.val / maxCal) * 100;
                    return (
                        <div key={i} className="flex flex-col items-center flex-1 group">
                            <div className="relative w-full flex items-end justify-center h-40 bg-gray-50 rounded-[14px] overflow-hidden border border-gray-50">
                                <div
                                    className={`w-full mx-1 rounded-t-[10px] transition-all duration-1000 ease-out ${day.isToday ? 'bg-gray-900 shadow-lg' : 'bg-gray-300'}`}
                                    style={{ height: animate ? `${heightPct}%` : '0%', transitionDelay: `${400 + (i * 100)}ms` }}
                                ></div>
                            </div>
                            <span className={`text-xs font-bold mt-3 ${day.isToday ? 'text-gray-900' : 'text-gray-400'}`}>{day.label}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return <AnalysisSkeleton />;
    }

    return (
        <>
            <div className="px-5 pt-8 pb-32 space-y-6 overflow-y-auto h-full no-scrollbar">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className={`text-3xl font-black text-gray-900 transition-all duration-500 transform ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                        آمار و تحلیل
                    </h1>
                    <div className={`text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full transition-all duration-700 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                        {toPersianDigits(format(new Date(), 'yyyy/MM/dd', { locale: faIR }))}
                    </div>
                </div>

                {/* Weight Goal Summary */}
                <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 relative overflow-hidden transition-all duration-700 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p
                                className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => openModal('goal')}
                            >
                                هدف وزنی (ویرایش)
                            </p>
                            <h2
                                className="text-4xl font-black text-gray-900 flex items-baseline gap-1 cursor-pointer"
                                onClick={() => openModal('goal')}
                            >
                                {toPersianDigits(goalWeight)}
                                <span className="text-base text-gray-400 font-bold">کیلوگرم</span>
                            </h2>
                        </div>
                        <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold h-fit border border-blue-100">
                            {isLosing ? 'در مسیر کاهش' : 'در مسیر افزایش'}
                        </div>
                    </div>

                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-gray-800">{toPersianDigits(currentWeight)}</p>
                            <p className="text-xs text-gray-400 font-bold">فعلی</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-gray-300">{toPersianDigits(startWeight)}</p>
                            <p className="text-xs text-gray-300 font-bold">شروع</p>
                        </div>
                    </div>

                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-6 relative">
                        <div
                            className="h-full bg-gray-900 rounded-full transition-all duration-1000 delay-300 ease-out relative overflow-hidden"
                            style={{ width: animate ? `${progressPercent}%` : '0%' }}
                        >
                            <div className="absolute inset-0 bg-white/20"></div>
                        </div>
                    </div>

                    <button
                        onClick={() => openModal('current')}
                        className="w-full py-4 bg-gray-900 text-white rounded-[20px] font-bold text-lg shadow-lg active:scale-95 transition-transform hover:bg-gray-800 flex justify-center items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        ثبت وزن جدید
                    </button>
                </div>

                {/* Weight Chart Card */}
                <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all duration-700 delay-100 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">روند تغییرات</h3>
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                            <button
                                onClick={() => setWeightRange('3m')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${weightRange === '3m' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >۳ ماه</button>
                            <button
                                onClick={() => setWeightRange('6m')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${weightRange === '6m' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >۶ ماه</button>
                        </div>
                    </div>
                    {renderWeightChart()}
                </div>

                {/* BMI Card */}
                <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all duration-700 delay-200 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">شاخص BMI</h3>
                        <div className={`w-auto px-3 h-10 rounded-2xl flex items-center justify-center font-bold text-sm border ${bmiBg} ${bmiColor} bg-opacity-50 border-opacity-20`}>
                            {bmiStatus}
                        </div>
                    </div>

                    <div className="text-center mb-8 relative">
                        <div className="absolute top-0 right-0 left-0 flex justify-center opacity-5 select-none">
                            <span className="text-8xl font-black tracking-tighter">BMI</span>
                        </div>
                        <h2 className="text-5xl font-black text-gray-900 tracking-tight relative z-10">
                            {bmi > 0 ? toPersianDigits(bmi.toFixed(1)) : '--'}
                        </h2>
                    </div>

                    {/* BMI Gauge */}
                    <div className="relative h-4 w-full rounded-full mb-6 overflow-hidden bg-gray-100">
                        <div className="absolute inset-0 opacity-80" style={{ background: 'linear-gradient(to right, #3B82F6 0%, #10B981 33%, #F59E0B 66%, #EF4444 100%)' }}></div>
                        {bmi > 0 && (
                            <div
                                className="absolute -top-1.5 bottom-[-6px] w-1.5 bg-gray-900 rounded-full border-2 border-white shadow-md transition-all duration-1000 delay-500 ease-out"
                                style={{ left: animate ? `${Math.min(100, Math.max(0, (bmi - 15) * 5))}%` : '0%' }}
                            ></div>
                        )}
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                        <span>کم‌وزن</span>
                        <span>سالم</span>
                        <span>اضافه</span>
                        <span>چاق</span>
                    </div>
                </div>

                {/* Nutrition Chart */}
                <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all duration-700 delay-300 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">دریافت کالری (۷ روز اخیر)</h3>
                    </div>
                    {renderNutritionChart()}
                </div>
            </div>

            <LogWeightModal
                isOpen={modalState.isOpen}
                mode={modalState.mode}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                onSave={handleSave}
                initialWeight={modalState.mode === 'current' ? currentWeight : goalWeight}
            />
        </>
    );
};

export default AnalysisPage;
