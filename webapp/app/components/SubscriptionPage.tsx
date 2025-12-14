"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiService, SubscriptionPlan, Offer, UserProfile, BASE_URL } from '../services/apiService';

// --- Utility Functions ---

const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US');
};

const parseHexColor = (hex: string): string => {
    if (hex.startsWith('#')) return hex;
    return `#${hex}`;
};

const darkenColor = (hex: string, percent: number = 15): string => {
    // ensure hex has #
    hex = parseHexColor(hex);
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
};

// --- Components ---

const TimerBox = ({ value, bgColor }: { value: string; bgColor: string }) => (
    <div
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
        style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: bgColor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
    >
        {value}
    </div>
);

const CountdownTimer = ({ endDate, textColor, bgColor }: { endDate: Date; textColor: string; bgColor: string }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +endDate - +new Date();
            let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

            if (difference > 0) {
                timeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }
            setTimeLeft(timeLeft);
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft(); // Init
        return () => clearInterval(timer);
    }, [endDate]);

    const format = (n: number) => toPersianNumbers(String(n).padStart(2, '0'));

    return (
        <div className="flex items-center gap-1.5 sm:gap-2" dir="ltr">
            {timeLeft.days > 0 && (
                <>
                    <TimerBox value={format(timeLeft.days)} bgColor={bgColor} />
                    <span style={{ color: textColor }} className="font-bold">:</span>
                </>
            )}
            <TimerBox value={format(timeLeft.hours)} bgColor={bgColor} />
            <span style={{ color: textColor }} className="font-bold">:</span>
            <TimerBox value={format(timeLeft.minutes)} bgColor={bgColor} />
            <span style={{ color: textColor }} className="font-bold">:</span>
            <TimerBox value={format(timeLeft.seconds)} bgColor={bgColor} />
        </div>
    );
};

