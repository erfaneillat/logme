'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface OnboardingData {
    id: number;
    image: string;
    title: string;
    subtitle: string;
    Overlay: React.FC;
}

const WeightGoalOverlay = () => (
    <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        className="absolute top-1/4 left-8 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl"
    >
        <div className="text-white/80 text-sm mb-1">هدف وزنی</div>
        <div className="text-white text-3xl font-bold">۶۰ کیلوگرم</div>
    </motion.div>
);

const CameraOverlay = () => (
    <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="absolute inset-0 flex items-center justify-center"
    >
        <div className="relative w-48 h-48 border-4 border-white/30 rounded-3xl flex items-center justify-center">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
            <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            />
        </div>
    </motion.div>
);

const NutritionOverlay = () => {
    const bubbles = [
        { label: 'پروتئین', value: '35g', color: 'text-red-400', top: '10%', left: '10%', delay: 0.3 },
        { label: 'کربوهیدرات', value: '35g', color: 'text-orange-400', top: '25%', right: '15%', delay: 0.5 },
        { label: 'چربی', value: '35g', color: 'text-blue-400', top: '45%', left: '15%', delay: 0.7 },
    ];

    return (
        <>
            {bubbles.map((b, i) => (
                <motion.div
                    key={i}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: b.delay, type: "spring" }}
                    style={{ top: b.top, left: b.left, right: b.right }}
                    className="absolute bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg"
                >
                    <div className={`${b.color} text-xs font-bold mb-0.5`}>{b.label}</div>
                    <div className="text-white text-lg font-bold">{b.value}</div>
                </motion.div>
            ))}
        </>
    );
};

const PAGES: OnboardingData[] = [
    {
        id: 0,
        image: '/app/images/man-onboarding.jpg',
        title: 'بدنت را متحول کن',
        subtitle: 'امروز بهترین زمان برای شروع به کار برای رسیدن به بدن رویایی خود است',
        Overlay: WeightGoalOverlay
    },
    {
        id: 1,
        image: '/app/images/food-onboarding.jpg',
        title: 'ردیابی کالری آسان شد',
        subtitle: 'فقط یک عکس سریع از وعده غذایی خود بگیرید و ما بقیه کارها را انجام خواهیم داد',
        Overlay: CameraOverlay
    },
    {
        id: 2,
        image: '/app/images/food-onboarding.jpg',
        title: 'تجزیه و تحلیل عمیق تغذیه',
        subtitle: 'ما شما را در مورد انتخاب های غذایی و محتوای غذایی آنها مطلع خواهیم کرد',
        Overlay: NutritionOverlay
    }
];

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const nextStep = () => {
        if (currentIndex < PAGES.length - 1) {
            setDirection(1);
            setCurrentIndex(prev => prev + 1);
        } else {
            onFinish();
        }
    };

    const prevStep = () => {
        if (currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleDragEnd = (event: any, info: any) => {
        const SWIPE_THRESHOLD = 50;
        // RTL Logic:
        // Swipe Right (Positive X) -> Next (User drags current slide to right to reveal next one from left)
        // Swipe Left (Negative X) -> Prev
        if (info.offset.x > SWIPE_THRESHOLD) {
            nextStep();
        } else if (info.offset.x < -SWIPE_THRESHOLD) {
            prevStep();
        }
    };

    const currentData = PAGES[currentIndex];

    // RTL Animation Variants
    // Next Step (direction = 1): Enter from Left (-300), Exit to Right (300)
    // Prev Step (direction = -1): Enter from Right (300), Exit to Left (-300)
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? -300 : 300,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? -300 : 300, // direction < 0 (back) -> exit to left (reversed from LTR)
            opacity: 0
        })
    };

    return (
        <div className="relative h-screen w-full bg-[var(--background)] overflow-hidden flex flex-col">
            {/* Background Image Area - 65% Height */}
            <div className="relative h-[65%] w-full bg-gray-100 overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
                    >
                        <Image
                            src={currentData.image}
                            alt="Onboarding"
                            fill
                            className="object-cover"
                            priority
                        />
                        {/* Dark overlay for text readability if needed, though we use bottom sheet */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

                        <currentData.Overlay />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Sheet Content - 35% Height + Overlap */}
            <div className="absolute bottom-0 w-full h-[40%] bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col items-center justify-between p-8 z-10 transition-all">

                <div className="flex flex-col items-center text-center w-full max-w-md mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center gap-4 mt-4"
                        >
                            <h2 className="text-2xl font-bold text-[var(--color-primary)]">{currentData.title}</h2>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{currentData.subtitle}</p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation & Dots */}
                <div className="flex flex-col w-full max-w-md gap-6 mb-2">
                    <div className="flex justify-center gap-2">
                        {PAGES.map((_, idx) => (
                            <motion.div
                                key={idx}
                                className={`h-2 rounded-full transition-colors duration-300 ${idx === currentIndex ? 'bg-[var(--color-primary)] w-6' : 'bg-gray-200 w-2'}`}
                                layout
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        ))}
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={nextStep}
                        className="w-full py-4 bg-[var(--color-primary)] text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        {currentIndex === PAGES.length - 1 ? 'پایان' : 'بعدی'}
                        {currentIndex !== PAGES.length - 1 && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
