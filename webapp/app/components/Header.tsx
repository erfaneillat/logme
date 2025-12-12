"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeaderProps {
    streakCount?: number;
    isSubscribed?: boolean;
    onSubscriptionClick?: () => void;
    onStreakClick?: () => void;
}

// Crown SVG Icon
const CrownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
);

// Fire/Flame SVG Icon  
const FireIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
);

// Helper to convert English numbers to Persian/Farsi numerals
const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

const Header: React.FC<HeaderProps> = ({
    streakCount = 0,
    isSubscribed = false,
    onSubscriptionClick,
    onStreakClick
}) => {
    // Animation state for crown
    const [crownAnimating, setCrownAnimating] = useState(false);

    useEffect(() => {
        if (!isSubscribed) {
            const interval = setInterval(() => {
                setCrownAnimating(true);
                setTimeout(() => setCrownAnimating(false), 600);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isSubscribed]);

    return (
        <header className="relative z-20 px-4 pt-4 pb-2">
            {/* Glassmorphism blur effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm pointer-events-none" />

            <div className="relative flex items-center justify-between">
                {/* Right side - Logo and App Name */}
                <div className="flex items-center gap-1">
                    <div className="relative w-10 h-10">
                        <Image
                            src="/loqme_logo.png"
                            alt="لقمه"
                            fill
                            className="object-contain drop-shadow-sm"
                        />
                        {/* Subtle glow effect behind logo */}
                        <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-md -z-10" />
                    </div>
                    <h1 className="text-xl font-black text-gray-800 tracking-tight">
                        لقمه
                    </h1>
                </div>

                {/* Left side - Crown and Streak */}
                <div className="flex items-center gap-3">
                    {/* Crown Icon for non-subscribed users */}
                    {!isSubscribed && (
                        <button
                            onClick={onSubscriptionClick}
                            className={`
                relative group p-2.5 rounded-2xl
                bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400
                shadow-[0_4px_20px_-4px_rgba(245,158,11,0.5)]
                hover:shadow-[0_6px_24px_-4px_rgba(245,158,11,0.6)]
                hover:scale-105 active:scale-95
                transition-all duration-300 ease-out
                ${crownAnimating ? 'animate-crown-pulse' : ''}
              `}
                        >
                            {/* Shine effect */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Icon */}
                            <div className="relative text-white drop-shadow-sm">
                                <CrownIcon />
                            </div>

                            {/* Glow ring on hover */}
                            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300 -z-10" />

                            {/* Animated particles */}
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-75" />
                        </button>
                    )}

                    {/* Streak Counter */}
                    <button
                        onClick={onStreakClick}
                        className="
              relative group flex items-center gap-2 
              px-4 py-2 rounded-2xl
              bg-white/80 backdrop-blur-md
              border border-gray-100/50
              shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]
              hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.12)]
              hover:bg-white hover:scale-102
              active:scale-98
              transition-all duration-300 ease-out
            "
                    >
                        {/* Fire icon with glow */}
                        <div className="relative">
                            <FireIcon className="h-5 w-5 text-orange-500 group-hover:text-orange-600 transition-colors duration-200" />
                            <div className="absolute inset-0 bg-orange-400/30 blur-md rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        {/* Streak Count */}
                        <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                            {toPersianNumbers(streakCount)} روز
                        </span>
                    </button>
                </div>
            </div>

            {/* Custom styles for animations */}
            <style>{`
        @keyframes crown-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          50% { transform: scale(1.15) rotate(0deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }
        .animate-crown-pulse {
          animation: crown-pulse 0.6s ease-in-out;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        .active\\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
        </header>
    );
};

export default Header;
