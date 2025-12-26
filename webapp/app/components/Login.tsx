'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../translations';
import { apiService } from '../services/apiService';

interface LoginProps {
    onPhoneSubmit: (phone: string) => void;
}

export default function Login({ onPhoneSubmit }: LoginProps) {
    const { t } = useTranslation();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber || phoneNumber.length < 10) {
            setError(t('login.phoneError'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await apiService.sendCode(phoneNumber);
            onPhoneSubmit(phoneNumber);
        } catch (err: any) {
            setError(err.message || t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col h-screen bg-white p-8 pt-20"
        >
            <div className="flex-1 flex flex-col items-center max-w-sm mx-auto w-full">
                {/* Title */}
                <h1 className="text-3xl font-bold text-center mb-12 leading-tight text-[var(--color-primary)] whitespace-pre-line">
                    {t('login.welcome')}
                </h1>

                {/* Input Container */}
                <div className="w-full bg-gray-50 rounded-2xl p-2 mb-8 border border-gray-100 focus-within:border-[var(--color-secondary)] focus-within:ring-1 focus-within:ring-[var(--color-secondary)] transition-all">
                    <input
                        type="tel"
                        dir="ltr"
                        value={phoneNumber}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setPhoneNumber(val);
                            if (error) setError(null);
                        }}
                        placeholder={t('login.phonePlaceholder')}
                        className="w-full bg-transparent p-4 text-center text-xl font-medium outline-none placeholder:text-gray-400 tracking-wider text-gray-900"
                    />
                </div>

                {error && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-500 text-sm mb-4"
                    >
                        {error}
                    </motion.p>
                )}

                <div className="mt-auto w-full space-y-6 mb-8">
                    {/* Main Action Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full bg-[var(--color-primary)] text-white h-14 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            t('login.continue')
                        )}
                    </button>

                    {/* Terms Text */}
                    <p className="text-xs text-center text-gray-500 leading-relaxed max-w-xs mx-auto">
                        {t('login.terms')}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
