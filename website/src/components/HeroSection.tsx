import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollAnimation from './ScrollAnimation';

const HeroSection: React.FC = () => {
    const { t } = useTranslation();

    return (
        <section
            id="hero"
            className="px-6 py-16 lg:py-24 relative overflow-hidden min-h-screen"
            style={{
                backgroundImage: 'url(/header_bg_image.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex items-center min-h-screen pl-8 lg:pl-16 justify-start">
                    {/* Content */}
                    <ScrollAnimation className="space-y-8 max-w-2xl text-right">
                        <div>
                            <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight font-farsi">
                                {t('hero.title')} {t('hero.titleHighlight')}
                            </h1>
                        </div>

                        <p className="text-lg text-gray-300 leading-relaxed max-w-2xl font-farsi">
                            {t('hero.description')}
                        </p>

                        {/* Download Options */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 justify-center sm:justify-start sm:space-x-reverse sm:space-x-6">
                            {/* QR Code */}
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center">
                                <img src="/qr-code.png" alt="QR Code" className="w-20 h-20 object-cover" />
                            </div>

                            {/* Download Buttons */}
                            <div className="space-y-3">
                                {/* CafeBazaar Button */}
                                <button className="flex items-center space-x-reverse space-x-3 bg-gray-900/80 hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-all duration-300 border border-gray-700 hover:border-gray-600 backdrop-blur-sm">
                                    <img src="/bazzar.png" alt="CafeBazaar" className="w-6 h-6" />
                                    <div className="text-right">
                                        <div className="text-sm font-semibold font-farsi">{t('hero.download.cafeBazaar')}</div>
                                    </div>
                                </button>

                                {/* Web App Button */}
                                <button className="flex items-center space-x-reverse space-x-3 bg-blue-600/80 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300 border border-blue-500 hover:border-blue-400 backdrop-blur-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold font-farsi">{t('hero.download.webApp')}</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Social Proof */}
                        <div className="pt-8">
                            <p className="text-2xl font-bold text-white font-farsi">{t('hero.socialProof.users')}</p>
                            <p className="text-gray-400 font-farsi text-sm">{t('hero.socialProof.trust')}</p>
                        </div>
                    </ScrollAnimation>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;