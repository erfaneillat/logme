"use client";

import React, { useState } from 'react';
import Header from './Header';
import { useTranslation } from '../translations';

interface DayItem {
    day: string;
    date: number;
    isToday: boolean;
}

// Generate date strip dynamically
const generateDays = (dayNames: string[]): DayItem[] => {
    const today = new Date();
    const todayDate = today.getDate();

    // Generate 7 days centered around today
    return Array.from({ length: 7 }, (_, i) => {
        const dayOffset = i - 3; // -3 to +3 from today
        const date = todayDate + dayOffset;
        const dayOfWeek = (today.getDay() + dayOffset + 7) % 7;

        // Map Sunday=0 to our jalali index (Sat=0, Sun=1, etc)
        const jalaliIndex = (dayOfWeek + 1) % 7;

        return {
            day: dayNames[jalaliIndex],
            date: date,
            isToday: dayOffset === 0,
        };
    });
};

interface DateHeaderProps {
    streakCount?: number;
    isSubscribed?: boolean;
    onSubscriptionClick?: () => void;
    onStreakClick?: () => void;
}

const DateHeader: React.FC<DateHeaderProps> = ({
    streakCount = 12,
    isSubscribed = false,
    onSubscriptionClick,
    onStreakClick,
}) => {
    const { t, isRTL } = useTranslation();

    // Conditional number formatting based on locale
    const toPersianNumbers = (num: number | string): string => {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
    };

    const formatNumber = (num: number | string): string => {
        return isRTL ? toPersianNumbers(num) : String(num);
    };

    const dayNames = t('dateHeader.days', { returnObjects: true }) as string[];
    const [days] = useState<DayItem[]>(() => generateDays(dayNames));
    const [selectedDate, setSelectedDate] = useState<number>(() => {
        const today = days.find(d => d.isToday);
        return today?.date ?? days[3]?.date ?? 0;
    });

    return (
        <div className="pb-4">
            {/* Header Component */}
            <Header
                streakCount={streakCount}
                isSubscribed={isSubscribed}
                onSubscriptionClick={onSubscriptionClick}
                onStreakClick={onStreakClick}
            />

            {/* Date Strip */}
            <div className="mt-4 px-5">
                <div className="flex justify-between items-center">
                    {days.map((item, index) => {
                        const isSelected = item.date === selectedDate;
                        const isToday = item.isToday;

                        return (
                            <div key={index} className="flex flex-col items-center gap-1.5">
                                {/* Day Circle */}
                                <button
                                    onClick={() => setSelectedDate(item.date)}
                                    className={`
                    relative w-11 h-11 rounded-full
                    flex items-center justify-center
                    transition-all duration-300 ease-out
                    font-bold text-sm
                    ${isSelected
                                            ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/30 scale-110'
                                            : isToday
                                                ? 'bg-white text-gray-800 border-2 border-gray-400 hover:border-gray-600'
                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }
                  `}
                                >
                                    {item.day}
                                </button>

                                {/* Date Number */}
                                <span className={`
                  text-sm font-semibold
                  ${isSelected ? 'text-gray-900' : 'text-gray-500'}
                `}>
                                    {formatNumber(item.date)}
                                </span>

                                {/* Today indicator dot */}
                                {isToday && (
                                    <div className={`
                    w-1.5 h-1.5 rounded-full -mt-0.5
                    ${isSelected
                                            ? 'bg-orange-500'
                                            : 'bg-orange-400'
                                        }
                  `} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DateHeader;
