'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: 'success' | 'failed' | 'cancelled' | 'error';
    refId?: string;
    errorCode?: string;
}

export default function PaymentResultModal({
    isOpen,
    onClose,
    status,
    refId,
    errorCode,
}: PaymentResultModalProps) {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen && status === 'success') {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, status]);

    const getStatusConfig = () => {
        switch (status) {
            case 'success':
                return {
                    icon: (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
                        >
                            <motion.svg
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                                className="w-12 h-12 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                            >
                                <motion.path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </motion.svg>
                        </motion.div>
                    ),
                    title: 'پرداخت موفق!',
                    subtitle: 'اشتراک شما با موفقیت فعال شد',
                    gradient: 'from-green-500/20 to-emerald-500/20',
                    buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
                    buttonText: 'عالی! بزن بریم 🎉',
                };
            case 'cancelled':
                return {
                    icon: (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30"
                        >
                            <motion.svg
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="w-12 h-12 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </motion.svg>
                        </motion.div>
                    ),
                    title: 'پرداخت لغو شد',
                    subtitle: 'شما پرداخت را لغو کردید',
                    gradient: 'from-amber-500/20 to-orange-500/20',
                    buttonColor: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
                    buttonText: 'تلاش دوباره',
                };
            case 'failed':
            case 'error':
            default:
                return {
                    icon: (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30"
                        >
                            <motion.svg
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="w-12 h-12 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </motion.svg>
                        </motion.div>
                    ),
                    title: 'پرداخت ناموفق',
                    subtitle: errorCode ? `کد خطا: ${errorCode}` : 'متأسفانه پرداخت انجام نشد',
                    gradient: 'from-red-500/20 to-rose-500/20',
                    buttonColor: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
                    buttonText: 'تلاش دوباره',
                };
        }
    };

    const config = getStatusConfig();

    // Confetti particles
    const confettiColors = ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#f59e0b'];
    const confetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        size: 6 + Math.random() * 8,
    }));

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Confetti */}
                    {showConfetti && status === 'success' && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {confetti.map((particle) => (
                                <motion.div
                                    key={particle.id}
                                    initial={{
                                        x: `${particle.x}vw`,
                                        y: -20,
                                        rotate: 0,
                                        opacity: 1
                                    }}
                                    animate={{
                                        y: '110vh',
                                        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                                        opacity: [1, 1, 0]
                                    }}
                                    transition={{
                                        duration: particle.duration,
                                        delay: particle.delay,
                                        ease: 'linear'
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: particle.size,
                                        height: particle.size,
                                        backgroundColor: particle.color,
                                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-sm bg-gradient-to-br ${config.gradient} backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl overflow-hidden`}
                    >
                        {/* Decorative circles */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-tr from-white/10 to-transparent" />

                        {/* Content */}
                        <div className="relative p-8 flex flex-col items-center text-center">
                            {/* Icon */}
                            {config.icon}

                            {/* Title */}
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-6 text-2xl font-bold text-gray-800"
                            >
                                {config.title}
                            </motion.h2>

                            {/* Subtitle */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mt-2 text-gray-600"
                            >
                                {config.subtitle}
                            </motion.p>

                            {/* Ref ID for success */}
                            {status === 'success' && refId && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-4 px-4 py-2 bg-white/50 rounded-xl border border-green-200"
                                >
                                    <p className="text-xs text-gray-500 mb-1">کد پیگیری</p>
                                    <p className="text-lg font-mono font-bold text-green-600" dir="ltr">
                                        {refId}
                                    </p>
                                </motion.div>
                            )}

                            {/* Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className={`mt-6 w-full py-4 px-6 ${config.buttonColor} text-white font-bold rounded-2xl shadow-lg transition-all duration-300`}
                            >
                                {config.buttonText}
                            </motion.button>

                            {/* Secondary text for success */}
                            {status === 'success' && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="mt-4 text-xs text-gray-500"
                                >
                                    از خرید شما متشکریم! 💚
                                </motion.p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
