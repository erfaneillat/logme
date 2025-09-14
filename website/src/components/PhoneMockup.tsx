import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

const PhoneMockup: React.FC = () => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    return (
        <div className="relative">
            {/* Phone Frame */}
            <div className="relative w-80 h-[600px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
                {/* Screen */}
                <div className="w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative">
                    {/* Camera View Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
                        {/* Food Image Background */}
                        <div className="absolute inset-0 bg-cover bg-center" style={{
                            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect width="400" height="600" fill="%23f59e0b"/><rect x="50" y="200" width="300" height="200" rx="20" fill="%23d97706"/><rect x="70" y="220" width="260" height="40" rx="10" fill="%23fbbf24"/><rect x="80" y="280" width="240" height="30" rx="5" fill="%23f59e0b"/><circle cx="200" cy="150" r="20" fill="%23dc2626"/><circle cx="180" cy="170" r="15" fill="%23dc2626"/><circle cx="220" cy="170" r="15" fill="%23dc2626"/></svg>')`
                        }} />

                        {/* Scanning Overlay */}
                        <div className="absolute inset-0">
                            {/* Green scanning grid */}
                            <div className="absolute inset-0 opacity-30">
                                <div className="w-full h-full bg-gradient-to-b from-transparent via-white/20 to-transparent animate-scan"></div>
                                <div className="absolute inset-0 grid grid-cols-4 grid-rows-6 gap-1 p-4">
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div key={i} className="border border-white/30 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Food Label Overlay */}
                        <div className="absolute bottom-20 left-4 right-4">
                            <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-4 text-white">
                                <h3 className={`text-lg font-bold ${isRTL ? 'font-farsi' : ''}`}>
                                    {isRTL ? 'ساندویچ پروسکیوتو' : 'Prosciutto Sandwich'}
                                </h3>
                                <p className="text-2xl font-bold text-white">350 kcal</p>
                            </div>
                        </div>

                        {/* Nutritional Info Cards */}
                        <div className="absolute bottom-4 left-4 right-4 space-y-2">
                            <div className={`flex ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                <div className={`bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                    </div>
                                    <div>
                                        <div className={`text-xs text-gray-300 ${isRTL ? 'font-farsi' : ''}`}>
                                            {isRTL ? 'کربوهیدرات' : 'CARBS'}
                                        </div>
                                        <div className="text-sm font-bold text-white">35g</div>
                                    </div>
                                </div>

                                <div className={`bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    </div>
                                    <div>
                                        <div className={`text-xs text-gray-300 ${isRTL ? 'font-farsi' : ''}`}>
                                            {isRTL ? 'پروتئین' : 'PROTEIN'}
                                        </div>
                                        <div className="text-sm font-bold text-white">25g</div>
                                    </div>
                                </div>

                                <div className={`bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                    </div>
                                    <div>
                                        <div className={`text-xs text-gray-300 ${isRTL ? 'font-farsi' : ''}`}>
                                            {isRTL ? 'چربی' : 'FAT'}
                                        </div>
                                        <div className="text-sm font-bold text-white">16g</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Camera Button */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating hand holding phone */}
            <div className={`absolute -bottom-4 ${isRTL ? '-left-4' : '-right-4'} w-32 h-32 opacity-20`}>
                <svg viewBox="0 0 100 100" className="w-full h-full text-white">
                    <path d="M20 30 Q30 20 40 30 Q50 40 60 30 Q70 20 80 30 L85 35 Q90 40 85 45 L80 50 Q70 60 60 50 Q50 40 40 50 Q30 60 20 50 Q15 45 20 40 Z" fill="currentColor" />
                </svg>
            </div>
        </div>
    );
};

export default PhoneMockup;
