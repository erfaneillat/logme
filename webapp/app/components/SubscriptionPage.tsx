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

const TimerBox = ({ value, bgColor, textColor }: { value: string; bgColor: string, textColor: string }) => (
    <div
        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
        style={{
            backgroundColor: 'white',
            color: bgColor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
    >
        {value}
    </div>
);

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
                    <span style={{ color: textColor }} className="font-bold text-xs opacity-90">:</span>
                </>
            )}
            <TimerBox value={pad(timeRemaining.hours)} bgColor={bgColor} textColor={textColor} />
            <span style={{ color: textColor }} className="font-bold text-xs opacity-90">:</span>
            <TimerBox value={pad(timeRemaining.minutes)} bgColor={bgColor} textColor={textColor} />
            <span style={{ color: textColor }} className="font-bold text-xs opacity-90">:</span>
            <TimerBox value={pad(timeRemaining.seconds)} bgColor={bgColor} textColor={textColor} />
        </div>
    );
};

const PlanCard = ({
    plan,
    isSelected,
    onSelect,
    discountedPrice,
    discountPercentage,
    offerColor,
    isInsideOffer = false
}: {
    plan: SubscriptionPlan;
    isSelected: boolean;
    onSelect: () => void;
    discountedPrice?: number;
    discountPercentage?: number;
    offerColor?: string;
    isInsideOffer?: boolean;
}) => {
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

    // Determine card styling based on selection and offer context
    let borderColor = 'transparent';
    let borderWidth = 0;

    if (isSelected) {
        borderColor = offerColor || '#8B5CF6'; // Use offer color or purple
        borderWidth = 3;
    } else if (isInsideOffer) {
        // If inside offer but not selected (unlikely for yearly default, but possible)
        borderColor = 'transparent';
        borderWidth = 0;
    }

    // For non-offer cards
    if (!isInsideOffer) {
        if (isSelected) {
            // Already handled above
        } else {
            // Default border for unselected non-offer cards
            borderColor = '#e5e7eb';
            borderWidth = 1;
        }
    }

    return (
        <motion.div
            layout
            onClick={onSelect}
            className={`cursor-pointer rounded-[20px] relative overflow-visible transition-all duration-300 ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
            style={{
                backgroundColor: 'white',
                border: `${borderWidth}px solid ${borderColor}`,
                boxShadow: isSelected
                    ? `0 10px 25px -5px ${offerColor ? offerColor + '40' : 'rgba(139, 92, 246, 0.25)'}`
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                marginBottom: isInsideOffer ? 0 : 12 // Spacing for cards outside offer container
            }}
        >
            <div className="p-4 flex flex-col justify-between h-[85px]">
                {/* Header Row: Title & Discount Badge */}
                <div className="flex flex-row items-center justify-between w-full h-[32px]">
                    <div className="flex items-center gap-2">
                        {hasDiscount && isInsideOffer && (
                            // For offer card, price per month is on the left
                            <div className="flex flex-col items-start gap-0.5">
                                {/* Monthly breakdown */}
                                <span
                                    className="font-black text-xl tracking-tight text-gray-800"
                                >
                                    {formatPrice(finalPrice)}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">تومان</span>
                            </div>
                        )}

                        {!hasDiscount && (
                            <h3 className={`font-medium text-base text-gray-800`}>
                                {plan.title || getDurationTitle(plan.duration)}
                            </h3>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Badge */}
                        {effectiveDiscountPercentage && (
                            <span
                                className="text-[11px] font-bold px-2.5 py-1 rounded-[10px] text-white"
                                style={{
                                    backgroundColor: offerColor || '#EF4444',
                                }}
                            >
                                {new Intl.NumberFormat('fa-IR').format(effectiveDiscountPercentage)}٪ تخفیف
                            </span>
                        )}

                        {/* If inside offer, title is on the right */}
                        {hasDiscount && isInsideOffer && (
                            <h3 className={`font-medium text-base text-gray-800 ml-1`}>
                                {plan.title || getDurationTitle(plan.duration)}
                            </h3>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Price & Actions */}
                <div className="flex items-end justify-between w-full mt-1">
                    <div className="flex flex-col items-start">
                        {!isInsideOffer ? (
                            // Standard Card Layout
                            <>
                                <span className="text-[10px] text-gray-400 font-medium mb-0.5">در ماه</span>
                                <span className={`font-bold text-lg text-gray-800`}>
                                    {(() => {
                                        let perMonth = 0;
                                        if (plan.duration === 'monthly') perMonth = finalPrice;
                                        else if (plan.duration === '3month') perMonth = finalPrice / 3;
                                        else if (plan.duration === 'yearly') perMonth = finalPrice / 12;
                                        return formatPrice(Math.round(perMonth));
                                    })()}
                                </span>
                            </>
                        ) : (
                            // Offer Card Layout - per month label already shown? logic check
                            <span className="text-[10px] text-gray-400 font-medium">در ماه</span>
                        )}
                    </div>

                    <div className="flex items-end gap-3 pb-0.5">
                        {/* Final Price for Standard, Total Price for Offer */}
                        {!isInsideOffer ? (
                            <div className="flex flex-col items-end">
                                {effectiveOriginalPrice && (
                                    <span className="text-[11px] text-gray-400 line-through decoration-red-400 mb-0.5">
                                        {formatPrice(effectiveOriginalPrice)}
                                    </span>
                                )}
                                <span className="font-bold text-base text-gray-800">
                                    {formatPrice(finalPrice)} <span className="text-[9px] font-normal text-gray-500">تومان</span>
                                </span>
                            </div>
                        ) : (
                            // Inside offer card: Total price calculation
                            <div className="flex flex-row items-center gap-2">
                                <span className={`font-black text-2xl text-gray-800`}>
                                    {formatPrice(finalPrice)}
                                </span>
                                {effectiveOriginalPrice && (
                                    <span className="text-xs text-gray-400 line-through decoration-gray-300">
                                        {formatPrice(effectiveOriginalPrice)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Checkmark Circle at bottom center if selected */}
            {isSelected && (
                <div className="absolute -bottom-3 left-0 right-0 flex justify-center z-10">
                    <div
                        className="bg-white rounded-full p-0.5 shadow-sm"
                        style={{ boxShadow: `0 2px 5px ${offerColor ? offerColor + '30' : 'rgba(0,0,0,0.1)'}` }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ color: borderColor }}>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            )}
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

                if (offersData && offersData.length > 0) {
                    setActiveOffer(offersData[0]);
                }

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
    const offerTextColor = activeOffer ? parseHexColor(activeOffer.display.textColor) : '#FFFFFF';

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col h-full w-full overflow-hidden font-[family-name:var(--font-geist-sans)]">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-10">
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
                        <div className={`w-2 h-2 rounded-full ${status.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        {status.isActive ? 'اشتراک فعال' : 'رایگان'}
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className={`flex-1 overflow-y-auto no-scrollbar pb-32 ${isLoading ? 'opacity-50' : ''}`}>
                <div className="px-5 pt-6">
                    {/* Offer Container (Only if active) */}
                    {activeOffer && isOfferValid ? (
                        <div
                            className="w-full rounded-[24px] mb-6 relative overflow-visible shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${offerBgColor}, ${darkenColor(offerBgColor)})`,
                                boxShadow: `0 10px 30px -5px ${offerBgColor}60`
                            }}
                        >
                            {/* Offer Header: Timer & Text */}
                            <div className="p-4 pb-2 flex items-center justify-between">
                                {/* Countdown Timer (Left) */}
                                {activeOfferEndDate && (
                                    <div>
                                        <CountdownTimer
                                            endDate={activeOfferEndDate}
                                            textColor={offerBgColor}
                                            bgColor={'#FFFFFF'}
                                            onExpired={() => setActiveOffer(null)}
                                        />
                                    </div>
                                )}

                                {/* Banner Text (Right) */}
                                <div className="flex flex-col items-end text-right">
                                    <h3 className="font-black text-white text-base leading-tight drop-shadow-sm">
                                        {activeOffer.display.bannerText}
                                    </h3>
                                    {activeOffer.display.bannerSubtext && (
                                        <p className="text-white/90 text-xs font-medium mt-1">
                                            {activeOffer.display.bannerSubtext}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Plan Card (Inside Offer Container) */}
                            <div className="px-1.5 pb-1.5 pt-2">
                                {plans.filter(p => p.duration === 'yearly').map(plan => {
                                    const applies = doesOfferApply(activeOffer, plan._id);
                                    const discounted = applies ? calculateDiscountedPrice(plan.price, activeOffer) : undefined;
                                    const discountPct = applies ? activeOffer.discountPercentage : undefined;

                                    return (
                                        <PlanCard
                                            key={plan._id}
                                            plan={plan}
                                            isSelected={selectedPlanId === plan._id}
                                            onSelect={() => setSelectedPlanId(plan._id)}
                                            discountedPrice={discounted}
                                            discountPercentage={discountPct}
                                            offerColor={offerBgColor}
                                            isInsideOffer={true}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        // Fallback/Loading for Yearly Plan if no offer
                        plans.filter(p => p.duration === 'yearly').map(plan => (
                            <PlanCard
                                key={plan._id}
                                plan={plan}
                                isSelected={selectedPlanId === plan._id}
                                onSelect={() => setSelectedPlanId(plan._id)}
                            />
                        ))
                    )}

                    {/* Other Plans (Monthly, 3-Month) */}
                    <div className="flex flex-col gap-0 mt-2">
                        {plans.filter(p => p.duration !== 'yearly').map(plan => {
                            // Offers typically only apply to main plan or specific ones, 
                            // but implementation suggests generalized support.
                            // If they check 'applyToAllPlans', apply here too, but layout is separate.
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
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Features */}
                <div className="px-6 py-8">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg">✨</span>
                        چرا نسخه حرفه‌ای؟
                    </h3>
                    <div className="space-y-4">
                        {[
                            { title: 'اسکن نامحدود غذا', desc: 'بدون هیچ محدودیتی از هوش مصنوعی استفاده کن' },
                            { title: 'تحلیل دقیق ریزمغذی‌ها', desc: 'پروتئین، کربوهیدرات، چربی و ویتامین‌ها' },
                            { title: 'حذف تبلیغات', desc: 'تجربه کاربری روان و بدون مزاحمت' },
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
                        background: activeOffer && isOfferValid ? `linear-gradient(135deg, ${offerBgColor}, ${darkenColor(offerBgColor)})` : 'linear-gradient(135deg, #18181b, #27272a)',
                        boxShadow: activeOffer && isOfferValid ? `0 10px 20px -5px ${offerBgColor}50` : ''
                    }}
                >
                    {isPurchasing ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>در حال پردازش...</span>
                        </>
                    ) : (
                        <span>خرید اشتراک لقمه پلاس</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SubscriptionPage;
