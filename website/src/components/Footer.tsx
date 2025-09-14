import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
    const { t } = useTranslation();

    return (
        <footer className="py-12 px-6 border-t border-gray-800" style={{ backgroundColor: '#101010' }}>
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-reverse space-x-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg border border-gray-300">
                                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white font-farsi">
                                    {t('footer.brand.title')}
                                </h3>
                                <p className="text-xs text-gray-400 font-farsi">
                                    {t('footer.brand.subtitle')}
                                </p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-xs font-farsi">
                            {t('footer.brand.description')}
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 font-farsi text-sm">
                            {t('footer.product.title')}
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors font-farsi">
                                    {t('footer.product.howItWorks')}
                                </a>
                            </li>
                            <li>
                                <a href="#accuracy" className="text-gray-400 hover:text-white transition-colors font-farsi">
                                    {t('footer.product.accuracy')}
                                </a>
                            </li>
                            <li>
                                <button className="text-gray-400 hover:text-white transition-colors font-farsi text-right">
                                    {t('footer.product.features')}
                                </button>
                            </li>
                            <li>
                                <button className="text-gray-400 hover:text-white transition-colors font-farsi text-right">
                                    {t('footer.product.pricing')}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 font-farsi text-sm">
                            {t('footer.support.title')}
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <button className="text-gray-400 hover:text-white transition-colors font-farsi text-right">
                                    {t('footer.support.helpCenter')}
                                </button>
                            </li>
                            <li>
                                <button className="text-gray-400 hover:text-white transition-colors font-farsi text-right">
                                    {t('footer.support.contactUs')}
                                </button>
                            </li>
                            <li>
                                <button className="text-gray-400 hover:text-white transition-colors font-farsi text-right">
                                    {t('footer.support.privacyPolicy')}
                                </button>
                            </li>
                            <li>
                                <button className="text-gray-400 hover:text-white transition-colors font-farsi text-right">
                                    {t('footer.support.termsOfService')}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Download */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 font-farsi text-sm">
                            {t('footer.download.title')}
                        </h4>
                        <div className="space-y-3">
                            <button className="flex items-center space-x-reverse space-x-3 bg-gray-900/80 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-all duration-300 border border-gray-700 hover:border-gray-600 backdrop-blur-sm w-full">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                <div className="text-right">
                                    <div className="text-xs font-farsi">{t('footer.download.appStore')}</div>
                                    <div className="text-sm font-semibold font-farsi">{t('footer.download.appStoreTitle')}</div>
                                </div>
                            </button>

                            <button className="flex items-center space-x-reverse space-x-3 bg-gray-900/80 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-all duration-300 border border-gray-700 hover:border-gray-600 backdrop-blur-sm w-full">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.609 1.814L13.792 12 3.609 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L13.5 12l4.198-2.491zM5.864 2.658L16.802 8.99l-4.318 4.318-6.62-10.65z" />
                                </svg>
                                <div className="text-right">
                                    <div className="text-xs font-farsi">{t('footer.download.googlePlay')}</div>
                                    <div className="text-sm font-semibold font-farsi">{t('footer.download.googlePlayTitle')}</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-12 pt-8 text-center">
                    <p className="text-gray-400 text-xs font-farsi">
                        {t('footer.copyright')}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;