// Translations for the webapp
// Usage: import { useTranslations } from './translations';

import en from './locales/en.json';
import fa from './locales/fa.json';

export type Locale = 'fa' | 'en';
export type TranslationStructure = typeof en;

const translations: Record<Locale, TranslationStructure> = {
    en,
    fa,
};

// Helper function to get nested translation
function getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((prev, curr) => {
        return prev ? prev[curr] : null;
    }, obj) || path;
}

// Standalone t function (useful when outside hook)
export function t(key: string, locale: Locale): string {
    const dict = translations[locale];
    return getNestedValue(dict, key);
}

// Get locale from market (Environment > URL > Default)
export function getLocale(): Locale {
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_MARKET === 'global' ? 'en' : 'fa';
    }

    // Check URL param first
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const marketParam = searchParams.get('market') || hashParams.get('market');

    if (marketParam === 'global' || process.env.NEXT_PUBLIC_MARKET === 'global') {
        return 'en';
    }

    return 'fa';
}

// Hook for easier usage in components
import { useState, useEffect } from 'react';

export function useTranslation() {
    const [locale, setLocale] = useState<Locale>('fa'); // Default to fa until hydrated

    useEffect(() => {
        setLocale(getLocale());
    }, []);

    const translate = (key: string) => t(key, locale);

    return {
        t: translate,
        locale,
        isRTL: locale === 'fa',
        dir: locale === 'fa' ? 'rtl' : 'ltr'
    };
}

