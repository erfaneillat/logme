import React from 'react';
import { motion } from 'framer-motion';
import ScrollAnimation from './ScrollAnimation';

const Footer: React.FC = () => {

    return (
        <footer className="py-8 px-6" style={{ backgroundColor: '#101010' }}>
            <div className="max-w-7xl mx-auto text-center">
                <ScrollAnimation>
                    <motion.div
                        className="flex flex-wrap justify-center items-center gap-8 text-sm font-farsi"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.button
                            className="text-white hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer"
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            شرایط خدمات
                        </motion.button>
                        <motion.button
                            className="text-white hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer"
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            حریم خصوصی
                        </motion.button>
                        <motion.button
                            className="text-white hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer"
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            تماس با پشتیبانی
                        </motion.button>
                        <a
                            referrerPolicy="origin"
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://trustseal.enamad.ir/?id=650090&Code=rqekd1jNfC3F5qF2bjG7gQNIUIEFQOQt"
                        >
                            <img
                                referrerPolicy="origin"
                                src="https://trustseal.enamad.ir/logo.aspx?id=650090&Code=rqekd1jNfC3F5qF2bjG7gQNIUIEFQOQt"
                                alt=""
                                style={{ cursor: 'pointer' }}
                            />
                        </a>
                        <motion.span
                            className="text-white"
                            whileHover={{ scale: 1.05 }}
                        >
                            © 2025 لقمه
                        </motion.span>
                    </motion.div>
                </ScrollAnimation>
            </div>
        </footer>
    );
};

export default Footer;