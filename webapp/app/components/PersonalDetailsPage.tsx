"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, AdditionalInfo } from '../services/apiService';
import { format, getYear, getMonth, getDate, newDate } from 'date-fns-jalali';
import { format as formatGregorian } from 'date-fns';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../translations';

interface PersonalDetailsPageProps {
    onClose: () => void;
}

// --- Scroll Wheel Component (Copied from AdditionalInfo.tsx) ---
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
        <div className="relative h-[200px] w-full overflow-hidden text-center select-none" dir="ltr">
            <div className="absolute top-[75px] left-0 right-0 h-[50px] bg-gray-100 rounded-[12px] -z-10 pointer-events-none" />
            <div
                ref={containerRef}
                className="h-full w-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[75px]"
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

// --- Date Picker (supports both Jalali and Gregorian) ---
interface JalaliDate { day: number; month: number; year: number }

interface DatePickerProps {
    value: JalaliDate;
    onChange: (val: JalaliDate) => void;
    months: string[];
    labels: { month: string; day: string; year: string };
    isJalali?: boolean;
}

const DatePicker = ({ value, onChange, months, labels, isJalali = true }: DatePickerProps) => {
    const years = isJalali
        ? Array.from({ length: 90 }, (_, i) => 1313 + i).reverse()
        : Array.from({ length: 90 }, (_, i) => 1934 + i).reverse();
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const currentMonthName = months[value.month - 1] || months[0];

    const setPart = (part: keyof JalaliDate | 'monthName', v: any) => {
        let newVal = { ...value };
        if (part === 'monthName') {
            newVal.month = months.indexOf(v) + 1;
        } else {
            newVal[part as keyof JalaliDate] = v;
        }
        onChange(newVal);
    };

    return (
        <div className="bg-white rounded-[20px] border border-gray-100 w-full overflow-hidden">
            <div className="flex justify-between mb-2 mt-4 px-4 text-xs font-bold text-gray-400">
                <span className="flex-1 text-center">{labels.month}</span>
                <span className="flex-1 text-center">{labels.day}</span>
                <span className="flex-1 text-center">{labels.year}</span>
            </div>
            <div className="flex gap-2 h-[200px] w-full relative">
                <div className="flex-1 relative">
                    <ScrollWheel items={months} value={currentMonthName} onChange={(v) => setPart('monthName', v)} />
                </div>
                <div className="flex-1 relative">
                    <ScrollWheel items={days} value={value.day} onChange={(v) => setPart('day', v)} />
                </div>
                <div className="flex-1 relative">
                    <ScrollWheel items={years} value={value.year} onChange={(v) => setPart('year', v)} />
                </div>
            </div>
        </div>
    );
};


const DetailRow = ({
    icon,
    label,
    value,
    subValue,
    onEdit
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    subValue?: string;
    onEdit?: () => void;
}) => (
    <div
        className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-purple-200 hover:shadow-lg hover:shadow-purple-50/50 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
        onClick={onEdit}
    >
        <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 group-hover:bg-purple-50/50 transition-all duration-500"></div>

        <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-[20px] bg-gray-50 flex items-center justify-center shrink-0 text-2xl text-gray-600 group-hover:bg-white group-hover:text-purple-600 group-hover:shadow-sm transition-all duration-300">
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-500 font-bold mb-1 group-hover:text-purple-500 transition-colors">{label}</p>
                <div className="flex items-baseline gap-1">
                    <p className="text-xl font-black text-gray-800">{value}</p>
                    {subValue && <span className="text-xs font-bold text-gray-400">{subValue}</span>}
                </div>
            </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-all duration-300 transform group-hover:rotate-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
        </div>
    </div>
);

