"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../translations';

interface SubscriptionDetails {
    planType?: 'monthly' | 'yearly' | string;
    expiryDate?: string | null;
}

interface SubscriptionPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchase: (plan: 'monthly' | 'yearly') => void;
    isSubscribed?: boolean; // If true, skip directly to plan selection
    subscriptionDetails?: SubscriptionDetails; // Current subscription info
    isLoading?: boolean;
}

const SubscriptionPromptModal: React.FC<SubscriptionPromptModalProps> = ({
    isOpen,
    onClose,
    onPurchase,
    isSubscribed = false,
    subscriptionDetails,
    isLoading = false
}) => {
    const { t, isRTL, locale } = useTranslation();
    // Start at step 3 if already subscribed, otherwise step 1
    const [step, setStep] = useState<1 | 2 | 3>(isSubscribed ? 3 : 1);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

    // Reset step when modal closes, or set to 3 if subscribed
    React.useEffect(() => {
        if (!isOpen) {
            setStep(isSubscribed ? 3 : 1);
            setSelectedPlan('yearly');
        }
    }, [isOpen, isSubscribed]);

    if (!isOpen) return null;

    const handleTryFreeClick = () => {
        setStep(2);
    };

    const handleContinueFree = () => {
        setStep(3);
    };

    const handleFinalAction = () => {
        onPurchase(selectedPlan);
    };

    const handleBack = () => {
        // If subscribed, don't allow going back to promotional steps
        if (isSubscribed) {
            onClose();
            return;
        }
        if (step === 2) setStep(1);
        if (step === 3) setStep(2);
    };

    const getBillingDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 3);
        try {
            return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto"
                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                    {/* Header with Back and Close buttons */}
                    <div className="flex justify-between items-center p-6 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                        {/* Back Button - Show on step 2 & 3 */}
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                disabled={isLoading}
                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:text-gray-300 transition-colors rounded-full hover:bg-gray-100"
                                aria-label="Back"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        ) : (
                            <div className="w-10" />
                        )}

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:text-gray-200 transition-colors rounded-full hover:bg-gray-100"
                            aria-label="Close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-x-hidden">
                        <AnimatePresence mode="wait" initial={false}>
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="px-6 pb-12 pt-4 flex flex-col items-center max-w-md mx-auto h-full justify-center"
                                >
                                    {/* Phone Mockup Section */}
                                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                                        <h2 className="text-3xl font-black text-gray-900 text-center leading-tight mb-4">
                                            {t('subscriptionPrompt.title')}
                                        </h2>

                                        <div className="relative w-64 h-[460px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl mb-4 transform scale-90 sm:scale-100 transition-transform">
                                            <div className="w-full h-full bg-gray-800 rounded-[2.5rem] overflow-hidden relative" dir="ltr">
                                                {/* Status Bar */}
                                                <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-6 text-white text-xs z-10">
                                                    <span className="font-medium">9:41</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-4 h-4 rounded-full bg-black/20" />
                                                        <div className="w-4 h-4 rounded-full bg-black/20" />
                                                    </div>
                                                </div>

                                                {/* App Preview - Food Image */}
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                                    <div className="relative w-full h-full">
                                                        <img
                                                            src="/app/images/sampleimage.jpeg"
                                                            alt="Food Analysis"
                                                            className="w-full h-full object-cover"
                                                        />

                                                        {/* Scanning Overlay Effect */}
                                                        <div className="absolute inset-0 bg-black/10" />

                                                        {/* Scanning Line Animation */}
                                                        <div className="absolute left-0 right-0 h-1 bg-green-400/50 shadow-[0_0_20px_rgba(74,222,128,0.5)] animate-scan" style={{ top: '50%' }} />

                                                        {/* Overlay UI */}
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                            <div className="absolute bottom-12 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                                <span className="text-white font-medium text-sm">Identifying Food...</span>
                                                            </div>
                                                        </div>

                                                        {/* Scanning Corners (kept generic) */}
                                                        <div className="absolute top-1/4 left-8 right-8 bottom-1/4 pointer-events-none">
                                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/50 rounded-tl-xl" />
                                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/50 rounded-tr-xl" />
                                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/50 rounded-bl-xl" />
                                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/50 rounded-br-xl" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Action Area */}
                                    <div className="w-full mt-auto">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-900 font-bold text-sm">
                                                {t('subscriptionPrompt.noPaymentDue')}
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleTryFreeClick}
                                            disabled={isLoading}
                                            className="w-full py-5 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-bold text-xl rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-xl shadow-gray-900/20 mb-2"
                                        >
                                            {t('subscriptionPrompt.tryForFree')}
                                        </button>

                                        <p className="text-center text-gray-500 text-sm font-medium">
                                            {t('subscriptionPrompt.priceInfo')}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="px-6 pb-12 pt-8 flex flex-col items-center max-w-md mx-auto h-full"
                                >
                                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                                        <h2 className="text-4xl font-black text-gray-900 text-center leading-tight mb-16">
                                            {t('subscriptionPrompt.reminderTitle')}
                                        </h2>

                                        <div className="relative mb-20 scale-125">
                                            <motion.div
                                                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                                                transition={{ duration: 0.5, delay: 0.5, repeat: 1, repeatDelay: 2 }}
                                                className="text-[#E7E9ED]"
                                            >
                                                <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                                                </svg>
                                            </motion.div>

                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", delay: 0.2 }}
                                                className={`absolute -top-1 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${isRTL ? '-left-1' : '-right-1'}`}
                                            >
                                                <span className="text-white font-bold text-xl">1</span>
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="w-full mt-auto">
                                        <div className="flex items-center justify-center gap-2 mb-6">
                                            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-900 font-bold text-sm">
                                                {t('subscriptionPrompt.noPaymentDue')}
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleContinueFree}
                                            disabled={isLoading}
                                            className="w-full py-5 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-bold text-xl rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-xl shadow-gray-900/20 mb-4"
                                        >
                                            {t('subscriptionPrompt.continueForFree')}
                                        </button>

                                        <p className="text-center text-gray-500 text-sm font-medium">
                                            {t('subscriptionPrompt.priceInfo')}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="px-6 pb-12 pt-2 flex flex-col items-center max-w-md mx-auto h-full"
                                >
                                    {isSubscribed ? (
                                        <div className="flex flex-col items-center w-full h-full pt-10">
                                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                                                <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>

                                            <h2 className="text-2xl font-black text-gray-900 text-center mb-3">
                                                {t('subscription.active.title')}
                                            </h2>

                                            <p className="text-gray-500 text-center mb-8 max-w-xs">
                                                {t('subscription.active.description')}
                                            </p>

                                            <div className="w-full bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-auto">
                                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                                                    <span className="text-gray-500 font-medium text-sm">{t('subscription.status')}</span>
                                                    <span className="text-green-700 font-bold bg-green-100 px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                                                        {t('settings.subscription.statusActive')}
                                                    </span>
                                                </div>

                                                {subscriptionDetails?.planType && (
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-gray-500 font-medium text-sm">{t('subscription.plan')}</span>
                                                        <span className="text-gray-900 font-bold capitalize">
                                                            {subscriptionDetails.planType}
                                                        </span>
                                                    </div>
                                                )}

                                                {subscriptionDetails?.expiryDate && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-500 font-medium text-sm">{t('subscription.expires')}</span>
                                                        <span className="text-gray-900 font-bold text-sm">
                                                            {new Date(subscriptionDetails.expiryDate).toLocaleDateString(locale)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={onClose}
                                                className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold text-lg rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-gray-900/20"
                                            >
                                                {t('chat.closeButton')}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-3xl font-black text-gray-900 text-center leading-tight mb-8">
                                                {t('subscriptionPrompt.step3.title')}
                                            </h2>

                                            {/* Timeline */}
                                            <div className={`w-full mb-10 relative ${isRTL ? 'pr-6' : 'pl-6'}`}>
                                                {/* Vertical Line */}
                                                <div className={`absolute top-6 bottom-6 w-1 bg-gray-100 rounded-full ${isRTL ? 'right-[46px]' : 'left-[46px]'}`} />

                                                {/* Item 1 - Today */}
                                                <div className="relative flex gap-6 mb-8 group">
                                                    <div className="relative z-10 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center border-4 border-white shadow-sm shrink-0">
                                                        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    </div>
                                                    <div className="pt-1">
                                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{t('subscriptionPrompt.step3.timeline.today')}</h3>
                                                        <p className="text-gray-500 text-sm leading-relaxed">{t('subscriptionPrompt.step3.timeline.todayDesc')}</p>
                                                    </div>
                                                </div>

                                                {/* Item 2 - Reminder */}
                                                <div className="relative flex gap-6 mb-8 group">
                                                    <div className="relative z-10 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center border-4 border-white shadow-sm shrink-0">
                                                        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                        </svg>
                                                    </div>
                                                    <div className="pt-1">
                                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{t('subscriptionPrompt.step3.timeline.reminder')}</h3>
                                                        <p className="text-gray-500 text-sm leading-relaxed">{t('subscriptionPrompt.step3.timeline.reminderDesc')}</p>
                                                    </div>
                                                </div>

                                                {/* Item 3 - Billing */}
                                                <div className="relative flex gap-6 group">
                                                    <div className="relative z-10 w-12 h-12 rounded-full bg-black flex items-center justify-center border-4 border-white shadow-sm shrink-0">
                                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="pt-1">
                                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{t('subscriptionPrompt.step3.timeline.billing')}</h3>
                                                        <p className="text-gray-500 text-sm leading-relaxed">
                                                            {t('subscriptionPrompt.step3.timeline.billingDesc').replace('{{date}}', getBillingDate())}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Plans Selection */}
                                            <div className="w-full grid grid-cols-2 gap-4 mb-8">
                                                {/* Monthly Plan */}
                                                <button
                                                    onClick={() => setSelectedPlan('monthly')}
                                                    disabled={isLoading}
                                                    className={`relative p-4 rounded-2xl border-2 transition-all duration-200 h-24 flex flex-col justify-center ${selectedPlan === 'monthly'
                                                        ? 'border-black bg-gray-50'
                                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                                        } ${isRTL ? 'text-right' : 'text-left'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="font-medium text-gray-900 text-sm mb-1">
                                                        {t('subscriptionPrompt.step3.plans.monthly')}
                                                    </div>
                                                    <div className="font-bold text-xl text-gray-900">
                                                        $9.99 <span className="text-sm font-normal text-gray-500">{t('subscriptionPrompt.step3.plans.mo')}</span>
                                                    </div>

                                                    {selectedPlan === 'monthly' && (
                                                        <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full flex items-center justify-center ${isRTL ? 'left-3' : 'right-3'}`}>
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {selectedPlan !== 'monthly' && (
                                                        <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 border-2 border-gray-300 rounded-full ${isRTL ? 'left-3' : 'right-3'}`} />
                                                    )}
                                                </button>

                                                {/* Yearly Plan */}
                                                <button
                                                    onClick={() => setSelectedPlan('yearly')}
                                                    disabled={isLoading}
                                                    className={`relative p-4 rounded-2xl border-2 transition-all duration-200 h-24 flex flex-col justify-center ${selectedPlan === 'yearly'
                                                        ? 'border-black bg-gray-50'
                                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                                        } ${isRTL ? 'text-right' : 'text-left'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="font-medium text-gray-900 text-sm mb-1">
                                                        {t('subscriptionPrompt.step3.plans.yearly')}
                                                    </div>
                                                    <div className="font-bold text-xl text-gray-900">
                                                        $49.99 <span className="text-sm font-normal text-gray-500">{t('subscriptionPrompt.step3.plans.yr')}</span>
                                                    </div>

                                                    {/* Tag */}
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap z-10">
                                                        {t('subscriptionPrompt.step3.plans.threeDaysFree')}
                                                    </div>

                                                    {selectedPlan === 'yearly' && (
                                                        <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full flex items-center justify-center ${isRTL ? 'left-3' : 'right-3'}`}>
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {selectedPlan !== 'yearly' && (
                                                        <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 border-2 border-gray-300 rounded-full ${isRTL ? 'left-3' : 'right-3'}`} />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Action Area */}
                                            <div className="w-full mt-auto">
                                                <div className="flex items-center justify-center gap-2 mb-6">
                                                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-gray-900 font-bold text-sm">
                                                        {t('subscriptionPrompt.noPaymentDue')}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={handleFinalAction}
                                                    disabled={isLoading}
                                                    className="w-full py-5 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-bold text-xl rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-xl shadow-gray-900/20 mb-4 flex items-center justify-center gap-3"
                                                >
                                                    {isLoading && (
                                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    )}
                                                    {isLoading ? t('common.processing') || 'Processing...' : (selectedPlan === 'yearly'
                                                        ? t('subscriptionPrompt.step3.button.trial')
                                                        : t('subscriptionPrompt.step3.button.noTrial'))
                                                    }
                                                </button>

                                                <p className="text-center text-gray-500 text-xs font-medium">
                                                    {selectedPlan === 'yearly'
                                                        ? t('subscriptionPrompt.step3.footer.trial')
                                                            .replace('{{price}}', '$49.99')
                                                            .replace('{{monthlyPrice}}', '$4.17')
                                                        : t('subscriptionPrompt.step3.footer.noTrial').replace('{{price}}', '$9.99')
                                                    }
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SubscriptionPromptModal;
