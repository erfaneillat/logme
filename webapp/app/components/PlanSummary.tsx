'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BASE_URL } from '../services/apiService';

interface PlanSummaryProps {
    onComplete: () => void;
}

interface PlanData {
    calories: number;
    carbsGrams: number;
    proteinGrams: number;
    fatsGrams: number;
}

interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    progress: number;
    color: string;
    bgColor: string;
    delay: number;
}

const MetricCard = ({ icon, label, value, progress, color, bgColor, delay }: MetricCardProps) => {
    const circumference = 2 * Math.PI * 32;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, duration: 0.5, ease: "easeOut" }}
            className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bgColor}`}>
                    {icon}
                </div>
                <span className="font-bold text-gray-800 text-sm">{label}</span>
            </div>

            {/* Ring Progress */}
            <div className="flex-1 flex items-center justify-center">
                <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                        {/* Background track */}
                        <circle
                            cx="40"
                            cy="40"
                            r="32"
                            fill="none"
                            stroke="#F3F4F6"
                            strokeWidth="8"
                        />
                        {/* Progress arc */}
                        <motion.circle
                            cx="40"
                            cy="40"
                            r="32"
                            fill="none"
                            stroke={color}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: circumference * (1 - progress) }}
                            transition={{ delay: delay + 0.3, duration: 1, ease: "easeOut" }}
                        />
                    </svg>

                    {/* Center Value */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                            className="text-xl font-black text-gray-900"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: delay + 0.5, duration: 0.3 }}
                        >
                            {value}
                        </motion.span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function PlanSummary({ onComplete }: PlanSummaryProps) {
    const [plan, setPlan] = useState<PlanData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    throw new Error('لطفا دوباره وارد شوید');
                }

                const response = await fetch(`${BASE_URL}/api/plan/latest`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'خطا در دریافت برنامه');
                }

                const data = await response.json();
                const planData = data.data?.plan || data.data || data;

                setPlan({
                    calories: planData.calories || 2000,
                    carbsGrams: planData.carbsGrams || 250,
                    proteinGrams: planData.proteinGrams || 100,
                    fatsGrams: planData.fatsGrams || 65,
                });
            } catch (err: any) {
                setError(err.message);
                // Use default values on error
                setPlan({
                    calories: 2000,
                    carbsGrams: 250,
                    proteinGrams: 100,
                    fatsGrams: 65,
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlan();
    }, []);

    // Calculate ratios for progress rings
    const calculateRatio = (grams: number, multiplier: number, total: number) => {
        return Math.min((grams * multiplier) / total, 1);
    };

    const carbsRatio = plan ? calculateRatio(plan.carbsGrams, 4, plan.calories) : 0;
    const proteinRatio = plan ? calculateRatio(plan.proteinGrams, 4, plan.calories) : 0;
    const fatsRatio = plan ? calculateRatio(plan.fatsGrams, 9, plan.calories) : 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center" dir="rtl">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col" dir="rtl">
            {/* Main Content */}
            <div className="flex-1 px-6 pt-12 pb-32 overflow-y-auto">
                {/* Success Icon */}
                <motion.div
                    className="flex justify-center mb-8"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                >
                    <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center shadow-2xl shadow-gray-900/30">
                        <motion.svg
                            className="w-12 h-12 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </motion.svg>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.div
                    className="text-center mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <h1 className="text-4xl font-black text-gray-900 mb-3">تبریک</h1>
                    <p className="text-lg text-gray-500 font-medium">برنامه سفارشی شما آماده است!</p>
                </motion.div>

                {/* Daily Recommendation Card */}
                <motion.div
                    className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 border border-gray-100"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    {/* Card Header */}
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🍽️</span>
                        <h2 className="text-xl font-black text-gray-900">توصیه روزانه</h2>
                    </div>
                    <p className="text-gray-400 text-sm mb-6 font-medium">هر زمان می‌توانید آن را ویرایش کنید</p>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Calories */}
                        <MetricCard
                            icon={<span className="text-lg">🔥</span>}
                            label="کالری"
                            value={plan?.calories.toString() || '0'}
                            progress={1}
                            color="#1F2937"
                            bgColor="bg-gray-100"
                            delay={0.5}
                        />

                        {/* Carbs */}
                        <MetricCard
                            icon={<span className="text-lg">🌾</span>}
                            label="کربوهیدرات"
                            value={`${plan?.carbsGrams || 0}g`}
                            progress={carbsRatio}
                            color="#F97316"
                            bgColor="bg-orange-50"
                            delay={0.6}
                        />

                        {/* Protein */}
                        <MetricCard
                            icon={<span className="text-lg">⚡</span>}
                            label="پروتئین"
                            value={`${plan?.proteinGrams || 0}g`}
                            progress={proteinRatio}
                            color="#EF4444"
                            bgColor="bg-red-50"
                            delay={0.7}
                        />

                        {/* Fat */}
                        <MetricCard
                            icon={<span className="text-lg">💧</span>}
                            label="چربی"
                            value={`${plan?.fatsGrams || 0}g`}
                            progress={fatsRatio}
                            color="#3B82F6"
                            bgColor="bg-blue-50"
                            delay={0.8}
                        />
                    </div>
                </motion.div>

                {/* Error Message (if any) */}
                {error && (
                    <motion.div
                        className="mt-4 bg-amber-50 text-amber-700 p-4 rounded-2xl text-center text-sm font-medium border border-amber-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        داده‌ها از سرور دریافت نشد. مقادیر پیش‌فرض نمایش داده شده است.
                    </motion.div>
                )}
            </div>

            {/* Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8F9FB] via-[#F8F9FB] to-transparent">
                <motion.button
                    onClick={onComplete}
                    className="w-full max-w-md mx-auto block py-5 bg-gray-900 text-white font-black text-lg rounded-[20px] shadow-xl shadow-gray-900/20 hover:bg-gray-800 active:scale-[0.98] transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <span className="flex items-center justify-center gap-2">
                        ثبت
                        <svg className="w-5 h-5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </span>
                </motion.button>
            </div>
        </div>
    );
}
