import React from 'react';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
    const { t } = useTranslation();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 min-h-[80px]">
            <div className="max-w-7xl mx-auto">
                {/* Transparent blur container */}
                <div className="backdrop-blur-md rounded-2xl px-6 py-4 border border-gray-700/30 shadow-xl">
                    <div className="flex items-center justify-between">
                        {/* Logo and Brand */}
                        <div className="flex items-center space-x-reverse space-x-3">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-300">
                                <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white font-farsi">
                                    {t('header.title')}
                                </h1>
                                <p className="text-xs text-gray-300 font-farsi">
                                    {t('header.subtitle')}
                                </p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
                            <a href="#how-it-works" className="text-white hover:text-gray-300 transition-colors font-farsi text-sm">
                                {t('header.nav.howItWorks')}
                            </a>
                            <a href="#accuracy" className="text-white hover:text-gray-300 transition-colors font-farsi text-sm">
                                {t('header.nav.accuracy')}
                            </a>
                            <button className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg font-farsi text-sm">
                                {t('header.nav.download')}
                            </button>
                        </nav>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center space-x-4 rtl:space-x-reverse">
                            <button className="text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
