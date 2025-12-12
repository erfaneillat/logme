"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    streakCount: number;
    completedDates?: string[]; // YYYY-MM-DD dates
}

// Fire/Flame SVG Icon  
const FireIcon = ({ className = "h-16 w-16" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
);

// Helper to convert English numbers to Persian/Farsi numerals
const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

const StreakModal: React.FC<StreakModalProps> = ({
    isOpen,
    onClose,
    streakCount,
    completedDates = [],
}) => {
    // Generate last 7 days
    const [last7Days, setLast7Days] = useState<{
        date: Date;
        dayLetter: string;
        isCompleted: boolean;
        isToday: boolean;
    }[]>([]);

    useEffect(() => {
        const now = new Date();

        const days = [];
        const completedSet = new Set(completedDates);

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);

            // Format date as YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            // Get day of week (0 = Sunday)
            const dayOfWeek = date.getDay();
            // Map to Persian days: Sunday=ی, Monday=د, Tuesday=س, Wednesday=چ, Thursday=پ, Friday=ج, Saturday=ش
            const dayNames = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']; // Index 0=Sunday, 6=Saturday

            days.push({
                date,
                dayLetter: dayNames[dayOfWeek],
                isCompleted: completedSet.has(dateStr),
                isToday: i === 0,
            });
        }

        setLast7Days(days);
    }, [completedDates]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl p-6 w-[90%] max-w-sm pointer-events-auto mx-4">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/loqme_logo.png"
                                        alt="لقمه"
                                        className="w-8 h-8 object-contain"
                                    />
                                    <span className="text-base font-bold text-gray-800">لقمه</span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                    <FireIcon className="h-4 w-4 text-orange-500" />
                                    <span className="text-sm font-bold text-gray-700">{toPersianNumbers(streakCount)}</span>
                                </div>
                            </div>

                            {/* Fire Icon */}
                            <div className="flex justify-center mb-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 10, delay: 0.2 }}
                                    className="relative"
                                >
                                    <FireIcon className="h-20 w-20 text-orange-500" />
                                    {/* Glow effect */}
                                    <div className="absolute inset-0 bg-orange-400/30 blur-xl rounded-full -z-10" />
                                </motion.div>
                            </div>

                            {/* Title */}
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl font-black text-orange-500 text-center mb-2"
                            >
                                رکورد شما
                            </motion.h2>

                            {/* Streak Count */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="text-lg font-semibold text-gray-700 text-center mb-6"
                            >
                                {toPersianNumbers(streakCount)} روز متوالی
                            </motion.p>

                            {/* Week Days */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex justify-between items-center mb-6 px-2"
                            >
                                {last7Days.map((day, index) => (
                                    <div key={index} className="flex flex-col items-center gap-2">
                                        <span className="text-xs font-medium text-gray-500">
                                            {day.dayLetter}
                                        </span>
                                        <div
                                            className={`
                                                w-4 h-4 rounded-full transition-all duration-300
                                                ${day.isCompleted
                                                    ? 'bg-orange-500 shadow-sm shadow-orange-300'
                                                    : day.isToday
                                                        ? 'bg-orange-200 ring-2 ring-orange-400'
                                                        : 'bg-gray-200'
                                                }
                                            `}
                                        />
                                    </div>
                                ))}
                            </motion.div>

                            {/* Message */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                                className="text-sm text-gray-600 text-center mb-6 leading-relaxed"
                            >
                                هر روز که وعده غذایی خود را ثبت کنید،
                                <br />
                                رکورد شما افزایش می‌یابد!
                            </motion.p>

                            {/* Continue Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                onClick={onClose}
                                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-base
                                    hover:bg-gray-800 active:scale-[0.98] transition-all duration-200
                                    shadow-lg shadow-gray-900/20"
                            >
                                ادامه
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default StreakModal;
