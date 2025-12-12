"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Toggle = ({ active, onChange }: { active: boolean; onChange: () => void }) => (
    <button
        onClick={onChange}
        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out relative flex items-center ${active ? 'bg-orange-400' : 'bg-gray-200'}`}
    >
        <div
            className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${active ? '-translate-x-5' : 'translate-x-0'}`}
        ></div>
    </button>
);

const SettingPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [animate, setAnimate] = useState(false);
    const [burnCalories, setBurnCalories] = useState(true);
    const [carryOver, setCarryOver] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setAnimate(true));
    }, []);

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        setShowLogoutModal(false);
        onLogout();
    };

    return (
        <>
            <div className="px-5 pt-6 pb-32 space-y-5 overflow-y-auto h-full no-scrollbar relative z-0">

                {/* Profile Header */}
                <div className={`bg-gray-900 rounded-[32px] p-6 text-white shadow-xl shadow-gray-200 flex justify-between items-center transition-all duration-700 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    {/* Avatar & Info (Right Side in RTL) */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-[20px] border-2 border-white/20 overflow-hidden shadow-inner bg-gray-800 shrink-0">
                            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-black mb-1">عرفان</h2>
                            <p className="text-gray-400 text-sm font-medium tracking-wider">09308694145</p>
                        </div>
                    </div>

                    {/* Back Button (Left Side in RTL) */}
                    <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors backdrop-blur-sm shadow-sm border border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Subscription Card */}
                <div className={`bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-[32px] p-6 text-white shadow-lg shadow-purple-200 relative overflow-hidden transition-all duration-700 delay-100 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        {/* Right Side: Text & Icon */}
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 p-2 rounded-xl border border-white/10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="text-right">
                                <h3 className="font-black text-lg">اشتراک فعال</h3>
                                <p className="text-purple-200 text-xs font-bold">ماهانه</p>
                            </div>
                        </div>

                        {/* Left Side: Badge */}
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                            <span className="text-xs font-bold">فعال</span>
                        </div>
                    </div>

                    <div className="bg-white/10 rounded-[20px] p-4 mb-4 backdrop-blur-sm border border-white/5 relative z-10">
                        <div className="flex justify-between text-sm font-bold text-purple-100 mb-2">
                            <span>۱۴۰۴/۱۰/۲۰</span>
                            <span>انقضا در تاریخ</span>
                        </div>

                        <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mb-2">
                            <div className="bg-white h-full rounded-full w-[70%] shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                        </div>

                        <div className="text-center text-xs font-medium text-purple-200 mt-1 flex items-center justify-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>۳۰ روز باقی‌مانده</span>
                        </div>
                    </div>

                    <button className="w-full py-3 bg-white text-[#5B21B6] rounded-[16px] font-bold text-sm shadow-lg hover:bg-gray-50 active:scale-95 transition-all relative z-10">
                        مدیریت اشتراک
                    </button>
                </div>

                {/* Invite Friends */}
                <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all duration-700 delay-150 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-gray-800">دعوت از دوستان</h3>
                        <div className="bg-orange-50 text-orange-500 p-2 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-[#FFF8F1] rounded-[24px] p-6 text-center mb-4 border border-orange-100">
                        <div className="w-16 h-16 mx-auto mb-3 text-4xl flex items-center justify-center">🎁</div>
                        <p className="font-bold text-orange-800 text-sm">با هم پاداش کسب کنید</p>
                    </div>

                    <p className="text-center text-gray-600 text-sm font-bold mb-4">با هم مسیر آسان‌تر است.</p>

                    <button className="w-full py-4 bg-orange-500 text-white rounded-[20px] font-bold text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                        </svg>
                        معرفی دوست و دریافت پاداش
                    </button>
                </div>

                {/* Quick Actions Grid */}
                <div className={`space-y-4 transition-all duration-700 delay-200 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h3 className="font-black text-xl text-gray-800 px-1">اقدامات سریع</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { title: 'اطلاعات شخصی', sub: 'پروفایل و جزئیات', icon: '👤', color: 'bg-purple-50 text-purple-600' },
                            { title: 'تنظیم ماکروها', sub: 'اهداف تغذیه‌ای', icon: '🍽️', color: 'bg-green-50 text-green-600' },
                            { title: 'هدف و وزن فعلی', sub: 'ردیابی پیشرفت', icon: '🚩', color: 'bg-red-50 text-red-500' },
                            { title: 'تاریخچه وزن', sub: 'مشاهده روندها', icon: '📉', color: 'bg-blue-50 text-blue-600' },
                        ].map((item, i) => (
                            <button key={i} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md active:scale-95 transition-all flex flex-col items-center text-center group">
                                <div className="w-full flex justify-between items-start mb-2">
                                    {/* Left Side: Arrow */}
                                    <span className="text-gray-300 transform group-hover:translate-x-1 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </span>
                                    {/* Right Side: Icon */}
                                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center text-lg`}>
                                        {item.icon}
                                    </div>
                                </div>
                                <span className="font-bold text-gray-800 text-sm mb-1">{item.title}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{item.sub}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3 mt-3">
                        <button className="flex-1 bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between group active:scale-95 transition-transform">
                            {/* Right Side: Icon and Text */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base">🌐</div>
                                <span className="font-bold text-gray-700 text-sm">زبان</span>
                            </div>

                            {/* Left Side: Arrow and Badge */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-gray-50 px-2 py-1 rounded-lg text-gray-500 border border-gray-100 group-hover:bg-gray-100 transition-colors">فارسی</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Preferences */}
                <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all duration-700 delay-300 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex items-center gap-2 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <h3 className="font-black text-lg text-gray-800">ترجیحات</h3>
                    </div>

                    <div className="space-y-6">
                        {/* Burn Calories Toggle */}
                        <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                            <div className="text-right flex-1 ml-4">
                                <div className="flex items-center justify-start gap-2 mb-1">
                                    <span className="text-orange-500 bg-orange-50 p-1 rounded-lg">🔥</span>
                                    <h4 className="font-bold text-gray-800 text-sm">افزودن کالری سوزانده</h4>
                                </div>
                                <p className="text-xs text-gray-400 mr-8">افزودن کالری سوزانده به هدف روزانه</p>
                            </div>
                            <Toggle active={burnCalories} onChange={() => setBurnCalories(!burnCalories)} />
                        </div>

                        {/* Carry Over Toggle */}
                        <div className="flex justify-between items-center">
                            <div className="text-right flex-1 ml-4">
                                <div className="flex items-center justify-start gap-2 mb-1">
                                    <span className="text-green-500 bg-green-50 p-1 rounded-lg">↺</span>
                                    <h4 className="font-bold text-gray-800 text-sm">انتقال کالری باقی‌مانده</h4>
                                </div>
                                <p className="text-xs text-gray-400 mr-8">انتقال تا ۲۰۰ کالری باقی‌مانده از دیروز</p>
                            </div>
                            <Toggle active={carryOver} onChange={() => setCarryOver(!carryOver)} />
                        </div>
                    </div>
                </div>

                {/* Support & Legal */}
                <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all duration-700 delay-500 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex items-center gap-2 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="font-black text-lg text-gray-800">پشتیبانی و قانونی</h3>
                    </div>

                    <div className="space-y-1">
                        {[
                            { label: 'سیاست حریم خصوصی', icon: '🛡️', color: 'bg-purple-50 text-purple-500' },
                            { label: 'تیکت‌های پشتیبانی', icon: '🎧', color: 'bg-blue-50 text-blue-500' },
                            { label: 'تماس با ما', icon: '✉️', color: 'bg-green-50 text-green-500' },
                            { label: 'حذف حساب کاربری؟', icon: '⚠️', color: 'bg-red-50 text-red-500' },
                        ].map((item, i) => (
                            <button key={i} className="w-full flex items-center justify-between p-3 rounded-[20px] hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${item.color}`}>
                                        {item.icon}
                                    </div>
                                    <span className={`font-bold text-sm ${item.icon === '⚠️' ? 'text-red-500' : 'text-gray-700'}`}>{item.label}</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogoutClick}
                    className={`w-full py-4 bg-[#EF4444] text-white rounded-[20px] font-bold text-lg shadow-lg shadow-red-200 hover:bg-red-600 active:scale-95 transition-all transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} duration-700 delay-700`}
                >
                    خروج
                </button>

                <div className={`text-center pb-4 transform ${animate ? 'opacity-100' : 'opacity-0'} transition-opacity delay-1000`}>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">نسخه 1.0.106</span>
                </div>

            </div>

            {/* Custom Modal with AnimatePresence */}
            <AnimatePresence>
                {showLogoutModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl overflow-hidden"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                🚪
                            </div>

                            <h3 className="text-xl font-black text-gray-800 text-center mb-2">خروج از حساب</h3>
                            <p className="text-gray-500 text-center text-sm font-medium mb-8">
                                آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className="flex-1 py-3 bg-[#EF4444] text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 hover:bg-red-600 transition-all"
                                >
                                    بله، خروج
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SettingPage;
