import React from 'react';

interface SubscriptionPageProps {
    onBack: () => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onBack }) => {
    return (
        <div className="flex flex-col h-screen bg-[#F8F9FB] fixed inset-0 z-50 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <button
                    onClick={onBack}
                    className="p-2 -mr-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>

                <h1 className="text-lg font-black text-gray-900">اشتراک ویژه</h1>

                <div className="w-10"></div> {/* Spacer for centering */}
            </header>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">ارتقا به نسخه حرفه‌ای</h2>
                <p className="text-gray-500 max-w-xs">
                    برای دسترسی نامحدود به چت با هوش مصنوعی و امکانات پیشرفته، اشتراک تهیه کنید.
                </p>

                {/* Placeholder for plans */}
                <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-200 w-full max-w-sm">
                    <p className="text-gray-400 text-sm">لیست اشتراک‌ها به زودی...</p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
