import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();

    // Determine language based on path, similar to other pages
    useEffect(() => {
        // This logic is primarily for when the footer is mounted; 
        // however, usually the parent page sets the language.
        // We can rely on i18n.language or check the path if needed.
        // For consistency with specific pages `PrivacyPolicy` and `TermsOfUse` which set the language:
        if (location.pathname.endsWith('/en')) {
            if (i18n.language !== 'en') i18n.changeLanguage('en');
        } else {
            // For main pages, we might default to fa, but we should be careful not to override if the user is already in 'en' mode on a main page (if we supported that).
            // Given the current pattern, specific pages force the language.
            // For now, we will rely on i18n.language which should be set by the page.
        }
    }, [location, i18n]);

    const isFarsi = i18n.language === 'fa';
    const langSuffix = isFarsi ? '' : '/en';
    const fontClass = isFarsi ? 'font-farsi' : '';

    return (
        <footer className="py-8 px-6" style={{ backgroundColor: '#101010' }}>
            <div className="max-w-7xl mx-auto text-center">
                <motion.div
                    className={`flex flex-wrap justify-center items-center gap-8 text-sm ${fontClass}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Link
                        to={`/privacy-policy${langSuffix}`}
                        className="text-white hover:text-gray-300 transition-colors no-underline"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {t('footer.support.privacyPolicy')}
                        </motion.div>
                    </Link>
                    <Link
                        to={`/terms-of-use${langSuffix}`}
                        className="text-white hover:text-gray-300 transition-colors no-underline"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {t('footer.support.termsOfService')}
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
                            {t('footer.support.contactUs')}
                        </motion.div>
                    </Link>
                    <motion.span
                        className="text-white"
                        whileHover={{ scale: 1.05 }}
                    >
                        {t('footer.copyright')}
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