"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FoodItem } from '../types';
import CircularProgress from './CircularProgress';

interface FoodDetailModalProps {
    food: FoodItem | null;
    onClose: () => void;
}

// Mock ingredients for UI demonstration
const MOCK_INGREDIENTS = [
    { id: 1, name: 'همبرگر (ساندویچ)', cal: 454, p: 22, c: 42, f: 22 },
    { id: 2, name: 'استیک گاو', cal: 266, p: 26, c: 0, f: 18 },
    { id: 3, name: 'تخم‌مرغ آب‌پز', cal: 73, p: 6, c: 1, f: 5 },
    { id: 4, name: 'ذرت کبابی', cal: 109, p: 3, c: 22, f: 1 },
    { id: 5, name: 'کیوی', cal: 101, p: 2, c: 21, f: 1 },
];

const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ food, onClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (food) {
            setIsOpen(true);
            setQuantity(1);
            setScrollProgress(0);
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
        } else {
            const timer = setTimeout(() => setIsOpen(false), 300);
            return () => clearTimeout(timer);
        }
    }, [food]);

    if (!food && !isOpen) return null;

    const displayFood = food || {
        name: '', calories: 0, protein: 0, carbs: 0, fat: 0, imageUrl: '', timestamp: new Date()
    };

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(onClose, 300);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const triggerHeight = window.innerHeight * 0.3;
        const progress = Math.min(1, Math.max(0, scrollTop / triggerHeight));
        setScrollProgress(progress);
    };

    const isScrolled = scrollProgress > 0.8;
    const headerBgOpacity = Math.max(0, (scrollProgress - 0.2) / 0.8);

    return (
        <div className={`fixed inset-0 z-[60] bg-[#F8F9FB] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto no-scrollbar relative w-full"
            >
                {/* Fixed Background Image (Parallax Layer) */}
                <div className="fixed top-0 left-0 right-0 h-[45vh] z-0 pointer-events-none overflow-hidden">
                    <div className="relative w-full h-full">
                        {displayFood.imageUrl ? (
                            <img
                                src={displayFood.imageUrl}
                                alt={displayFood.name}
                                className="w-full h-full object-cover transition-transform duration-75 will-change-transform"
                                style={{
                                    transform: `scale(${1 + scrollProgress * 0.1}) translateY(${scrollProgress * 40}px)`
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl bg-gray-900">🍲</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/30"></div>
                    </div>
                </div>

                {/* Sticky Header Bar */}
                <div
                    className="fixed top-0 left-0 right-0 z-50 px-5 pt-4 pb-3 flex justify-between items-center transition-all duration-300"
                    style={{
                        backgroundColor: `rgba(255, 255, 255, ${headerBgOpacity > 0.95 ? 0.95 : headerBgOpacity})`,
                        backdropFilter: headerBgOpacity > 0.1 ? 'blur(12px)' : 'none',
                        borderBottom: headerBgOpacity > 0.9 ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                        boxShadow: headerBgOpacity > 0.9 ? '0 4px 20px -5px rgba(0,0,0,0.05)' : 'none',
                    }}
                >
                    <button
                        onClick={handleClose}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isScrolled
                                ? 'bg-gray-100 text-gray-800 shadow-sm'
                                : 'bg-white/20 backdrop-blur-md text-white border border-white/10'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>

                    {/* Collapsed Title */}
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-gray-800 text-sm transition-all duration-300 pointer-events-none"
                        style={{
                            opacity: isScrolled ? 1 : 0,
                            transform: isScrolled ? 'translate(-50%, -50%) translateY(0)' : 'translate(-50%, -50%) translateY(10px)'
                        }}
                    >
                        {displayFood.name.split(' ').slice(0, 3).join(' ')}...
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isScrolled
                                    ? 'bg-gray-100 shadow-sm'
                                    : 'bg-white/20 backdrop-blur-md border border-white/10'
                                } ${isFavorite ? 'text-red-500' : (isScrolled ? 'text-gray-600' : 'text-white')}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Scrolling Content Wrapper */}
                <div className="relative w-full z-10 flex flex-col min-h-screen">
                    {/* Spacer matching desired initial image visibility */}
                    <div className="h-[38vh] w-full shrink-0"></div>

                    {/* White Card Content */}
                    <div className="flex-1 bg-[#F8F9FB] rounded-t-[40px] -mt-10 pb-10 shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.15)] relative">

                        {/* Pull Bar */}
                        <div className="w-12 h-1.5 bg-gray-300/50 rounded-full mx-auto mt-3 mb-6"></div>

                        <div className="px-6">
                            {/* Title */}
                            <h1 className="text-2xl font-black text-center text-gray-900 leading-tight mb-8">
                                {displayFood.name}
                            </h1>

                            {/* Controls & Summary */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {/* Quantity Control */}
                                <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <span className="text-xs font-bold text-gray-400 mb-2">تعداد وعده</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 rounded-xl bg-gray-50 text-gray-800 flex items-center justify-center hover:bg-gray-100 font-bold text-lg">+</button>
                                        <span className="text-2xl font-black text-gray-900 w-6 text-center">{quantity}</span>
                                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-xl bg-gray-50 text-gray-800 flex items-center justify-center hover:bg-gray-100 font-bold text-lg">-</button>
                                    </div>
                                </div>

                                {/* Calories Control */}
                                <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="absolute top-3 left-3 text-gray-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 mb-1">کالری کل</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-gray-900">{displayFood.calories * quantity}</span>
                                        <span className="text-xs font-bold text-gray-500">کالری</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Macros Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {/* Fat */}
                                <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden">
                                    <span className="text-xs font-bold text-gray-400 mb-2">چربی</span>
                                    <div className="text-xl font-black text-purple-600 mb-1">{displayFood.fat * quantity} <span className="text-xs text-gray-400">گرم</span></div>
                                    <div className="w-full h-1.5 bg-purple-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 w-[40%] rounded-full"></div>
                                    </div>
                                    <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-purple-500"></div>
                                </div>

                                {/* Protein */}
                                <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden">
                                    <span className="text-xs font-bold text-gray-400 mb-2">پروتئین</span>
                                    <div className="text-xl font-black text-blue-600 mb-1">{displayFood.protein * quantity} <span className="text-xs text-gray-400">گرم</span></div>
                                    <div className="w-full h-1.5 bg-blue-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[60%] rounded-full"></div>
                                    </div>
                                    <div className="absolute top-3 left-3 text-blue-500">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>

                                {/* Health Score */}
                                <div className="bg-white p-3 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                    <span className="text-xs font-bold text-gray-400 mb-2">امتیاز سلامت</span>
                                    <div className="relative flex items-center justify-center">
                                        <CircularProgress
                                            value={9} max={10} size={50} strokeWidth={5} color="#10B981"
                                            showValue={false}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-black text-gray-800">9</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Carbs */}
                                <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden">
                                    <span className="text-xs font-bold text-gray-400 mb-2">کربوهیدرات</span>
                                    <div className="text-xl font-black text-yellow-600 mb-1">{displayFood.carbs * quantity} <span className="text-xs text-gray-400">گرم</span></div>
                                    <div className="w-full h-1.5 bg-yellow-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500 w-[55%] rounded-full"></div>
                                    </div>
                                    <div className="absolute top-3 left-3 text-yellow-500">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v2.819l6.96 3.48a1 1 0 01.59-1.225l-6.91-3.454V12a1 1 0 012 0v1.181l6.96 3.48a1 1 0 01.59-1.225l-6.91-3.454V10a1 1 0 012 0v1.181l5.86 2.93a1 1 0 11-.894 1.789L8 12.82V16a1 1 0 01-2 0v-4.18L5 11.237V12a1 1 0 01-2 0V3a1 1 0 011-1v8.5l1.618.81L5 11.666V11z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Fix Button */}
                            <button className="w-full py-4 bg-gray-900 text-white rounded-[20px] font-bold text-lg shadow-xl shadow-gray-300 hover:bg-gray-800 active:scale-95 transition-all mb-10 flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                                اصلاح نتیجه
                            </button>

                            {/* Ingredients Header */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-xl text-gray-800">مواد اولیه</h3>
                                <button className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-colors">
                                    + افزودن
                                </button>
                            </div>

                            {/* Ingredients List */}
                            <div className="space-y-4 pb-20">
                                {MOCK_INGREDIENTS.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col gap-3 animate-slide-up"
                                        style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800 text-lg">{item.name}</h4>
                                            <div className="text-sm font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">
                                                {item.cal} <span className="text-[10px] text-gray-500 font-bold">کالری</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div className="flex gap-2">
                                                <span className="text-[10px] font-bold bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded-lg border border-yellow-100">
                                                    {item.c} گرم C
                                                </span>
                                                <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg border border-purple-100">
                                                    {item.f} گرم F
                                                </span>
                                                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100">
                                                    {item.p} گرم P
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-[24px] font-bold text-sm hover:border-orange-200 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
                                    <span>+</span>
                                    <span>افزودن ماده اولیه</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
            animation: slide-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            opacity: 0;
        }
      `}</style>
        </div>
    );
};

export default FoodDetailModal;
