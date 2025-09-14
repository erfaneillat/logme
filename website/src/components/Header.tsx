import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
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
            <motion.header
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4 min-h-[80px]"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className="max-w-7xl mx-auto">
                    {/* Transparent blur container */}
                    <motion.div
                        className="backdrop-blur-md rounded-2xl px-6 py-4 border border-gray-700/30 shadow-xl"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex items-center justify-between">
                            {/* Logo and Brand */}
                            <motion.div
                                className="flex items-center space-x-reverse space-x-3"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                            >
                                <motion.div
                                    className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-300 overflow-hidden"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <img src="/loqme_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                                </motion.div>
                                <div>
                                    <motion.h1
                                        className="text-lg font-bold text-white font-farsi"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2, duration: 0.4 }}
                                    >
                                        {t('header.title')}
                                    </motion.h1>
                                    <motion.p
                                        className="text-xs text-gray-300 font-farsi"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3, duration: 0.4 }}
                                    >
                                        {t('header.subtitle')}
                                    </motion.p>
                                </div>
                            </motion.div>

                            {/* Navigation */}
                            <motion.nav
                                className="hidden md:flex items-center space-x-8 rtl:space-x-reverse"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4, duration: 0.4 }}
                            >
                                <motion.a
                                    href="#how-it-works"
                                    className="text-white hover:text-gray-300 transition-colors font-farsi text-sm"
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {t('header.nav.howItWorks')}
                                </motion.a>
                                <motion.a
                                    href="#accuracy"
                                    className="text-white hover:text-gray-300 transition-colors font-farsi text-sm"
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {t('header.nav.accuracy')}
                                </motion.a>
                                <motion.button
                                    onClick={scrollToDownload}
                                    className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg font-farsi text-sm"
                                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {t('header.nav.download')}
                                </motion.button>
                            </motion.nav>

                            {/* Mobile menu button */}
                            <motion.div
                                className="md:hidden flex items-center space-x-4 rtl:space-x-reverse"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4, duration: 0.4 }}
                            >
                                <motion.button
                                    onClick={toggleDrawer}
                                    className="text-white hover:text-gray-300 transition-colors"
                                    aria-label="Toggle mobile menu"
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    animate={{ rotate: isDrawerOpen ? 90 : 0 }}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </motion.header>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                            onClick={closeDrawer}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        />

                        {/* Drawer */}
                        <motion.div
                            className="fixed top-0 right-0 rtl:left-0 rtl:right-auto h-full w-80 shadow-2xl z-50 md:hidden"
                            style={{ backgroundColor: '#101010' }}
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        >
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
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Header;
