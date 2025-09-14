import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollAnimation from './ScrollAnimation';

const AccuracySection: React.FC = () => {
    const { t } = useTranslation();

    return (
        <section id="accuracy" className="px-6 py-20 relative overflow-hidden" style={{ backgroundColor: '#101010' }}>
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-20 w-48 h-48 bg-gray-300 rounded-full blur-3xl"></div>
            </div>
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <ScrollAnimation className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 font-farsi">
                        {t('accuracy.title')}
                    </h2>
                    <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed font-farsi">
                        {t('accuracy.description')}
                    </p>
                </ScrollAnimation>

                {/* Three Column Comparison */}
                <ScrollAnimation className="grid md:grid-cols-3 gap-8" delay={0.2}>
                    {/* General Population */}
                    <div className="text-center p-8 rounded-2xl bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:bg-gray-800/80">
                        <div className="mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 font-farsi">
                                {t('accuracy.comparison.generalPopulation.title')}
                            </h3>
                            <p className="text-gray-400 text-xs font-farsi">
                                {t('accuracy.comparison.generalPopulation.description')}
                            </p>
                        </div>
                        <div className="text-4xl font-bold text-white">{t('accuracy.comparison.generalPopulation.accuracy')}</div>
                    </div>

                    {/* Calz AI - Highlighted */}
                    <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-2 border-white/50 hover:border-white transition-all duration-300 transform hover:scale-105">
                        <div className="mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center border border-white/50">
                                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 font-farsi">
                                {t('accuracy.comparison.calz.title')}
                            </h3>
                            <p className="text-gray-400 text-xs font-farsi">
                                {t('accuracy.comparison.calz.description')}
                            </p>
                        </div>
                        <div className="text-4xl font-bold text-white">{t('accuracy.comparison.calz.accuracy')}</div>
                    </div>

                    {/* Nutritionists */}
                    <div className="text-center p-8 rounded-2xl bg-gray-900/80 backdrop-blur-sm border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:bg-gray-800/80">
                        <div className="mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 font-farsi">
                                {t('accuracy.comparison.nutritionists.title')}
                            </h3>
                            <p className="text-gray-400 text-xs font-farsi">
                                {t('accuracy.comparison.nutritionists.description')}
                            </p>
                        </div>
                        <div className="text-4xl font-bold text-white">{t('accuracy.comparison.nutritionists.accuracy')}</div>
                    </div>
                </ScrollAnimation>

                {/* Additional Features */}
                <ScrollAnimation className="mt-16 text-center" delay={0.4}>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="p-6 rounded-xl bg-gray-900/60 backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:bg-gray-800/60">
                            <div className="w-12 h-12 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="text-base font-semibold text-white mb-2 font-farsi">
                                {t('accuracy.features.aiPowered.title')}
                            </h4>
                            <p className="text-gray-400 text-xs font-farsi">
                                {t('accuracy.features.aiPowered.description')}
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-gray-900/60 backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:bg-gray-800/60">
                            <div className="w-12 h-12 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h4 className="text-base font-semibold text-white mb-2 font-farsi">
                                {t('accuracy.features.instant.title')}
                            </h4>
                            <p className="text-gray-400 text-xs font-farsi">
                                {t('accuracy.features.instant.description')}
                            </p>
                        </div>

                        <div className="p-6 rounded-xl bg-gray-900/60 backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:bg-gray-800/60">
                            <div className="w-12 h-12 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h4 className="text-base font-semibold text-white mb-2 font-farsi">
                                {t('accuracy.features.learning.title')}
                            </h4>
                            <p className="text-gray-400 text-xs font-farsi">
                                {t('accuracy.features.learning.description')}
                            </p>
                        </div>
                    </div>
                </ScrollAnimation>
            </div>
        </section>
    );
};

export default AccuracySection;