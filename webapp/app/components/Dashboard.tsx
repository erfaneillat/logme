"use client";

import React from 'react';
import DateHeader from './DateHeader';
import CircularProgress from './CircularProgress';
import NutrientCard from './NutrientCard';
import { FoodItem, DailyGoals } from '../types';

interface DashboardProps {
    goals: DailyGoals;
    consumed: { calories: number; protein: number; carbs: number; fat: number };
    foods: FoodItem[];
    setIsModalOpen: (isOpen: boolean) => void;
    onFoodClick: (food: FoodItem) => void;
}

// Icons
const FireIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
);

// Fat/Oil Drop Icon - Clean water drop shape
const DropIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor" />
    </svg>
);

// Carbs/Bread Icon - Simple bread/grain shape
const WheatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
        <ellipse cx="12" cy="8" rx="8" ry="5" />
        <path d="M4 8v6c0 2.76 3.58 5 8 5s8-2.24 8-5V8" />
        <ellipse cx="12" cy="14" rx="8" ry="5" fillOpacity="0.3" />
    </svg>
);

const LightningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
);

// Macro Pill Component
const MacroPill = ({ label, value, color, bg }: { label: string, value: string, color: string, bg: string }) => (
    <div className={`${bg} ${color} px-2.5 py-1 rounded-xl text-[10px] font-bold border border-transparent hover:border-current transition-colors flex items-center gap-1`}>
        <span>{value}</span>
        <span className="opacity-70">{label}</span>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ goals, consumed, foods, setIsModalOpen, onFoodClick }) => {
    return (
        <>
            <DateHeader />
            <main className="flex-1 px-5 overflow-y-auto no-scrollbar pb-32 animate-fade-in">
                {/* Main Calorie Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-between mb-6 relative overflow-hidden">
                    {/* Decorative background blob */}
                    <div className="absolute -left-10 -top-10 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-60"></div>

                    <div className="flex-1 relative z-10">
                        <div className="text-gray-500 font-semibold text-sm mb-1">کالری باقیمانده</div>
                        <div className="text-5xl font-black text-gray-800 tracking-tight leading-tight">
                            {Math.max(0, goals.calories - consumed.calories)}
                        </div>

                        <div className="mt-4 flex items-center">
                            <div className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-100">
                                {Math.round((consumed.calories / goals.calories) * 100)}% مصرف شده
                            </div>
                        </div>
                    </div>

                    <div className="flex-shrink-0 mr-4 relative z-10">
                        <CircularProgress
                            value={consumed.calories}
                            max={goals.calories}
                            size={130}
                            strokeWidth={12}
                            color="#F97316"
                            icon={<FireIcon />}
                            reverse={true}
                        />
                    </div>
                </div>

                {/* Nutrient Grid */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <NutrientCard
                        label="چربی"
                        value={consumed.fat}
                        total={goals.fat}
                        unit="گرم"
                        color="#A855F7"
                        icon={<DropIcon />}
                    />
                    <NutrientCard
                        label="کربو"
                        value={consumed.carbs}
                        total={goals.carbs}
                        unit="گرم"
                        color="#EAB308"
                        icon={<WheatIcon />}
                    />
                    <NutrientCard
                        label="پروتئین"
                        value={consumed.protein}
                        total={goals.protein}
                        unit="گرم"
                        color="#3B82F6"
                        icon={<LightningIcon />}
                    />
                </div>

                {/* Recently Eaten Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h3 className="text-xl font-bold text-gray-800">اخیرأ خورده شده‌ها</h3>
                    </div>

                    {foods.length === 0 ? (
                        <div className="bg-white rounded-[24px] p-8 text-center border-2 border-dashed border-gray-100 hover:border-orange-100 transition-colors cursor-pointer group" onClick={() => setIsModalOpen(true)}>
                            <div className="w-16 h-16 bg-gray-50 group-hover:bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
                                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300">📸</span>
                            </div>
                            <h4 className="font-bold text-gray-700 mb-1">هنوز غذایی ثبت نشده</h4>
                            <p className="text-sm text-gray-400 max-w-[200px] mx-auto">
                                اولین وعده غذایی خود را ثبت کنید
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {foods.map((food, index) => (
                                <div
                                    key={food.id}
                                    onClick={() => onFoodClick(food)}
                                    className="bg-white p-4 rounded-[28px] shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group animate-slide-up-item cursor-pointer"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Content */}
                                    <div className="flex gap-4 items-start">
                                        {/* Image Container (Right aligned in RTL via flex behavior) */}
                                        <div className="w-24 h-24 rounded-[22px] bg-gray-50 overflow-hidden shrink-0 shadow-inner border border-gray-100 relative group-hover:scale-105 transition-transform duration-500">
                                            {food.imageUrl ? (
                                                <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl">🍲</div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-0.5">
                                            {/* Top: Title & Time */}
                                            <div className="flex justify-between items-start w-full">
                                                <h4 className="font-black text-gray-800 text-base leading-tight line-clamp-2 pl-2 text-right w-full ml-2 group-hover:text-orange-600 transition-colors">
                                                    {food.name}
                                                </h4>
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg shrink-0 tabular-nums">
                                                    {food.timestamp.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* Middle: Calories */}
                                            <div className="text-xl font-black text-gray-900 mt-auto mb-2 text-right">
                                                {food.calories} <span className="text-xs font-bold text-gray-400">کالری</span>
                                            </div>

                                            {/* Bottom: Macros */}
                                            <div className="flex gap-1.5 justify-end flex-wrap">
                                                <MacroPill value={`${food.protein}`} label="گرم" color="text-blue-600" bg="bg-blue-50" />
                                                <MacroPill value={`${food.carbs}`} label="گرم" color="text-yellow-600" bg="bg-yellow-50" />
                                                <MacroPill value={`${food.fat}`} label="گرم" color="text-purple-600" bg="bg-purple-50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.4s ease-out;
        }
        @keyframes slide-up-item {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-item {
            animation: slide-up-item 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            opacity: 0; /* Default hidden before animation */
        }
      `}</style>
        </>
    );
};

export default Dashboard;
