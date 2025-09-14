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
                <ScrollAnimation className="w-full max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 items-start" delay={0.2}>
                    {/* General Population */}
                    <div className="flex flex-col items-center text-center">
                        <div className="text-6xl mb-6">🌎</div>
                        <h2 className="text-xl font-bold mb-2 font-farsi text-white">
                            {t('accuracy.comparison.generalPopulation.title')}
                        </h2>
                        <p className="text-white text-sm mb-6 font-farsi">
                            {t('accuracy.comparison.generalPopulation.description')}
                        </p>
                        <p className="text-7xl font-bold text-white">{t('accuracy.comparison.generalPopulation.accuracy')}</p>
                    </div>

                    {/* Calz AI - Highlighted */}
                    <div className="relative flex flex-col items-center text-center p-8 rounded-2xl" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(18, 18, 18, 0) 70%)' }}>
                        <div className="w-20 h-20 mb-6 flex items-center justify-center">
                            <img
                                src="/loqme_logo.jpg"
                                alt="Loqme Logo"
                                className="w-full h-full object-contain rounded-2xl shadow-lg"
                            />
                        </div>
                        <h2 className="text-xl font-bold text-green-400 mb-2 font-farsi">
                            {t('accuracy.comparison.calz.title')}
                        </h2>
                        <p className="text-gray-300 text-sm mb-6 font-farsi">
                            {t('accuracy.comparison.calz.description')}
                        </p>
                        <p className="text-8xl font-bold text-green-400" style={{ textShadow: '0 0 20px rgba(52, 211, 153, 0.7)' }}>
                            {t('accuracy.comparison.calz.accuracy')}
                        </p>
                    </div>

                    {/* Nutritionists */}
                    <div className="flex flex-col items-center text-center">
                        <div className="text-6xl mb-6">👨‍⚕️</div>
                        <h2 className="text-xl font-bold mb-2 font-farsi text-white">
                            {t('accuracy.comparison.nutritionists.title')}
                        </h2>
                        <p className="text-white text-sm mb-6 font-farsi">
                            {t('accuracy.comparison.nutritionists.description')}
                        </p>
                        <p className="text-7xl font-bold text-white">{t('accuracy.comparison.nutritionists.accuracy')}</p>
                    </div>
                </ScrollAnimation>

            </div>
        </section>
    );
};

export default AccuracySection;