"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, SubscriptionPlan, SubscriptionStatus, BASE_URL, Offer } from '../services/apiService';

// --- Helpers ---

// Helper to convert English numbers to Persian/Farsi numerals
const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

// Helper to parse hex color
const parseHexColor = (hex: string): string => {
    if (!hex) return '#E53935';
    if (hex.startsWith('#')) return hex;
    return `#${hex}`;
};

// Helper to darken a color
const darkenColor = (hex: string, percent: number = 15): string => {
    if (!hex) return '#C62828';
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).padLeft(6, '0')}`;
};

// Calculate discounted price
const calculateDiscountedPrice = (price: number, offer: Offer): number => {
    if (offer.offerType === 'percentage' && offer.discountPercentage) {
        return Math.floor(price * (1 - offer.discountPercentage / 100));
    }
    if (offer.offerType === 'fixed_amount' && offer.discountAmount) {
        return Math.max(0, price - offer.discountAmount);
    }
    // fixed_price logic if needed, treating discountAmount as the fixed price
    if (offer.offerType === 'fixed_price' && offer.discountAmount) {
        return offer.discountAmount;
    }
    return price;
}

// Add padLeft extension for string if not exists (polyfill)
// We use a local helper stringPadLeft instead of extending prototype to avoid conflicts
const stringPadLeft = (str: string, length: number, char: string): string => {
    return char.repeat(Math.max(0, length - str.length)) + str;
};

// --- Components ---

// Timer Box Component
const TimerBox = ({ value, bgColor, textColor }: { value: string; bgColor: string, textColor: string }) => (
    <div
        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm backdrop-blur-sm transition-all duration-300"
        style={{
            backgroundColor: 'white',
            color: bgColor, // Text color matches banner background (inverted)
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

    const pad = (n: number) => toPersianNumbers(stringPadLeft(String(n), 2, '0'));

    return (
        <div className="flex items-center gap-1.5" dir="ltr">
            {timeRemaining.days > 0 && (
                <>
                    <TimerBox value={pad(timeRemaining.days)} bgColor={bgColor} textColor={textColor} />
                    <span style={{ color: textColor }} className="font-bold text-xs opacity-80">:</span>
                </>
            )}
            <TimerBox value={pad(timeRemaining.hours)} bgColor={bgColor} textColor={textColor} />
            <span style={{ color: textColor }} className="font-bold text-xs opacity-80">:</span>
            <TimerBox value={pad(timeRemaining.minutes)} bgColor={bgColor} textColor={textColor} />
            <span style={{ color: textColor }} className="font-bold text-xs opacity-80">:</span>
            <TimerBox value={pad(timeRemaining.seconds)} bgColor={bgColor} textColor={textColor} />
        </div>
    );
};

const TestimonialCard = ({ testimonial }: { testimonial: { name: string; text: string; image: string; rating: number } }) => (
    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 h-full flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-50 to-transparent rounded-bl-[100px] -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

        <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden flex-shrink-0">
                <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + testimonial.name + '&background=random' }}
                />
            </div>
            <div>
                <h4 className="font-bold text-gray-800 text-sm">{testimonial.name}</h4>
                <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
            </div>
        </div>
        <p className="text-gray-600 text-xs leading-relaxed relative z-10 font-medium">{testimonial.text}</p>
    </div>
);

const PlanCard = ({
    plan,
    isSelected,
    onSelect,
    discountedPrice,
    discountPercentage,
    offerColor,
    bestValue = false
}: {
    plan: SubscriptionPlan;
    isSelected: boolean;
    onSelect: () => void;
    discountedPrice?: number;
    discountPercentage?: number;
    offerColor?: string;
    bestValue?: boolean;
}) => {
    // Format price to Persian digits and currency
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const getDurationTitle = (duration: string) => {
        switch (duration) {
            case 'monthly': return 'یک ماهه';
            case '3month': return 'سه ماهه';
            case 'yearly': return 'یک ساله';
            default: return duration;
        }
    };

    const finalPrice = discountedPrice ?? plan.price;
    const hasDiscount = discountedPrice !== undefined && discountedPrice < plan.price;
    const effectiveDiscountPercentage = discountPercentage ?? plan.discountPercentage;
    const effectiveOriginalPrice = hasDiscount ? plan.price : plan.originalPrice;

    // Use offer color if selected, otherwise purple
    const activeBorderColor = offerColor || '#8B5CF6';
    // Tailwind classes don't support dynamic colors easily without style prop or safelist
    // We'll use style props for colors

    return (
        <motion.div
            layout
            onClick={onSelect}
            className={`cursor-pointer rounded-[24px] p-1 relative overflow-hidden transition-all duration-300 ${isSelected ? 'shadow-lg scale-[1.02]' : 'hover:scale-[1.01]'}`}
            style={{
                boxShadow: isSelected ? `0 10px 25px -5px ${activeBorderColor}40` : '',
            }}
        >
            {/* Border Gradient for Selected State */}
            <div
                className={`absolute inset-0 rounded-[24px] transition-colors duration-300`}
                style={{
                    backgroundColor: isSelected ? activeBorderColor : '#f3f4f6',
                    background: isSelected ? `linear-gradient(135deg, ${activeBorderColor}, ${darkenColor(activeBorderColor)})` : undefined
                }}
            ></div>

            <div className="bg-white rounded-[22px] p-5 relative h-full flex flex-col justify-between">
                {bestValue && !hasDiscount && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-[16px] shadow-sm z-10">
                        پیشنهاد ویژه
                    </div>
                )}

                <div className="flex flex-row items-start justify-between w-full mb-3">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h3
                                className={`font-black text-lg transition-colors duration-300`}
                                style={{ color: isSelected ? activeBorderColor : '#1f2937' }}
                            >
                                {plan.title || getDurationTitle(plan.duration)}
                            </h3>
                            {effectiveDiscountPercentage && (
                                <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{
                                        backgroundColor: offerColor ? `${offerColor}15` : '#FEF2F2',
                                        color: offerColor || '#EF4444'
                                    }}
                                >
                                    {new Intl.NumberFormat('fa-IR').format(effectiveDiscountPercentage)}٪ تخفیف
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold text-lg text-gray-700">
                                {formatPrice(finalPrice)} <span className="text-[10px] text-gray-400 font-medium">تومان</span>
                            </span>
                            {effectiveOriginalPrice && (
                                <span className="text-xs text-gray-400 line-through decoration-red-400">
                                    {formatPrice(effectiveOriginalPrice)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end pl-1 pt-1">
                        <span className="text-[10px] text-gray-400 font-medium mb-0.5">ماهانه</span>
                        <div className="flex items-center gap-1">
                            {/* Calculate monthly breakdown */}
                            <span
                                className={`font-black text-2xl tracking-tight`}
                                style={{ color: isSelected ? activeBorderColor : '#1f2937' }}
                            >
                                {(() => {
                                    let perMonth = 0;
                                    if (plan.duration === 'monthly') perMonth = finalPrice;
                                    else if (plan.duration === '3month') perMonth = finalPrice / 3;
                                    else if (plan.duration === 'yearly') perMonth = finalPrice / 12;

                                    return formatPrice(Math.round(perMonth));
                                })()}
                            </span>
                        </div>
                        <span className="text-[10px] text-gray-400">تومان</span>
                    </div>
                </div>

                <div className="w-full border-t border-dashed border-gray-100 pt-3 flex items-center justify-between">
                    <span
                        className={`text-xs font-medium transition-colors duration-300`}
                        style={{ color: isSelected ? activeBorderColor : '#9ca3af' }}
                    >
                        {isSelected ? 'طرح انتخاب شده' : 'انتخاب کنید'}
                    </span>
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300`}
                        style={{
                            backgroundColor: isSelected ? `${activeBorderColor}20` : '#f3f4f6',
                            color: isSelected ? activeBorderColor : '#d1d5db'
                        }}
                    >
                        {isSelected ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <div className="w-3 h-3 rounded-full border-2 border-current"></div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- Main Page Component ---

const SubscriptionPage = ({ onBack }: { onBack: () => void }) => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [activeOffer, setActiveOffer] = useState<Offer | null>(null);
    const [userCreatedAt, setUserCreatedAt] = useState<string | undefined>(undefined);

    // Testimonials Data
    const testimonials = [
        {
            name: 'مونا',
            text: 'فقط با عکس گرفتن از غذاهام، ۱۵ کیلو کم کردم! یکی از بهترین اتفاقات زندگیم. مررررسی لقمه.',
            image: '/app/images/comments/mona.jpg',
            rating: 5
        },
        {
            name: 'نیلوفر',
            text: 'همیشه یادم می‌رفت غذاهام رو وارد کنم و رژیمم نصفه می‌موند. ولی با لقمه همه‌چی خودکار انجام می‌شه.',
            image: '/app/images/comments/niloofar.jpg',
            rating: 5
        },
        {
            name: 'پدرام',
            text: 'بهترین بخش لقمه برای من نمودار پیشرفته‌ست. می‌فهمم دقیقاً توی هفته چند درصد به هدف وزنیم نزدیک‌تر شدم.',
            image: '/app/images/comments/pedram.jpg',
            rating: 5
        },
        {
            name: 'رامین',
            text: 'احساس می‌کنم یه مربی کوچیک توی جیبمه! هر بار یه غذای جدید می‌خورم، لقمه آنالیزش می‌کنه.',
            image: '/app/images/comments/ramin.jpg',
            rating: 5
        }
    ];

    const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [plansData, statusData, offersData, userProfile] = await Promise.all([
                    apiService.getSubscriptionPlans(),
                    apiService.getSubscriptionStatus(),
                    apiService.getActiveOffers(),
                    apiService.getUserProfile()
                ]);

                setUserCreatedAt(userProfile.createdAt);

                const sortedPlans = plansData.sort((a, b) => a.sortOrder - b.sortOrder);
                setPlans(sortedPlans);
                setStatus(statusData);

                // Set Highest Priority Offer
                if (offersData && offersData.length > 0) {
                    setActiveOffer(offersData[0]);
                }

                // Select Yearly by default or the first one if not available
                const yearly = sortedPlans.find(p => p.duration === 'yearly');
                if (yearly) setSelectedPlanId(yearly._id);
                else if (sortedPlans.length > 0) setSelectedPlanId(sortedPlans[0]._id);

            } catch (error) {
                console.error("Failed to load subscription data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        const interval = setInterval(() => {
            setCurrentTestimonialIndex(prev => (prev + 1) % testimonials.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handlePurchase = () => {
        if (!selectedPlanId) return;

        const selectedPlan = plans.find(p => p._id === selectedPlanId);
        if (!selectedPlan) return;

        setIsPurchasing(true);

        // Log the correct product key to console for now, and simulate purchase
        console.log('Initiating purchase for:', selectedPlan.cafebazaarProductKey || selectedPlan.name);

        // Use custom URL scheme or web payment methods later
        // For web MVP, we simulate
        setTimeout(() => {
            setIsPurchasing(false);
            alert(`در حال انتقال به درگاه پرداخت برای طرح ${selectedPlan.title || selectedPlan.name}...\nProduct Key: ${selectedPlan.cafebazaarProductKey || 'N/A'}`);
        }, 1500);
    };

    // Helper to determine if offer applies to a plan
    const doesOfferApply = (offer: Offer, planId: string): boolean => {
        return offer.applyToAllPlans || (offer.applicablePlans && offer.applicablePlans.includes(planId));
    };

    // Calculate effective end date
    const getEffectiveEndDate = (): Date | null => {
        if (!activeOffer) return null;
        if (activeOffer.isTimeLimited && activeOffer.endDate) {
            return new Date(activeOffer.endDate);
        }
        if (activeOffer.targetUserType === 'new' && activeOffer.conditions?.userRegisteredWithinDays && userCreatedAt) {
            const userDate = new Date(userCreatedAt);
            userDate.setDate(userDate.getDate() + activeOffer.conditions.userRegisteredWithinDays);
            return userDate;
        }
        return null;
    };

    const activeOfferEndDate = getEffectiveEndDate();
    const isOfferValid = activeOffer && activeOffer.isActive && (!activeOfferEndDate || new Date() < activeOfferEndDate);
    const offerBgColor = activeOffer ? parseHexColor(activeOffer.display.backgroundColor) : '#E53935';
    const offerTextColor = activeOffer ? parseHexColor(activeOffer.display.textColor) : '#FFFFFF';

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col h-full w-full overflow-hidden">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /> {/* RTL arrow */}
                        </svg>
                    </button>
                    <span className="font-bold text-gray-800 text-lg">اشتراک ویژه</span>
                </div>
                {status && (
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${status.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${status.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        {status.isActive ? 'اشتراک فعال' : 'رایگان'}
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar">

                {/* Hero Section */}
                <div className="px-5 pt-6 pb-2">
                    <div className="w-full h-48 rounded-[32px] overflow-hidden relative shadow-lg shadow-purple-200/50">
                        {(() => {
                            const yearlyPlan = plans.find(p => p.duration === 'yearly');
                            const validImageUrl = yearlyPlan?.imageUrl && !yearlyPlan.imageUrl.includes('undefined') && !yearlyPlan.imageUrl.includes('null');
                            const heroImageUrl = validImageUrl
                                ? (yearlyPlan!.imageUrl!.startsWith('http') ? yearlyPlan!.imageUrl : `${BASE_URL}${yearlyPlan!.imageUrl}`)
                                : "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80";

                            const heroTitle = yearlyPlan?.title || "نسخه حرفه‌ای لقمه 🥘";

                            return (
                                <>
                                    <img
                                        src={heroImageUrl}
                                        className="w-full h-full object-cover"
                                        alt="Premium"
                                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80" }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
                                        <h2 className="font-black text-2xl mb-1">{heroTitle}</h2>
                                        <p className="text-sm font-medium opacity-90">بهترین ابزار برای رسیدن به وزن ایده‌آل</p>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Testimonials Slider */}
                <div className="px-5 py-4 overflow-hidden">
                    <div className="relative h-[160px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTestimonialIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0"
                            >
                                <TestimonialCard testimonial={testimonials[currentTestimonialIndex]} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="flex justify-center gap-1.5 mt-3">
                        {testimonials.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentTestimonialIndex ? 'w-6 bg-purple-600' : 'w-1.5 bg-gray-300'}`}
                            ></div>
                        ))}
                    </div>
                </div>

                {/* Offer Banner & Plans Grid */}
                <div className="px-5 mt-2">
                    {activeOffer && isOfferValid && (
                        <div
                            className="w-full rounded-[24px] mb-4 overflow-hidden relative shadow-xl transform transition-all duration-500 hover:scale-[1.01]"
                            style={{
                                background: `linear-gradient(135deg, ${offerBgColor}, ${darkenColor(offerBgColor)})`,
                                boxShadow: `0 10px 30px -5px ${offerBgColor}50`
                            }}
                        >
                            {/* Shine Effect */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                                <div className="absolute top-0 -left-[100%] w-[100%] h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shine" style={{ transform: 'skewX(-20deg)' }}></div>
                            </div>

                            <style>{`
                                @keyframes shine {
                                    0% { left: -100%; }
                                    100% { left: 200%; }
                                }
                                .animate-shine {
                                    animation: shine 3s infinite linear;
                                }
                            `}</style>

                            <div className="p-5 flex items-center justify-between relative z-10">
                                <div className="flex flex-col gap-1 flex-1">
                                    <h3
                                        className="font-black text-lg leading-tight"
                                        style={{ color: offerTextColor }}
                                    >
                                        {activeOffer.display.bannerText}
                                    </h3>
                                    {activeOffer.display.bannerSubtext && (
                                        <p
                                            className="text-xs font-medium opacity-90"
                                            style={{ color: offerTextColor }}
                                        >
                                            {activeOffer.display.bannerSubtext}
                                        </p>
                                    )}
                                </div>

                                {activeOfferEndDate && (
                                    <div className="flex-shrink-0 mr-4">
                                        <CountdownTimer
                                            endDate={activeOfferEndDate}
                                            textColor={offerTextColor}
                                            bgColor={offerBgColor}
                                            onExpired={() => {
                                                // Ideally refresh offers or hide banner
                                                setActiveOffer(null);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="grid gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-[24px] h-24 w-full animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {plans.map((plan) => {
                                const applies = activeOffer && isOfferValid && doesOfferApply(activeOffer, plan._id);
                                const discounted = applies ? calculateDiscountedPrice(plan.price, activeOffer!) : undefined;
                                const discountPct = applies && activeOffer ? activeOffer.discountPercentage : undefined;

                                return (
                                    <PlanCard
                                        key={plan._id}
                                        plan={plan}
                                        isSelected={selectedPlanId === plan._id}
                                        onSelect={() => setSelectedPlanId(plan._id)}
                                        discountedPrice={discounted}
                                        discountPercentage={discountPct}
                                        offerColor={applies ? offerBgColor : undefined}
                                        bestValue={plan.duration === 'yearly'}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Features List */}
                <div className="px-6 py-8">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg">✨</span>
                        چرا نسخه پریمیوم؟
                    </h3>
                    <div className="space-y-4">
                        {[
                            { title: 'اسکن نامحدود غذا', desc: 'بدون هیچ محدودیتی از هوش مصنوعی استفاده کن' },
                            { title: 'تحلیل دقیق ریزمغذی‌ها', desc: 'پروتئین، کربوهیدرات، چربی و ویتامین‌ها' },
                            { title: 'حذف تبلیغات', desc: 'تجربه کاربری روان و بدون مزاحمت' },
                            { title: 'پشتیبانی اولویت‌دار', desc: 'پاسخگویی سریع به سوالات شما' },
                        ].map((feature, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-700 text-sm">{feature.title}</h5>
                                    <p className="text-gray-500 text-xs mt-1">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Bottom Action Bar */}
            <div className={`p-5 bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] transition-transform duration-500 z-20 ${isLoading ? 'translate-y-full' : 'translate-y-0'}`}>
                <button
                    onClick={handlePurchase}
                    disabled={isPurchasing || !selectedPlanId}
                    className="w-full py-4 text-white rounded-[20px] font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden"
                    style={{
                        background: activeOffer && isOfferValid ? `linear-gradient(135deg, ${offerBgColor}, ${darkenColor(offerBgColor)})` : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                        boxShadow: activeOffer && isOfferValid ? `0 10px 20px -5px ${offerBgColor}50` : ''
                    }}
                >
                    {isPurchasing && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    )}

                    {isPurchasing ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>در حال پردازش...</span>
                        </>
                    ) : (
                        <>
                            <span>خرید اشتراک ویژه</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </>
                    )}
                </button>
                <div className="text-center mt-3">
                    <p className="text-[10px] text-gray-400">
                        با خرید اشتراک، <span className="underline cursor-pointer">قوانین و مقررات</span> لقمه را می‌پذیرم
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
