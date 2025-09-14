import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import faTranslations from './locales/fa.json';

const resources = {
    en: {
        translation: enTranslations
    },
    fa: {
        translation: faTranslations
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'fa', // Always use Persian
        fallbackLng: 'fa',
        debug: false,

        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
