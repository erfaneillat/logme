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
    // If we have specific plan pricing overrides, we should use them (not available in simple Offer type yet, but good to note)
    // For now, simple standard discount logic
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
const TimerBox = ({ value, label, bgColor, textColor }: { value: string; label: string; bgColor: string, textColor: string }) => (
    <div className="flex flex-col items-center">
        <div
            className="w-[32px] h-[32px] rounded-lg flex items-center justify-center font-bold text-sm shadow-sm backdrop-blur-sm transition-all duration-300"
            style={{
                backgroundColor: 'white',
                color: bgColor,
            }}
        >
            {value}
        </div>

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
        <div className="flex items-center gap-2" dir="ltr">
            {timeRemaining.days > 0 && (
                <TimerBox value={pad(timeRemaining.days)} label="روز" bgColor={bgColor} textColor={textColor} />
            )}
            <TimerBox value={pad(timeRemaining.hours)} label="ساعت" bgColor={bgColor} textColor={textColor} />
            <TimerBox value={pad(timeRemaining.minutes)} label="دقیقه" bgColor={bgColor} textColor={textColor} />
            <TimerBox value={pad(timeRemaining.seconds)} label="ثانیه" bgColor={bgColor} textColor={textColor} />
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
    bestValue = false,
    isActiveOffer = false
}: {
    plan: SubscriptionPlan;
    isSelected: boolean;
    onSelect: () => void;
    discountedPrice?: number;
    discountPercentage?: number;
    offerColor?: string;
    bestValue?: boolean;
    isActiveOffer?: boolean;
}) => {
    // Format price to Persian digits and currency
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const getDurationTitle = (duration: string) => {
        switch (duration) {
            case 'monthly': return 'یک ماهه';
            case '3month': return 'سه ماهه';
            case 'yearly': return 'سالانه';
            default: return duration;
        }
    };

    const finalPrice = discountedPrice ?? plan.price;
    const hasDiscount = discountedPrice !== undefined && discountedPrice < plan.price;
    const effectiveDiscountPercentage = discountPercentage ?? plan.discountPercentage;
    const effectiveOriginalPrice = hasDiscount ? plan.price : plan.originalPrice;

    const activeBorderColor = offerColor || '#E53935';

    return (
        <motion.div
            layout
            onClick={onSelect}
            className={`cursor-pointer rounded-[24px] p-0 relative overflow-hidden transition-all duration-300 ${isSelected ? 'shadow-lg scale-[1.02]' : 'hover:scale-[1.01]'}`}
            style={{
                boxShadow: isSelected ? `0 10px 25px -5px ${activeBorderColor}40` : '',
            }}
        >
            {/* Main Plan Content */}
            <div
                className={`bg-white rounded-[22px] px-5 py-4 relative h-full flex flex-col justify-between`}
                style={{
                    border: isSelected ? `3px solid ${activeBorderColor}` : isActiveOffer ? 'none' : '2px solid #f3f4f6'
                }}
            >
                <div className="flex flex-row items-center justify-between w-full h-full">

                    {/* Price and Details (Left Side) */}
                    <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-xl text-gray-800">
                                {formatPrice(finalPrice)}
                                <span className="text-xs text-gray-500 font-medium mr-1">تومان</span>
                            </span>
                        </div>
                        {effectiveOriginalPrice && (
                            <span className="text-sm text-gray-400 line-through decoration-red-400">
                                {formatPrice(effectiveOriginalPrice)}
                                <span className="text-[10px] mr-1">تومان</span>
                            </span>
                        )}
                        <span className="text-[10px] text-gray-400 mt-1">
                            در ماه
                        </span>
                    </div>

                    {/* Badge and Title (Center/Right) */}
                    <div className="flex flex-col items-end justify-center gap-2">
                        {effectiveDiscountPercentage && (
                            <span
                                className="text-[12px] font-bold px-3 py-1 rounded-full text-white shadow-sm"
                                style={{
                                    backgroundColor: activeBorderColor
                                }}
                            >
                                {new Intl.NumberFormat('fa-IR').format(effectiveDiscountPercentage)}٪ تخفیف
                            </span>
                        )}
                        <h3 className="font-bold text-lg text-gray-800 mt-1">
                            {plan.title || getDurationTitle(plan.duration)}
                        </h3>
                    </div>

                </div>

                {/* Selected Checkmark at Bottom Center */}
                {isSelected && (
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex justify-center">
                        <div className="bg-white rounded-full p-0.5 shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" style={{ color: activeBorderColor }}>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                )}
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

                if (userProfile) {
                    setUserCreatedAt(userProfile.createdAt);
                }

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
        console.log('Initiating purchase for:', selectedPlan.cafebazaarProductKey || selectedPlan.name);

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

                {/* Plans List */}
                <div className="px-5 mt-2 space-y-4">
                    {/* Offer Container Wrapper for Yearly or Applicable Plans */}
                    {activeOffer && isOfferValid ? (
                        <div
                            className="w-full rounded-[24px] p-4 relative shadow-xl transform transition-all duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${offerBgColor}, ${darkenColor(offerBgColor)})`,
                                boxShadow: `0 10px 30px -5px ${offerBgColor}50`
                            }}
                        >
                            {/* Offer Header Section */}
                            <div className="flex justify-between items-start mb-4">

                                {activeOfferEndDate && (
                                    <CountdownTimer
                                        endDate={activeOfferEndDate}
                                        textColor={offerBgColor} // Text color inside boxes (inverted)
                                        bgColor={offerBgColor} // Passed to be inverted in component? No, TimerBox uses bgColor for text color. Wait.
                                        // Let's check TimerBox again. 
                                        // TimerBox: style={{ color: bgColor }} -> text color matches bgColor.
                                        // We want text inside box to be the Offer Color (Red/Orange), and box bg to be white.
                                        onExpired={() => setActiveOffer(null)}
                                    />
                                )}

                                <div className="text-left text-white">
                                    <h3 className="font-bold text-lg leading-tight mb-1">
                                        ! {activeOffer.display.bannerText}
                                    </h3>
                                    <p className="text-xs font-medium opacity-90 text-left">
                                        {activeOffer.display.bannerSubtext}
                                    </p>
                                </div>
                            </div>

                            {/* Render Plan Card Inside Offer Container */}
                            {(() => {
                                // Find the plan that this offer applies to (Usually Yearly)
                                // If applyToAll, maybe just show Yearly here as highlighted? 
                                // Based on Flutter, it seems it wraps the Yearly plan if valid on Yearly.
                                const targetPlan = plans.find(p => p.duration === 'yearly'); // Default to yearly for main offer

                                if (targetPlan && doesOfferApply(activeOffer, targetPlan._id)) {
                                    const discounted = calculateDiscountedPrice(targetPlan.price, activeOffer!);
                                    const discountPct = activeOffer.discountPercentage;
                                    return (
                                        <div className="mb-2">
                                            <PlanCard
                                                key={targetPlan._id}
                                                plan={targetPlan}
                                                isSelected={selectedPlanId === targetPlan._id}
                                                onSelect={() => setSelectedPlanId(targetPlan._id)}
                                                discountedPrice={discounted}
                                                discountPercentage={discountPct}
                                                offerColor={offerBgColor}
                                                bestValue={true}
                                                isActiveOffer={true}
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    ) : null}

                    {/* Render Other Plans or All Plans if no active offer Wrapper */}
                    {plans.filter(p => {
                        // If offer is active and we showed the target plan inside it, filter it out here
                        if (activeOffer && isOfferValid) {
                            const targetPlan = plans.find(tp => tp.duration === 'yearly');
                            if (targetPlan && doesOfferApply(activeOffer, targetPlan._id) && p._id === targetPlan._id) {
                                return false;
                            }
                        }
                        return true;
                    }).map((plan) => (
                        <PlanCard
                            key={plan._id}
                            plan={plan}
                            isSelected={selectedPlanId === plan._id}
                            onSelect={() => setSelectedPlanId(plan._id)}
                        // We still show discounts for other plans if applicable, but without the big wrapper
                        // logic for other plans...
                        />
                    ))}
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
