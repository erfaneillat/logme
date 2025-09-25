import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ScrollAnimation from '../components/ScrollAnimation';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Contact: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#101010' }}>
            <Header />
            <div className="pt-20">
                {/* Hero Section */}
                <section className="py-20 px-6 text-center relative overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute inset-0 opacity-10">
                        <motion.div
                            className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div
                            className="absolute bottom-20 right-20 w-24 h-24 bg-gray-300 rounded-full blur-3xl"
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.2, 0.1, 0.2]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        <ScrollAnimation>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <Link
                                    to="/"
                                    className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 font-farsi"
                                >
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    بازگشت به صفحه اصلی
                                </Link>
                                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-farsi">
                                    {t('contact.title')}
                                </h1>
                                <p className="text-xl text-gray-400 mb-8 font-farsi">
                                    {t('contact.subtitle')}
                                </p>
                                <p className="text-lg text-gray-500 max-w-2xl mx-auto font-farsi">
                                    {t('contact.description')}
                                </p>
                            </motion.div>
                        </ScrollAnimation>
                    </div>
                </section>

                {/* Contact Information */}
                <section className="py-20 px-6 relative overflow-hidden">
                    <div className="max-w-4xl mx-auto relative z-10">
                        <ScrollAnimation>
                            <motion.div
                                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <h2 className="text-3xl font-bold text-white mb-8 text-center font-farsi">
                                    اطلاعات تماس
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <motion.div
                                        className="flex items-center space-x-reverse space-x-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm font-farsi">ایمیل</p>
                                            <p className="text-white font-farsi">{t('contact.info.email')}</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="flex items-center space-x-reverse space-x-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm font-farsi">تلفن</p>
                                            <p className="text-white font-farsi">{t('contact.info.phone')}</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="flex items-center space-x-reverse space-x-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm font-farsi">آدرس</p>
                                            <p className="text-white font-farsi">{t('contact.info.address')}</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="flex items-center space-x-reverse space-x-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm font-farsi">ساعات کاری</p>
                                            <p className="text-white font-farsi">{t('contact.info.hours')}</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </ScrollAnimation>
                    </div>
                </section>
            </div>
            <Footer />
        </div>
    );
};

export default Contact;
