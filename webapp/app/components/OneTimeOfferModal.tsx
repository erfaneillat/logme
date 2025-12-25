"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../translations';

interface OneTimeOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchase: () => void;
}

const OneTimeOfferModal: React.FC<OneTimeOfferModalProps> = ({
    isOpen,
    onClose,
    onPurchase
}) => {
    const { t, isRTL } = useTranslation();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] bg-white flex flex-col overflow-y-auto"
                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                    {/* Close Button */}
                    <div className="flex justify-end p-6 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 border border-gray-200"
                            aria-label="Close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-between px-6 pb-8 max-w-md mx-auto w-full">
                        {/* Top Content */}
                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                            {/* Title */}
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className="text-3xl font-black text-gray-900 text-center mb-3"
                            >
                                {t('oneTimeOffer.title')}
                            </motion.h1>

                            {/* Subtitle */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="text-gray-500 text-center mb-10"
                            >
                                {t('oneTimeOffer.subtitle')}
                            </motion.p>

                            {/* Discount Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{
                                    delay: 0.3,
                                    duration: 0.6,
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15
                                }}
                                className="relative mb-10"
                            >
                                {/* Floating sparkles */}
                                <motion.div
                                    animate={{
                                        y: [0, -5, 0],
                                        opacity: [0.5, 1, 0.5],
                                        scale: [0.8, 1, 0.8]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute -top-6 -left-8 text-2xl"
                                >
                                    ✦
                                </motion.div>
                                <motion.div
                                    animate={{
                                        y: [0, -3, 0],
                                        opacity: [0.5, 1, 0.5],
                                        scale: [0.9, 1.1, 0.9]
                                    }}
                                    transition={{
                                        duration: 1.8,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: 0.3
                                    }}
                                    className="absolute -bottom-2 -left-6 text-lg"
                                >
                                    ✦
                                </motion.div>
                                <motion.div
                                    animate={{
                                        y: [0, -4, 0],
                                        opacity: [0.5, 1, 0.5],
                                        scale: [0.85, 1.05, 0.85]
                                    }}
                                    transition={{
                                        duration: 2.2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: 0.6
                                    }}
                                    className="absolute -top-4 -right-10 text-xl"
                                >
                                    ✦
                                </motion.div>
                                <motion.div
                                    animate={{
                                        y: [0, -6, 0],
                                        opacity: [0.5, 1, 0.5],
                                        scale: [0.7, 1, 0.7]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: 0.9
                                    }}
                                    className="absolute bottom-4 -right-8 text-base"
                                >
                                    ✦
                                </motion.div>

                                {/* Main badge */}
                                <motion.div
                                    className="relative bg-gray-900 rounded-2xl px-10 py-8 shadow-2xl overflow-hidden"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    {/* Shimmer effect */}
                                    <motion.div
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "200%" }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 3,
                                            ease: "easeInOut"
                                        }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                                    />

                                    {/* Decorative notch - left */}
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-white rounded-r-full" />

                                    {/* Decorative notch - right */}
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-white rounded-l-full" />

                                    <div className="text-center relative z-10">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.5, duration: 0.4, type: "spring" }}
                                            className="text-5xl font-black text-white tracking-tight"
                                        >
                                            50%<span className="text-4xl">OFF</span>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.7, duration: 0.3 }}
                                            className="text-white/80 text-sm font-bold tracking-[0.3em] mt-1"
                                        >
                                            FOREVER
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Price Display */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="flex items-baseline gap-2 mb-3"
                            >
                                <span className="text-2xl text-gray-400 line-through font-medium">
                                    US$59.99
                                </span>
                                <span className="text-4xl font-black text-gray-900">
                                    US$29.99
                                </span>
                                <span className="text-xl text-gray-600 font-medium">
                                    /{t('oneTimeOffer.year')}
                                </span>
                            </motion.div>

                            {/* Lowest price ever badge */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                                className="text-gray-400 text-sm font-medium"
                            >
                                {t('oneTimeOffer.lowestPrice')}
                            </motion.p>
                        </div>

                        {/* Bottom Content */}
                        <div className="w-full mt-8">
                            {/* Price info */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.5 }}
                                className="text-gray-500 text-sm text-center mb-4"
                            >
                                {t('oneTimeOffer.pricePerYear')}
                            </motion.p>

                            {/* CTA Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onPurchase}
                                className="w-full py-5 bg-gray-900 hover:bg-black text-white font-bold text-xl rounded-2xl transition-all duration-200 shadow-xl shadow-gray-900/20 mb-4"
                            >
                                {t('oneTimeOffer.continue')}
                            </motion.button>

                            {/* Disclaimer */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9, duration: 0.5 }}
                                className="text-gray-400 text-xs text-center leading-relaxed mb-4"
                            >
                                {t('oneTimeOffer.disclaimer')}
                            </motion.p>

                            {/* Terms and Privacy */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1, duration: 0.5 }}
                                className="flex items-center justify-center gap-6"
                            >
                                <a
                                    href="/terms"
                                    target="_blank"
                                    className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                                >
                                    {t('oneTimeOffer.termsOfUse')}
                                </a>
                                <a
                                    href="/privacy"
                                    target="_blank"
                                    className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                                >
                                    {t('oneTimeOffer.privacyPolicy')}
                                </a>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OneTimeOfferModal;
