import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import ScrollAnimation from './ScrollAnimation';
import CountUpAnimation from './CountUpAnimation';

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
                    <motion.div
                        className="flex flex-col items-center text-center"
                        whileHover={{ scale: 1.05, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="text-6xl mb-6"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            🌎
                        </motion.div>
                        <h2 className="text-xl font-bold mb-2 font-farsi text-white">
                            {t('accuracy.comparison.generalPopulation.title')}
                        </h2>
                        <p className="text-white text-sm mb-6 font-farsi">
                            {t('accuracy.comparison.generalPopulation.description')}
                        </p>
                        <motion.div
                            className="text-7xl font-bold text-white"
                            whileHover={{ scale: 1.1 }}
                        >
                            <CountUpAnimation
                                from={0}
                                to={parseInt(t('accuracy.comparison.generalPopulation.accuracy'))}
                                suffix="%"
                                duration={2}
                                className="text-7xl font-bold text-white"
                            />
                        </motion.div>
                    </motion.div>

                    {/* Calz AI - Highlighted */}
                    <motion.div
                        className="relative flex flex-col items-center text-center p-8 rounded-2xl"
                        style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(18, 18, 18, 0) 70%)' }}
                        whileHover={{ scale: 1.08, y: -15 }}
                        transition={{ duration: 0.3 }}
                        animate={{
                            boxShadow: [
                                "0 0 0px rgba(16, 185, 129, 0.3)",
                                "0 0 30px rgba(16, 185, 129, 0.6)",
                                "0 0 0px rgba(16, 185, 129, 0.3)"
                            ]
                        }}
                    >
                        <motion.div
                            className="w-20 h-20 mb-6 flex items-center justify-center"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.8 }}
                        >
                            <img
                                src="/loqme_logo.jpg"
                                alt="Loqme Logo"
                                className="w-full h-full object-contain rounded-2xl shadow-lg"
                            />
                        </motion.div>
                        <h2 className="text-xl font-bold text-green-400 mb-2 font-farsi">
                            {t('accuracy.comparison.calz.title')}
                        </h2>
                        <p className="text-gray-300 text-sm mb-6 font-farsi">
                            {t('accuracy.comparison.calz.description')}
                        </p>
                        <motion.div
                            className="text-8xl font-bold text-green-400"
                            style={{ textShadow: '0 0 20px rgba(52, 211, 153, 0.7)' }}
                            whileHover={{ scale: 1.15 }}
                        >
                            <CountUpAnimation
                                from={0}
                                to={parseInt(t('accuracy.comparison.calz.accuracy'))}
                                suffix="%"
                                duration={2.5}
                                className="text-8xl font-bold text-green-400"
                            />
                        </motion.div>
                    </motion.div>

                    {/* Nutritionists */}
                    <motion.div
                        className="flex flex-col items-center text-center"
                        whileHover={{ scale: 1.05, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="text-6xl mb-6"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            👨‍⚕️
                        </motion.div>
                        <h2 className="text-xl font-bold mb-2 font-farsi text-white">
                            {t('accuracy.comparison.nutritionists.title')}
                        </h2>
                        <p className="text-white text-sm mb-6 font-farsi">
                            {t('accuracy.comparison.nutritionists.description')}
                        </p>
                        <motion.div
                            className="text-7xl font-bold text-white"
                            whileHover={{ scale: 1.1 }}
                        >
                            <CountUpAnimation
                                from={0}
                                to={parseInt(t('accuracy.comparison.nutritionists.accuracy'))}
                                suffix="%"
                                duration={2}
                                className="text-7xl font-bold text-white"
                            />
                        </motion.div>
                    </motion.div>
                </ScrollAnimation>

            </div>
        </section>
    );
};

export default AccuracySection;