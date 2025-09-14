import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollAnimation from './ScrollAnimation';

const HowItWorksSection: React.FC = () => {
    const { t } = useTranslation();

    return (
        <section id="how-it-works" className="px-6 py-20 relative overflow-hidden" style={{ backgroundColor: '#101010' }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-20 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-10 w-40 h-40 bg-gray-300 rounded-full blur-3xl"></div>
            </div>
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center lg:grid-flow-col-dense">
                    {/* Food Photo with Nutritional Tags */}
                    <ScrollAnimation className="relative lg:col-start-2">
                        {/* Food Image Container */}
                        <div className="relative w-full h-96 rounded-2xl overflow-hidden">
                            {/* Pancakes Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-amber-300">
                                {/* Pancake stack SVG */}
                                <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                                    {/* Plate */}
                                    <ellipse cx="200" cy="350" rx="180" ry="40" fill="#8B4513" />

                                    {/* Pancake 1 (bottom) */}
                                    <ellipse cx="200" cy="320" rx="160" ry="20" fill="#D2691E" />

                                    {/* Pancake 2 */}
                                    <ellipse cx="200" cy="300" rx="150" ry="18" fill="#CD853F" />

                                    {/* Pancake 3 */}
                                    <ellipse cx="200" cy="280" rx="140" ry="16" fill="#DEB887" />

                                    {/* Syrup */}
                                    <path d="M120 280 Q200 260 280 280 Q200 300 120 280" fill="#8B4513" opacity="0.8" />

                                    {/* Berries */}
                                    <circle cx="150" cy="250" r="8" fill="#DC2626" />
                                    <circle cx="180" cy="240" r="6" fill="#1E40AF" />
                                    <circle cx="220" cy="245" r="7" fill="#DC2626" />
                                    <circle cx="250" cy="235" r="6" fill="#1E40AF" />

                                    {/* Mint leaf */}
                                    <path d="M160 220 Q170 210 180 220 Q170 230 160 220" fill="#10B981" />
                                </svg>
                            </div>
                        </div>

                        {/* Floating Nutritional Tags */}
                        <div className="absolute -top-4 -right-4 animate-float">
                            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center space-x-reverse space-x-3">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-300 font-farsi">{t('howItWorks.nutrition.carbs')}</div>
                                    <div className="text-lg font-bold text-white">140g</div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-4 -right-4 animate-float" style={{ animationDelay: '2s' }}>
                            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center space-x-reverse space-x-3">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-300 font-farsi">{t('howItWorks.nutrition.fat')}</div>
                                    <div className="text-lg font-bold text-white">20g</div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-1/2 -left-4 animate-float" style={{ animationDelay: '4s' }}>
                            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center space-x-reverse space-x-3">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-300 font-farsi">{t('howItWorks.nutrition.protein')}</div>
                                    <div className="text-lg font-bold text-white">15g</div>
                                </div>
                            </div>
                        </div>
                    </ScrollAnimation>

                    {/* Text Content */}
                    <ScrollAnimation className="space-y-8 lg:col-start-1" delay={0.2}>
                        <h2 className="text-3xl lg:text-4xl font-bold text-white font-farsi">
                            {t('howItWorks.title')}
                        </h2>

                        <p className="text-lg text-gray-300 leading-relaxed font-farsi">
                            {t('howItWorks.description')}
                        </p>

                        <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold text-base hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-gray-300 font-farsi">
                            {t('howItWorks.cta')}
                        </button>
                    </ScrollAnimation>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;