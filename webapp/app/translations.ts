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

// Get locale from localStorage > FlutterBridge > browser > default
// In Iran mode, always returns 'fa'. Language selection is only available in global mode.
export function getLocale(): Locale {
    // In Iran mode, always use Farsi
    if (!isGlobalMode()) {
        return 'fa';
    }

    if (typeof window === 'undefined') {
        return 'en'; // Default for global mode on server
    }

    // In global mode, check localStorage for user preference first
    const savedLocale = localStorage.getItem('app_locale');
    if (savedLocale === 'en' || savedLocale === 'fa') {
        return savedLocale;
    }

    // Check if FlutterBridge provides device locale (from mobile app)
    // @ts-ignore
    const flutterBridge = window.FlutterBridge;
    if (flutterBridge?.deviceLocale) {
        const deviceLocale = flutterBridge.deviceLocale as string;
        // Check if device locale is supported, otherwise default to 'en'
        const supportedLocale: Locale = (deviceLocale === 'fa' || deviceLocale === 'en') ? deviceLocale : 'en';
        // Save to localStorage for future use
        localStorage.setItem('app_locale', supportedLocale);
        return supportedLocale;
    }

    // Fallback: Check browser navigator language
    const browserLang = navigator.language?.split('-')[0] || 'en';
    const browserLocale: Locale = browserLang === 'fa' ? 'fa' : 'en';

    // Save detected locale to localStorage
    localStorage.setItem('app_locale', browserLocale);

    return browserLocale;
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

// Get initial locale for SSR/first render
function getInitialLocale(): Locale {
    // During SSR or if global mode, default to 'en'
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_MARKET === 'global' ? 'en' : 'fa';
    }

    // On client, try to get from localStorage immediately
    const savedLocale = localStorage.getItem('app_locale');
    if (savedLocale === 'en' || savedLocale === 'fa') {
        return savedLocale;
    }

    // In global mode, default to 'en', otherwise 'fa'
    return isGlobalMode() ? 'en' : 'fa';
}

export function useTranslation() {
    const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
    const [isGlobal, setIsGlobal] = useState(isGlobalMode);

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
