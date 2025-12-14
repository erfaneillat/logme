"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Offer } from '../services/apiService';

// Helper to convert English numbers to Persian/Farsi numerals
const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

interface OfferBannerProps {
    offer: Offer;
    userCreatedAt?: string;
    onExpired: () => void;
    onClick: () => void;
}

// Countdown Timer Box Component
const TimerBox = ({ value, bgColor }: { value: string; bgColor: string }) => (
    <div
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105"
        style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: bgColor,
        }}
    >
        {value}
    </div>
);

// Countdown Timer Component
const CountdownTimer = ({
    endDate,
    textColor,
    bgColor,
    onExpired,
}: {
    endDate: Date;
    textColor: string;
    bgColor: string;
    onExpired: () => void;
}) => {
    const [timeRemaining, setTimeRemaining] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });
    const [hasExpired, setHasExpired] = useState(false);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const diff = endDate.getTime() - now.getTime();

            if (diff <= 0) {
                setHasExpired(true);
                onExpired();
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining({ days, hours, minutes, seconds });
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, [endDate, onExpired]);

    if (hasExpired) return null;

    const pad = (n: number) => toPersianNumbers(String(n).padLeft(2, '0'));

    return (
        <div className="flex items-center gap-1.5 sm:gap-2" dir="ltr">
            {timeRemaining.days > 0 && (
                <>
                    <TimerBox value={pad(timeRemaining.days)} bgColor={bgColor} />
                    <span style={{ color: textColor }} className="font-bold text-xs opacity-80">:</span>
                </>
            )}
            <TimerBox value={pad(timeRemaining.hours)} bgColor={bgColor} />
            <span style={{ color: textColor }} className="font-bold text-xs opacity-80">:</span>
            <TimerBox value={pad(timeRemaining.minutes)} bgColor={bgColor} />
            <span style={{ color: textColor }} className="font-bold text-xs opacity-80">:</span>
            <TimerBox value={pad(timeRemaining.seconds)} bgColor={bgColor} />
        </div>
    );
};

// Add padLeft extension for string
declare global {
    interface String {
        padLeft(length: number, char: string): string;
    }
}

// eslint-disable-next-line no-extend-native
String.prototype.padLeft = function (length: number, char: string): string {
    return char.repeat(Math.max(0, length - this.length)) + this;
};

// Helper to parse hex color
const parseHexColor = (hex: string): string => {
    if (hex.startsWith('#')) return hex;
    return `#${hex}`;
};

// Helper to darken a color
const darkenColor = (hex: string, percent: number = 15): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
};

// Helper to get effective end date considering user conditions
const getEffectiveEndDate = (offer: Offer, userCreatedAt?: string): Date | null => {
    // For time-limited offers with explicit end date
    if (offer.isTimeLimited && offer.endDate) {
        return new Date(offer.endDate);
    }

    // For new user offers with userRegisteredWithinDays condition
    if (
        offer.targetUserType === 'new' &&
        offer.conditions?.userRegisteredWithinDays &&
        userCreatedAt
    ) {
        const userDate = new Date(userCreatedAt);
        userDate.setDate(userDate.getDate() + offer.conditions.userRegisteredWithinDays);
        return userDate;
    }

    return null;
};

const OfferBanner: React.FC<OfferBannerProps> = ({
    offer,
    userCreatedAt,
    onExpired,
    onClick,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    const bgColor = parseHexColor(offer.display.backgroundColor);
    const textColor = parseHexColor(offer.display.textColor);
    const effectiveEndDate = getEffectiveEndDate(offer, userCreatedAt);

    // Check if expired
    useEffect(() => {
        if (effectiveEndDate && new Date() > effectiveEndDate) {
            setIsVisible(false);
            onExpired();
        }
    }, [effectiveEndDate, onExpired]);

    // Entrance animation
    useEffect(() => {
        setIsAnimating(true);
    }, []);

    const handleExpired = useCallback(() => {
        setIsVisible(false);
        onExpired();
    }, [onExpired]);

    if (!isVisible || !offer.isActive) return null;

    return (
        <div
            className={`relative mb-2 cursor-pointer overflow-hidden transition-all duration-500 ease-out ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}
            onClick={onClick}
        >
            {/* Gradient Background */}
            <div
                className="relative px-4 py-3 sm:py-4"
                style={{
                    background: `linear-gradient(135deg, ${bgColor} 0%, ${darkenColor(bgColor)} 100%)`,
                }}
            >
                {/* Animated shine effect */}
                <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ opacity: 0.15 }}
                >
                    <div
                        className="absolute inset-0 animate-shine"
                        style={{
                            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)`,
                            transform: 'translateX(-100%)',
                        }}
                    />
                </div>

                {/* Sparkle particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1 left-4 w-1 h-1 bg-white/40 rounded-full animate-pulse" />
                    <div className="absolute top-3 left-16 w-1.5 h-1.5 bg-white/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute bottom-2 left-1/4 w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute top-2 right-1/3 w-1 h-1 bg-white/30 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
                </div>

                <div className="relative flex items-center justify-between gap-3">
                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                        <h3
                            className="font-extrabold text-sm sm:text-base leading-tight truncate"
                            style={{ color: textColor }}
                        >
                            {offer.display.bannerText}
                        </h3>
                        {offer.display.bannerSubtext && (
                            <p
                                className="text-xs sm:text-sm mt-0.5 truncate opacity-90"
                                style={{ color: textColor }}
                            >
                                {offer.display.bannerSubtext}
                            </p>
                        )}
                    </div>

                    {/* Countdown Timer */}
                    {effectiveEndDate && (
                        <div className="flex-shrink-0">
                            <CountdownTimer
                                endDate={effectiveEndDate}
                                textColor={textColor}
                                bgColor={bgColor}
                                onExpired={handleExpired}
                            />
                        </div>
                    )}

                    {/* Arrow Icon */}
                    <div
                        className="flex-shrink-0 transition-transform duration-300 hover:translate-x-1"
                        style={{ color: textColor }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 opacity-80"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Animation Styles */}
            <style>{`
                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .animate-shine {
                    animation: shine 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default OfferBanner;