interface SubscriptionPageProps {
    onBack: () => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onBack }) => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [activeOffer, setActiveOffer] = useState<Offer | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    // Testimonials data (Persian user reviews)
    const testimonials = [
        {
            name: 'مونا',
            text: 'فقط با عکس گرفتن از غذاهام، ۱۵ کیلو کم کردم! یکی از بهترین اتفاقات زندگیم. مررررسی لقمه.',
            avatar: '👩‍🦰'
        },
        {
            name: 'نیلوفر',
            text: 'همیشه یادم می‌رفت غذاهام رو وارد کنم و رژیمم نصفه می‌موند. ولی با لقمه همه‌چی خودکار انجام می‌شه. فقط عکس می‌گیرم و پیشرفتم رو هر روز می‌بینم، همین باعث شده ادامه بدم.',
            avatar: '👩'
        },
        {
            name: 'نیما',
            text: 'بعد از یه ماه استفاده از لقمه، دیدن پیشرفتم روی نمودار واقعاً خوشحالم کرد. اینکه بتونی مسیرت رو ببینی، خودش بزرگ‌ترین انگیزه‌ست.',
            avatar: '👨'
        },
        {
            name: 'پدرام',
            text: 'بهترین بخش لقمه برای من نمودار پیشرفته‌ست. می‌فهمم دقیقاً توی هفته چند درصد به هدف وزنیم نزدیک‌تر شدم.',
            avatar: '👨‍💼'
        },
        {
            name: 'رامین',
            text: 'احساس می‌کنم یه مربی کوچیک توی جیبمه! هر بار یه غذای جدید می‌خورم، لقمه آنالیزش می‌کنه و راهنمایی می‌ده چطور متعادل‌تر بخورم.',
            avatar: '🧑'
        },
        {
            name: 'الناز',
            text: 'اینکه غذاهای ایرانی رو میشناسه فوق العاده س، لقمه حتی خورشت و برنج رو هم درست تشخیص داد 😅 خیلی دقیق و کاربردیه.',
            avatar: '👩‍🦱'
        },
        {
            name: 'میترا',
            text: 'همیشه دنبال یه راه ساده بودم که بفهمم چی می‌خورم بدون محاسبه و سرچ کردن. لقمه دقیقاً همونه. حس می‌کنم بالاخره یه اپ طراحی شده برای آدمای واقعی!',
            avatar: '👩‍💻'
        }
    ];

    // Auto-rotate testimonials every 5 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [testimonials.length]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [fetchedPlans, fetchedOffers, profile] = await Promise.all([
                    apiService.getSubscriptionPlans(),
                    apiService.getActiveOffers(),
                    apiService.getUserProfile()
                ]);

                // Filter active plans just in case
                const activePlans = fetchedPlans.filter(p => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
                setPlans(activePlans);
                setUserProfile(profile);

                // Find valid offer
                if (fetchedOffers.length > 0) {
                    const offer = fetchedOffers.find(o => o.isActive); // Should select best offer logic here
                    if (offer) {
                        // Check effective end date logic here, though simplified
                        // Actual validation happens via getEffectiveEndDate
                        setActiveOffer(offer);
                    }
                }

                // Default selection: Yearly (usually best value) or the one in the offer
                const yearlyPlan = activePlans.find(p => p.duration === 'yearly');
                if (yearlyPlan) setSelectedPlanId(yearlyPlan._id);
                else if (activePlans.length > 0) setSelectedPlanId(activePlans[0]._id);

            } catch (error) {
                console.error("Failed to load subscription data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Helper to get effective end date (copied logic from flutter/OfferBanner)
    const getEffectiveEndDate = (offer: Offer, userCreatedAt?: string): Date | null => {
        if (offer.isTimeLimited && offer.endDate) {
            return new Date(offer.endDate);
        }
        if (offer.targetUserType === 'new' && offer.conditions?.userRegisteredWithinDays && userCreatedAt) {
            const userDate = new Date(userCreatedAt);
            userDate.setDate(userDate.getDate() + offer.conditions.userRegisteredWithinDays);
            return userDate;
        }
        return null;
    };

    const calculatePrice = (plan: SubscriptionPlan): { finalPrice: number, originalPrice: number, hasDiscount: boolean, discountPercent: number } => {
        // Base logic
        let finalPrice = plan.price;
        let originalPrice = plan.originalPrice || plan.price;
        let hasDiscount = (plan.originalPrice && plan.originalPrice > plan.price) || false;
        let discountPercent = plan.discountPercentage || 0;

        // Offer logic
        if (activeOffer) {
            const applies = activeOffer.applyToAllPlans || activeOffer.applicablePlans.includes(plan._id);
            if (applies) {
                const base = plan.price;

                let offerPrice = base;
                if (activeOffer.offerType === 'percentage' && activeOffer.discountPercentage) {
                    offerPrice = base * (1 - activeOffer.discountPercentage / 100);
                } else if (activeOffer.offerType === 'fixed_amount' && activeOffer.discountAmount) {
                    offerPrice = Math.max(0, base - activeOffer.discountAmount);
                }

                if (offerPrice < finalPrice) {
                    finalPrice = offerPrice;
                    hasDiscount = true;
                    discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
                }
            }
        }

        return { finalPrice, originalPrice, hasDiscount, discountPercent };
    };

    const handlePurchase = () => {
        setIsPurchasing(true);
        // Simulate Purchase API call
        setTimeout(() => {
            alert('اتصال به درگاه پرداخت...');
            setIsPurchasing(false);
        }, 1500);
    };

    const renderPlanCard = (plan: SubscriptionPlan, isSelected: boolean, isOfferTarget: boolean = false) => {
        const { finalPrice, originalPrice, hasDiscount, discountPercent } = calculatePrice(plan);

        let accentColor = '#64748B'; // Default slate
        if (plan.duration === 'yearly') accentColor = '#E53935';
        if (plan.duration === '3month') accentColor = '#0EA5E9';
        if (plan.duration === 'monthly') accentColor = '#4CAF50';

        // If there is an active offer and this is the target/highlighted plan, use offer color if available
        if (isOfferTarget && activeOffer && activeOffer.display.backgroundColor) {
            accentColor = activeOffer.display.backgroundColor;
        }

        const borderColor = isSelected ? accentColor : 'transparent';
        const bgColor = '#FFFFFF';

        return (
            <div
                key={plan._id}
                onClick={() => setSelectedPlanId(plan._id)}
                className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-300 border-[3px]
                    ${isSelected ? 'shadow-md scale-[1.02]' : 'shadow-sm hover:scale-[1.01] border-transparent'}
                `}
                style={{
                    borderColor: borderColor,
                    backgroundColor: bgColor,
                }}
            >
                <div className="flex justify-between items-center">
                    {/* Left Side: Title & Prices */}
                    <div className="flex-1">
                        <h3 className="text-gray-600 font-medium text-sm mb-1">{plan.title || plan.name}</h3>

                        <div className="flex items-center gap-2 flex-wrap">
                            {hasDiscount && (
                                <span className="text-gray-400 text-sm line-through decoration-gray-400">
                                    {toPersianNumbers(formatPrice(originalPrice))}
                                </span>
                            )}
                            <span className="text-gray-900 font-black text-xl">
                                {toPersianNumbers(formatPrice(finalPrice))}
                                <span className="text-xs font-normal text-gray-500 mr-1">تومان</span>
                            </span>

                            {hasDiscount && (
                                <span
                                    className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    {toPersianNumbers(discountPercent)}٪ تخفیف
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Per Month Calculation */}
                    <div className="text-left rtl:text-right border-r-2 border-gray-100 pr-4 mr-2">
                        <div className="flex flex-col items-end">
                            <span className="text-gray-800 font-bold text-lg">
                                {toPersianNumbers(formatPrice(Math.round(finalPrice / (plan.duration === 'yearly' ? 12 : plan.duration === '3month' ? 3 : 1))))}
                            </span>
                            <span className="text-gray-400 text-[10px]">ماهانه</span>
                        </div>
                    </div>
                </div>

                {/* Selection Checkmark */}
                {isSelected && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 shadow-sm">
                        <div className="rounded-full p-0.5" style={{ backgroundColor: accentColor }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const yearlyPlan = plans.find(p => p.duration === 'yearly');
    const otherPlans = plans.filter(p => p.duration !== 'yearly');

    // Logic to determine Hero Image from Plans (Yearly > 3Month > Monthly > Default)
    const getHeroImage = () => {
        const pYearly = plans.find(p => p.duration === 'yearly');
        const p3Month = plans.find(p => p.duration === '3month');
        const pMonthly = plans.find(p => p.duration === 'monthly');

        let imgUrl = null;
        if (pYearly?.imageUrl) imgUrl = pYearly.imageUrl;
        else if (p3Month?.imageUrl) imgUrl = p3Month.imageUrl;
        else if (pMonthly?.imageUrl) imgUrl = pMonthly.imageUrl;

        if (imgUrl) {
            return imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
        }
        return 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop&q=80';
    };

    const heroImageUrl = getHeroImage();

    const effectiveEndDate = activeOffer ? getEffectiveEndDate(activeOffer, userProfile?.createdAt) : null;
    const isOfferValid = activeOffer && (!effectiveEndDate || new Date() < effectiveEndDate);

    return (
        <div className="min-h-screen bg-[#F5F7FA] pb-safe-bottom flex flex-col font-sans">
            {/* Header */}
            <div className="bg-white px-6 pt-safe-top pb-4 shadow-sm flex items-center justify-between z-10 sticky top-0">
                <button
                    onClick={onBack}
                    className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
                <h1 className="text-lg font-black text-gray-800">خرید اشتراک</h1>
                <div className="w-10" />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-24">
                <div className="max-w-md mx-auto w-full">

                    {/* Hero Image & Testimonials Section */}
                    <div className="bg-white px-6 pb-6 pt-5">
                        {/* Hero Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="relative rounded-3xl overflow-hidden shadow-xl mb-6 bg-gray-100"
                        >
                            <img
                                src={heroImageUrl}
                                alt="Subscription Plan"
                                className="w-full h-52 object-cover"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop&q=80';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 right-4 left-4">
                                <h3 className="text-white font-black text-xl drop-shadow-lg">
                                    🍽️ تغذیه هوشمند با لقمه
                                </h3>
                            </div>
                        </motion.div>

                        {/* Testimonials Carousel */}
                        <div className="relative h-48 mb-5">
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 100 }}
                                    animate={{
                                        opacity: currentTestimonial === index ? 1 : 0,
                                        x: currentTestimonial === index ? 0 : currentTestimonial > index ? -100 : 100,
                                        zIndex: currentTestimonial === index ? 10 : 0
                                    }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-white rounded-2xl p-4 shadow-lg border border-gray-100"
                                    onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                                >
                                    {/* User Info */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-2xl shadow-md">
                                            {testimonial.avatar}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-base">{testimonial.name}</h4>
                                            <div className="flex gap-0.5 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Testimonial Text */}
                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                                        {testimonial.text}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Testimonial Indicators */}
                        <div className="flex justify-center gap-2">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentTestimonial(index)}
                                    className={`h-2 rounded-full transition-all duration-300 ${currentTestimonial === index
                                        ? 'w-8 bg-gray-800'
                                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="px-6 space-y-6">


                        {/* Pricing Section */}
                        <div className="space-y-4">

                            {/* Offer Banner + Yearly Plan Wrapper */}
                            {isOfferValid && activeOffer && yearlyPlan ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative rounded-[24px] overflow-hidden shadow-xl"
                                    style={{
                                        background: `linear-gradient(135deg, ${activeOffer.display.backgroundColor} 0%, ${darkenColor(activeOffer.display.backgroundColor)} 100%)`
                                    }}
                                >
                                    {/* Decorative elements */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                                    <div className="p-5 pb-6">
                                        {/* Banner Header */}
                                        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mb-6">
                                            {/* Timer */}
                                            {effectiveEndDate && (
                                                <CountdownTimer
                                                    endDate={effectiveEndDate}
                                                    bgColor={activeOffer.display.backgroundColor}
                                                    textColor="white"
                                                />
                                            )}

                                            {/* Text */}
                                            <div className="text-center sm:text-right flex-1">
                                                <h3 className="text-white font-black text-lg sm:text-xl leading-tight">
                                                    {activeOffer.display.bannerText}
                                                </h3>
                                                {activeOffer.display.bannerSubtext && (
                                                    <p className="text-white/90 text-xs sm:text-sm mt-1 font-medium">
                                                        {activeOffer.display.bannerSubtext}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* The Yearly Plan Card Nested Inside */}
                                        {renderPlanCard(yearlyPlan, selectedPlanId === yearlyPlan._id, true)}
                                    </div>
                                </motion.div>
                            ) : (
                                // Fallback if no offer or no yearly plan
                                yearlyPlan && renderPlanCard(yearlyPlan, selectedPlanId === yearlyPlan._id)
                            )}

                            {/* Other Plans */}
                            {otherPlans.map(plan => renderPlanCard(plan, selectedPlanId === plan._id))}
                        </div>

                        {/* Hero Text */}
                        <div className="text-center space-y-2 mb-8 pt-6">
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                به جمع کاربران <span className="text-blue-500">ویژه</span> بپیوندید
                            </h2>
                            <p className="text-gray-500 text-sm leading-relaxed px-4">
                                با اشتراک ویژه، بدون محدودیت از تمام امکانات هوشمند کالری‌شمار و تحلیلگر استفاده کنید.
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {[
                                { text: 'تحلیل نامحدود غذا', icon: '📸' },
                                { text: 'برنامه غذایی اختصاصی', icon: '🥗' },
                                { text: 'چت هوشمند نامحدود', icon: '💬' },
                                { text: 'حذف تبلیغات', icon: '🚫' },
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded-2xl shadow-sm">
                                    <span className="text-xl">{feature.icon}</span>
                                    <span className="text-xs font-bold text-gray-700">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Purchase Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 pb-8 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                <div className="max-w-md mx-auto w-full flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">مبلغ قابل پرداخت</p>
                        <div className="flex items-center gap-1">
                            <span className="font-black text-2xl text-gray-900">
                                {(() => {
                                    const selected = plans.find(p => p._id === selectedPlanId);
                                    if (!selected) return '---';
                                    return toPersianNumbers(formatPrice(calculatePrice(selected).finalPrice));
                                })()}
                            </span>
                            <span className="text-xs font-bold text-gray-500">تومان</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePurchase}
                        disabled={isPurchasing || !selectedPlanId}
                        className={`
                            px-8 py-4 rounded-xl font-bold text-white text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2
                            ${isPurchasing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'}
                        `}
                    >
                        {isPurchasing ? (
                            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>پرداخت و فعال‌سازی</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
