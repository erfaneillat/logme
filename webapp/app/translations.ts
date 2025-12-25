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
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => {
        return prev ? prev[curr] : null;
    }, obj) || path;
}

// Standalone t function (useful when outside hook)
export function t(key: string, locale: Locale): any {
    const dict = translations[locale];
    return getNestedValue(dict, key);
}

// Check if app is running in global mode
export function isGlobalMode(): boolean {
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_MARKET === 'global';
    }

    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const marketParam = searchParams.get('market') || hashParams.get('market');

    return marketParam === 'global' || process.env.NEXT_PUBLIC_MARKET === 'global';
}

// Get locale from localStorage > market (Environment > URL > Default)
// In Iran mode, always returns 'fa'. Language selection is only available in global mode.
export function getLocale(): Locale {
    // In Iran mode, always use Farsi
    if (!isGlobalMode()) {
        return 'fa';
    }

    if (typeof window === 'undefined') {
        return 'en'; // Default for global mode on server
    }

    // In global mode, check localStorage for user preference
    const savedLocale = localStorage.getItem('app_locale');
    if (savedLocale === 'en' || savedLocale === 'fa') {
        return savedLocale;
    }

    // Default to English for global mode
    return 'en';
}

// Apply locale-specific styles (direction, font, lang attribute)
export function applyLocaleStyles(locale: Locale): void {
    if (typeof window === 'undefined') return;

    const isRTL = locale === 'fa';

    // Update document direction and language
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;

    // Update font family
    if (isRTL) {
        // Persian font
        document.body.style.fontFamily = "'Vazirmatn', sans-serif";
        // Ensure Vazirmatn font is loaded
        if (!document.querySelector('link[href*="Vazirmatn"]')) {
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    } else {
        // English/LTR font
        document.body.style.fontFamily = "system-ui, -apple-system, sans-serif";
    }

    // Update document title based on locale
    document.title = locale === 'fa' ? 'لقمه' : 'Slice';
}

// Set locale and persist to localStorage
export function setLocale(locale: Locale): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('app_locale', locale);
        // Apply styles immediately before reload
        applyLocaleStyles(locale);
        // Reload to fully apply changes
        window.location.reload();
    }
}

// Hook for easier usage in components
import { useState, useEffect, useCallback } from 'react';

export function useTranslation() {
    const [locale, setLocaleState] = useState<Locale>('fa'); // Default to fa until hydrated
    const [isGlobal, setIsGlobal] = useState(false);

    useEffect(() => {
        const currentLocale = getLocale();
        setLocaleState(currentLocale);
        setIsGlobal(isGlobalMode());
        // Apply locale styles on mount (handles cases where localStorage differs from initial render)
        applyLocaleStyles(currentLocale);
    }, []);

    const translate = (key: string, options?: { returnObjects?: boolean }) => t(key, locale);

    const changeLocale = useCallback((newLocale: Locale) => {
        setLocale(newLocale);
    }, []);

    return {
        t: translate,
        locale,
        setLocale: changeLocale,
        isRTL: locale === 'fa',
        dir: locale === 'fa' ? 'rtl' : 'ltr',
        isGlobal
    };
}
