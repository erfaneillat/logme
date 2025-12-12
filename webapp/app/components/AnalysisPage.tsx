"use client";

import React, { useState, useEffect } from 'react';

// Mock Data
const WEIGHT_DATA = {
    current: 75,
    goal: 65,
    start: 82,
    bmi: 24.5
};

const WEIGHT_HISTORY = [82, 80.5, 79.2, 78.5, 77.8, 76.2, 75];
const HISTORY_LABELS = ['هفته ۱', 'هفته ۲', 'هفته ۳', 'هفته ۴', 'هفته ۵', 'هفته ۶', 'اکنون'];

const WEEKLY_DATA = [
    { day: 'ش', height: 60 },
    { day: 'ی', height: 75 },
    { day: 'د', height: 65 },
    { day: 'س', height: 90 },
    { day: 'چ', height: 80 },
    { day: 'پ', height: 5 },
    { day: 'ج', height: 5 },
];

const AnalysisPage: React.FC = () => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setAnimate(true));
    }, []);

    // SVG Chart Math
    const chartHeight = 120;
    const chartWidth = 300;
    const maxWeight = Math.max(...WEIGHT_HISTORY) + 1;
    const minWeight = Math.min(...WEIGHT_HISTORY) - 1;

    const getCoordinates = (index: number, value: number) => {
        const x = (index / (WEIGHT_HISTORY.length - 1)) * chartWidth;
        const y = ((maxWeight - value) / (maxWeight - minWeight)) * chartHeight;
        return { x, y };
    };

    const points = WEIGHT_HISTORY.map((val, i) => getCoordinates(i, val));
    const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    const areaD = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

    return (
        <div className="px-5 pt-8 pb-32 space-y-6 overflow-y-auto h-full no-scrollbar">
            <div className="flex justify-between items-center">
                <h1 className={`text-3xl font-black text-gray-900 transition-all duration-500 transform ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                    آمار و تحلیل
                </h1>
                <div className={`text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full transition-all duration-700 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                    ۱۴۰۳/۰۶/۲۳
                </div>
            </div>

            {/* Weight Goal Summary */}
            <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 relative overflow-hidden transition-all duration-700 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">هدف وزنی</p>
                        <h2 className="text-4xl font-black text-gray-900 flex items-baseline gap-1">
                            {WEIGHT_DATA.goal}
                            <span className="text-base text-gray-400 font-bold">کیلوگرم</span>
                        </h2>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold h-fit border border-blue-100">
                        در مسیر کاهش
                    </div>
                </div>

                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-gray-800">{WEIGHT_DATA.current}</p>
                        <p className="text-xs text-gray-400 font-bold">فعلی</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-gray-300">{WEIGHT_DATA.start}</p>
                        <p className="text-xs text-gray-300 font-bold">شروع</p>
                    </div>
                </div>

                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-6 relative">
                    <div className="h-full bg-gray-900 rounded-full transition-all duration-1000 delay-300 ease-out relative overflow-hidden" style={{ width: animate ? '41%' : '0%' }}>
                        <div className="absolute inset-0 bg-white/20"></div>
                    </div>
                </div>

                <button className="w-full py-4 bg-gray-900 text-white rounded-[20px] font-bold text-lg shadow-lg active:scale-95 transition-transform hover:bg-gray-800 flex justify-center items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    ثبت وزن جدید
                </button>
            </div>

            {/* New Weight Chart Card */}
            <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all duration-700 delay-100 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">روند تغییرات</h3>
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-gray-800 shadow-sm transition-all border border-gray-100">۳ ماه</button>
                        <button className="px-3 py-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">۶ ماه</button>
                    </div>
                </div>

                <div className="relative w-full h-[180px]" dir="ltr">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full h-full overflow-visible">
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Grid Lines */}
                        {[0, 1, 2, 3].map(i => (
                            <line
                                key={i}
                                x1="0"
                                y1={(chartHeight / 3) * i}
                                x2={chartWidth}
                                y2={(chartHeight / 3) * i}
                                stroke="#f3f4f6"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                        ))}

                        <path
                            d={areaD}
                            fill="url(#chartGradient)"
                            className="transition-all duration-1000 ease-out"
                            style={{ opacity: animate ? 1 : 0 }}
                        />

                        <path
                            d={pathD}
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-sm transition-all duration-1000 ease-out"
                            strokeDasharray={1000}
                            strokeDashoffset={animate ? 0 : 1000}
                        />

                        {/* Points */}
                        {points.map((p, i) => (
                            <circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r={i === points.length - 1 ? 6 : 4}
                                fill="white"
                                stroke="#3B82F6"
                                strokeWidth={i === points.length - 1 ? 3 : 2}
                                className={`transition-all duration-300 ${animate ? 'scale-100' : 'scale-0'}`}
                                style={{ transitionDelay: `${i * 100}ms` }}
                            />
                        ))}

                        {/* Labels */}
                        {points.map((p, i) => (
                            (i === 0 || i === points.length - 1 || i === 3) && (
                                <text
                                    key={`label-${i}`}
                                    x={p.x}
                                    y={chartHeight + 25}
                                    textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
                                    className="text-[10px] fill-gray-400 font-bold"
                                    style={{ fontFamily: 'Vazirmatn' }}
                                >
                                    {HISTORY_LABELS[i]}
                                </text>
                            )
                        ))}
                    </svg>
                </div>
            </div>

            {/* BMI Card */}
            <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all duration-700 delay-200 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">شاخص BMI</h3>
                    <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>

                <div className="text-center mb-8 relative">
                    <div className="absolute top-0 right-0 left-0 flex justify-center opacity-10">
                        <span className="text-8xl font-black tracking-tighter">BMI</span>
                    </div>
                    <h2 className="text-5xl font-black text-gray-900 tracking-tight relative z-10">{WEIGHT_DATA.bmi}</h2>
                    <p className="text-green-600 text-sm font-bold mt-2 bg-green-50 inline-block px-3 py-1 rounded-lg">وضعیت نرمال</p>
                </div>

                {/* BMI Gauge */}
                <div className="relative h-4 w-full rounded-full mb-6">
                    <div className="absolute inset-0 rounded-full opacity-80" style={{ background: 'linear-gradient(to right, #3B82F6 0%, #10B981 33%, #F59E0B 66%, #EF4444 100%)' }}></div>

                    <div className="absolute -top-1.5 bottom-[-6px] w-1.5 bg-gray-900 rounded-full border-2 border-white shadow-md transition-all duration-1000 delay-500 ease-out"
                        style={{ left: `${animate ? '45%' : '0%'}` }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>کم‌وزن</span>
                    <span>سالم</span>
                    <span>اضافه</span>
                    <span>چاق</span>
                </div>
            </div>

            {/* Nutrition Chart */}
            <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all duration-700 delay-300 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">دریافت کالری</h3>
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-gray-800 shadow-sm transition-all border border-gray-100">هفتگی</button>
                        <button className="px-3 py-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">ماهانه</button>
                    </div>
                </div>

                <div className="flex items-end justify-between h-48 px-2 space-x-2 space-x-reverse">
                    {WEEKLY_DATA.map((day, i) => (
                        <div key={i} className="flex flex-col items-center flex-1 group cursor-pointer">
                            <div className="relative w-full flex items-end justify-center h-40 bg-gray-50 rounded-[14px] overflow-hidden border border-gray-50 group-hover:border-gray-200 transition-colors">
                                <div
                                    className={`w-full mx-1 rounded-t-[10px] transition-all duration-1000 ease-out ${i === 4 ? 'bg-gray-900 shadow-lg' : 'bg-gray-300 group-hover:bg-gray-400'}`}
                                    style={{ height: animate ? `${day.height}%` : '0%', transitionDelay: `${400 + (i * 100)}ms` }}
                                ></div>
                            </div>
                            <span className={`text-xs font-bold mt-3 ${i === 4 ? 'text-gray-900' : 'text-gray-400'}`}>{day.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;
