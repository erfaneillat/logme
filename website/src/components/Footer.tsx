import React from 'react';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {

    return (
        <footer className="py-8 px-6" style={{ backgroundColor: '#101010' }}>
            <div className="max-w-7xl mx-auto text-center">
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
                    <motion.span
                        className="text-white"
                        whileHover={{ scale: 1.05 }}
                    >
                        © 2025 لقمه
                    </motion.span>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;