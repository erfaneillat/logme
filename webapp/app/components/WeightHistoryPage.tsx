"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiService, WeightEntry } from '../services/apiService';
import { useTranslation } from '../translations';

interface WeightHistoryPageProps {
    onClose: () => void;
}

const WeightHistoryPage: React.FC<WeightHistoryPageProps> = ({ onClose }) => {
    const { t, isRTL, locale } = useTranslation();

    // Helper to convert English numbers to Persian/Farsi numerals
    const toPersianNumbers = (num: number | string): string => {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
    };

    // Conditional number formatting based on locale
    const formatNumber = (num: number | string): string => {
        if (typeof num === 'number' && !Number.isInteger(num)) {
            num = num.toFixed(1);
        }
        return isRTL ? toPersianNumbers(num) : String(num);
    };

    const [weights, setWeights] = useState<WeightEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const today = new Date();
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(today.getFullYear() - 2);

            const start = twoYearsAgo.toISOString().split('T')[0];
            const end = today.toISOString().split('T')[0];

            const entries = await apiService.getWeightRange(start, end);
            const sorted = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setWeights(sorted);
        } catch (error) {
            console.error('Failed to fetch weight history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(isRTL ? 'fa-IR' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getRelativeDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) return t('weightHistory.relativeDates.today');
        if (diffDays === 2) return t('weightHistory.relativeDates.yesterday');
        if (diffDays < 7) return t('weightHistory.relativeDates.daysAgo').replace('{{count}}', formatNumber(diffDays));
        if (diffDays < 30) return t('weightHistory.relativeDates.weeksAgo').replace('{{count}}', formatNumber(Math.floor(diffDays / 7)));
        if (diffDays < 365) return t('weightHistory.relativeDates.monthsAgo').replace('{{count}}', formatNumber(Math.floor(diffDays / 30)));
        return t('weightHistory.relativeDates.yearsAgo').replace('{{count}}', formatNumber(Math.floor(diffDays / 365)));
    };

    const latestWeight = weights.length > 0 ? weights[0].weightKg : 0;
    const oldestWeight = weights.length > 0 ? weights[weights.length - 1].weightKg : 0;
    const totalChange = latestWeight - oldestWeight;
    const isGain = totalChange > 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-0 sm:p-4"
            onClick={onClose}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md h-[90vh] sm:h-[80vh] flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-gray-50 bg-white z-10 shrink-0">
                    <div className="w-8"></div>
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mb-3 sm:hidden"></div>
                        <h2 className="text-lg font-black text-gray-800">{t('weightHistory.title')}</h2>
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
                <div className="flex-1 overflow-y-auto p-6 pb-20">
                    {isLoading ? (
                        <div className="flex justify-center pt-20">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : weights.length === 0 ? (
                        <div className="text-center pt-20 text-gray-400">
                            <div className="text-4xl mb-4 opacity-50">⚖️</div>
                            <p className="font-medium">{t('weightHistory.empty')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Card */}
                            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[24px] p-6 text-white shadow-xl shadow-purple-200/50 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                                <div className="flex justify-between items-end relative z-10">
                                    <div className="text-start">
                                        <p className="text-purple-200 text-xs font-bold tracking-wider mb-1">{t('weightHistory.latestRecord')}</p>
                                        <div className="flex items-baseline gap-1">
                                            <h3 className="text-4xl font-black">{formatNumber(latestWeight)}</h3>
                                            <span className="text-sm font-medium opacity-80">{t('weightHistory.kgFull')}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center min-w-[80px]">
                                        {totalChange !== 0 ? (
                                            <>
                                                <span className="text-lg font-black flex items-center gap-1">
                                                    {isGain ? '+' : ''}{formatNumber(Math.abs(totalChange))}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d={isGain ? "M12 7l-5 5h10l-5-5z" : "M12 13l5-5H7l5 5z"} clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                                <span className="text-[10px] opacity-80 font-medium">{t('weightHistory.totalChange')}</span>
                                            </>
                                        ) : (
                                            <span className="text-xs font-bold">{t('weightHistory.noChange')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-4">
                                {weights.map((entry, index) => {
                                    const prev = index < weights.length - 1 ? weights[index + 1] : null;
                                    const change = prev ? entry.weightKg - prev.weightKg : 0;
                                    const isPositive = change > 0;
                                    const isNeutral = Math.abs(change) < 0.1;

                                    return (
                                        <div key={entry._id || index} className="bg-white rounded-[20px] p-4 flex items-center justify-between border border-gray-50 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl shrink-0 ${isNeutral ? 'bg-gray-100 text-gray-500' : (isPositive ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500')}`}>
                                                    ⚖️
                                                </div>
                                                <div className="text-start">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-lg font-black text-gray-800">{formatNumber(entry.weightKg)}</span>
                                                        <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">{t('weightHistory.kg')}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-700">{getRelativeDate(entry.date)}</span>
                                                        <span className="text-[10px] text-gray-400">{formatDate(entry.date)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {!isNeutral && (
                                                <div className={`px-2.5 py-1.5 rounded-[12px] text-xs font-black flex items-center gap-1 ${isPositive ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                                    {isPositive ? '+' : ''}{formatNumber(Math.abs(change))}
                                                </div>
                                            )}
                                            {isNeutral && (
                                                <div className="px-2.5 py-1.5 rounded-[12px] text-[10px] font-bold bg-gray-50 text-gray-400">
                                                    {t('weightHistory.stable')}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default WeightHistoryPage;
