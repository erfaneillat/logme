"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format as formatJalali, getDate as getJalaliDate } from 'date-fns-jalali';
import Header from './Header';
import CircularProgress from './CircularProgress';
import NutrientCard from './NutrientCard';
import StreakModal from './StreakModal';
import OfferBanner from './OfferBanner';
import { apiService, DailyLog, DailyLogItem, Plan, UserProfile, Offer, getBaseUrl, fixImageUrl } from '../services/apiService';
import { useTranslation } from '../translations';

// Helper to format date as YYYY-MM-DD (Gregorian for API)
const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get Jalali day of month (for Persian calendar)
const getJalaliDayOfMonth = (date: Date): number => {
    return getJalaliDate(date);
};

// Helper to get Gregorian day of month (for global mode)
const getGregorianDayOfMonth = (date: Date): number => {
    return date.getDate();
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
    setIsExerciseModalOpen: (isOpen: boolean) => void;
    onFoodClick: (food: any) => void;
    refreshTrigger?: number;
    pendingAnalyses?: {
        id: string;
        image?: string;
        type: 'image' | 'text';
        startTime: number;
    }[];
    onSubscriptionClick: () => void;
    offerExpiresAt?: string | null;
    onOfferClick?: () => void;
}

const PendingFoodItem = ({ item, t }: { item: NonNullable<DashboardProps['pendingAnalyses']>[number], t: (key: string) => any }) => (
    <div className="bg-white p-4 rounded-[28px] shadow-sm border border-orange-100 relative overflow-hidden animate-slide-up-item group">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/30 to-transparent animate-shimmer" style={{ animationDuration: '2s' }}></div>
        <div className="flex gap-4 items-center relative z-10">
            <div className="w-24 h-24 rounded-[22px] bg-gray-100 overflow-hidden shrink-0 shadow-inner border border-gray-100 relative">
                {item.image ? (
                    <img src={item.image} alt="Analyzing" className="w-full h-full object-cover opacity-80" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                        {item.type === 'image' ? '📸' : '📝'}
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <div className="w-8 h-8 border-4 border-white border-t-orange-500 rounded-full animate-spin"></div>
                </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                <div className="h-4 w-3/4 bg-gray-50 rounded animate-pulse"></div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-600 animate-pulse">
                        {t('dashboard.aiAnalyzing')}
                    </span>
                    <img
                        src="/app/images/loqme_logo.png"
                        alt="Loqme Logo"
                        className="w-8 h-8 object-contain animate-bounce"
                    />
                </div>
                <div className="flex gap-2 mt-1">
                    <div className="h-6 w-12 bg-gray-50 rounded-lg animate-pulse"></div>
                    <div className="h-6 w-12 bg-gray-50 rounded-lg animate-pulse delay-75"></div>
                    <div className="h-6 w-12 bg-gray-50 rounded-lg animate-pulse delay-150"></div>
                </div>
            </div>
        </div>
    </div>
);

// Icons
const FireIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
);

// Fat Icon - Butter emoji
const FatIcon = () => (
    <span className="text-2xl">🧈</span>
);

// Carbs Icon - Rice/Wheat emoji
const CarbsIcon = () => (
    <span className="text-2xl">🌾</span>
);

// Protein Icon - Meat emoji
const ProteinIcon = () => (
    <span className="text-2xl">🥩</span>
);

// Macro Pill Component
const MacroPill = ({ label, value, color, bg, icon }: { label: string, value: string, color: string, bg: string, icon?: string }) => (
    <div className={`${bg} ${color} px-2.5 py-1 rounded-xl text-[10px] font-bold border border-transparent hover:border-current transition-colors flex items-center gap-1`}>
        {icon && <span className="text-sm">{icon}</span>}
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

const Dashboard: React.FC<DashboardProps> = ({ setIsModalOpen, setIsExerciseModalOpen, onFoodClick, refreshTrigger = 0, pendingAnalyses = [], onSubscriptionClick, offerExpiresAt, onOfferClick }) => {
    const { t, isRTL } = useTranslation();

    // Conditional number formatting based on locale
    const formatNumber = (num: number | string): string => {
        return isRTL ? toPersianNumbers(num) : String(num);
    };

    // Conditional day of month based on locale
    const getDayOfMonth = (date: Date): number => {
        return isRTL ? getJalaliDayOfMonth(date) : getGregorianDayOfMonth(date);
    };
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [dateRange] = useState<Date[]>(() => generateDateRange());
    const [visibleDates, setVisibleDates] = useState<Date[]>([]);

    // API Data State
    const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeOffer, setActiveOffer] = useState<Offer | null>(null);

    // Preferences State
    const [preferences, setPreferences] = useState({ addBurnedCalories: true, rolloverCalories: true });
    const [rolloverCaloriesAmount, setRolloverCaloriesAmount] = useState(0);

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

            // Calculate yesterday's date for rollover
            const yesterday = new Date(selectedDate);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = formatDate(yesterday);

            // Fetch all data in parallel (including preferences and yesterday's log)
            const [logData, planData, profileData, subStatus, offers, prefs, yesterdayLog] = await Promise.all([
                apiService.getDailyLog(dateStr),
                apiService.getLatestPlan(),
                apiService.getUserProfile(),
                apiService.getSubscriptionStatus(),
                apiService.getActiveOffers(),
                apiService.getPreferences(),
                apiService.getDailyLog(yesterdayStr),
            ]);

            setDailyLog(logData);
            setPlan(planData);
            setUserProfile(profileData);
            setIsSubscribed(subStatus?.isActive || false);
            setPreferences(prefs);

            // Calculate rollover calories from yesterday (max 200)
            if (prefs.rolloverCalories && yesterdayLog && planData) {
                const yesterdayGoal = planData.calories || 0;
                const yesterdayConsumed = yesterdayLog.caloriesConsumed || 0;
                const remaining = yesterdayGoal - yesterdayConsumed;
                // Only rollover positive remaining calories, max 200
                const rollover = Math.min(200, Math.max(0, remaining));
                setRolloverCaloriesAmount(rollover);
            } else {
                setRolloverCaloriesAmount(0);
            }

            // Set highest priority offer (first one)
            if (offers && offers.length > 0) {
                setActiveOffer(offers[0]);
            } else {
                setActiveOffer(null);
            }
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

    // Day names - mapped to JavaScript getDay()
    // getDay(): 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    const getDayName = (date: Date) => {
        const persianDayNames = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']; // Persian: ی=Sunday, ش=Saturday
        const englishDayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // English: S=Sunday, S=Saturday
        const dayOfWeek = date.getDay(); // 0-6 (Sunday-Saturday)
        return isRTL ? persianDayNames[dayOfWeek] : englishDayNames[dayOfWeek];
    };

    // Calculate remaining values with preferences applied
    const basePlan = plan || { calories: 2200, proteinGrams: 150, carbsGrams: 250, fatsGrams: 70 };

    // Calculate adjusted calorie goal based on preferences
    let adjustedCalorieGoal = basePlan.calories;
    const burnedCalories = dailyLog?.burnedCalories || 0;

    // Add burned calories to daily goal if preference is enabled
    if (preferences.addBurnedCalories && burnedCalories > 0) {
        adjustedCalorieGoal += burnedCalories;
    }

    // Add rollover calories from yesterday if preference is enabled
    if (preferences.rolloverCalories && rolloverCaloriesAmount > 0) {
        adjustedCalorieGoal += rolloverCaloriesAmount;
    }

    const goals = {
        ...basePlan,
        calories: adjustedCalorieGoal,
        baseCalories: basePlan.calories // Keep original for reference
    };

    const consumed = dailyLog ? {
        calories: dailyLog.caloriesConsumed,
        protein: dailyLog.proteinGrams,
        carbs: dailyLog.carbsGrams,
        fat: dailyLog.fatsGrams,
    } : { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const caloriesRemaining = Math.max(0, adjustedCalorieGoal - consumed.calories);
    const percentConsumed = adjustedCalorieGoal > 0 ? Math.round((consumed.calories / adjustedCalorieGoal) * 100) : 0;

    // Format food items from API
    const foods = dailyLog?.items?.map((item: DailyLogItem) => ({
        id: item._id,
        name: item.title,
        calories: item.calories,
        protein: item.proteinGrams,
        carbs: item.carbsGrams,
        fat: item.fatsGrams,
        timestamp: new Date(item.timeIso),
        imageUrl: fixImageUrl(item.imageUrl),
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
                            {isRefreshing ? t('dashboard.updating') : pullDistance >= 50 ? t('dashboard.releaseToRefresh') : t('dashboard.pullToRefresh')}
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

                {/* Offer Banner - Only shown for Persian users, server filters out used offers */}
                {isRTL && activeOffer && (
                    <OfferBanner
                        offer={activeOffer}
                        userCreatedAt={userProfile?.createdAt}
                        onExpired={() => setActiveOffer(null)}
                        onClick={onSubscriptionClick}
                    />
                )}

                {/* Header Component */}
                <Header
                    streakCount={userProfile?.streakCount || 0}
                    isSubscribed={isSubscribed}
                    isLoading={isLoading}
                    onSubscriptionClick={onSubscriptionClick}
                    onStreakClick={handleStreakClick}
                    offerExpiresAt={offerExpiresAt}
                    onOfferClick={onOfferClick}
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
                                        {formatNumber(getDayOfMonth(date))}
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
                            <div className="text-gray-500 font-semibold text-sm mb-1">{t('dashboard.remaining')}</div>
                            <div className="text-5xl font-black text-gray-800 tracking-tight leading-tight">
                                {formatNumber(caloriesRemaining)}
                            </div>
                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                                <div className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-100">
                                    {formatNumber(percentConsumed)}{isRTL ? '٪' : '%'} {t('dashboard.consumed')}
                                </div>
                                {dailyLog && dailyLog.burnedCalories > 0 ? (
                                    <button
                                        onClick={() => setIsExerciseModalOpen(true)}
                                        className="px-3 py-1 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 text-xs font-bold border border-green-200 flex items-center gap-1.5 hover:from-green-100 hover:to-emerald-100 transition-all active:scale-95"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                        </svg>
                                        <span>{formatNumber(dailyLog.burnedCalories)} {t('dashboard.burned')}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-60" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsExerciseModalOpen(true)}
                                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-green-200 hover:from-green-600 hover:to-emerald-600 transition-all active:scale-95"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        <span>{t('dashboard.exercise')}</span>
                                    </button>
                                )}
                                {/* Rollover calories indicator */}
                                {preferences.rolloverCalories && rolloverCaloriesAmount > 0 && (
                                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 text-xs font-bold border border-blue-200 flex items-center gap-1.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                        </svg>
                                        <span>+{formatNumber(rolloverCaloriesAmount)} {t('dashboard.fromYesterday')}</span>
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
                            label={t('dashboard.nutrients.fat')}
                            value={consumed.fat}
                            total={goals.fatsGrams}
                            unit={t('dashboard.nutrients.unit')}
                            color="#EAB308"
                            icon={<FatIcon />}
                            isRTL={isRTL}
                        />
                        <NutrientCard
                            label={t('dashboard.nutrients.carbs')}
                            value={consumed.carbs}
                            total={goals.carbsGrams}
                            unit={t('dashboard.nutrients.unit')}
                            color="#F59E0B"
                            icon={<CarbsIcon />}
                            isRTL={isRTL}
                        />
                        <NutrientCard
                            label={t('dashboard.nutrients.protein')}
                            value={consumed.protein}
                            total={goals.proteinGrams}
                            unit={t('dashboard.nutrients.unit')}
                            color="#EF4444"
                            icon={<ProteinIcon />}
                            isRTL={isRTL}
                        />
                    </div>
                )}

                {/* Recently Eaten Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h3 className="text-xl font-bold text-gray-800">{t('dashboard.recent')}</h3>
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
                    ) : foods.length === 0 && pendingAnalyses.length === 0 ? (
                        <div className="bg-white rounded-[24px] p-8 text-center border-2 border-dashed border-gray-100 hover:border-orange-100 transition-colors cursor-pointer group" onClick={() => setIsModalOpen(true)}>
                            <div className="w-16 h-16 bg-gray-50 group-hover:bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
                                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300">📸</span>
                            </div>
                            <h4 className="font-bold text-gray-700 mb-1">{t('dashboard.noFood')}</h4>
                            <p className="text-sm text-gray-400 max-w-[200px] mx-auto">
                                {t('dashboard.logFirst')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Pending Analyses */}
                            {pendingAnalyses.map((item) => (
                                <PendingFoodItem key={item.id} item={item} t={t} />
                            ))}

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
                                                <h4 className={`font-black text-gray-800 text-base leading-tight line-clamp-2 ${isRTL ? 'pl-2 text-right ml-2' : 'pr-2 text-left mr-2'} w-full group-hover:text-orange-600 transition-colors`}>
                                                    {food.name}
                                                </h4>
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg shrink-0 tabular-nums">
                                                    {food.timestamp.toLocaleTimeString(isRTL ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-0.5 mt-auto">
                                                <div className={`text-lg font-black text-gray-900 ${isRTL ? 'text-right' : 'text-left'} leading-none mb-1`}>
                                                    {formatNumber(food.calories)} <span className="text-[10px] font-bold text-gray-400">{t('dashboard.calories')}</span>
                                                </div>
                                                <div className={`flex gap-1 ${isRTL ? 'justify-end' : 'justify-start'} flex-nowrap overflow-hidden`}>
                                                    <MacroPill value={formatNumber(food.protein)} label={t('dashboard.nutrients.unit')} color="text-red-600" bg="bg-red-50" icon="🥩" />
                                                    <MacroPill value={formatNumber(food.carbs)} label={t('dashboard.nutrients.unit')} color="text-amber-600" bg="bg-amber-50" icon="🌾" />
                                                    <MacroPill value={formatNumber(food.fat)} label={t('dashboard.nutrients.unit')} color="text-yellow-600" bg="bg-yellow-50" icon="🧈" />
                                                </div>
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

