'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/apiService';
import { newDate } from 'date-fns-jalali';
import { differenceInYears } from 'date-fns';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../translations';

// --- Types ---
type Gender = 'male' | 'female' | 'other';
type WeightGoal = 'lose_weight' | 'gain_weight' | 'maintain_weight';
type WorkoutFrequency = '0-2' | '3-5' | '6+';
type WeightLossSpeed = 'slow' | 'moderate' | 'fast';
type Diet = 'standard' | 'pescatarian' | 'vegetarian' | 'vegan';
type Accomplishment = 'eat_healthier' | 'boost_energy' | 'stay_motivated' | 'feel_better';

interface AdditionalInfoData {
    gender?: Gender;
    birthDate?: { day: number; month: number; year: number };
    age?: number;
    weight?: number;
    height?: number;
    workoutFrequency?: WorkoutFrequency;
    weightGoal?: WeightGoal;
    targetWeight?: number;
    weightLossSpeed?: WeightLossSpeed;
    barriers?: string[];
    dietType?: Diet;
    accomplishment?: Accomplishment;
    referralCode?: string;
}

// --- Icons ---
const Icons = {
    Male: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" /><path d="M12 7v10M9 10l3-3 3 3" /></svg>,
    Female: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" /><path d="M12 17v-6M9 14l3 3 3-3" /></svg>,
    Person: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>,
    Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    ChevronLeft: ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${className || ''}`}><polyline points="15 18 9 12 15 6"></polyline></svg>,
    HeaderPerson: () => <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-10 h-10"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
};

// --- Reusable Components ---

const Header = ({ title, subtitle, icon }: { title: string, subtitle: React.ReactNode, icon: React.ReactNode }) => (
    <div className="flex flex-col items-center text-center w-full mb-8 pt-4">
        <div className="mb-6 relative">
            <div className="w-20 h-20 bg-black rounded-[24px] flex items-center justify-center shadow-xl shadow-gray-200 z-10 relative">
                {icon}
            </div>
            {/* Decorative blurred background for glow effect */}
            <div className="absolute inset-0 bg-black blur-xl opacity-20 transform translate-y-2"></div>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-3 px-4 leading-tight">{title}</h1>
        <div className="text-gray-500 text-sm font-medium px-8 leading-relaxed whitespace-pre-line">{subtitle}</div>
    </div>
);

const SelectionCard = ({
    title,
    icon,
    isSelected,
    onClick,
    colorClass = "bg-black",
    gradientClass = "from-gray-800 to-black",
    iconColorClass = "text-black"
}: {
    title: string,
    icon: React.ReactNode,
    isSelected: boolean,
    onClick: () => void,
    colorClass?: string,
    gradientClass?: string,
    iconColorClass?: string
}) => {
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.98 }}
            className={`w-full h-20 px-5 rounded-[24px] border transition-all duration-300 flex items-center justify-between group relative overflow-hidden mb-4 ${isSelected
                ? `border-transparent shadow-lg text-white bg-gradient-to-br ${gradientClass}`
                : 'border-blue-50/50 bg-white hover:border-blue-100 shadow-sm'
                }`}
        >
            {/* RTL: Flex direction is row-reverse by default in container or we handle order manually */}
            {/* We want: [Check/Radio] ... [Title] ... [IconBox]  in LTR visual terms (since it's RTL: IconBox - Title - Check/Radio) */}

            {/* Icon Box (Right side in visual RTL) */}
            <div className={`w-[50px] h-[50px] rounded-[18px] flex items-center justify-center transition-colors ${isSelected ? 'bg-white/20 text-white' : `${colorClass.replace('bg-', 'bg-').replace('500', '50')} ${iconColorClass}`
                }`}>
                {icon}
            </div>

            {/* Title (Center) */}
            <div className="flex-1 text-right pr-4">
                <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                    {title}
                </span>
            </div>

            {/* Selection Indicator (Left side in visual RTL) */}
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'border-gray-200'
                }`}>
                {isSelected && <span className={iconColorClass}><Icons.Check /></span>}
            </div>
        </motion.button>
    );
};

