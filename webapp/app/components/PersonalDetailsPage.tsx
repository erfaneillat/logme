"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, AdditionalInfo } from '../services/apiService';
import { format, getYear, getMonth, getDate, newDate } from 'date-fns-jalali';

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

// --- Jalali Date Picker ---
interface JalaliDate { day: number; month: number; year: number }

const JalaliDatePicker = ({ value, onChange }: { value: JalaliDate, onChange: (val: JalaliDate) => void }) => {
    const years = Array.from({ length: 90 }, (_, i) => 1313 + i).reverse();
    const months = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];
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
                <span className="flex-1 text-center">ماه</span>
                <span className="flex-1 text-center">روز</span>
                <span className="flex-1 text-center">سال</span>
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
    const [info, setInfo] = useState<AdditionalInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Edit Modal State
    const [editingField, setEditingField] = useState<{ key: keyof AdditionalInfo; label: string; type: 'number' | 'text' | 'date' | 'select' | 'gender' | 'goal'; options?: string[] } | null>(null);
    const [editValue, setEditValue] = useState<string | number>(''); // For text/number inputs
    const [jalaliDate, setJalaliDate] = useState<JalaliDate>({ year: 1380, month: 1, day: 1 }); // For date picker

    const [isSaving, setIsSaving] = useState(false);

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
            // Parse ISO string to Jalali parts
            try {
                const date = new Date(val);
                if (!isNaN(date.getTime())) {
                    setJalaliDate({
                        year: getYear(date),
                        month: getMonth(date) + 1,
                        day: getDate(date)
                    });
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
                // Convert Jalali parts back to Date object
                try {
                    const dateObj = newDate(jalaliDate.year, jalaliDate.month - 1, jalaliDate.day);
                    // Use format to get ISO string YYYY-MM-DD for API
                    // Be careful with newDate, it might create local time.
                    // Ideally send ISO string at noon to avoid timezone shifts affecting day
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
            alert('Error updating info');
        } finally {
            setIsSaving(false);
        }
    };

    const getGenderLabel = (g?: string) => {
        if (!g) return 'تعیین نشده';
        const lower = g.toLowerCase();
        if (lower === 'male' || lower === 'm') return 'مرد';
        if (lower === 'female' || lower === 'f') return 'زن';
        return 'سایر';
    };

    const formatJalaliDate = (dateStr?: string) => {
        if (!dateStr) return 'تعیین نشده';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return format(date, 'd MMMM yyyy');
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-0 sm:p-4"
            onClick={onClose}
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
                        <h2 className="text-lg font-black text-gray-800">اطلاعات شخصی</h2>
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
                                label="جنسیت"
                                value={getGenderLabel(info?.gender)}
                                onEdit={() => handleEdit('gender', 'جنسیت', 'gender')}
                            />
                            <DetailRow
                                icon="🎂"
                                label="تاریخ تولد"
                                value={formatJalaliDate(info?.birthDate)}
                                onEdit={() => handleEdit('birthDate', 'تاریخ تولد', 'date')}
                            />
                            <DetailRow
                                icon="📏"
                                label="قد"
                                value={info?.height ? `${info.height}` : 'تعیین نشده'}
                                subValue={info?.height ? 'سانتی‌متر' : ''}
                                onEdit={() => handleEdit('height', 'قد (سانتی‌متر)', 'number')}
                            />
                            <DetailRow
                                icon="⚖️"
                                label="وزن فعلی"
                                value={info?.weight ? `${info.weight}` : 'تعیین نشده'}
                                subValue={info?.weight ? 'کیلوگرم' : ''}
                                onEdit={() => handleEdit('weight', 'وزن (کیلوگرم)', 'number')}
                            />
                            <DetailRow
                                icon="🎯"
                                label="وزن هدف"
                                value={info?.targetWeight ? `${info.targetWeight}` : 'تعیین نشده'}
                                subValue={info?.targetWeight ? 'کیلوگرم' : ''}
                                onEdit={() => handleEdit('targetWeight', 'وزن هدف (کیلوگرم)', 'number')}
                            />
                            <DetailRow
                                icon="🚩"
                                label="هدف"
                                value={info?.weightGoal === 'lose_weight' ? 'کاهش وزن' : info?.weightGoal === 'gain_weight' ? 'افزایش وزن' : info?.weightGoal === 'maintain_weight' ? 'حفظ وزن' : 'تعیین نشده'}
                                onEdit={() => handleEdit('weightGoal', 'هدف', 'goal')}
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
                            <h3 className="text-xl font-black text-gray-800 mb-6">ویرایش {editingField.label}</h3>

                            {editingField.type === 'gender' ? (
                                <div className="flex gap-3 mb-8">
                                    {['male', 'female'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setEditValue(g)}
                                            className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${editValue === g ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            {g === 'male' ? 'مرد' : 'زن'}
                                        </button>
                                    ))}
                                </div>
                            ) : editingField.type === 'goal' ? (
                                <div className="flex flex-col gap-3 mb-8">
                                    {[
                                        { val: 'lose_weight', label: 'کاهش وزن' },
                                        { val: 'maintain_weight', label: 'حفظ وزن' },
                                        { val: 'gain_weight', label: 'افزایش وزن' }
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
                                    <JalaliDatePicker
                                        value={jalaliDate}
                                        onChange={setJalaliDate}
                                    />
                                    <p className="text-center text-xs text-gray-400 mt-3 font-medium">
                                        تاریخ انتخاب شده: {jalaliDate.year}/{jalaliDate.month}/{jalaliDate.day}
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
                                    انصراف
                                </button>
                                <button
                                    onClick={saveEdit}
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'ذخیره'}
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
