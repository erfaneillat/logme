import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { scrollToDownload } from '../utils/scrollToSection';

const Header: React.FC = () => {
    const { t } = useTranslation();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 min-h-[80px]">
                <div className="max-w-7xl mx-auto">
                    {/* Transparent blur container */}
                    <div className="backdrop-blur-md rounded-2xl px-6 py-4 border border-gray-700/30 shadow-xl">
                        <div className="flex items-center justify-between">
                            {/* Logo and Brand */}
                            <div className="flex items-center space-x-reverse space-x-3">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-300 overflow-hidden">
                                    <img src="/loqme_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
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
                                <button
                                    onClick={scrollToDownload}
                                    className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg font-farsi text-sm"
                                >
                                    {t('header.nav.download')}
                                </button>
                            </nav>

                            {/* Mobile menu button */}
                            <div className="md:hidden flex items-center space-x-4 rtl:space-x-reverse">
                                <button
                                    onClick={toggleDrawer}
                                    className="text-white hover:text-gray-300 transition-colors"
                                    aria-label="Toggle mobile menu"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Drawer */}
            {isDrawerOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                        onClick={closeDrawer}
                    />

                    {/* Drawer */}
                    <div className="fixed top-0 right-0 rtl:left-0 rtl:right-auto h-full w-80 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden animate-in slide-in-from-right rtl:slide-in-from-left" style={{ backgroundColor: '#101010' }}>
                        <div className="flex flex-col h-full">
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#333333' }}>
                                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
                                        <img src="/loqme_logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-lg" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white font-farsi">
                                            {t('header.title')}
                                        </h2>
                                        <p className="text-xs font-farsi" style={{ color: '#888888' }}>
                                            {t('header.subtitle')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeDrawer}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    aria-label="Close menu"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Drawer Navigation */}
                            <nav className="flex-1 p-6">
                                <div className="space-y-4">
                                    <a
                                        href="#how-it-works"
                                        onClick={closeDrawer}
                                        className="block text-white hover:text-gray-300 px-4 py-3 rounded-lg transition-colors font-farsi text-base hover:bg-opacity-10 hover:bg-white"
                                    >
                                        {t('header.nav.howItWorks')}
                                    </a>
                                    <a
                                        href="#accuracy"
                                        onClick={closeDrawer}
                                        className="block text-white hover:text-gray-300 px-4 py-3 rounded-lg transition-colors font-farsi text-base hover:bg-opacity-10 hover:bg-white"
                                    >
                                        {t('header.nav.accuracy')}
                                    </a>
                                    <button
                                        onClick={() => {
                                            scrollToDownload();
                                            closeDrawer();
                                        }}
                                        className="w-full text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg font-farsi text-base hover:opacity-80"
                                        style={{ backgroundColor: '#333333' }}
                                    >
                                        {t('header.nav.download')}
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Header;