const BottomButton = ({ onClick, disabled, text = "ادامه" }: { onClick: () => void, disabled?: boolean, text?: string }) => (
    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8F9FB] via-[#F8F9FB] to-transparent z-20">
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full h-14 bg-black text-white rounded-[20px] font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-gray-300 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100`}
        >
            <Icons.ChevronLeft />
            <span>{text}</span>
        </button>
    </div>
);

// --- Steps ---

const GenderSelection = ({ value, onChange }: { value: Gender | undefined, onChange: (v: Gender) => void }) => {
    const { t } = useTranslation();
    return (
        <div className="w-full">
            <Header
                title={t('additionalInfo.gender.title')}
                subtitle={t('additionalInfo.gender.subtitle')}
                icon={<Icons.HeaderPerson />}
            />

            <div className="w-full px-1">
                <SelectionCard
                    title={t('additionalInfo.gender.male')}
                    icon={<Icons.Male />}
                    isSelected={value === 'male'}
                    onClick={() => onChange('male')}
                    colorClass="bg-blue-500"
                    gradientClass="from-blue-500 to-blue-600"
                    iconColorClass="text-blue-500"
                />
                <SelectionCard
                    title={t('additionalInfo.gender.female')}
                    icon={<Icons.Female />}
                    isSelected={value === 'female'}
                    onClick={() => onChange('female')}
                    colorClass="bg-pink-500"
                    gradientClass="from-pink-500 to-pink-600"
                    iconColorClass="text-pink-500"
                />
                <SelectionCard
                    title={t('additionalInfo.gender.other')}
                    icon={<Icons.Person />}
                    isSelected={value === 'other'}
                    onClick={() => onChange('other')}
                    colorClass="bg-purple-500"
                    gradientClass="from-purple-500 to-purple-600"
                    iconColorClass="text-purple-500"
                />
            </div>
        </div>
    );
}

const ScrollWheel = ({ items, value, onChange }: { items: (string | number)[]; value: string | number; onChange: (val: any) => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const ITEM_HEIGHT = 50;
    const isScrolling = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            const index = items.indexOf(value);
            if (index !== -1) {
                containerRef.current.scrollTop = index * ITEM_HEIGHT;
            }
        }
    }, []);

    useEffect(() => {
        if (containerRef.current && !isScrolling.current) {
            const index = items.indexOf(value);
            const currentScrollIndex = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
            if (index !== -1 && index !== currentScrollIndex) {
                containerRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
            }
        }
    }, [value, items]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        isScrolling.current = true;

        if (containerRef.current) {
            const index = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
            const validIndex = Math.max(0, Math.min(items.length - 1, index));
            // Trigger update immediately if value changed
            if (items[validIndex] !== value) {
                onChange(items[validIndex]);
            }
        }

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            isScrolling.current = false;
        }, 150);
    };

    return (
        <div className="relative h-[250px] w-full overflow-hidden text-center select-none" dir="ltr">
            <div className="absolute top-[100px] left-0 right-0 h-[50px] bg-gray-100 rounded-[12px] -z-10 pointer-events-none" />
            <div
                ref={containerRef}
                className="h-full w-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[100px]"
                onScroll={handleScroll}
            >
                {items.map((item) => (
                    <div
                        key={item}
                        className={`h-[50px] flex items-center justify-center snap-center cursor-pointer transition-all duration-200 ${item == value ? 'font-bold text-black text-xl' : 'text-gray-400 text-sm'}`}
                        onClick={() => { onChange(item); }}
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
};

// 2. Birth Date (iOS Style Picker)
const BirthDateSelection = ({ value, onChange }: any) => {
    const years = Array.from({ length: 90 }, (_, i) => 1313 + i).reverse();
    const months = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const val = value || { day: 26, month: 2, year: 1380 };
    const currentMonthName = months[val.month - 1];

    const setPart = (part: string, v: any) => {
        let newVal = { ...val };
        if (part === 'month') {
            newVal.month = months.indexOf(v) + 1;
        } else {
            newVal[part] = v;
        }
        onChange(newVal);
    };

    return (
        <div className="w-full">
            <Header
                title="تاریخ تولد شما چه زمانی است؟"
                subtitle="این برای تنظیم برنامه سفارشی شما استفاده خواهد شد."
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}
            />

            <div className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 w-full">
                <div className="flex justify-between mb-4 px-4 text-sm font-bold text-gray-800">
                    <span className="flex-1 text-center">ماه</span>
                    <span className="flex-1 text-center">روز</span>
                    <span className="flex-1 text-center">سال</span>
                </div>
                <div className="flex gap-2 h-[250px] w-full relative">
                    <div className="flex-1 relative">
                        <ScrollWheel items={months} value={currentMonthName} onChange={(v) => setPart('month', v)} />
                    </div>
                    <div className="flex-1 relative">
                        <ScrollWheel items={days} value={val.day} onChange={(v) => setPart('day', v)} />
                    </div>
                    <div className="flex-1 relative">
                        <ScrollWheel items={years} value={val.year} onChange={(v) => setPart('year', v)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const WorkoutFrequency = ({ value, onChange }: any) => {
    const { t } = useTranslation();
    const StepIcons = {
        Dumbbell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="m6.5 6.5 11 11" /><path d="m21 21-1-1" /><path d="m3 3 1 1" /><path d="m18 22 4-4" /><path d="m2 6 4-4" /><path d="m3 10 7-7" /><path d="m14 21 7-7" /></svg>,
        Runner: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M22 16.92v3a1 1 0 0 1-2.18.51l-8-6.15-2.6 2.37A2 2 0 0 1 7.74 17L5 15.65" /><path d="M12.92 7.74 3.03 5.48" /><path d="M19 12.08 15 8l-3 3-2.15-2.15" /><path d="M16 4a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" /></svg>,
        Athlete: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M12.5 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path d="M2 13.5h5l2-6.5 2 4.5h2l2-4.5 2 6.5h5" /><path d="M14.5 21.5v-5" /><path d="M9.5 21.5v-5" /></svg>,
        Dots2: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><circle cx="8" cy="12" r="2.5" /><circle cx="16" cy="12" r="2.5" /></svg>,
        Dots3: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><circle cx="4" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="20" cy="12" r="2" /></svg>,
        DotsGrid: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><circle cx="9" cy="9" r="1.5" /><circle cx="15" cy="9" r="1.5" /><circle cx="9" cy="15" r="1.5" /><circle cx="15" cy="15" r="1.5" /><circle cx="12" cy="12" r="1.5" /></svg>,
        HeaderDumbbell: () => <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><path d="m6.5 6.5 11 11" /><path d="m21 21-1-1" /><path d="m3 3 1 1" /><path d="m18 22 4-4" /><path d="m2 6 4-4" /><path d="m3 10 7-7" /><path d="m14 21 7-7" /></svg>
    };

    const WorkoutCard = ({ title, subtitle, icon, dotsIcon, isSelected, onClick, colorClass, gradientClass, iconColorClass }: any) => (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.98 }}
            className={`w-full h-auto min-h-[100px] px-5 py-4 rounded-[28px] border transition-all duration-300 flex items-center justify-between group relative overflow-hidden mb-4 ${isSelected
                ? `border-transparent shadow-xl text-white bg-gradient-to-br ${gradientClass}`
                : 'border-gray-100 bg-white hover:border-blue-50 shadow-sm'
                }`}
        >
            {/* Right: Icon Container */}
            <div className={`w-[64px] h-[64px] shrink-0 rounded-[20px] flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-white/20 text-white' : `${colorClass}/10 ${iconColorClass}`
                }`}>
                {icon}
            </div>

            {/* Center: Texts */}
            <div className="flex-1 text-right pr-4 flex flex-col justify-center">
                <span className={`text-2xl font-black mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>{title}</span>
                <span className={`text-[11px] font-bold ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>{subtitle}</span>
            </div>

            {/* Left: Dots & Check */}
            <div className="flex items-center gap-3 pl-1">
                {/* Dots Container */}
                <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400'
                    }`}>
                    {dotsIcon}
                </div>

                {/* Check Circle */}
                <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'border-gray-200'
                    }`}>
                    {isSelected && <span className={iconColorClass}><Icons.Check /></span>}
                </div>
            </div>
        </motion.button>
    );

    return (
        <div className="w-full">
            <Header
                title={t('additionalInfo.workout.title')}
                subtitle={t('additionalInfo.workout.subtitle')}
                icon={<StepIcons.HeaderDumbbell />}
            />
            <div className="w-full px-1">
                <WorkoutCard
                    title={t('additionalInfo.workout.range1.title')}
                    subtitle={t('additionalInfo.workout.range1.subtitle')}
                    icon={<StepIcons.Dumbbell />}
                    dotsIcon={<StepIcons.Dots2 />}
                    isSelected={value === '0-2'}
                    onClick={() => onChange('0-2')}
                    gradientClass="from-[#FF6B6B] to-[#EE5253]"
                    colorClass="bg-[#FF6B6B]"
                    iconColorClass="text-[#FF6B6B]"
                />
                <WorkoutCard
                    title={t('additionalInfo.workout.range2.title')}
                    subtitle={t('additionalInfo.workout.range2.subtitle')}
                    icon={<StepIcons.Runner />}
                    dotsIcon={<StepIcons.Dots3 />}
                    isSelected={value === '3-5'}
                    onClick={() => onChange('3-5')}
                    gradientClass="from-[#1DD1A1] to-[#10AC84]"
                    colorClass="bg-[#1DD1A1]"
                    iconColorClass="text-[#1DD1A1]"
                />
                <WorkoutCard
                    title={t('additionalInfo.workout.range3.title')}
                    subtitle={t('additionalInfo.workout.range3.subtitle')}
                    icon={<StepIcons.Athlete />}
                    dotsIcon={<StepIcons.DotsGrid />}
                    isSelected={value === '6+'}
                    onClick={() => onChange('6+')}
                    gradientClass="from-[#54A0FF] to-[#2E86DE]"
                    colorClass="bg-[#54A0FF]"
                    iconColorClass="text-[#54A0FF]"
                />
            </div>
        </div>
    );
};

// 4. Weight & Height
const WeightHeight = ({ weight, height, onChange }: any) => {
    const { t } = useTranslation();
    // Generate ranges
    const minWeight = 40, maxWeight = 150;
    const minHeight = 140, maxHeight = 220;

    // We use formatted strings for the wheel: "70 kg"
    const weights = Array.from({ length: maxWeight - minWeight + 1 }, (_, i) => `${minWeight + i} ${t('additionalInfo.measurements.kg')}`);
    const heights = Array.from({ length: maxHeight - minHeight + 1 }, (_, i) => `${minHeight + i} ${t('additionalInfo.measurements.cm')}`);

    // Helper to parse value back to number
    const parseValue = (str: string) => parseInt(str.split(' ')[0]);

    // Defaults
    const currentWeight = weight || 70;
    const currentHeight = height || 170;

    const weightStr = `${currentWeight} ${t('additionalInfo.measurements.kg')}`;
    const heightStr = `${currentHeight} ${t('additionalInfo.measurements.cm')}`;

    const StepIcons = {
        Height: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M12 5v14M8 9l4-4 4 4M8 15l4 4 4-4" /></svg>, // Vertical double arrow
        Weight: () => <svg viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="0" className="w-3 h-3"><circle cx="12" cy="12" r="4" /></svg> // Simple dot or specific icon
    };

    const RealHeaderIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8"><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" /></svg>
    );

    return (
        <div className="w-full">
            <Header
                title={t('additionalInfo.measurements.title')}
                subtitle={t('additionalInfo.measurements.subtitle')}
                icon={<RealHeaderIcon />}
            />

            <div className="w-full bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex relative overflow-hidden">
                {/* Divider */}
                <div className="absolute top-6 bottom-6 left-1/2 w-[1px] bg-gray-100 -translate-x-1/2 z-10"></div>

                {/* Weight Column */}
                <div className="flex-1 flex flex-col items-center relative z-0">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="font-black text-lg">{t('additionalInfo.measurements.weight')}</span>
                        <div className="bg-black text-white p-1.5 rounded-[8px] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                    </div>

                    <div className="h-[250px] w-full relative">
                        <ScrollWheel
                            items={weights}
                            value={weightStr}
                            onChange={(v) => onChange('weight', parseValue(v))}
                        />
                    </div>

                    <div className="bg-black text-white px-5 py-3 rounded-[16px] font-bold text-sm mt-4 shadow-lg shadow-gray-200 min-w-[100px] text-center">
                        {currentWeight} {t('additionalInfo.measurements.kg')}
                    </div>
                </div>

                {/* Height Column */}
                <div className="flex-1 flex flex-col items-center relative z-0">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="font-black text-lg">{t('additionalInfo.measurements.height')}</span>
                        <div className="text-black"><StepIcons.Height /></div>
                    </div>

                    <div className="h-[250px] w-full relative">
                        <ScrollWheel
                            items={heights}
                            value={heightStr}
                            onChange={(v) => onChange('height', parseValue(v))}
                        />
                    </div>

                    <div className="bg-black text-white px-5 py-3 rounded-[16px] font-bold text-sm mt-4 shadow-lg shadow-gray-200 min-w-[100px] text-center">
                        {currentHeight} {t('additionalInfo.measurements.cm')}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 5. Goal
const GoalSelection = ({ value, onChange }: any) => {
    const { t } = useTranslation();
    const StepIcons = {
        Target: () => <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
        TrendDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>,
        Minus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="5" y1="12" x2="19" y2="12" /></svg>,
        TrendUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
    };

    const GoalCard = ({ title, subtitle, icon, isSelected, onClick, colorClass, iconColorClass, borderColorClass, bgColorClass, ringColorClass }: any) => (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-4 rounded-[24px] border transition-all duration-300 flex items-center justify-between group mb-4 ${isSelected
                ? `${bgColorClass} ${borderColorClass} shadow-none`
                : 'bg-white border-transparent shadow-sm'
                }`}
        >
            {/* Right: Icon Box */}
            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${colorClass}/10 ${iconColorClass}`}>
                {icon}
            </div>

            {/* Center: Text */}
            <div className="flex-1 text-right pr-4 flex flex-col">
                <span className="text-lg font-bold text-gray-900">{title}</span>
                <span className="text-xs text-gray-800 font-medium">{subtitle}</span>
            </div>

            {/* Left: Radio Circle */}
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? ringColorClass : 'border-gray-200'
                }`}>
                {isSelected && <div className={`w-3 h-3 rounded-full ${colorClass}`} />}
            </div>
        </motion.button>
    );

    return (
        <div className="w-full">
            <Header
                title={t('additionalInfo.goal.title')}
                subtitle={t('additionalInfo.goal.subtitle')}
                icon={<StepIcons.Target />}
            />

            <div className="w-full px-1">
                <GoalCard
                    title={t('additionalInfo.goal.lose.title')}
                    subtitle={t('additionalInfo.goal.lose.subtitle')}
                    icon={<StepIcons.TrendDown />}
                    isSelected={value === 'lose_weight'}
                    onClick={() => onChange('lose_weight')}
                    colorClass="bg-red-500"
                    iconColorClass="text-red-500"
                    borderColorClass="border-red-200"
                    bgColorClass="bg-red-50"
                    ringColorClass="border-red-400"
                />
                <GoalCard
                    title={t('additionalInfo.goal.maintain.title')}
                    subtitle={t('additionalInfo.goal.maintain.subtitle')}
                    icon={<StepIcons.Minus />}
                    isSelected={value === 'maintain_weight'}
                    onClick={() => onChange('maintain_weight')}
                    colorClass="bg-green-500"
                    iconColorClass="text-green-500"
                    borderColorClass="border-green-200"
                    bgColorClass="bg-green-50"
                    ringColorClass="border-green-400"
                />
                <GoalCard
                    title={t('additionalInfo.goal.gain.title')}
                    subtitle={t('additionalInfo.goal.gain.subtitle')}
                    icon={<StepIcons.TrendUp />}
                    isSelected={value === 'gain_weight'}
                    onClick={() => onChange('gain_weight')}
                    colorClass="bg-blue-500"
                    iconColorClass="text-blue-500"
                    borderColorClass="border-blue-200"
                    bgColorClass="bg-blue-50"
                    ringColorClass="border-blue-400"
                />
            </div>
        </div>
    );
};

