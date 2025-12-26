"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../translations';
import { apiService } from '../services/apiService';

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
    const [step, setStep] = useState<'dice' | 'offer'>('dice');
    const [expiresAt, setExpiresAt] = useState<string | null>(null);

    // Reset to dice step whenever modal opens, unless already active
    useEffect(() => {
        if (isOpen) {
            const checkStatus = async () => {
                const profile = await apiService.getUserProfile();
                if (profile?.oneTimeOfferExpiresAt && new Date(profile.oneTimeOfferExpiresAt) > new Date()) {
                    setExpiresAt(profile.oneTimeOfferExpiresAt);
                    setStep('offer');
                } else {
                    setStep('dice');
                }
            };
            checkStatus();
        }
    }, [isOpen]);

    const handleDiceComplete = async () => {
        try {
            const result = await apiService.activateOneTimeOffer();
            if (result?.expiresAt) {
                setExpiresAt(result.expiresAt);
                setStep('offer');
            }
        } catch (e) {
            console.error("Failed to activate offer", e);
            // Fallback for demo if offline/error
            const fakeExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            setExpiresAt(fakeExpiry);
            setStep('offer');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    key="modal-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] bg-white flex flex-col overflow-y-auto overflow-x-hidden"
                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                    <AnimatePresence mode="wait">
                        {step === 'dice' ? (
                            <DiceStep key="dice-step" onComplete={handleDiceComplete} onClose={onClose} />
                        ) : (
                            <OfferStep key="offer-step" onClose={onClose} onPurchase={onPurchase} t={t} expiresAt={expiresAt} />
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const DiceStep = ({ onComplete, onClose }: { onComplete: () => void, onClose: () => void }) => {
    const [isRolling, setIsRolling] = useState(false);

    const handleRoll = () => {
        if (isRolling) return;

        // Play dice sound
        const audio = new Audio('/app/dicesound.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));

        setIsRolling(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-between relative h-full bg-slate-50"
        >


            <div className="flex-1 flex flex-col items-center justify-center w-full perspective-container pb-20">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-black text-gray-900 mb-16 mt-12 text-center px-4"
                >
                    Roll for a Discount!
                </motion.h2>

                <div className="h-48 w-48 flex items-center justify-center relative" style={{ perspective: '1000px' }}>
                    <Dice3D isRolling={isRolling} onLand={onComplete} />
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-500 mt-16 text-center max-w-xs px-4 font-medium"
                >
                    Drop the dice to reveal your exclusive one-time offer.
                </motion.p>
            </div>

            <div className="w-full p-6 max-w-md mx-auto bg-white/50 backdrop-blur-sm border-t border-gray-100">
                <button
                    onClick={handleRoll}
                    disabled={isRolling}
                    className="w-full py-5 bg-gray-900 hover:bg-black disabled:bg-gray-700 text-white font-bold text-xl rounded-2xl transition-all duration-200 shadow-xl shadow-gray-900/20 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
                >
                    {isRolling ? 'Rolling...' : 'Drop Dice'}
                </button>
            </div>
        </motion.div>
    );
};

const Dice3D = ({ isRolling, onLand }: { isRolling: boolean, onLand: () => void }) => {
    // We want to land with face 5 showing.
    // Standard mapping:
    // Front: 1 (Z)
    // Top: 5 (Y) -> To view this, we rotate container X by -90deg.

    return (
        <motion.div
            className="w-32 h-32 relative"
            style={{
                transformStyle: 'preserve-3d',
                width: '8rem',
                height: '8rem'
            }}
            initial={{ rotateX: -25, rotateY: 25, rotateZ: 0 }}
            animate={isRolling ? {
                rotateX: [0, 720, 1440, 1710], // 1710 = 360*4 + 270 (which is -90). Lands on Top Face (5)
                rotateY: [0, 720, 1080, 1440], // Multiple of 360, lands back to 0
                rotateZ: [0, 360, 720, 360],   // Lands back to 0
                y: [0, -300, 0], // Jump up higher
                scale: [1, 1.2, 1]
            } : {
                rotateX: -25,
                rotateY: 25,
                y: [0, -15, 0],
                transition: {
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut"
                }
            }}
            transition={isRolling ? {
                duration: 2.5,
                ease: "circOut", // Slow down at end
                times: [0, 0.4, 0.7, 1]
            } : {}}
            onAnimationComplete={() => {
                if (isRolling) {
                    setTimeout(onLand, 600);
                }
            }}
        >
            <DiceFace index={1} transform="translateZ(4rem)" dots={[5]} />
            <DiceFace index={6} transform="translateZ(-4rem) rotateY(180deg)" dots={[1, 3, 4, 6, 7, 9]} />
            <DiceFace index={2} transform="rotateX(-90deg) translateZ(4rem)" dots={[1, 9]} />
            <DiceFace index={5} transform="rotateX(90deg) translateZ(4rem)" dots={[1, 3, 5, 7, 9]} />
            <DiceFace index={3} transform="rotateY(90deg) translateZ(4rem)" dots={[1, 5, 9]} />
            <DiceFace index={4} transform="rotateY(-90deg) translateZ(4rem)" dots={[1, 3, 7, 9]} />
        </motion.div>
    );
};

const DiceFace = ({ index, transform, dots }: { index: number, transform: string, dots: number[] }) => (
    <div
        className="absolute inset-0 bg-white rounded-2xl border border-gray-200 flex flex-wrap p-3 justify-between content-between"
        style={{
            transform,
            backfaceVisibility: 'hidden',
            // Adding a slight inset shadow for depth
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
        }}
    >
        {/* Render dots based on a 3x3 grid logic 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className="w-1/3 h-1/3 flex items-center justify-center">
                {dots.includes(i) && (
                    <div className="w-3.5 h-3.5 rounded-full bg-black shadow-sm" />
                )}
            </div>
        ))}
    </div>
);

const OfferStep = ({ onClose, onPurchase, t, expiresAt }: { onClose: () => void, onPurchase: () => void, t: any, expiresAt: string | null }) => {
    const [timeLeft, setTimeLeft] = useState<{ m: number, s: number } | null>(null);

    useEffect(() => {
        if (!expiresAt) return;

        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(expiresAt);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                clearInterval(interval);
                setTimeLeft({ m: 0, s: 0 });
                onClose(); // Close modal if offer expired
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft({ m, s });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full bg-white"
        >
            {/* Close Button */}
            <div className="flex justify-end p-6 sticky top-0 bg-white/80 backdrop-blur-md z-10 w-full">
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
                    {/* Timer */}
                    {timeLeft && (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="relative group mb-8"
                        >
                            <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 rounded-full" />
                            <div className="relative px-6 py-3 bg-gradient-to-br from-red-50 to-white rounded-full border border-red-100 shadow-[0_10px_20px_-10px_rgba(239,68,68,0.3)] flex items-center gap-4">
                                {/* 3D Clock Icon Animation */}
                                <div className="relative w-8 h-8">
                                    <motion.div
                                        animate={{ rotateY: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="w-full h-full text-red-500 drop-shadow-sm"
                                        style={{ transformStyle: "preserve-3d" }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                                        </svg>
                                    </motion.div>
                                </div>

                                {/* Digits */}
                                <div className="font-mono text-3xl font-black text-red-600 tracking-wider flex items-center gap-0.5 drop-shadow-sm">
                                    <AnimatedDigit digit={Math.floor(timeLeft.m / 10)} />
                                    <AnimatedDigit digit={timeLeft.m % 10} />
                                    <span className="pb-1">:</span>
                                    <AnimatedDigit digit={Math.floor(timeLeft.s / 10)} />
                                    <AnimatedDigit digit={timeLeft.s % 10} />
                                </div>
                            </div>
                        </motion.div>
                    )}

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
                            US$49.99
                        </span>
                        <span className="text-4xl font-black text-gray-900">
                            US$24.99
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
                            href="https://loqmeapp.ir/terms-of-use/en"
                            target="_blank"
                            className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                        >
                            {t('oneTimeOffer.termsOfUse')}
                        </a>
                        <a
                            href="https://loqmeapp.ir/privacy-policy/en"
                            target="_blank"
                            className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                        >
                            {t('oneTimeOffer.privacyPolicy')}
                        </a>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

const AnimatedDigit = ({ digit }: { digit: number }) => (
    <div className="relative h-9 w-6 overflow-hidden">
        <AnimatePresence mode="popLayout">
            <motion.span
                key={digit}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-100%' }}
                transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                {digit}
            </motion.span>
        </AnimatePresence>
    </div>
);

export default OneTimeOfferModal;