const PersonalDetailsPage: React.FC<PersonalDetailsPageProps> = ({ onClose }) => {
    const { t, isRTL } = useTranslation();
    const [info, setInfo] = useState<AdditionalInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Edit Modal State
    const [editingField, setEditingField] = useState<{ key: keyof AdditionalInfo; label: string; type: 'number' | 'text' | 'date' | 'select' | 'gender' | 'goal'; options?: string[] } | null>(null);
    const [editValue, setEditValue] = useState<string | number>(''); // For text/number inputs
    const [dateValue, setDateValue] = useState<JalaliDate>({ year: isRTL ? 1380 : 2000, month: 1, day: 1 }); // For date picker

    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    // Get months from translations
    const months = t('personalDetails.months', { returnObjects: true }) as string[];
    const dateLabels = {
        month: t('personalDetails.dateLabels.month'),
        day: t('personalDetails.dateLabels.day'),
        year: t('personalDetails.dateLabels.year')
    };

    useEffect(() => {
        fetchInfo();
    }, []);

    const fetchInfo = async () => {
        try {
            const data = await apiService.getAdditionalInfo();
            setInfo(data);
        } catch (error) {
            console.error('Failed to fetch personal details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (key: keyof AdditionalInfo, label: string, type: any, options?: string[]) => {
        if (!info) return;

        let val = info[key];

        if (type === 'date' && typeof val === 'string') {
            // Parse ISO string to date parts
            try {
                const date = new Date(val);
                if (!isNaN(date.getTime())) {
                    if (isRTL) {
                        // Jalali date
                        setDateValue({
                            year: getYear(date),
                            month: getMonth(date) + 1,
                            day: getDate(date)
                        });
                    } else {
                        // Gregorian date
                        setDateValue({
                            year: date.getFullYear(),
                            month: date.getMonth() + 1,
                            day: date.getDate()
                        });
                    }
                }
            } catch (e) {
                console.error("Error parsing date:", e);
            }
        } else {
            setEditValue(val as string | number || '');
        }

        setEditingField({ key, label, type, options });
    };

    const saveEdit = async () => {
        if (!editingField) return;
        setIsSaving(true);
        try {
            let val: any;

            if (editingField.type === 'date') {
                // Convert date parts back to Date object
                try {
                    let dateObj: Date;
                    if (isRTL) {
                        dateObj = newDate(dateValue.year, dateValue.month - 1, dateValue.day);
                    } else {
                        dateObj = new Date(dateValue.year, dateValue.month - 1, dateValue.day);
                    }
                    dateObj.setHours(12, 0, 0, 0);
                    val = dateObj.toISOString().split('T')[0];
                } catch (e) {
                    console.error("Error converting date:", e);
                    val = info?.[editingField.key]; // Fallback
                }
            } else if (editingField.type === 'number') {
                val = Number(editValue);
            } else {
                val = editValue;
            }

            const updated = await apiService.updateAdditionalInfo({ [editingField.key]: val });
            if (updated) {
                setInfo(updated);
            }
            setEditingField(null);
        } catch (error) {
            console.error('Failed to update info:', error);
            showToast(t('personalDetails.updateError'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const getGenderLabel = (g?: string) => {
        if (!g) return t('personalDetails.notSet');
        const lower = g.toLowerCase();
        if (lower === 'male' || lower === 'm') return t('personalDetails.male');
        if (lower === 'female' || lower === 'f') return t('personalDetails.female');
        return t('personalDetails.other');
    };

    const formatDateDisplay = (dateStr?: string) => {
        if (!dateStr) return t('personalDetails.notSet');
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            if (isRTL) {
                return format(date, 'd MMMM yyyy');
            } else {
                return formatGregorian(date, 'MMMM d, yyyy');
            }
        } catch (e) {
            return dateStr;
        }
    };

    const getGoalLabel = (goal?: string) => {
        if (!goal) return t('personalDetails.notSet');
        if (goal === 'lose_weight') return t('personalDetails.loseWeight');
        if (goal === 'gain_weight') return t('personalDetails.gainWeight');
        if (goal === 'maintain_weight') return t('personalDetails.maintainWeight');
        return t('personalDetails.notSet');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-0 sm:p-4"
            onClick={onClose}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-gray-50 bg-white z-10 shrink-0">
                    <div className="w-8"></div>
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mb-3 sm:hidden"></div>
                        <h2 className="text-lg font-black text-gray-800">{t('personalDetails.title')}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors text-gray-400"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 bg-white rounded-[24px] animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <DetailRow
                                icon="👫"
                                label={t('personalDetails.gender')}
                                value={getGenderLabel(info?.gender)}
                                onEdit={() => handleEdit('gender', t('personalDetails.genderLabel'), 'gender')}
                            />
                            <DetailRow
                                icon="🎂"
                                label={t('personalDetails.birthDate')}
                                value={formatDateDisplay(info?.birthDate)}
                                onEdit={() => handleEdit('birthDate', t('personalDetails.birthDateLabel'), 'date')}
                            />
                            <DetailRow
                                icon="📏"
                                label={t('personalDetails.height')}
                                value={info?.height ? `${info.height}` : t('personalDetails.notSet')}
                                subValue={info?.height ? t('personalDetails.cm') : ''}
                                onEdit={() => handleEdit('height', t('personalDetails.heightLabel'), 'number')}
                            />
                            <DetailRow
                                icon="⚖️"
                                label={t('personalDetails.weight')}
                                value={info?.weight ? `${info.weight}` : t('personalDetails.notSet')}
                                subValue={info?.weight ? t('personalDetails.kg') : ''}
                                onEdit={() => handleEdit('weight', t('personalDetails.weightLabel'), 'number')}
                            />
                            <DetailRow
                                icon="🎯"
                                label={t('personalDetails.targetWeight')}
                                value={info?.targetWeight ? `${info.targetWeight}` : t('personalDetails.notSet')}
                                subValue={info?.targetWeight ? t('personalDetails.kg') : ''}
                                onEdit={() => handleEdit('targetWeight', t('personalDetails.targetWeightLabel'), 'number')}
                            />
                            <DetailRow
                                icon="🚩"
                                label={t('personalDetails.goal')}
                                value={getGoalLabel(info?.weightGoal)}
                                onEdit={() => handleEdit('weightGoal', t('personalDetails.goalLabel'), 'goal')}
                            />
                        </>
                    )}
                </div>
            </motion.div>

            {/* Inner Edit Modal (Nested) */}
            <AnimatePresence>
                {editingField && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center bg-black/20 backdrop-blur-[2px] p-0 sm:p-4"
                        onClick={() => setEditingField(null)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-white rounded-t-[32px] sm:rounded-[32px] p-6 w-full max-w-md shadow-2xl overflow-hidden mb-0 sm:mb-20"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
                            <h3 className="text-xl font-black text-gray-800 mb-6">{t('personalDetails.edit')} {editingField.label}</h3>

                            {editingField.type === 'gender' ? (
                                <div className="flex gap-3 mb-8">
                                    {['male', 'female'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setEditValue(g)}
                                            className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${editValue === g ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            {g === 'male' ? t('personalDetails.male') : t('personalDetails.female')}
                                        </button>
                                    ))}
                                </div>
                            ) : editingField.type === 'goal' ? (
                                <div className="flex flex-col gap-3 mb-8">
                                    {[
                                        { val: 'lose_weight', label: t('personalDetails.loseWeight') },
                                        { val: 'maintain_weight', label: t('personalDetails.maintainWeight') },
                                        { val: 'gain_weight', label: t('personalDetails.gainWeight') }
                                    ].map(g => (
                                        <button
                                            key={g.val}
                                            onClick={() => setEditValue(g.val)}
                                            className={`w-full py-4 rounded-xl border-2 font-bold transition-all ${editValue === g.val ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            ) : editingField.type === 'date' ? (
                                <div className="mb-8">
                                    <DatePicker
                                        value={dateValue}
                                        onChange={setDateValue}
                                        months={months}
                                        labels={dateLabels}
                                        isJalali={isRTL}
                                    />
                                    <p className="text-center text-xs text-gray-400 mt-3 font-medium">
                                        {t('personalDetails.selectedDate')}: {dateValue.year}/{dateValue.month}/{dateValue.day}
                                    </p>
                                </div>
                            ) : (
                                <div className="mb-8">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{editingField.label}</label>
                                    <input
                                        type={editingField.type === 'number' ? 'number' : 'text'}
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-full px-4 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all font-medium text-gray-800 text-center text-lg"
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditingField(null)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                                >
                                    {t('personalDetails.cancel')}
                                </button>
                                <button
                                    onClick={saveEdit}
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : t('personalDetails.save')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PersonalDetailsPage;
