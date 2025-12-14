"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, SubscriptionPlan, SubscriptionStatus, BASE_URL, Offer } from '../services/apiService';

// --- Helpers ---

const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

const parseHexColor = (hex: string): string => {
    if (!hex) return '#E53935';
    if (hex.startsWith('#')) return hex;
    return `#${hex}`;
};

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

const calculateDiscountedPrice = (price: number, offer: Offer): number => {
    if (offer.offerType === 'percentage' && offer.discountPercentage) {
        return Math.floor(price * (1 - offer.discountPercentage / 100));
    }
    if (offer.offerType === 'fixed_amount' && offer.discountAmount) {
        return Math.max(0, price - offer.discountAmount);
    }
    if (offer.offerType === 'fixed_price' && offer.discountAmount) {
        return offer.discountAmount;
    }
    return price;
}

const stringPadLeft = (str: string, length: number, char: string): string => {
    return char.repeat(Math.max(0, length - str.length)) + str;
};

// --- Components ---

const TimerBox = ({ value, label, color }: { value: string; label: string; color: string }) => (
    <div className="flex flex-col items-center gap-0.5">
        <div className="w-8 h-9 bg-white rounded-[8px] flex items-center justify-center shadow-sm">
            <span className="font-bold text-lg leading-none pt-1" style={{ color }}>{value}</span>
        </div>
        {/* <span className="text-[9px] text-white/90 font-medium">{label}</span> */}
        {/* Label removed to match exact screenshot cleaner look, can add back if needed */}
    </div>
);

const CountdownTimer = ({
    endDate,
    themeColor,
    onExpired,
}: {
    endDate: Date;
    themeColor: string;
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
            <TimerBox value={pad(timeRemaining.days)} label="روز" color={themeColor} />
            <TimerBox value={pad(timeRemaining.hours)} label="ساعت" color={themeColor} />
            <TimerBox value={pad(timeRemaining.minutes)} label="دقیقه" color={themeColor} />
            <TimerBox value={pad(timeRemaining.seconds)} label="ثانیه" color={themeColor} />
        </div>
    );
};

