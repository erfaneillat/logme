"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './Header';
import CircularProgress from './CircularProgress';
import NutrientCard from './NutrientCard';
import StreakModal from './StreakModal';
import { apiService, DailyLog, DailyLogItem, Plan, UserProfile } from '../services/apiService';

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to convert English numbers to Persian/Farsi numerals
const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

// Generate date range centered on today (90 days past to 90 days future like Flutter)
const generateDateRange = (): Date[] => {
    const today = new Date();
    const dates: Date[] = [];
    for (let i = -90; i <= 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
    }
    return dates;
};

interface DashboardProps {
    setIsModalOpen: (isOpen: boolean) => void;
    onFoodClick: (food: any) => void;
    refreshTrigger?: number;
}

// Icons
const FireIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
);

// Fat/Oil Drop Icon
const DropIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor" />
    </svg>
);

// Carbs/Bread Icon
const WheatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
        <ellipse cx="12" cy="8" rx="8" ry="5" />
        <path d="M4 8v6c0 2.76 3.58 5 8 5s8-2.24 8-5V8" />
        <ellipse cx="12" cy="14" rx="8" ry="5" fillOpacity="0.3" />
    </svg>
);

const LightningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
);

// Macro Pill Component
const MacroPill = ({ label, value, color, bg }: { label: string, value: string, color: string, bg: string }) => (
    <div className={`${bg} ${color} px-2.5 py-1 rounded-xl text-[10px] font-bold border border-transparent hover:border-current transition-colors flex items-center gap-1`}>
        <span>{value}</span>
        <span className="opacity-70">{label}</span>
    </div>
);

// Skeleton Loading Components with Shimmer Effect
const ShimmerBox = ({ className }: { className: string }) => (
    <div className={`${className} relative overflow-hidden`}>
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
);

const CaloriesCardSkeleton = () => (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-between mb-6 relative overflow-hidden">
        <div className="flex-1">
            <ShimmerBox className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <ShimmerBox className="h-12 bg-gray-200 rounded w-32 mb-4" />
            <ShimmerBox className="h-6 bg-gray-200 rounded-full w-28" />
        </div>
        <ShimmerBox className="w-[130px] h-[130px] bg-gray-200 rounded-full" />
    </div>
);

const NutrientCardSkeleton = () => (
    <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100/50 h-[180px] flex flex-col">
        <ShimmerBox className="h-6 bg-gray-200 rounded w-12 mb-2" />
        <ShimmerBox className="h-4 bg-gray-200 rounded w-16 mb-4" />
        <div className="flex-1" />
        <ShimmerBox className="w-16 h-16 bg-gray-200 rounded-full self-center" />
    </div>
);

const FoodItemSkeleton = () => (
    <div className="bg-white p-4 rounded-[28px] shadow-sm border border-gray-100/50">
        <div className="flex gap-4">
            <ShimmerBox className="w-24 h-24 bg-gray-200 rounded-[22px]" />
            <div className="flex-1 flex flex-col justify-center">
                <ShimmerBox className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <ShimmerBox className="h-6 bg-gray-200 rounded w-20 mb-2" />
                <div className="flex gap-2">
                    <ShimmerBox className="h-6 bg-gray-200 rounded-full w-14" />
                    <ShimmerBox className="h-6 bg-gray-200 rounded-full w-14" />
                    <ShimmerBox className="h-6 bg-gray-200 rounded-full w-14" />
                </div>
            </div>
        </div>
    </div>
);

