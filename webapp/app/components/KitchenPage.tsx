"use client";

import React, { useState } from 'react';

// Types for our kitchen items
interface KitchenItem {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image: string;
    prepTime: string; // e.g., "15 min"
    difficulty: 'easy' | 'medium' | 'hard';
}

interface KitchenCategory {
    id: string;
    title: string;
    items: KitchenItem[];
}

// Mock Data
const KITCHEN_DATA: KitchenCategory[] = [
    {
        id: 'breakfast',
        title: 'صبحانه پیشنهادی 🍳',
        items: [
            { id: 'b1', name: 'اوت‌میل با میوه', calories: 350, protein: 12, carbs: 45, fat: 6, image: '🥣', prepTime: '۱۰ دقیقه', difficulty: 'easy' },
            { id: 'b2', name: 'املت اسفناج', calories: 280, protein: 18, carbs: 5, fat: 15, image: '🍳', prepTime: '۱۵ دقیقه', difficulty: 'medium' },
            { id: 'b3', name: 'نان و پنیر و گردو', calories: 320, protein: 10, carbs: 35, fat: 12, image: '🧀', prepTime: '۵ دقیقه', difficulty: 'easy' },
            { id: 'b4', name: 'پنکیک پروتئینی', calories: 400, protein: 25, carbs: 40, fat: 8, image: '🥞', prepTime: '۲۰ دقیقه', difficulty: 'medium' },
        ]
    },
    {
        id: 'lunch',
        title: 'ناهار سالم 🍗',
        items: [
            { id: 'l1', name: 'سالاد سزار با مرغ', calories: 450, protein: 35, carbs: 12, fat: 20, image: '🥗', prepTime: '۲۰ دقیقه', difficulty: 'medium' },
            { id: 'l2', name: 'زرشک پلو با مرغ', calories: 650, protein: 40, carbs: 65, fat: 18, image: '🍚', prepTime: '۶۰ دقیقه', difficulty: 'medium' },
            { id: 'l3', name: 'ماهی قزل‌آلا کبابی', calories: 400, protein: 30, carbs: 0, fat: 22, image: '🐟', prepTime: '۳۰ دقیقه', difficulty: 'medium' },
            { id: 'l4', name: 'پاستا سبزیجات', calories: 550, protein: 15, carbs: 70, fat: 10, image: '🍝', prepTime: '۲۵ دقیقه', difficulty: 'easy' },
        ]
    },
    {
        id: 'dinner',
        title: 'شام سبک 🥑',
        items: [
            { id: 'd1', name: 'سوپ جو', calories: 200, protein: 8, carbs: 30, fat: 5, image: '🍲', prepTime: '۴۵ دقیقه', difficulty: 'easy' },
            { id: 'd2', name: 'سالاد یونانی', calories: 250, protein: 6, carbs: 10, fat: 18, image: '🥒', prepTime: '۱۵ دقیقه', difficulty: 'easy' },
            { id: 'd3', name: 'خوراک لوبیا', calories: 300, protein: 15, carbs: 40, fat: 2, image: '🥘', prepTime: '۴۰ دقیقه', difficulty: 'easy' },
            { id: 'd4', name: 'کوکو سبزی', calories: 350, protein: 12, carbs: 20, fat: 25, image: '🥬', prepTime: '۳۰ دقیقه', difficulty: 'medium' },
        ]
    },
    {
        id: 'snack',
        title: 'میان‌وعده 🍎',
        items: [
            { id: 's1', name: 'ماست یونانی و توت', calories: 150, protein: 15, carbs: 12, fat: 0, image: '🥛', prepTime: '۵ دقیقه', difficulty: 'easy' },
            { id: 's2', name: 'آجیل مخلوط', calories: 200, protein: 6, carbs: 8, fat: 18, image: '🥜', prepTime: '۰ دقیقه', difficulty: 'easy' },
            { id: 's3', name: 'سیب و کره بادام‌زمینی', calories: 220, protein: 7, carbs: 25, fat: 12, image: '🍎', prepTime: '۵ دقیقه', difficulty: 'easy' },
        ]
    }
];

// Helper to convert English numbers to Persian/Farsi numerals
const toPersianNumbers = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

interface KitchenPageProps {
    onBack?: () => void;
    onAddFood?: (food: any) => void;
}