const PlanCard = ({
    plan,
    isSelected,
    onSelect,
    discountedPrice,
    discountPercentage,
    offer,
    offerEndDate,
    onOfferExpired
}: {
    plan: SubscriptionPlan;
    isSelected: boolean;
    onSelect: () => void;
    discountedPrice?: number;
    discountPercentage?: number;
    offer?: Offer;
    offerEndDate?: Date | null;
    onOfferExpired?: () => void;
}) => {
    // Format price
    const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price);

    const getDurationTitle = (duration: string) => {
        switch (duration) {
            case 'monthly': return 'ماهانه';
            case '3month': return 'سه ماهه';
            case 'yearly': return 'سالانه';
            default: return duration;
        }
    };

    const finalPrice = discountedPrice ?? plan.price;
    const hasDiscount = discountedPrice !== undefined && discountedPrice < plan.price;
    const effectiveDiscountPercentage = discountPercentage ?? plan.discountPercentage;
    const effectiveOriginalPrice = hasDiscount ? plan.price : plan.originalPrice;

    // Theme Colors
    const themeColor = offer ? parseHexColor(offer.display.backgroundColor) : (isSelected ? '#8B5CF6' : '#9CA3AF');
    const themeGradientStart = themeColor;
    const themeGradientEnd = offer ? darkenColor(themeColor) : themeColor;

    // Provide offer context only if this specific plan has an offer applied
    const showOfferHeader = offer && hasDiscount;

    return (
        <motion.div
            layout
            onClick={onSelect}
            className={`relative rounded-[24px] transition-all duration-300 ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
            style={{
                marginBottom: isSelected ? '24px' : '12px', // Space for checkmark
            }}
        >
            {/* Integrated Offer Header */}
            {showOfferHeader && (
                <div
                    className="rounded-t-[24px] p-4 flex items-center justify-between relative overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${themeGradientStart}, ${themeGradientEnd})`
                    }}
                >
                    {/* Timer on Left (LTR in DOM but visually matches image) */}
                    <div className="flex-shrink-0 z-10">
                        {offerEndDate && onOfferExpired && (
                            <CountdownTimer
                                endDate={offerEndDate}
                                themeColor={themeColor} // Pass theme color for text inside white boxes
                                onExpired={onOfferExpired}
                            />
                        )}
                    </div>

                    {/* Text on Right */}
                    <div className="flex flex-col items-end z-10 text-white">
                        <h3 className="font-bold text-lg leading-tight shadow-black/10 drop-shadow-md">
                            {offer.display.bannerText}
                        </h3>
                        {offer.display.bannerSubtext && (
                            <p className="text-xs font-medium opacity-90 mt-1">
                                {offer.display.bannerSubtext}
                            </p>
                        )}
                    </div>

                    {/* Background Shine */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
                        <div className="absolute top-0 -left-[100%] w-[100%] h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shine" style={{ transform: 'skewX(-20deg)' }}></div>
                    </div>
                    <style>{`
                        @keyframes shine { 0% { left: -100%; } 100% { left: 200%; } }
                        .animate-shine { animation: shine 3s infinite linear; }
                    `}</style>
                </div>
            )}

            {/* Card Body */}
            <div
                className={`bg-white p-5 relative border-x-4 border-b-4 ${showOfferHeader ? 'rounded-b-[24px] border-t-0' : 'rounded-[24px] border-4'}`}
                style={{
                    borderColor: isSelected ? themeColor : 'white',
                    backgroundColor: 'white'
                }}
            >
                <div className="flex flex-col gap-4">

                    {/* Top Row: Title */}
                    <div className="flex justify-end">
                        <h3 className="font-bold text-xl text-gray-800">
                            {plan.title || getDurationTitle(plan.duration)}
                        </h3>
                    </div>

                    {/* Middle Row: Prices */}
                    <div className="flex items-end justify-between">
                        {/* Left: Per Month Price */}
                        <div className="flex flex-col items-start">
                            <span className="font-bold text-lg text-gray-800">
                                {(() => {
                                    let perMonth = 0;
                                    if (plan.duration === 'monthly') perMonth = finalPrice;
                                    else if (plan.duration === '3month') perMonth = finalPrice / 3;
                                    else if (plan.duration === 'yearly') perMonth = finalPrice / 12;
                                    return formatPrice(Math.round(perMonth));
                                })()}
                            </span>
                            <span className="text-xs text-gray-400">در ماه</span>
                        </div>

                        {/* Right: Full Price + Badge */}
                        <div className="flex items-center gap-3">
                            {/* Discount Badge */}
                            {effectiveDiscountPercentage && (
                                <div
                                    className="px-2.5 py-1 rounded-full text-white font-bold text-sm shadow-sm"
                                    style={{ backgroundColor: themeColor }} // Using offer color for badge
                                >
                                    {toPersianNumbers(effectiveDiscountPercentage)}٪
                                </div>
                            )}

                            {/* Prices */}
                            <div className="flex items-center gap-3">
                                <span className="font-black text-2xl text-gray-900">
                                    {formatPrice(finalPrice)}
                                </span>
                                {effectiveOriginalPrice && (
                                    <span className="text-sm text-gray-400 line-through decoration-red-400 opacity-70">
                                        {formatPrice(effectiveOriginalPrice)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checkmark Circle - Absolute positioned at bottom center */}
                {isSelected && (
                    <div
                        className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-md z-20"
                        style={{ backgroundColor: themeColor }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>
        </motion.div>
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

const SubscriptionPage = ({ onBack }: { onBack: () => void }) => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [activeOffer, setActiveOffer] = useState<Offer | null>(null);
    const [userCreatedAt, setUserCreatedAt] = useState<string | undefined>(undefined);

    const testimonials = [
        { name: 'مونا', text: 'فقط با عکس گرفتن از غذاهام، ۱۵ کیلو کم کردم!', image: '/app/images/comments/mona.jpg', rating: 5 },
        { name: 'نیلوفر', text: 'با لقمه همه‌چی خودکار انجام می‌شه.', image: '/app/images/comments/niloofar.jpg', rating: 5 },
        { name: 'پدرام', text: 'بهترین بخش لقمه برای من نمودار پیشرفته‌ست.', image: '/app/images/comments/pedram.jpg', rating: 5 },
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

                if (userProfile) setUserCreatedAt(userProfile.createdAt);

                const sortedPlans = plansData.sort((a, b) => a.sortOrder - b.sortOrder);
                setPlans(sortedPlans);
                setStatus(statusData);

                if (offersData && offersData.length > 0) setActiveOffer(offersData[0]);

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
        const interval = setInterval(() => setCurrentTestimonialIndex(prev => (prev + 1) % testimonials.length), 5000);
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
            alert(`در حال انتقال... \nProduct Key: ${selectedPlan.cafebazaarProductKey || 'N/A'}`);
        }, 1500);
    };

    const doesOfferApply = (offer: Offer, planId: string): boolean => {
        return offer.applyToAllPlans || (offer.applicablePlans && offer.applicablePlans.includes(planId));
    };

    const getEffectiveEndDate = (): Date | null => {
        if (!activeOffer) return null;
        if (activeOffer.isTimeLimited && activeOffer.endDate) return new Date(activeOffer.endDate);
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

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col h-full w-full overflow-hidden">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
                            const heroImageUrl = validImageUrl ? (yearlyPlan!.imageUrl!.startsWith('http') ? yearlyPlan!.imageUrl : `${BASE_URL}${yearlyPlan!.imageUrl}`) : "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80";
                            return (
                                <>
                                    <img src={heroImageUrl} className="w-full h-full object-cover" alt="Premium" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80" }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
                                        <h2 className="font-black text-2xl mb-1">{yearlyPlan?.title || "نسخه حرفه‌ای لقمه"}</h2>
                                        <p className="text-sm font-medium opacity-90">بهترین ابزار برای رسیدن به وزن ایده‌آل</p>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Testimonials */}
                <div className="px-5 py-4 overflow-hidden">
                    <div className="relative h-[120px]">
                        <AnimatePresence mode="wait">
                            <motion.div key={currentTestimonialIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                                <TestimonialCard testimonial={testimonials[currentTestimonialIndex]} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="px-5 mt-4 flex flex-col gap-6">
                    {isLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="bg-white rounded-[24px] h-24 w-full animate-pulse"></div>)
                    ) : (
                        plans.map((plan) => {
                            const applies = activeOffer && isOfferValid && doesOfferApply(activeOffer, plan._id);
                            const discounted = applies ? calculateDiscountedPrice(plan.price, activeOffer!) : undefined;

                            return (
                                <PlanCard
                                    key={plan._id}
                                    plan={plan}
                                    isSelected={selectedPlanId === plan._id}
                                    onSelect={() => setSelectedPlanId(plan._id)}
                                    discountedPrice={discounted}
                                    discountPercentage={applies && activeOffer ? activeOffer.discountPercentage : undefined}
                                    offer={applies ? activeOffer! : undefined}
                                    offerEndDate={activeOfferEndDate}
                                    onOfferExpired={() => setActiveOffer(null)}
                                />
                            );
                        })
                    )}
                </div>

                {/* Features */}
                <div className="px-6 py-8">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg">✨</span> چرا نسخه پریمیوم؟</h3>
                    <div className="space-y-4">
                        {[
                            { title: 'اسکن نامحدود غذا', desc: 'بدون هیچ محدودیتی از هوش مصنوعی استفاده کن' },
                            { title: 'تحلیل دقیق ریزمغذی‌ها', desc: 'پروتئین، کربوهیدرات، چربی و ویتامین‌ها' },
                        ].map((feature, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>
                                <div><h5 className="font-bold text-gray-700 text-sm">{feature.title}</h5><p className="text-gray-500 text-xs mt-1">{feature.desc}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] transition-transform duration-500 z-20">
                <button
                    onClick={handlePurchase}
                    disabled={isPurchasing || !selectedPlanId}
                    className="w-full py-4 text-white rounded-[20px] font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-3 relative overflow-hidden"
                    style={{
                        background: activeOffer && isOfferValid ? `linear-gradient(135deg, ${offerBgColor}, ${darkenColor(offerBgColor)})` : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                    }}
                >
                    {isPurchasing ? <span>در حال پردازش...</span> : <span>خرید اشتراک ویژه</span>}
                </button>
            </div>
        </div>
    );
};

export default SubscriptionPage;