const DateStripSkeleton = () => (
    <div className="flex justify-between items-center">
        {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
                <ShimmerBox className="w-11 h-11 bg-gray-200 rounded-full" />
                <ShimmerBox className="w-6 h-3 bg-gray-200 rounded" />
            </div>
        ))}
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ setIsModalOpen, onFoodClick, refreshTrigger = 0 }) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [dateRange] = useState<Date[]>(() => generateDateRange());
    const [visibleDates, setVisibleDates] = useState<Date[]>([]);

    // API Data State
    const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Streak Modal State
    const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
    const [streakCompletions, setStreakCompletions] = useState<string[]>([]);

    // Pull-to-refresh state
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const startY = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate visible dates (7 days centered on TODAY - not selected date)
    // This runs only once on mount to keep dates fixed
    useEffect(() => {
        const today = new Date();
        const todayIndex = dateRange.findIndex(d => formatDate(d) === formatDate(today));
        const start = Math.max(0, todayIndex - 3);
        const end = Math.min(dateRange.length, start + 7);
        setVisibleDates(dateRange.slice(start, end));
    }, [dateRange]); // Only depend on dateRange, not selectedDate

    // Fetch all data
    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const dateStr = formatDate(selectedDate);

            // Fetch all data in parallel
            const [logData, planData, profileData] = await Promise.all([
                apiService.getDailyLog(dateStr),
                apiService.getLatestPlan(),
                apiService.getUserProfile(),
            ]);

            setDailyLog(logData);
            setPlan(planData);
            setUserProfile(profileData);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedDate]);

    // Initial data fetch and on date change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Refresh when triggered by parent
    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchData(false);
        }
    }, [refreshTrigger, fetchData]);

    // Refresh on pull-to-refresh or manual refresh
    const handleRefresh = () => {
        fetchData(false);
    };

    // Jalali day names - mapped to JavaScript getDay()
    // getDay(): 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    // Persian:  ی=Sunday, د=Monday, س=Tuesday, چ=Wednesday, پ=Thursday, ج=Friday, ش=Saturday
    const getDayName = (date: Date) => {
        const dayNames = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']; // Index 0=Sunday, 6=Saturday
        const dayOfWeek = date.getDay(); // 0-6 (Sunday-Saturday)
        return dayNames[dayOfWeek];
    };

    // Calculate remaining values
    const goals = plan || { calories: 2200, proteinGrams: 150, carbsGrams: 250, fatsGrams: 70 };
    const consumed = dailyLog ? {
        calories: dailyLog.caloriesConsumed,
        protein: dailyLog.proteinGrams,
        carbs: dailyLog.carbsGrams,
        fat: dailyLog.fatsGrams,
    } : { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const caloriesRemaining = Math.max(0, goals.calories - consumed.calories);
    const percentConsumed = goals.calories > 0 ? Math.round((consumed.calories / goals.calories) * 100) : 0;

    // Format food items from API
    const foods = dailyLog?.items?.map((item: DailyLogItem) => ({
        id: item._id,
        name: item.title,
        calories: item.calories,
        protein: item.proteinGrams,
        carbs: item.carbsGrams,
        fat: item.fatsGrams,
        timestamp: new Date(item.timeIso),
        imageUrl: item.imageUrl,
        portions: item.portions || 1,
        healthScore: item.healthScore,
        ingredients: item.ingredients,
        liked: item.liked,
        date: formatDate(selectedDate), // YYYY-MM-DD for API
    })) || [];

    const isToday = (date: Date) => formatDate(date) === formatDate(new Date());

    // Handle streak click - fetch completions and show modal
    const handleStreakClick = async () => {
        try {
            const completions = await apiService.getStreakCompletions();
            setStreakCompletions(completions);
        } catch (error) {
            console.error('Failed to fetch streak completions:', error);
        }
        setIsStreakModalOpen(true);
    };

    // Pull-to-refresh handlers
    const PULL_THRESHOLD = 50; // Lower threshold for easier triggering

    const handleTouchStart = (e: React.TouchEvent) => {
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            setIsPulling(true);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isPulling || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0 && containerRef.current?.scrollTop === 0) {
            // Higher sensitivity for easier pull
            const resistance = 0.7;
            setPullDistance(Math.min(diff * resistance, PULL_THRESHOLD * 2));
        }
    };

    const handleTouchEnd = async () => {
        if (!isPulling) return;

        if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
            // Trigger refresh
            await fetchData(false);
        }

        setPullDistance(0);
        setIsPulling(false);
    };

    return (
        <>
            {/* Streak Modal */}
            <StreakModal
                isOpen={isStreakModalOpen}
                onClose={() => setIsStreakModalOpen(false)}
                streakCount={userProfile?.streakCount || 0}
                completedDates={streakCompletions}
            />

            <div
                ref={containerRef}
                className="pb-4 h-full overflow-y-auto"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Pull-to-refresh indicator */}
                <div
                    className="flex justify-center items-center overflow-hidden transition-all duration-300"
                    style={{
                        height: pullDistance > 0 || isRefreshing ? Math.max(pullDistance, isRefreshing ? 70 : 0) : 0,
                        opacity: pullDistance > 0 || isRefreshing ? 1 : 0
                    }}
                >
                    <div className="flex flex-col items-center gap-2">
                        {/* Pizza Animation */}
                        <div
                            className={`text-4xl transition-transform duration-200 ${isRefreshing ? 'animate-pizza-spin' : ''}`}
                            style={{
                                transform: !isRefreshing ? `rotate(${pullDistance * 4}deg) scale(${0.8 + (pullDistance / 200)})` : undefined,
                            }}
                        >
                            🍕
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                            {isRefreshing ? 'در حال بروزرسانی...' : pullDistance >= 50 ? 'رها کنید' : 'بکشید برای بروزرسانی'}
                        </span>
                    </div>
                </div>

                {/* Animation keyframes */}
                <style>{`
                    @keyframes pizza-spin {
                        0% { transform: rotate(0deg) scale(1); }
                        25% { transform: rotate(90deg) scale(1.1); }
                        50% { transform: rotate(180deg) scale(1); }
                        75% { transform: rotate(270deg) scale(1.1); }
                        100% { transform: rotate(360deg) scale(1); }
                    }
                    .animate-pizza-spin {
                        animation: pizza-spin 1s ease-in-out infinite;
                    }
                    @keyframes shimmer {
                        100% { transform: translateX(100%); }
                    }
                    .animate-shimmer {
                        animation: shimmer 1.5s infinite;
                    }
                `}</style>

                {/* Header Component */}
                <Header
                    streakCount={userProfile?.streakCount || 0}
                    isSubscribed={false}
                    onSubscriptionClick={() => { }}
                    onStreakClick={handleStreakClick}
                />

                {/* Date Strip */}
                <div className="mt-4 px-5">
                    <div className="flex justify-between items-center">
                        {visibleDates.map((date, index) => {
                            const isSelected = formatDate(date) === formatDate(selectedDate);
                            const isTodayDate = isToday(date);

                            return (
                                <div key={index} className="flex flex-col items-center gap-1.5">
                                    <button
                                        onClick={() => setSelectedDate(date)}
                                        className={`
                                            relative w-11 h-11 rounded-full
                                            flex items-center justify-center
                                            transition-all duration-300 ease-out
                                            font-bold text-sm
                                            ${isSelected
                                                ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/30 scale-110'
                                                : isTodayDate
                                                    ? 'bg-white text-gray-800 border-2 border-gray-400 hover:border-gray-600'
                                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {getDayName(date)}
                                    </button>
                                    <span className={`text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {toPersianNumbers(date.getDate())}
                                    </span>
                                    {isTodayDate && (
                                        <div className={`w-1.5 h-1.5 rounded-full -mt-0.5 ${isSelected ? 'bg-orange-500' : 'bg-orange-400'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <main className="flex-1 px-5 overflow-y-auto no-scrollbar pb-32 animate-fade-in">
                {/* Refresh indicator */}
                {isRefreshing && (
                    <div className="flex justify-center py-2">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Main Calorie Card */}
                {isLoading ? (
                    <CaloriesCardSkeleton />
                ) : (
                    <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-between mb-6 relative overflow-hidden">
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-60"></div>
                        <div className="flex-1 relative z-10">
                            <div className="text-gray-500 font-semibold text-sm mb-1">کالری باقیمانده</div>
                            <div className="text-5xl font-black text-gray-800 tracking-tight leading-tight">
                                {toPersianNumbers(caloriesRemaining)}
                            </div>
                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                                <div className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-100">
                                    {toPersianNumbers(percentConsumed)}٪ مصرف شده
                                </div>
                                {dailyLog && dailyLog.burnedCalories > 0 && (
                                    <div className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                        </svg>
                                        {toPersianNumbers(dailyLog.burnedCalories)} سوزانده شده
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-shrink-0 mr-4 relative z-10">
                            <CircularProgress
                                value={consumed.calories}
                                max={goals.calories}
                                size={130}
                                strokeWidth={12}
                                color="#F97316"
                                icon={<FireIcon />}
                                reverse={true}
                            />
                        </div>
                    </div>
                )}

                {/* Nutrient Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <NutrientCardSkeleton />
                        <NutrientCardSkeleton />
                        <NutrientCardSkeleton />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <NutrientCard
                            label="چربی"
                            value={consumed.fat}
                            total={goals.fatsGrams}
                            unit="گرم"
                            color="#A855F7"
                            icon={<DropIcon />}
                        />
                        <NutrientCard
                            label="کربو"
                            value={consumed.carbs}
                            total={goals.carbsGrams}
                            unit="گرم"
                            color="#EAB308"
                            icon={<WheatIcon />}
                        />
                        <NutrientCard
                            label="پروتئین"
                            value={consumed.protein}
                            total={goals.proteinGrams}
                            unit="گرم"
                            color="#3B82F6"
                            icon={<LightningIcon />}
                        />
                    </div>
                )}

                {/* Recently Eaten Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h3 className="text-xl font-bold text-gray-800">اخیرأ خورده شده‌ها</h3>
                        <button
                            onClick={handleRefresh}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            disabled={isRefreshing}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            <FoodItemSkeleton />
                            <FoodItemSkeleton />
                        </div>
                    ) : foods.length === 0 ? (
                        <div className="bg-white rounded-[24px] p-8 text-center border-2 border-dashed border-gray-100 hover:border-orange-100 transition-colors cursor-pointer group" onClick={() => setIsModalOpen(true)}>
                            <div className="w-16 h-16 bg-gray-50 group-hover:bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
                                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300">📸</span>
                            </div>
                            <h4 className="font-bold text-gray-700 mb-1">هنوز غذایی ثبت نشده</h4>
                            <p className="text-sm text-gray-400 max-w-[200px] mx-auto">
                                اولین وعده غذایی خود را ثبت کنید
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {foods.map((food, index) => (
                                <div
                                    key={food.id}
                                    onClick={() => onFoodClick(food)}
                                    className="bg-white p-4 rounded-[28px] shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group animate-slide-up-item cursor-pointer"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex gap-4 items-start">
                                        <div className="w-24 h-24 rounded-[22px] bg-gray-50 overflow-hidden shrink-0 shadow-inner border border-gray-100 relative group-hover:scale-105 transition-transform duration-500">
                                            {food.imageUrl ? (
                                                <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl">🍲</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-0.5">
                                            <div className="flex justify-between items-start w-full">
                                                <h4 className="font-black text-gray-800 text-base leading-tight line-clamp-2 pl-2 text-right w-full ml-2 group-hover:text-orange-600 transition-colors">
                                                    {food.name}
                                                </h4>
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg shrink-0 tabular-nums">
                                                    {food.timestamp.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="text-xl font-black text-gray-900 mt-auto mb-2 text-right">
                                                {toPersianNumbers(food.calories)} <span className="text-xs font-bold text-gray-400">کالری</span>
                                            </div>
                                            <div className="flex gap-1.5 justify-end flex-wrap">
                                                <MacroPill value={toPersianNumbers(food.protein)} label="گرم" color="text-blue-600" bg="bg-blue-50" />
                                                <MacroPill value={toPersianNumbers(food.carbs)} label="گرم" color="text-yellow-600" bg="bg-yellow-50" />
                                                <MacroPill value={toPersianNumbers(food.fat)} label="گرم" color="text-purple-600" bg="bg-purple-50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s ease-out;
                }
                @keyframes slide-up-item {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up-item {
                    animation: slide-up-item 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                    opacity: 0;
                }
            `}</style>
        </>
    );
};

export default Dashboard;