const KitchenPage: React.FC<KitchenPageProps> = ({ onAddFood }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Animation utilities
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="h-full flex flex-col bg-[#F8F9FB] overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            {/* Header */}
            <header className="px-6 pt-8 pb-4 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-1">آشپزخانه 🧑‍🍳</h1>
                        <p className="text-sm text-gray-500 font-medium">پیشنهادهای خوشمزه و سالم برای شما</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100">
                        <span className="text-xl">🥗</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="w-full h-12 pr-12 pl-4 rounded-[20px] bg-white border border-gray-100 focus:border-orange-200 focus:ring-4 focus:ring-orange-50 text-gray-800 placeholder-gray-400 transition-all outline-none font-medium shadow-sm"
                        placeholder="جستجو در غذاها..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar space-y-8 animate-fade-in relative z-10">

                {/* Categories / Tags (Optional future feature, for now static visual) */}
                <div className="px-6 flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {['همه', 'گیاهخواری', 'پروتئین بالا', 'رژیمی', 'خوشمزه'].map((tag, i) => (
                        <button key={i} className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${i === 0 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>
                            {tag}
                        </button>
                    ))}
                </div>

                {KITCHEN_DATA.map((category, catIndex) => (
                    <div key={category.id} className="animate-slide-up" style={{ animationDelay: `${catIndex * 150}ms` }}>
                        <div className="px-6 mb-4 flex justify-between items-end">
                            <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                                <span className="w-1 h-6 bg-orange-500 rounded-full inline-block"></span>
                                {category.title}
                            </h2>
                            <button className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                                مشاهده همه
                            </button>
                        </div>

                        {/* Horizontal List */}
                        <div className="flex overflow-x-auto px-6 gap-4 pb-4 no-scrollbar -mx-1 pt-1 snap-x snap-mandatory">
                            {category.items.filter(item => item.name.includes(searchQuery)).map((item) => (
                                <div
                                    key={item.id}
                                    className="snap-center relative shrink-0 w-[220px] bg-white rounded-[32px] p-4 pb-4 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] border border-gray-100/50 hover:border-orange-200 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl"
                                    onClick={() => onAddFood && onAddFood(item)}
                                >
                                    {/* Image Area */}
                                    <div className="w-full h-32 rounded-[24px] bg-gradient-to-br from-gray-50 to-gray-100 mb-4 flex items-center justify-center text-6xl shadow-inner relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                                        <span className="filter drop-shadow-lg">{item.image}</span>

                                        {/* Add overlay button */}
                                        <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-orange-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>

                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                                            <span>⏱️</span>
                                            {toPersianNumbers(item.prepTime)}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 mb-1 truncate text-lg">{item.name}</h3>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-orange-500 font-extrabold text-sm flex items-center gap-1">
                                                🔥 {toPersianNumbers(item.calories)}
                                            </span>
                                            <span className="text-gray-300 text-xs">|</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
                                                    item.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                {item.difficulty === 'easy' ? 'آسان' : item.difficulty === 'medium' ? 'متوسط' : 'سخت'}
                                            </span>
                                        </div>

                                        {/* Macros Mini Bar */}
                                        <div className="flex gap-1 mt-2 bg-gray-50 p-2 rounded-2xl justify-between">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] text-gray-400 font-medium">پروتئین</span>
                                                <span className="text-[10px] text-gray-700 font-bold">{toPersianNumbers(item.protein)}g</span>
                                            </div>
                                            <div className="w-px bg-gray-200"></div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] text-gray-400 font-medium">کربو</span>
                                                <span className="text-[10px] text-gray-700 font-bold">{toPersianNumbers(item.carbs)}g</span>
                                            </div>
                                            <div className="w-px bg-gray-200"></div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] text-gray-400 font-medium">چربی</span>
                                                <span className="text-[10px] text-gray-700 font-bold">{toPersianNumbers(item.fat)}g</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* "See More" Card */}
                            <div className="snap-center shrink-0 w-[100px] flex flex-col items-center justify-center">
                                <button className="w-14 h-14 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all duration-300 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                                <span className="text-xs font-bold text-gray-400">بیشتر</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Floating Promo Card */}
                <div className="mx-6 p-6 mt-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-[32px] text-white relative overflow-hidden shadow-xl animate-scale-up">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>

                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">
                            👨‍🍳
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1">سرآشپز هوشمند</h3>
                            <p className="text-xs text-gray-300 max-w-[200px] leading-relaxed">
                                با مواد اولیه‌ای که داری، بگو چی بپزم تا بهت دستور پخت بدم!
                            </p>
                        </div>
                    </div>
                    <button className="mt-4 w-full py-3 bg-white text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg active:scale-95">
                        درخواست دستور پخت
                    </button>
                </div>

                <div className="h-10"></div>
            </div>
        </div>
    );
};

export default KitchenPage;
