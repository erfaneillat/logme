import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface SplashProps {
    onFinish: () => void;
}

export default function Splash({ onFinish }: SplashProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onFinish();
        }, 2500);

        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    duration: 0.8,
                    ease: [0, 0.71, 0.2, 1.01],
                    scale: {
                        type: "spring",
                        damping: 10,
                        stiffness: 100,
                        restDelta: 0.001
                    }
                }}
                className="relative flex flex-col items-center"
            >
                <div className="relative w-32 h-32 mb-4">
                    {/* Pulsing effect behind logo */}
                    <motion.div
                        className="absolute inset-0 bg-orange-500/10 rounded-full blur-xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <Image
                        src="/app/images/loqme_logo.png"
                        alt="Loqme Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-2xl font-bold text-gray-800"
                >
                    لقمه
                </motion.h1>
            </motion.div>
        </div>
    );
}
