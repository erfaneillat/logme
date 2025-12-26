'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { t, getLocale, Locale } from '../translations';

interface OnboardingData {
    id: number;
    image: string;
    titleKey: string;
    subtitleKey: string;
    Overlay: React.FC<{ locale: Locale }>;
}

const WeightGoalOverlay = ({ locale }: { locale: Locale }) => (
    <motion.div
        initial={{ x: locale === 'en' ? 50 : -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        className={`absolute top-1/4 ${locale === 'en' ? 'left-8' : 'right-8'} bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl`}
    >
        <div className="text-white/80 text-sm mb-1">{t('onboarding.page1.weightGoal', locale)}</div>
        <div className="text-white text-3xl font-bold">{t('onboarding.page1.weightValue', locale)}</div>
    </motion.div>
);

const CameraOverlay = ({ locale }: { locale: Locale }) => (
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

const NutritionOverlay = ({ locale }: { locale: Locale }) => {
    const bubbles = [
        { labelKey: 'onboarding.page3.protein', value: '35g', color: 'text-red-400', top: '10%', left: locale === 'en' ? '10%' : undefined, right: locale === 'fa' ? '10%' : undefined, delay: 0.3 },
        { labelKey: 'onboarding.page3.carbs', value: '35g', color: 'text-orange-400', top: '25%', right: locale === 'en' ? '15%' : undefined, left: locale === 'fa' ? '15%' : undefined, delay: 0.5 },
        { labelKey: 'onboarding.page3.fat', value: '35g', color: 'text-blue-400', top: '45%', left: locale === 'en' ? '15%' : undefined, right: locale === 'fa' ? '15%' : undefined, delay: 0.7 },
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
                    <div className={`${b.color} text-xs font-bold mb-0.5`}>{t(b.labelKey, locale)}</div>
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
        titleKey: 'onboarding.page1.title',
        subtitleKey: 'onboarding.page1.subtitle',
        Overlay: WeightGoalOverlay
    },
    {
        id: 1,
        image: '/app/images/food-onboarding.jpg',
        titleKey: 'onboarding.page2.title',
        subtitleKey: 'onboarding.page2.subtitle',
        Overlay: CameraOverlay
    },
    {
        id: 2,
        image: '/app/images/food-onboarding.jpg',
        titleKey: 'onboarding.page3.title',
        subtitleKey: 'onboarding.page3.subtitle',
        Overlay: NutritionOverlay
    }
];

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [locale, setLocale] = useState<Locale>('fa');

    useEffect(() => {
        setLocale(getLocale());
    }, []);

    const isRTL = locale === 'fa';

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
        if (isRTL) {
            // RTL Logic:
            // Swipe Right (Positive X) -> Next
            // Swipe Left (Negative X) -> Prev
            if (info.offset.x > SWIPE_THRESHOLD) {
                nextStep();
            } else if (info.offset.x < -SWIPE_THRESHOLD) {
                prevStep();
            }
        } else {
            // LTR Logic:
            // Swipe Left (Negative X) -> Next
            // Swipe Right (Positive X) -> Prev
            if (info.offset.x < -SWIPE_THRESHOLD) {
                nextStep();
            } else if (info.offset.x > SWIPE_THRESHOLD) {
                prevStep();
            }
        }
    };

    const currentData = PAGES[currentIndex];

    // Animation Variants (direction-aware)
    const variants = {
        enter: (direction: number) => ({
            x: isRTL
                ? (direction > 0 ? -300 : 300)
                : (direction > 0 ? 300 : -300),
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: isRTL
                ? (direction < 0 ? -300 : 300)
                : (direction < 0 ? 300 : -300),
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

                        <currentData.Overlay locale={locale} />
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
                            <h2 className="text-2xl font-bold text-[var(--color-primary)]">{t(currentData.titleKey, locale)}</h2>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{t(currentData.subtitleKey, locale)}</p>
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
                        className={`w-full py-4 bg-[var(--color-primary)] text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        {currentIndex === PAGES.length - 1 ? t('onboarding.finish', locale) : t('onboarding.next', locale)}
                        {currentIndex !== PAGES.length - 1 && (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
