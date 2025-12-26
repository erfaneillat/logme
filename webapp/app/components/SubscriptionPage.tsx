"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiService, SubscriptionPlan, Offer, UserProfile, BASE_URL, fixImageUrl } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import { useTranslation, isGlobalMode } from '../translations';

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
    const [touchStart, setTouchStart] = useState(0);

    const [touchEnd, setTouchEnd] = useState(0);
    const { showToast } = useToast();

    // Testimonials data (Persian user reviews)
    const testimonials = [
        {
            name: 'مونا',
            text: 'فقط با عکس گرفتن از غذاهام، ۱۵ کیلو کم کردم! یکی از بهترین اتفاقات زندگیم. مررررسی لقمه.',
            image: '/app/images/comments/mona.jpg'
        },
        {
            name: 'نیلوفر',
            text: 'همیشه یادم می‌رفت غذاهام رو وارد کنم و رژیمم نصفه می‌موند. ولی با لقمه همه‌چی خودکار انجام می‌شه. فقط عکس می‌گیرم و پیشرفتم رو هر روز می‌بینم، همین باعث شده ادامه بدم.',
            image: '/app/images/comments/niloofar.jpg'
        },
        {
            name: 'نیما',
            text: 'بعد از یه ماه استفاده از لقمه، دیدن پیشرفتم روی نمودار واقعاً خوشحالم کرد. اینکه بتونی مسیرت رو ببینی، خودش بزرگ‌ترین انگیزه‌ست.',
            image: '/app/images/comments/nima.jpg'
        },
        {
            name: 'پدرام',
            text: 'بهترین بخش لقمه برای من نمودار پیشرفته‌ست. می‌فهمم دقیقاً توی هفته چند درصد به هدف وزنیم نزدیک‌تر شدم.',
            image: '/app/images/comments/pedram.jpg'
        },
        {
            name: 'رامین',
            text: 'احساس می‌کنم یه مربی کوچیک توی جیبمه! هر بار یه غذای جدید می‌خورم، لقمه آنالیزش می‌کنه و راهنمایی می‌ده چطور متعادل‌تر بخورم.',
            image: '/app/images/comments/ramin.jpg'
        },
        {
            name: 'الناز',
            text: 'اینکه غذاهای ایرانی رو میشناسه فوق العاده س، لقمه حتی خورشت و برنج رو هم درست تشخیص داد 😅 خیلی دقیق و کاربردیه.',
            image: '/app/images/comments/elnaz.jpg'
        },
        {
            name: 'میترا',
            text: 'همیشه دنبال یه راه ساده بودم که بفهمم چی می‌خورم بدون محاسبه و سرچ کردن. لقمه دقیقاً همونه. حس می‌کنم بالاخره یه اپ طراحی شده برای آدمای واقعی!',
            image: '/app/images/comments/mitra.jpg'
        }
    ];

    // Auto-rotate testimonials
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [testimonials.length]);

    // Handle Swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }
        if (isRightSwipe) {
            setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

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

    const calculatePrice = (plan: SubscriptionPlan): { finalPrice: number, originalPrice: number, hasDiscount: boolean, discountPercent: number, pricePerMonth?: number } => {
        // Start with plan's base price and original price
        const basePlanPrice = plan.price;
        let originalPrice = plan.originalPrice || plan.price;
        let finalPrice = basePlanPrice;
        let hasDiscount = false;
        let discountPercent = 0;
        let pricePerMonth: number | undefined = undefined;

        // Check if plan itself has a discount (no offer)
        if (plan.originalPrice && plan.originalPrice > plan.price) {
            hasDiscount = true;
            discountPercent = plan.discountPercentage || Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100);
        }

        // Apply offer discount if active and applicable
        if (activeOffer) {
            // Check if offer applies to this plan
            const planIdStr = String(plan._id);
            const applicablePlanIds = activeOffer.applicablePlans.map(p =>
                typeof p === 'object' && p !== null ? String((p as any)._id || p) : String(p)
            );
            const applies = activeOffer.applyToAllPlans || applicablePlanIds.includes(planIdStr);

            if (applies) {
                // Check if there's a plan-specific override in the offer
                // Handle case where planId might be an object with _id or a string
                const planPricing = activeOffer.planPricing?.find(pp => {
                    const ppPlanId = typeof pp.planId === 'object' && pp.planId !== null
                        ? String((pp.planId as any)._id || pp.planId)
                        : String(pp.planId);
                    return ppPlanId === planIdStr;
                });


                if (planPricing && planPricing.discountedPrice !== undefined) {
                    // Use the specific discounted price from the offer (this is pre-calculated)
                    finalPrice = planPricing.discountedPrice;
                    // Use the discountedPricePerMonth if available
                    if (planPricing.discountedPricePerMonth !== undefined) {
                        pricePerMonth = planPricing.discountedPricePerMonth;
                    }
                    // Original price should be the plan's originalPrice or basePlanPrice
                    originalPrice = plan.originalPrice || basePlanPrice;
                    hasDiscount = true;
                    // Use offer's discount percentage if available, otherwise calculate
                    if (activeOffer.discountPercentage) {
                        discountPercent = Math.round(activeOffer.discountPercentage);
                    } else {
                        discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
                    }
                } else {
                    // Calculate based on offer type (fallback)
                    const offerBase = basePlanPrice;
                    if (activeOffer.offerType === 'percentage' && activeOffer.discountPercentage) {
                        finalPrice = offerBase * (1 - activeOffer.discountPercentage / 100);
                    } else if (activeOffer.offerType === 'fixed_amount' && activeOffer.discountAmount) {
                        finalPrice = Math.max(0, offerBase - activeOffer.discountAmount);
                    }

                    // When offer is active, always show discount
                    if (finalPrice < offerBase) {
                        originalPrice = plan.originalPrice || basePlanPrice;
                        hasDiscount = true;
                        if (activeOffer.discountPercentage) {
                            discountPercent = Math.round(activeOffer.discountPercentage);
                        } else {
                            discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
                        }
                    }
                }
            }
        }

        return { finalPrice, originalPrice, hasDiscount, discountPercent, pricePerMonth };
    };

    const handlePurchase = async () => {
        if (!selectedPlanId) return;

        setIsPurchasing(true);

        try {
            // Find the selected plan
            const selectedPlan = plans.find(p => p._id === selectedPlanId);
            if (!selectedPlan) {
                setIsPurchasing(false);
                showToast(isGlobalMode() ? 'Please select a plan' : 'پلن انتخاب نشده است', 'error');
                return;
            }

            // Check if we're in Flutter WebView
            const isFlutterWebView = typeof window !== 'undefined' &&
                (window as any).FlutterBridge?.isFlutterWebView === true;

            // Check if we're in global mode
            const isGlobal = isGlobalMode();

            if (isFlutterWebView) {
                if (isGlobal) {
                    // Use RevenueCat payment via Flutter bridge for global users
                    console.log('Using RevenueCat payment via FlutterBridge');

                    // Get the RevenueCat product ID from plan or use default based on duration
                    let productId: string;
                    if (selectedPlan.revenueCatProductId) {
                        productId = selectedPlan.revenueCatProductId;
                    } else {
                        // Fallback to default product IDs based on duration
                        switch (selectedPlan.duration) {
                            case 'yearly':
                                productId = 'slice_yearly';
                                break;
                            case '3month':
                                productId = 'slice_3month';
                                break;
                            case 'monthly':
                            default:
                                productId = 'slice_monthly';
                                break;
                        }
                    }

                    console.log('Calling FlutterBridge.purchaseRevenueCat with productId:', productId);

                    try {
                        // Check if purchaseRevenueCat exists on FlutterBridge
                        if (!(window as any).FlutterBridge?.purchaseRevenueCat) {
                            console.error('FlutterBridge.purchaseRevenueCat not available');
                            showToast('Payment method not available', 'error');
                            setIsPurchasing(false);
                            return;
                        }

                        const result = await (window as any).FlutterBridge.purchaseRevenueCat(productId);
                        console.log('RevenueCat purchase result:', result);

                        if (result.success) {
                            // Verify with backend
                            console.log('Verifying RevenueCat purchase with backend...');
                            const verifyResult = await apiService.verifyRevenueCatPurchase({
                                productId: result.productId || productId,
                                transactionId: result.transactionId,
                                purchaseToken: result.purchaseToken,
                                store: result.store || 'play_store',
                                entitlementId: result.entitlementId || 'premium',
                            });

                            if (verifyResult.success) {
                                showToast('Subscription activated successfully!', 'success');
                                onBack();
                            } else {
                                // Purchase went through but backend verification failed
                                // Still show success since user was charged
                                console.warn('Backend verification failed but purchase successful:', verifyResult.message);
                                showToast('Subscription activated! Please refresh if not reflected.', 'success');
                                onBack();
                            }
                        } else {
                            showToast(result.message || 'Payment failed', 'error');
                        }
                    } catch (purchaseError: any) {
                        console.error('RevenueCat purchase error:', purchaseError);
                        showToast(purchaseError.message || 'Payment error', 'error');
                    }

                    setIsPurchasing(false);
                    return;
                } else {
                    // Use CafeBazaar payment via Flutter bridge for Iran users
                    console.log('Using CafeBazaar payment via FlutterBridge');

                    // Determine the product key to use
                    let productKey: string | undefined;

                    // Check if there's an active offer with a CafeBazaar product key
                    if (activeOffer) {
                        const planIdStr = String(selectedPlan._id);
                        const applicablePlanIds = activeOffer.applicablePlans.map(p =>
                            typeof p === 'object' && p !== null ? String((p as any)._id || p) : String(p)
                        );
                        const offerApplies = activeOffer.applyToAllPlans || applicablePlanIds.includes(planIdStr);

                        if (offerApplies && activeOffer.cafebazaarProductKey) {
                            productKey = activeOffer.cafebazaarProductKey;
                        }
                    }

                    // Fall back to plan's CafeBazaar product key
                    if (!productKey) {
                        productKey = selectedPlan.cafebazaarProductKey;
                    }

                    if (!productKey) {
                        setIsPurchasing(false);
                        showToast('این پلن برای خرید از کافه‌بازار پیکربندی نشده است', 'error');
                        return;
                    }

                    console.log('Calling FlutterBridge.purchaseCafeBazaar with productKey:', productKey);

                    try {
                        const result = await (window as any).FlutterBridge.purchaseCafeBazaar(productKey);
                        console.log('CafeBazaar purchase result:', result);

                        if (result.success) {
                            // Payment successful - show success message and go back
                            showToast('اشتراک شما با موفقیت فعال شد!', 'success');
                            onBack();
                        } else {
                            showToast(result.message || 'خطا در پرداخت', 'error');
                        }
                    } catch (purchaseError: any) {
                        console.error('CafeBazaar purchase error:', purchaseError);
                        showToast(purchaseError.message || 'خطا در پرداخت از کافه‌بازار', 'error');
                    }

                    setIsPurchasing(false);
                    return;
                }
            }

            // Regular web payment
            if (isGlobal) {
                // For global users on web without Flutter, show message to use app
                showToast('Please use the mobile app to subscribe', 'info');
                setIsPurchasing(false);
                return;
            }

            // Iran web payment via Zarinpal
            console.log('Creating Zarinpal payment for plan:', selectedPlan._id);

            // Get offer ID if applicable
            let offerId: string | undefined = undefined;
            if (activeOffer) {
                const planIdStr = String(selectedPlan._id);
                const applicablePlanIds = activeOffer.applicablePlans.map(p =>
                    typeof p === 'object' && p !== null ? String((p as any)._id || p) : String(p)
                );
                const offerApplies = activeOffer.applyToAllPlans || applicablePlanIds.includes(planIdStr);

                if (offerApplies) {
                    offerId = activeOffer._id;
                }
            }

            // Create payment with Zarinpal
            const paymentResult = await apiService.createZarinpalPayment(selectedPlan._id, offerId);

            if (!paymentResult.success || !paymentResult.paymentUrl) {
                setIsPurchasing(false);
                showToast(paymentResult.message || 'خطا در ایجاد پرداخت', 'error');
                return;
            }

            console.log('Payment created, redirecting to:', paymentResult.paymentUrl);

            // Redirect to Zarinpal payment gateway
            // Using replace() instead of href to prevent Zarinpal from appearing in back history
            window.location.replace(paymentResult.paymentUrl);

        } catch (error: any) {
            console.error('Payment error:', error);
            setIsPurchasing(false);
            showToast(isGlobalMode() ? 'Payment connection error' : 'خطا در برقراری ارتباط با درگاه پرداخت', 'error');
        }
    };

    const renderPlanCard = (plan: SubscriptionPlan, isSelected: boolean, isOfferTarget: boolean = false) => {
        const { finalPrice, originalPrice, hasDiscount, discountPercent, pricePerMonth } = calculatePrice(plan);

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

        // Calculate monthly price priority:
        // 1. pricePerMonth from offer's planPricing.discountedPricePerMonth
        // 2. plan.pricePerMonth from the plan database
        // 3. calculate from finalPrice / months
        const monthDivisor = plan.duration === 'yearly' ? 12 : plan.duration === '3month' ? 3 : 1;
        const displayPricePerMonth = pricePerMonth !== undefined
            ? pricePerMonth
            : (plan.pricePerMonth !== undefined ? plan.pricePerMonth : Math.round(finalPrice / monthDivisor));

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
                                {toPersianNumbers(formatPrice(displayPricePerMonth))}
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
            // Use fixImageUrl to properly handle localhost and Android emulator
            return fixImageUrl(imgUrl) || imgUrl;
        }
        return 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop&q=80';
    };

    const heroImageUrl = getHeroImage();

    const effectiveEndDate = activeOffer ? getEffectiveEndDate(activeOffer, userProfile?.createdAt) : null;
    const isOfferValid = activeOffer && (!effectiveEndDate || new Date() < effectiveEndDate);

    return (
        <div className="min-h-screen bg-[#F5F7FA] pb-safe-bottom flex flex-col font-sans overflow-x-hidden">
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
                        <div
                            className="relative h-48 mb-5 overflow-hidden"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
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
                                        <div className="w-12 h-12 rounded-full overflow-hidden shadow-md border-2 border-green-500">
                                            <img
                                                src={testimonial.image}
                                                alt={testimonial.name}
                                                className="w-full h-full object-cover"
                                            />
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
            <div className="fixed bottom-0 left-0 right-0 bg-white px-4 py-3 rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                <div className="max-w-md mx-auto w-full">
                    <button
                        onClick={handlePurchase}
                        disabled={isPurchasing || !selectedPlanId}
                        className={`
                            w-full px-6 py-3.5 rounded-xl font-bold text-white text-sm shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2
                            ${isPurchasing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'}
                        `}
                    >
                        {isPurchasing ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>پرداخت و فعال‌سازی</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
