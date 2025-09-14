import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
    const { currentLanguage, setLanguage, isRTL } = useLanguage();

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'fa', name: 'فارسی', flag: '🇮🇷' }
    ];

    return (
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${currentLanguage === lang.code
                        ? 'bg-white text-black'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        }`}
                >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
