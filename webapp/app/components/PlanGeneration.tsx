'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../services/apiService';
import { useTranslation } from '../translations';

interface PlanGenerationProps {
    onComplete: () => void;
    onError?: (error: string) => void;
}

interface ChecklistItem {
    key: string;
    labelKey: string;
    threshold: number; // Progress percentage when this item completes
}

export default function PlanGeneration({ onComplete, onError }: PlanGenerationProps) {
    const { t, dir } = useTranslation();

    const CHECKLIST_ITEMS: ChecklistItem[] = [
        { key: 'calories', labelKey: 'planGeneration.checklist.calories', threshold: 30 },
        { key: 'carbs', labelKey: 'planGeneration.checklist.carbs', threshold: 55 },
        { key: 'protein', labelKey: 'planGeneration.checklist.protein', threshold: 80 },
        { key: 'fats', labelKey: 'planGeneration.checklist.fats', threshold: 90 },
        { key: 'health_score', labelKey: 'planGeneration.checklist.healthScore', threshold: 100 },
    ];

    const STEP_MESSAGES = [
        { threshold: 10, messageKey: 'planGeneration.calculatingBMR' },
        { threshold: 30, messageKey: 'planGeneration.calculatingTDEE' },
        { threshold: 55, messageKey: 'planGeneration.adjustingMacros' },
        { threshold: 80, messageKey: 'planGeneration.currentMessage' },
        { threshold: 100, messageKey: 'planGeneration.almostReady' },
    ];

    const [progress, setProgress] = useState(0);
    const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
    const [currentMessage, setCurrentMessage] = useState(t('planGeneration.currentMessage'));
    const [isGenerating, setIsGenerating] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const apiCalledRef = useRef(false);
    const errorRef = useRef(false);

    // Generate plan API call
    const generatePlan = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error(t('planGeneration.errors.loginAgain'));
            }

            const response = await fetch(`${BASE_URL}/api/plan/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || t('planGeneration.errors.generic'));
            }

            // Mark generation complete - allow progress to go to 100
            setIsGenerating(false);
        } catch (err: any) {
            console.error(err);
            errorRef.current = true;
            setError(err.message);
            setIsGenerating(false);
            if (onError) onError(err.message);
        }
    };

    // Progress animation timer
    useEffect(() => {
        // Start API call
        if (!apiCalledRef.current) {
            apiCalledRef.current = true;
            generatePlan();
        }

        timerRef.current = setInterval(() => {
            setProgress(prev => {
                if (errorRef.current) return prev;

                // Cap at 92% until API completes
                const maxProgress = isGenerating ? 92 : 100;
                const next = Math.min(prev + 1, maxProgress);

                // Update completed items based on progress
                const newCompleted = new Set<string>();
                CHECKLIST_ITEMS.forEach(item => {
                    if (next >= item.threshold) {
                        newCompleted.add(item.key);
                    }
                });
                setCompletedItems(newCompleted);

                // Update step message
                const stepMessage = STEP_MESSAGES.findLast(s => next >= s.threshold);
                if (stepMessage) {
                    setCurrentMessage(t(stepMessage.messageKey));
                }

                // Complete when reaching 100%
                if (next >= 100) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setTimeout(() => {
                        onComplete();
                    }, 500);
                }

                return next;
            });
        }, 80);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isGenerating, onComplete, t]);

    // Retry handler
    const handleRetry = () => {
        errorRef.current = false;
        setError(null);
        setProgress(0);
        setCompletedItems(new Set());
        setIsGenerating(true);
        apiCalledRef.current = false;
    };

    const circumference = 2 * Math.PI * 80;

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-between px-6 py-12" dir={dir}>

            {/* Top Section */}
            <div className="flex flex-col items-center w-full">
                {/* Circular Progress */}
                <motion.div
                    className="relative mb-10"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    {/* Outer Glow */}
                    <div className="absolute inset-0 w-48 h-48 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 blur-xl opacity-60 -z-10 scale-110" />

                    {/* Main Circle Container */}
                    <div className="w-48 h-48 rounded-full bg-white shadow-2xl shadow-gray-300/30 flex items-center justify-center relative">
                        {/* Progress Ring */}
                        <svg className="absolute w-48 h-48 rotate-90" viewBox="0 0 176 176">
                            {/* Background track */}
                            <circle
                                cx="88"
                                cy="88"
                                r="80"
                                fill="none"
                                stroke="#F3F4F6"
                                strokeWidth="10"
                            />
                            {/* Progress arc */}
                            <motion.circle
                                cx="88"
                                cy="88"
                                r="80"
                                fill="none"
                                stroke="url(#progressGradient)"
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
                                transition={{ duration: 0.1, ease: "linear" }}
                            />
                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#FB923C" />
                                    <stop offset="50%" stopColor="#F97316" />
                                    <stop offset="100%" stopColor="#EA580C" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Center Content */}
                        <div className="z-10 flex items-baseline justify-center">
                            <motion.span
                                className="text-6xl font-black text-gray-900 tabular-nums"
                                key={progress}
                                initial={{ scale: 1.05 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.08 }}
                            >
                                {progress}
                            </motion.span>
                            <span className="text-2xl font-bold text-gray-400 mr-0.5">%</span>
                        </div>
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.div
                    className="text-center mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h1 className="text-3xl font-black text-gray-900 leading-snug mb-3 whitespace-pre-line">
                        {t('planGeneration.title')}
                    </h1>
                </motion.div>

                {/* Step Message */}
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentMessage}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="text-gray-500 text-lg font-medium"
                    >
                        {currentMessage}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Bottom Section - Checklist Card */}
            <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
            >
                <div className="bg-white rounded-[28px] p-7 shadow-xl shadow-gray-200/60 border border-gray-100/80">
                    <h2 className="text-xl font-black text-gray-900 mb-6">
                        {t('planGeneration.recommendationsFor')}
                    </h2>

                    <div className="flex flex-col gap-5">
                        {CHECKLIST_ITEMS.map((item, index) => {
                            const isCompleted = completedItems.has(item.key);
                            return (
                                <motion.div
                                    key={item.key}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + index * 0.08 }}
                                    className="flex items-center gap-4"
                                >
                                    {/* Checkbox */}
                                    <motion.div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isCompleted
                                            ? 'bg-gray-900 shadow-lg shadow-gray-900/20'
                                            : 'bg-gray-50 border-2 border-gray-200'
                                            }`}
                                        animate={{
                                            scale: isCompleted ? [1, 1.15, 1] : 1,
                                        }}
                                        transition={{ duration: 0.35 }}
                                    >
                                        <AnimatePresence>
                                            {isCompleted && (
                                                <motion.svg
                                                    initial={{ scale: 0, rotate: -45 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    exit={{ scale: 0 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                    className="w-4 h-4 text-white"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </motion.svg>)}
                                        </AnimatePresence>
                                    </motion.div>

                                    {/* Label */}
                                    <span className={`text-lg font-bold transition-all duration-300 ${isCompleted ? 'text-gray-900' : 'text-gray-300'
                                        }`}>
                                        • {t(item.labelKey)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Error State */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-6"
                        >
                            <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-center mb-4 font-bold border border-red-100">
                                {error}
                            </div>
                            <button
                                onClick={handleRetry}
                                className="w-full py-5 bg-gray-900 text-white font-black text-lg rounded-2xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-900/20"
                            >
                                {t('planGeneration.retry')}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
