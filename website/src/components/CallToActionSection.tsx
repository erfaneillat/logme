import React from 'react';
import { motion } from 'framer-motion';
import { scrollToDownload } from '../utils/scrollToSection';
import ScrollAnimation from './ScrollAnimation';
import GlowButton from './GlowButton';

const CallToActionSection: React.FC = () => {

    return (
        <section className="py-20 px-6 text-center relative overflow-hidden" style={{ backgroundColor: '#101010' }}>
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
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold text-white mb-6 font-farsi"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        امروز لقمه را امتحان کنید
                    </motion.h2>
                </ScrollAnimation>

                <ScrollAnimation delay={0.2}>
                    <motion.p
                        className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto font-farsi"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        کالری‌هایتان را فقط با یک عکس ردیابی کنید
                    </motion.p>
                </ScrollAnimation>

                <ScrollAnimation delay={0.4}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <GlowButton
                            onClick={scrollToDownload}
                            className="bg-white text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-200 transition-colors duration-300 font-farsi"
                            glowColor="rgba(255, 255, 255, 0.4)"
                            pulseDuration={2}
                        >
                            شروع کنید
                        </GlowButton>
                    </motion.div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.6}>
                    <motion.div
                        className="mt-8 flex justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        {/* eslint-disable-next-line react/jsx-no-target-blank */}
                        <a
                            referrerPolicy="origin"
                            target="_blank"
                            href="https://trustseal.enamad.ir/?id=650090&Code=rqekd1jNfC3F5qF2bjG7gQNIUIEFQOQt"
                            style={{ display: 'inline-block', cursor: 'pointer' }}
                            className="hover:opacity-80 transition-opacity duration-300"
                        >
                            <img
                                referrerPolicy="origin"
                                src="https://trustseal.enamad.ir/logo.aspx?id=650090&Code=rqekd1jNfC3F5qF2bjG7gQNIUIEFQOQt"
                                alt="نماد اعتماد الکترونیک"
                                style={{
                                    cursor: 'pointer',
                                    width: 'auto',
                                    height: '80px',
                                    display: 'block',
                                    border: 'none'
                                }}
                                {...({ code: "rqekd1jNfC3F5qF2bjG7gQNIUIEFQOQt" } as any)}
                            />
                        </a>
                    </motion.div>
                </ScrollAnimation>
            </div>
        </section>
    );
};

export default CallToActionSection;
