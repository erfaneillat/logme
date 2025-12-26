"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OneTimeOfferWidgetProps {
    expiresAt: string | null;
    onClick: () => void;
}

const OneTimeOfferWidget: React.FC<OneTimeOfferWidgetProps> = ({ expiresAt, onClick }) => {
    const [timeLeft, setTimeLeft] = useState<{ m: number, s: number } | null>(null);

    useEffect(() => {
        if (!expiresAt) {
            setTimeLeft(null);
            return;
        }

        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(expiresAt);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                clearInterval(interval);
                setTimeLeft(null);
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft({ m, s });
            }
        }, 1000);

        // Initial calc
        const now = new Date();
        const end = new Date(expiresAt);
        const diff = end.getTime() - now.getTime();
        if (diff > 0) {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft({ m, s });
        } else {
            setTimeLeft(null);
        }

        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!timeLeft) return null;

    return (
        <AnimatePresence>
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className="relative group flex items-center gap-2 px-3 py-2 rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/30 border border-red-400/50 hover:bg-red-600 transition-all duration-300"
            >
                {/* 50% & Icon */}
                <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm italic">50%</span>
                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-wide">OFF</span>
                </div>

                <div className="h-4 w-px bg-white/30" />

                {/* Timer */}
                <div className="font-mono text-sm font-bold tabular-nums flex items-center gap-1">
                    <motion.div
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-white mb-0.5"
                    />
                    {String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
                </div>
            </motion.button>
        </AnimatePresence>
    );
};

export default OneTimeOfferWidget;