// 6. Long Term Results (Chart showing sustainable weight loss)
const LongTermResults = ({ goal }: { goal: string | undefined }) => {
    // Determine content based on goal
    const isMaintain = goal === 'maintain_weight';
    const isGain = goal === 'gain_weight';

    let title = "لقمه کاهش وزن پایدار ایجاد می‌کند";
    let subtitle = "روش ما نتایج ثابت و پایدار ارائه می‌دهد";
    let successRate = "٪۹۵";

    // Default Lose Weight settings
    let appData = [20, 15, 12, 10, 5, 2]; // Descending
    let appColor = "#22c55e"; // Green
    let appBgClass = "bg-green-100";
    let appTextClass = "text-green-700";
    let appDotClass = "bg-green-500";
    let badgeTextColor = "text-green-500";

    if (isMaintain) {
        title = "لقمه به شما کمک می‌کند تا وزن خود را حفظ کنید";
        subtitle = "روش ما نتایج پایدار و بلندمدت ارائه می‌دهد";
        appData = [20, 21, 19, 20, 21, 20];
        appColor = "#fbbf24"; // Amber
        appBgClass = "bg-amber-100";
        appTextClass = "text-amber-700";
        appDotClass = "bg-amber-500";
        successRate = "٪۹۸";
        badgeTextColor = "text-gray-900";
    } else if (isGain) {
        title = "لقمه به شما کمک می‌کند تا وزن خود را به طور سالم افزایش دهید";
        subtitle = "رویکرد ما تضمین می‌کند که عضله‌سازی مداوم داشته باشید";
        appData = [20, 25, 30, 35, 40, 45]; // Ascending
        appColor = "#3b82f6"; // Blue
        appBgClass = "bg-blue-100";
        appTextClass = "text-blue-700";
        appDotClass = "bg-blue-500";
        successRate = "٪۹۲";
        badgeTextColor = "text-gray-900";
    }

    // SVG Chart Data - Traditional Diet (red/unstable) vs Our App
    const months = ['ماه ۱', 'ماه ۲', 'ماه ۳', 'ماه ۴', 'ماه ۵', 'ماه ۶'];
    // Traditional: yo-yo pattern (same for all)
    const traditionalData = [20, 30, 15, 28, 18, 25];

    // Convert to SVG path coordinates
    const chartWidth = 280;
    const chartHeight = 150;
    const padding = { left: 40, right: 20, top: 20, bottom: 30 };
    const graphWidth = chartWidth - padding.left - padding.right;
    const graphHeight = chartHeight - padding.top - padding.bottom;

    const getX = (index: number) => padding.left + (index / (months.length - 1)) * graphWidth;
    const getY = (value: number) => padding.top + ((50 - value) / 50) * graphHeight;

    const createPath = (data: number[]) => {
        return data.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');
    };

    const HeaderIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );

    return (
        <div className="w-full">
            <Header
                title={title}
                subtitle={subtitle}
                icon={<HeaderIcon />}
            />

            {/* Chart Card */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-6">
                {/* Chart Title */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                            <span className="text-xs text-gray-500 font-medium">رژیم سنتی</span>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${appBgClass}`}>
                            <span className={`w-2 h-2 rounded-full ${appDotClass}`}></span>
                            <span className={`text-xs font-bold ${appTextClass}`}>اپلیکیشن ما</span>
                        </div>
                    </div>
                    <span className="font-bold text-gray-800">وزن شما</span>
                </div>

                {/* SVG Chart */}
                <div className="w-full flex justify-center">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-[300px]">
                        {/* Y-axis labels */}
                        {[0, 10, 20, 30, 50].map((val, i) => (
                            <text key={val} x={padding.left - 5} y={getY(val) + 4} textAnchor="end" className="text-[10px] fill-gray-400">
                                {val}%
                            </text>
                        ))}

                        {/* X-axis labels */}
                        {months.map((month, i) => (
                            <text key={i} x={getX(i)} y={chartHeight - 5} textAnchor="middle" className="text-[9px] fill-gray-400">
                                {month}
                            </text>
                        ))}

                        {/* Grid lines */}
                        {[0, 10, 20, 30, 50].map((val) => (
                            <line key={val} x1={padding.left} y1={getY(val)} x2={chartWidth - padding.right} y2={getY(val)} stroke="#f0f0f0" strokeWidth="1" />
                        ))}

                        {/* Traditional Diet Line (Red) */}
                        <motion.path
                            d={createPath(traditionalData)}
                            fill="none"
                            stroke="#f87171"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                        {traditionalData.map((val, i) => (
                            <motion.circle
                                key={`trad-${i}`}
                                cx={getX(i)}
                                cy={getY(val)}
                                r="4"
                                fill="#f87171"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 * i, duration: 0.4, type: 'spring' }}
                            />
                        ))}

                        {/* Our App Line (Dynamic Color) */}
                        <motion.path
                            d={createPath(appData)}
                            fill="none"
                            stroke={appColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                        />
                        {appData.map((val, i) => (
                            <motion.circle
                                key={`app-${i}`}
                                cx={getX(i)}
                                cy={getY(val)}
                                r="4"
                                fill={appColor}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 + (0.2 * i), duration: 0.4, type: 'spring' }}
                            />
                        ))}
                    </svg>
                </div>
            </div>

            {/* Success Rate Badge */}
            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex items-center justify-center gap-3">
                <span className="text-lg font-bold text-gray-800">نرخ موفقیت با لقمه</span>
                <span className={`text-2xl font-black ${badgeTextColor}`}>{successRate}</span>
            </div>
        </div>
    );
};

// 7. Target Weight
const DataRuler = ({ value, min = 30, max = 200, onChange, indicatorColor = "bg-blue-500" }: any) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const stepWidth = 12; // pixels per unit (gap 10 + width 2)

    // Generate ticks Max -> Min (RTL visual order in LTR container)
    // [150, 149, ..., 40]
    // 150 is Left, 40 is Right.
    const ticks = Array.from({ length: max - min + 1 }, (_, i) => max - i);

    // Initial scroll on mount
    useEffect(() => {
        if (scrollRef.current) {
            const { scrollWidth, clientWidth } = scrollRef.current;
            const maxScroll = scrollWidth - clientWidth;

            // Calculate position
            // Min value (Right) -> Max ScrollLeft
            // Max value (Left) -> 0 ScrollLeft
            const distance = (value - min) * stepWidth;
            scrollRef.current.scrollLeft = maxScroll - distance;
        }
    }, []); // Run only once on mount

    const handleScroll = (e: any) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.target;
        const maxScroll = scrollWidth - clientWidth;

        // Distance from Right Edge
        const scrollRight = maxScroll - scrollLeft;

        const calculatedVal = Math.round(scrollRight / stepWidth) + min;

        // Debounce or check diversity to avoid loop
        if (calculatedVal !== value && calculatedVal >= min && calculatedVal <= max) {
            onChange(calculatedVal);
        }
    };

    return (
        <div className="relative h-36 bg-gray-50 rounded-[32px] overflow-hidden border border-gray-100/50" dir="ltr">
            {/* Center Line Indicator */}
            <div className={`absolute h-14 w-[3px] ${indicatorColor} rounded-full left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none shadow-sm`}></div>

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                className="w-full h-full overflow-x-auto flex items-center px-[50%] snap-x"
                style={{ scrollBehavior: 'auto', scrollbarWidth: 'none' }} // Hide scrollbar
                onScroll={handleScroll}
            >
                <div className="flex items-end h-20" style={{ gap: '10px' }}> {/* gap 10px + w 2px = 12px step */}
                    {ticks.map((tick) => (
                        <div key={tick} className="flex flex-col items-center justify-end w-[2px] shrink-0 relative snap-center">
                            {/* Tick Lines */}
                            <div className={`w-[2px] rounded-full transition-all duration-300 ${tick % 10 === 0
                                ? 'h-12 bg-gray-400'
                                : tick % 5 === 0
                                    ? 'h-8 bg-gray-300'
                                    : 'h-4 bg-gray-200'
                                }`}></div>

                            {/* Numbers */}
                            {tick % 10 === 0 && (
                                <span className="absolute top-14 text-xs font-bold text-gray-400 select-none transform -translate-x-1/2">
                                    {tick}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Fade Gradients at edges for depth */}
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-10"></div>
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-10"></div>
        </div>
    );
};

// 7. Target Weight
const TargetWeight = ({ value, onChange, goal, currentWeight }: any) => {
    const isGain = goal === 'gain_weight';
    const isMaintain = goal === 'maintain_weight';

    const title = isGain ? "افزایش وزن" : isMaintain ? "تثبیت وزن" : "کاهش وزن";
    const subtitle = isGain ? "وزن هدف خود را برای افزایش وزن انتخاب کنید"
        : isMaintain ? "وزن هدف خود را برای تثبیت وزن انتخاب کنید"
            : "وزن هدف خود را برای کاهش وزن انتخاب کنید";

    const boxBg = isGain ? "bg-blue-50 border-blue-100"
        : isMaintain ? "bg-amber-50 border-amber-100"
            : "bg-green-50 border-green-100";

    const indicatorColor = isGain ? "bg-blue-500"
        : isMaintain ? "bg-amber-500"
            : "bg-green-500";

    const textColor = isGain ? "text-blue-900"
        : isMaintain ? "text-amber-900"
            : "text-green-900";

    const HeaderIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20v-4" />
        </svg>
    );

    return (
        <div className="w-full">
            <Header
                title={title}
                subtitle={subtitle}
                icon={<HeaderIcon />}
            />

            {/* Target Weight Display Box */}
            <div className={`${boxBg} rounded-[32px] p-8 text-center border-2 mb-6 shadow-sm transition-colors duration-500`}>
                <span className="text-gray-500 text-sm font-medium block mb-2">وزن هدف</span>
                <div className="flex justify-center items-baseline gap-2 dir-ltr">
                    <span className={`text-6xl font-black ${textColor} tracking-tight`}>{value || 70}</span>
                    <span className="text-gray-400 font-bold text-xl">kg</span>
                </div>
            </div>

            {/* Current Weight Info */}
            <div className="bg-gray-100 rounded-2xl p-4 flex justify-center items-center gap-2 mb-8 text-gray-500 shadow-inner">
                <span className="text-[15px] font-medium">وزن فعلی {currentWeight} kg</span>
                <svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            </div>

            {/* Horizontal Ruler */}
            <DataRuler
                value={value || 70}
                min={40}
                max={150}
                onChange={onChange}
                indicatorColor={indicatorColor}
            />

            {/* Validation Message */}
            {(() => {
                if (!value || !currentWeight) return null;
                let error = "";
                if (goal === 'lose_weight' && value >= currentWeight) error = "برای کاهش وزن، هدف باید کمتر از وزن فعلی باشد";
                if (goal === 'gain_weight' && value <= currentWeight) error = "برای افزایش وزن، هدف باید بیشتر از وزن فعلی باشد";
                if (goal === 'maintain_weight' && value !== currentWeight) error = "برای تثبیت، هدف باید برابر وزن فعلی باشد";

                if (error) {
                    return (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center animate-pulse border border-red-100">
                            ⚠️ {error}
                        </div>
                    );
                }
                return null;
            })()}
        </div>
    );
};

// 8. Motivational / Feasibility Feedback
const MotivationalStep = ({ goal, weight, targetWeight }: any) => {
    const isGain = goal === 'gain_weight';
    const isMaintain = goal === 'maintain_weight';

    // Safety check
    if (!weight || !targetWeight) return null;

    const diff = Math.abs(targetWeight - weight).toFixed(1);

    // Text Logic
    let actionText = "کاهش";
    let colorClass = "text-amber-400"; // Default orange/brownish from image

    if (isGain) {
        actionText = "افزایش";
        colorClass = "text-amber-400";
    } else if (isMaintain) {
        actionText = "تثبیت";
        colorClass = "text-blue-400";
    }

    // Feasibility Logic (Simple rules for demo)
    // < 5kg: Easy / Realistic
    // 5-10kg: Challenge / Doable
    // > 10kg: Ambitious

    let difficulty = "اصلاً سخت نیست!";
    const numDiff = parseFloat(diff);

    if (numDiff > 15) difficulty = "نیاز به اراده قوی دارد!";
    else if (numDiff > 8) difficulty = "چالش‌برانگیز اما ممکن!";

    // Maintain variation
    if (isMaintain) {
        return (
            <div className="w-full flex flex-col items-center justify-center text-center px-4 mt-8 pt-10">
                <div className="text-3xl font-black leading-loose text-gray-900 mb-8">
                    تثبیت وزن فعلی
                    <br />
                    یک تصمیم <span className="text-blue-500">هوشمندانه</span> است!
                </div>
                <p className="text-gray-500 text-lg leading-relaxed max-w-xs">
                    ۹۵٪ از کاربران ما با موفقیت وزن خود را برای سال‌ها ثابت نگه داشته‌اند.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center justify-center text-center px-4 mt-8 pt-10">
            <div className="text-3xl font-black leading-loose text-gray-900 mb-8 md:text-4xl">
                {actionText} <span className={`${colorClass} mx-1 dir-ltr inline-block`}>{diff} kg</span> کیلوگرم
                <br />
                یک هدف واقع‌بینانه است.
                <br />
                {difficulty}
            </div>

            <p className="text-gray-500 text-lg leading-relaxed max-w-xs font-medium">
                ۹۰٪ از کاربران می‌گویند که تغییر پس از استفاده از لقمه واضح است و بازگشت آسان نیست.
            </p>
        </div>
    );
};

// 9. Speed Selection
const SpeedSelection = ({ value, onChange, goal }: any) => {
    const isGain = goal === 'gain_weight';

    // Texts
    const title = "چقدر سریع می‌خواهید به هدف خود برسید؟";
    const subtitle = isGain
        ? "سرعت مورد نظر خود را برای افزایش وزن انتخاب کنید. سرعت کمتر پایدارتر است."
        : "سرعت مورد نظر خود را برای کاهش وزن انتخاب کنید. سرعت کمتر پایدارتر است.";

    const options = isGain ? [
        { key: 'slow', amount: '0.1', label: 'آرام و پیوسته', iconType: 'walk', color: 'orange' },
        { key: 'moderate', amount: '0.8', label: 'سرعت متوسط', iconType: 'run', color: 'blue' },
        { key: 'fast', amount: '1.5', label: 'مسیر سریع', iconType: 'bolt', color: 'yellow' },
    ] : [
        { key: 'slow', amount: '0.5', label: 'آرام و پیوسته', iconType: 'walk', color: 'orange' },
        { key: 'moderate', amount: '0.7', label: 'سرعت متوسط', iconType: 'run', color: 'blue' },
        { key: 'fast', amount: '1.0', label: 'مسیر سریع', iconType: 'bolt', color: 'yellow' },
    ];

    const Dot = ({ active }: { active: boolean }) => (
        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-current opacity-60'}`}></div>
    );

    return (
        <div className="w-full">
            <Header title={title} subtitle={subtitle} icon={<span className="text-3xl">🚀</span>} />
            <div className="flex flex-col gap-4">
                {options.map((opt) => {
                    const isSelected = value === opt.key;

                    // Style logic
                    // Selected: Brown bg (#9D5416)
                    // Unselected: White bg, colored boxes (Orange/Blue/Yellow)

                    let boxBgClass = "";
                    let iconColorClass = "";

                    if (isSelected) {
                        boxBgClass = "bg-white/20";
                        iconColorClass = "text-white";
                    } else {
                        if (opt.key === 'slow') { boxBgClass = "bg-[#9D5416]/10"; iconColorClass = "text-[#9D5416]"; }
                        if (opt.key === 'moderate') { boxBgClass = "bg-blue-50"; iconColorClass = "text-blue-500"; }
                        if (opt.key === 'fast') { boxBgClass = "bg-amber-50"; iconColorClass = "text-amber-500"; }
                    }

                    return (
                        <div
                            key={opt.key}
                            onClick={() => onChange(opt.key)}
                            className={`relative w-full p-5 rounded-[24px] flex items-center justify-between cursor-pointer border-2 transition-all duration-300
                                ${isSelected
                                    ? 'bg-[#9D5416] border-[#9D5416] text-white shadow-lg shadow-orange-900/20 scale-[1.02]'
                                    : 'bg-white border-gray-50 text-gray-900 shadow-sm hover:border-orange-100 hover:bg-gray-50'
                                }
                            `}
                        >
                            {/* Left Side: Checkmark & Dot Icon */}
                            <div className="flex items-center gap-4">
                                {/* Check Circle */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-[1.5px] 
                                    ${isSelected ? 'border-white bg-white' : 'border-gray-300'}`}>
                                    {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="#9D5416" strokeWidth="4" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>}
                                </div>

                                {/* Dot Icon Box */}
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${boxBgClass} ${iconColorClass}`}>
                                    <div className="flex gap-1">
                                        <Dot active={isSelected} />
                                        {['moderate', 'fast'].includes(opt.key) && <Dot active={isSelected} />}
                                        {opt.key === 'fast' && <Dot active={isSelected} />}
                                    </div>
                                </div>
                            </div>

                            {/* Center Text */}
                            <div className="flex-1 text-center">
                                <div className={`text-xl font-black mb-1 dir-ltr inline-block ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                    kg {opt.amount}
                                </div>
                                <div className={`text-xs font-medium ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                    {opt.label}
                                </div>
                            </div>

                            {/* Right Icon Box */}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${boxBgClass} ${iconColorClass}`}>
                                {opt.iconType === 'walk' && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                        <path d="M13 4v6m-4 5h5l2 9M1 10l5-3 5 3" />
                                        <circle cx="13" cy="2" r="2" />
                                    </svg>
                                )}
                                {opt.iconType === 'run' && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                        <path d="M18 2l-3 4-6-1-5 4" />
                                        <path d="M15 7l-2 5-6 2" />
                                        <path d="M13 12v6l3 2" />
                                        <circle cx="19" cy="2" r="2" />
                                    </svg>
                                )}
                                {opt.iconType === 'bolt' && (
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 10. Barriers Selection
const BarriersSelection = ({ value = [], onChange }: any) => {
    const options = [
        { key: 'consistency', label: 'کمبود استمرار', icon: '📉' },
        { key: 'habits', label: 'عادات غذایی ناسالم', icon: '🍔' },
        { key: 'support', label: 'کمبود حمایت', icon: '👥' },
        { key: 'schedule', label: 'برنامه شلوغ', icon: '⏰' },
        { key: 'ideas', label: 'کمبود ایده برای وعده‌ها', icon: '🍽️' },
    ];

    const toggle = (key: string) => {
        if (value.includes(key)) {
            onChange(value.filter((k: string) => k !== key));
        } else {
            onChange([...value, key]);
        }
    };

    return (
        <div className="w-full">
            <Header
                title="چه چیزهایی مانع رسیدن شما به اهدافتان می‌شود؟"
                subtitle="همه موارد مربوطه را انتخاب کنید تا به ما کمک کنید تجربه شما را شخصی‌سازی کنیم"
                icon={<span className="text-3xl">🧠</span>}
            />
            <div className="flex flex-col gap-3">
                {options.map((opt) => {
                    const isSelected = value.includes(opt.key);
                    return (
                        <div
                            key={opt.key}
                            onClick={() => toggle(opt.key)}
                            className={`w-full p-3 rounded-[20px] flex items-center justify-between cursor-pointer border-2 transition-all duration-300
                                ${isSelected
                                    ? 'bg-blue-50 border-blue-500 shadow-sm scale-[1.01]'
                                    : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'
                                }
                            `}
                        >
                            {/* Left: Check Selection */}
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors
                                ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-200'}
                            `}>
                                {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>}
                            </div>

                            {/* Middle: Text */}
                            <div className="flex-1 text-right pr-4 text-base font-bold text-gray-800">
                                {opt.label}
                            </div>

                            {/* Right: Icon */}
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl">
                                {opt.icon}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 11. Diet Selection
const DietSelection = ({ value, onChange }: any) => {
    const options = [
        { key: 'standard', label: 'معمولی', icon: '🍴', color: 'bg-orange-100 text-orange-500' },
        { key: 'pescatarian', label: 'ماهی‌خوار', icon: '🐟', color: 'bg-blue-100 text-blue-500' },
        { key: 'vegetarian', label: 'گیاه‌خوار', icon: '🍎', color: 'bg-green-100 text-green-500' },
        { key: 'vegan', label: 'وگان', icon: '🍃', color: 'bg-green-100 text-green-600' },
    ];

    return (
        <div className="w-full">
            <Header
                title="آیا رژیم غذایی خاصی دنبال می‌کنید؟"
                subtitle="این به ما کمک می‌کند تا توصیه‌های غذایی شما را شخصی‌سازی کنیم"
                icon={<span className="text-3xl">🍽️</span>}
            />
            <div className="flex flex-col gap-3">
                {options.map((opt) => {
                    const isSelected = value === opt.key;
                    return (
                        <div
                            key={opt.key}
                            onClick={() => onChange(opt.key)}
                            className={`w-full p-4 rounded-[20px] flex items-center justify-between cursor-pointer border-2 transition-all duration-300
                                ${isSelected
                                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                                    : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'
                                }
                            `}
                        >
                            {/* Left: Radio Circle */}
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                ${isSelected ? 'border-blue-500' : 'border-gray-300'}
                            `}>
                                {isSelected && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                            </div>

                            {/* Middle: Text */}
                            <div className="flex-1 text-right pr-4 text-base font-bold text-gray-800">
                                {opt.label}
                            </div>

                            {/* Right: Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${opt.color}`}>
                                {opt.icon}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 12. Accomplishment Selection
const AccomplishmentSelection = ({ value, onChange }: any) => {
    const options = [
        { key: 'eat_healthier', label: 'سالم‌تر غذا بخورید و زندگی کنید', icon: '🍏', color: 'bg-green-100 text-green-600' },
        { key: 'boost_energy', label: 'انرژی و روحیه خود را تقویت کنم', icon: '☀️', color: 'bg-yellow-100 text-yellow-600' },
        { key: 'stay_motivated', label: 'انگیزه و ثبات خود را حفظ کنم', icon: '💪', color: 'bg-blue-100 text-blue-600' },
        { key: 'feel_better', label: 'احساس بهتری نسبت به بدنم داشته باشم', icon: '🧘‍♀️', color: 'bg-purple-100 text-purple-600' },
    ];

    return (
        <div className="w-full">
            <Header
                title="چه چیزی می‌خواهید به دست آورید؟"
                subtitle="انگیزه اصلی خود را انتخاب کنید تا به ما کمک کنید تجربه شما را شخصی‌سازی کنیم"
                icon={<span className="text-3xl">🧠</span>}
            />
            <div className="flex flex-col gap-3">
                {options.map((opt) => {
                    const isSelected = value === opt.key;
                    return (
                        <div
                            key={opt.key}
                            onClick={() => onChange(opt.key)}
                            className={`w-full p-4 rounded-[20px] flex items-center justify-between cursor-pointer border-2 transition-all duration-300
                                ${isSelected
                                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                                    : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'
                                }
                            `}
                        >
                            {/* Left: Radio Circle */}
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                ${isSelected ? 'border-blue-500' : 'border-gray-300'}
                            `}>
                                {isSelected && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                            </div>

                            {/* Middle: Text */}
                            <div className="flex-1 text-right pr-4 text-base font-bold text-gray-800 leading-tight">
                                {opt.label}
                            </div>

                            {/* Right: Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${opt.color}`}>
                                {opt.icon}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 13. Goal Transition Chart (Motivational Break)
const GoalTransitionChart = ({ goal }: { goal: WeightGoal }) => {
    const isGain = goal === 'gain_weight';
    const isLose = goal === 'lose_weight';

    // Config based on goal
    const config = isGain ? {
        color: '#3B82F6', // Blue
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        chartPath: "M10 90 Q 150 70, 290 30",
        points: [{ x: 10, y: 90 }, { x: 150, y: 60 }, { x: 290, y: 30 }],
        message: "براساس داده‌های لقمه، با تغذیه و تمرین منظم، افزایش وزن سالم معمولاً پس از هفته اول سرعت می‌گیرد."
    } : isLose ? {
        color: '#22C55E', // Green
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        chartPath: "M10 10 Q 150 50, 290 90",
        points: [{ x: 10, y: 10 }, { x: 150, y: 50 }, { x: 290, y: 90 }],
        message: "براساس داده‌های لقمه، کاهش وزن معمولاً در هفته‌های اول سریع‌تر است و سپس پایدار می‌شود."
    } : {
        color: '#F59E0B', // Amber
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        chartPath: "M10 50 L 290 50",
        points: [{ x: 10, y: 50 }, { x: 150, y: 50 }, { x: 290, y: 50 }],
        message: "حفظ وزن فعلی نشان‌دهنده سبک زندگی سالم و پایدار شماست."
    };

    return (
        <div className="w-full flex flex-col items-center gap-6 pt-4">
            {/* Top Motivational Box */}
            <div className="w-full bg-gray-200 rounded-[32px] p-8 text-center shadow-inner">
                <h1 className="text-2xl font-black text-gray-800 leading-snug">
                    تو پتانسیل فوق‌العاده‌ای داری<br />که هدفت رو محقق کنی
                </h1>
            </div>

            {/* Chart Card */}
            <div className="w-full bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div className={`w-1 h-6 rounded-full ${isGain ? 'bg-blue-500' : isLose ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <h2 className="text-xl font-bold text-gray-800 flex-1 px-3 text-right">تغییرات وزن شما</h2>
                </div>

                {/* Chart Area */}
                <div className="relative w-full h-40 bg-gray-50 rounded-2xl mb-6 overflow-hidden border border-gray-100">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between py-6 px-0">
                        <div className="w-full h-px bg-gray-100"></div>
                        <div className="w-full h-px bg-gray-100"></div>
                        <div className="w-full h-px bg-gray-100"></div>
                    </div>

                    {/* SVG Chart */}
                    <svg viewBox="0 0 300 100" className="absolute inset-0 w-full h-full p-4" preserveAspectRatio="none">
                        <motion.path
                            d={config.chartPath}
                            fill="none"
                            stroke={config.color}
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                        {/* Points */}
                        {config.points.map((p, i) => (
                            <motion.circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r="5"
                                fill="white"
                                stroke={config.color}
                                strokeWidth="3"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.5 + (i * 0.3) }}
                            />
                        ))}
                    </svg>
                </div>

                {/* X-Axis Labels */}
                <div className="flex justify-between text-xs text-gray-400 font-bold px-2 mb-6">
                    <span>۳ روز</span>
                    <span>۷ روز</span>
                    <span>۳۰ روز</span>
                </div>

                {/* Info Box */}
                <div className={`w-full ${config.bgColor} rounded-2xl p-4 text-right`}>
                    <p className={`text-sm font-bold ${config.textColor} leading-relaxed`}>
                        {config.message}
                    </p>
                </div>
            </div>
        </div>
    );
};

// 14. Referral Code Input
const ReferralCodeInput = ({ value, onChange }: any) => {
    return (
        <div className="w-full">
            <Header
                title="کد معرفی را وارد کنید"
                subtitle={`(اختیاری)\nمی‌توانید این مرحله را رد کنید`}
                icon={<span className="text-3xl">🎟️</span>}
            />

            {/* Discount Notification */}
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="w-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-[24px] p-5 mb-8 flex items-center justify-center shadow-lg shadow-indigo-200 relative overflow-hidden group cursor-default"
            >
                <div className="absolute inset-0 bg-white/10 blur-xl group-hover:bg-white/20 transition-colors"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                        <span className="text-2xl">🎁</span>
                    </div>
                    <p className="text-white font-bold text-sm leading-relaxed text-right">
                        با وارد کردن کد معرف، <br />
                        <span className="text-[#fbbf24] font-black text-lg shadow-black drop-shadow-sm">۷۰٪ تخفیف</span> ویژه دریافت کنید!
                    </p>
                </div>
            </motion.div>

            <div className="relative">
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="کد معرفی"
                    className="w-full h-20 rounded-[24px] bg-white border-2 border-gray-100 px-6 text-center text-2xl font-bold text-gray-800 placeholder-gray-300 focus:border-black focus:ring-4 focus:ring-black/5 focus:outline-none transition-all shadow-sm"
                    dir="ltr"
                />
            </div>
            <p className="text-center text-xs text-gray-400 mt-4 font-medium opacity-60">
                کد را با دقت و حروف انگلیسی وارد کنید
            </p>
        </div>
    );
};

// 15. Trust Intro (Final Step)
const TrustIntro = () => {
    return (
        <div className="w-full flex flex-col items-center pt-8">
            {/* Handshake Icon with Ring */}
            <div className="relative mb-8">
                <div className="w-56 h-56 rounded-full border-[6px] border-[#E8A798]/30 flex items-center justify-center">
                    <div className="w-40 h-40 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <span className="text-7xl">🤝</span>
                    </div>
                </div>
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-4 text-center">از اعتماد شما ممنونیم!</h1>
            <p className="text-gray-500 text-lg text-center mb-12 px-6">
                بیایید لقمه را مخصوص شما شخصی‌سازی کنیم...
            </p>

            {/* Privacy Card */}
            <div className="w-full bg-white rounded-[32px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-2xl border border-gray-100">
                    🔒
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-lg">حریم خصوصی و امنیت شما برای ما مهم است.</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    قول می‌دهیم اطلاعات شخصی شما همواره محرمانه و امن بماند.
                </p>
            </div>
        </div>
    );
};

// Generic components for other steps can be simple for now
const SimpleStep = ({ title, subtitle, icon, value, onChange, options }: any) => (
    <div className="w-full">
        <Header title={title} subtitle={subtitle} icon={icon} />
        {options.map((opt: any) => (
            <SelectionCard
                key={opt.key}
                title={opt.label}
                icon={<span className="text-2xl">✨</span>}
                isSelected={value === opt.key || (Array.isArray(value) && value.includes(opt.key))}
                onClick={() => {
                    if (Array.isArray(value)) {
                        onChange(value.includes(opt.key) ? value.filter((k: any) => k !== opt.key) : [...value, opt.key]);
                    } else {
                        onChange(opt.key);
                    }
                }}
                colorClass="bg-gray-800"
                iconColorClass="text-gray-800"
            />
        ))}
    </div>
);


export default function AdditionalInfo({ onFinish }: { onFinish: () => void }) {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<AdditionalInfoData>({
        dietType: 'standard', // Default
        val: { day: 26, month: 2, year: 1380 }, // birthDate Default
        weight: 70, // Default
        height: 170, // Default
    } as any);

    // Fix: properly structure the initial state
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            birthDate: prev.birthDate || { day: 26, month: 2, year: 1380 },
            weight: prev.weight || 70,
            height: prev.height || 170,
        }));
    }, []);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    const updateData = (key: string, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const nextStep = () => {
        setStep((s) => s + 1);
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const prevStep = () => {
        setStep((s) => Math.max(0, s - 1));
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Skip speed if maintain weight
    const showSpeed = formData.weightGoal !== 'maintain_weight';
    // Show long-term results chart for all goals (lose, maintain, gain)
    const showLongterm = !!formData.weightGoal;

    // Defines steps
    // 0: Gender, 1: Birth, 2: Workout, 3: W/H, 4: Goal, 5: LongTerm (conditional), 6: Target, 7: Speed (Optional), 8: Barriers

    const stepsList = [
        'gender', 'birth', 'workout', 'measurements', 'goal',
        ...(showLongterm ? ['longterm'] : []),
        'target', 'motivational', // motivation step always after target
        ...(showSpeed ? ['speed'] : []), 'barriers', 'diet', 'accomplishment', 'transition', 'referral', 'trust'
    ];

    const currentStepId = stepsList[step];
    const progress = ((step + 1) / stepsList.length) * 100;

    const renderStep = () => {
        switch (currentStepId) {
            case 'gender':
                return <GenderSelection value={formData.gender} onChange={(v) => updateData('gender', v)} />;
            case 'birth':
                return <BirthDateSelection value={formData.birthDate || { day: 26, month: 2, year: 1380 }} onChange={(v: any) => updateData('birthDate', v)} />;
            case 'workout':
                return <WorkoutFrequency value={formData.workoutFrequency} onChange={(v: any) => updateData('workoutFrequency', v)} />;
            case 'measurements':
                return <WeightHeight weight={formData.weight || 70} height={formData.height || 170} onChange={(k: string, v: any) => updateData(k, v)} />;
            case 'goal':
                return <GoalSelection value={formData.weightGoal} onChange={(v: any) => updateData('weightGoal', v)} />;
            case 'longterm':
                return <LongTermResults goal={formData.weightGoal} />;
            case 'target':
                return <TargetWeight value={formData.targetWeight} currentWeight={formData.weight} goal={formData.weightGoal} onChange={(v: any) => updateData('targetWeight', v)} />;
            case 'motivational':
                return <MotivationalStep goal={formData.weightGoal} weight={formData.weight} targetWeight={formData.targetWeight} />;
            case 'speed':
                return <SpeedSelection value={formData.weightLossSpeed} onChange={(v: any) => updateData('weightLossSpeed', v)} goal={formData.weightGoal} />;
            case 'barriers':
                return <BarriersSelection value={formData.barriers || []} onChange={(v: any) => updateData('barriers', v)} />;
            case 'diet':
                return <DietSelection value={formData.dietType} onChange={(v: any) => updateData('dietType', v)} />;
            case 'accomplishment':
                return <AccomplishmentSelection value={formData.accomplishment} onChange={(v: any) => updateData('accomplishment', v)} />;
            case 'transition':
                return <GoalTransitionChart goal={formData.weightGoal || 'lose_weight'} />;
            case 'referral':
                return <ReferralCodeInput value={formData.referralCode} onChange={(v: any) => updateData('referralCode', v)} />;
            case 'trust':
                return <TrustIntro />;
            default:
                return null;
        }
    };

    const isStepValid = () => {
        switch (currentStepId) {
            case 'gender': return !!formData.gender;
            case 'birth': return !!formData.birthDate;
            case 'workout': return !!formData.workoutFrequency;
            case 'measurements': return !!formData.weight && !!formData.height;
            case 'goal': return !!formData.weightGoal;
            case 'longterm': return true; // informational step, always valid
            case 'target': {
                if (formData.weightGoal === 'maintain_weight') return true;
                if (!formData.targetWeight || !formData.weight) return false;
                if (formData.weightGoal === 'lose_weight') return formData.targetWeight < formData.weight;
                if (formData.weightGoal === 'gain_weight') return formData.targetWeight > formData.weight;
                return false;
            }
            case 'motivational': return true; // informational step, always valid
            case 'speed': return !!formData.weightLossSpeed;
            case 'barriers': return formData.barriers && formData.barriers.length > 0;
            case 'diet': return !!formData.dietType;
            case 'accomplishment': return !!formData.accomplishment;
            case 'transition': return true;
            case 'referral': return true;
            case 'trust': return true;
            default: return false;
        }
    };

    const handleNext = async () => {
        if (step === stepsList.length - 1) {
            if (isSubmitting) return;
            setIsSubmitting(true);
            try {
                // Calculate age
                let age = formData.age;
                if (!age && formData.birthDate) {
                    // Create a standard Date object from Jalali input
                    // date-fns-jalali's newDate takes (year, monthIndex, day) in Jalali and returns standard Date
                    const birthDateGeo = newDate(formData.birthDate.year, formData.birthDate.month - 1, formData.birthDate.day);
                    const today = new Date();

                    age = differenceInYears(today, birthDateGeo);
                }

                // Map speed
                const speedMap: any = {
                    'lose_weight': { 'slow': 0.5, 'moderate': 0.7, 'fast': 1.0 },
                    'gain_weight': { 'slow': 0.1, 'moderate': 0.8, 'fast': 1.5 },
                    'maintain_weight': { 'slow': 0.5, 'moderate': 0.5, 'fast': 0.5 }
                };
                const speedKey = formData.weightLossSpeed || 'moderate';
                const goal = formData.weightGoal || 'maintain_weight';
                const weightLossSpeed = speedMap[goal]?.[speedKey] || 0.5;

                // Map diet
                const diet = formData.dietType === 'standard' ? 'classic' : formData.dietType;

                // Map activity level from workout frequency
                const activityMap: Record<string, string> = {
                    '0-2': 'lightly_active',
                    '3-5': 'moderately_active',
                    '6+': 'very_active'
                };
                const activityLevel = activityMap[formData.workoutFrequency || '0-2'] || 'lightly_active';

                const payload = {
                    ...formData,
                    age,
                    activityLevel,
                    weightLossSpeed,
                    targetWeight: goal === 'maintain_weight' ? formData.weight : formData.targetWeight,
                    diet,
                    birthDate: formData.birthDate
                        ? new Date(formData.birthDate.year, formData.birthDate.month - 1, formData.birthDate.day)
                        : undefined
                };

                await apiService.saveAdditionalInfo(payload);
                onFinish();
            } catch (err: any) {
                console.error(err);
                showToast(err.message || 'خطا در ثبت اطلاعات.', 'error');
                setIsSubmitting(false);
            }
        } else {
            nextStep();
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center relative overflow-hidden">

            {/* Top Progress Bar */}
            <div className="w-full h-1 bg-gray-200 fixed top-0 left-0 z-50">
                <motion.div
                    className="h-full bg-black rounded-r-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            <div className="w-full max-w-md flex-1 overflow-y-auto no-scrollbar pb-28 pt-8 px-6" ref={scrollRef}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex flex-col items-center"
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </div>

            <BottomButton
                onClick={handleNext}
                disabled={!isStepValid() || isSubmitting}
                text={step === stepsList.length - 1 ? (isSubmitting ? "در حال ثبت..." : "ثبت") : "ادامه"}
            />

            {step > 0 && (
                <button
                    onClick={prevStep}
                    className="fixed top-6 right-6 z-40 p-2 bg-white/50 backdrop-blur-md rounded-full shadow-sm text-gray-500 hover:bg-white"
                >
                    <Icons.ChevronLeft className="rotate-180" />
                </button>
            )}

        </div>
    );
}
