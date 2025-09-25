import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
                    <Link
                        to="/privacy-policy"
                        className="text-white hover:text-gray-300 transition-colors no-underline"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            حریم خصوصی
                        </motion.div>
                    </Link>
                    <Link
                        to="/contact"
                        className="text-white hover:text-gray-300 transition-colors no-underline"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            تماس با پشتیبانی
                        </motion.div>
                    </Link>
                    <motion.span
                        className="text-white"
                        whileHover={{ scale: 1.05 }}
                    >
                        © 2025 لقمه
                    </motion.span>

                    {/* E-namad Trust Seal */}
                    <motion.div
                        className="flex justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                    >
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href="https://trustseal.enamad.ir/?id=650090&Code=rqekd1jNfC3F5qF2bjG7gQNIUIEFQOQt"
                            style={{ display: 'inline-block', cursor: 'pointer' }}
                            className="hover:opacity-80 transition-opacity duration-300"
                        >
                            <img
                                src="/enamad.png"
                                alt="نماد اعتماد الکترونیک"
                                style={{
                                    cursor: 'pointer',
                                    width: 'auto',
                                    height: '60px',
                                    display: 'block',
                                    border: 'none'
                                }}
                            />
                        </a>
                    </motion.div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;