import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const TermsOfUse: React.FC = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();

    useEffect(() => {
        if (location.pathname.endsWith('/en')) {
            i18n.changeLanguage('en');
            document.dir = 'ltr';
        } else {
            i18n.changeLanguage('fa');
            document.dir = 'rtl';
        }
    }, [location, i18n]);

    const isFarsi = i18n.language === 'fa';
    const fontClass = isFarsi ? 'font-farsi' : '';
    const dir = isFarsi ? 'rtl' : 'ltr';

    return (
        <div className={`min-h-screen bg-gray-50 py-12 px-4 ${fontClass}`} dir={dir}>
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-lg shadow-lg p-8"
                >
                    <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
                        {t('termsOfUse.title')}
                    </h1>

                    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                        <p className="text-lg mb-6 text-gray-600">
                            {t('termsOfUse.lastUpdated')}
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('termsOfUse.introduction.title')}
                            </h2>
                            <p className="mb-4">
                                {t('termsOfUse.introduction.content')}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('termsOfUse.usageLicense.title')}
                            </h2>
                            <p className="mb-4">
                                {t('termsOfUse.usageLicense.content')}
                            </p>
                            <ul className={`list-disc mb-4 ${isFarsi ? 'pr-6' : 'pl-6'}`}>
                                <li>{t('termsOfUse.usageLicense.modify')}</li>
                                <li>{t('termsOfUse.usageLicense.commercial')}</li>
                                <li>{t('termsOfUse.usageLicense.reverseEngineer')}</li>
                                <li>{t('termsOfUse.usageLicense.copyright')}</li>
                                <li>{t('termsOfUse.usageLicense.transfer')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('termsOfUse.disclaimer.title')}
                            </h2>
                            <p className="mb-4">
                                {t('termsOfUse.disclaimer.content')}
                            </p>
                            <p className="mb-4">
                                {t('termsOfUse.disclaimer.medical')}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('termsOfUse.limitations.title')}
                            </h2>
                            <p className="mb-4">
                                {t('termsOfUse.limitations.content')}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('termsOfUse.accuracy.title')}
                            </h2>
                            <p className="mb-4">
                                {t('termsOfUse.accuracy.content')}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('termsOfUse.links.title')}
                            </h2>
                            <p className="mb-4">
                                {t('termsOfUse.links.content')}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('termsOfUse.modifications.title')}
                            </h2>
                            <p className="mb-4">
                                {t('termsOfUse.modifications.content')}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('termsOfUse.governingLaw.title')}
                            </h2>
                            <p className="mb-4">
                                {t('termsOfUse.governingLaw.content')}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('termsOfUse.contact.title')}
                            </h2>
                            <p className="mb-4">
                                {t('termsOfUse.contact.content')}
                            </p>
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <p><strong>{t('privacyPolicy.contact.email')}:</strong> {t('contact.info.email')}</p>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsOfUse;
