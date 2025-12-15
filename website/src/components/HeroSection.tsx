import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import ScrollAnimation from './ScrollAnimation';
import FloatingElement from './FloatingElements';
import BackgroundParticles from './BackgroundParticles';

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

            {/* Background Particles */}
            <BackgroundParticles count={15} colors={['#ffffff', '#10b981', '#3b82f6']} />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex items-center min-h-screen pl-8 lg:pl-16 justify-start">
                    {/* Content */}
                    <div className="space-y-8 max-w-2xl text-right">
                        <ScrollAnimation delay={0.2}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                                <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight font-farsi">
                                    <motion.span
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5, duration: 0.6 }}
                                    >
                                        {t('hero.title')}
                                    </motion.span>
                                    <motion.span
                                        className="text-green-400"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8, duration: 0.6 }}
                                    >
                                        {' '}{t('hero.titleHighlight')}
                                    </motion.span>
                                </h1>
                            </motion.div>
                        </ScrollAnimation>

                        <ScrollAnimation delay={0.4}>
                            <motion.p
                                className="text-lg text-gray-300 leading-relaxed max-w-2xl font-farsi"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                            >
                                {t('hero.description')}
                            </motion.p>
                        </ScrollAnimation>

                        {/* Download Options */}
                        <ScrollAnimation delay={0.6}>
                            <motion.div
                                className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 justify-center sm:justify-start sm:space-x-reverse sm:space-x-6"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                            >
                                {/* QR Code */}
                                <FloatingElement delay={0} amplitude={10} duration={3}>
                                    <motion.div
                                        className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center"
                                        whileHover={{ scale: 1.05, rotate: 5 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <img src="/qr-code.png" alt="QR Code" className="w-20 h-20 object-contain" />
                                    </motion.div>
                                </FloatingElement>

                                {/* Download Buttons */}
                                <div className="space-y-3">
                                    {/* CafeBazaar Button */}
                                    <motion.a
                                        href="https://cafebazaar.ir/app/ir.loqmeapp.application"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-reverse space-x-3 bg-gray-900/80 hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-all duration-300 border border-gray-700 hover:border-gray-600 backdrop-blur-sm"
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.0, duration: 0.4 }}
                                    >
                                        <img src="/bazzar.png" alt="CafeBazaar" className="w-6 h-6" />
                                        <div className="text-right">
                                            <div className="text-sm font-semibold font-farsi">{t('hero.download.cafeBazaar')}</div>
                                        </div>
                                    </motion.a>

                                    {/* Web App Button */}
                                    <motion.a
                                        href="https://loqmeapp.ir/app"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-reverse space-x-3 bg-blue-600/80 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300 border border-blue-500 hover:border-blue-400 backdrop-blur-sm"
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.2, duration: 0.4 }}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold font-farsi">{t('hero.download.webApp')}</div>
                                        </div>
                                    </motion.a>

                                    {/* iOS Button */}
                                    <motion.a
                                        href="https://loqmeapp.ir/app"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-reverse space-x-3 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-sm"
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.4, duration: 0.4 }}
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-1.21 3.28-1.21 2.21.34 3.08 1.54 3.08 1.54-.15.44-2.61 1.8-2.61 5.56 0 3.76 3.19 5.39 3.19 5.39-.2.53-.42 1.07-.64 1.61-.14.39-.5.9-1.38.34zM12.94 5.28C12.44 2.89 15.22.95 17.5 0c.26 2.76-2.69 4.96-4.56 5.28z" />
                                        </svg>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold font-farsi">{t('hero.download.appStoreTitle')}</div>
                                        </div>
                                    </motion.a>
                                </div>
                            </motion.div>
                        </ScrollAnimation>

                        {/* Social Proof */}
                        <ScrollAnimation delay={0.8}>
                            <motion.div
                                className="pt-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 1.4 }}
                            >
                                <motion.p
                                    className="text-2xl font-bold text-white font-farsi"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    {t('hero.socialProof.users')}
                                </motion.p>
                                <motion.p
                                    className="text-gray-400 font-farsi text-sm"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    {t('hero.socialProof.trust')}
                                </motion.p>
                            </motion.div>
                        </ScrollAnimation>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;