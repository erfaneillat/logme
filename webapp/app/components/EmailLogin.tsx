'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/apiService';
import { useTranslation } from '../translations';

interface EmailLoginProps {
    onLoginSuccess: (user: any) => void;
    onBack: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

export default function EmailLogin({ onLoginSuccess, onBack }: EmailLoginProps) {
    const { t } = useTranslation();
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Handle forgot password mode
        if (mode === 'forgot') {
            if (!email) {
                setError(t('emailLogin.errors.emailRequired'));
                return;
            }
            if (!validateEmail(email)) {
                setError(t('emailLogin.errors.invalidEmail'));
                return;
            }
            // Fake sending - just show success message
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                setResetSent(true);
            }, 1500);
            return;
        }

        // Validation for login/signup
        if (!email || !password) {
            setError(t('emailLogin.errors.required'));
            return;
        }

        if (!validateEmail(email)) {
            setError(t('emailLogin.errors.invalidEmail'));
            return;
        }

        if (password.length < 6) {
            setError(t('emailLogin.errors.shortPassword'));
            return;
        }

        if (mode === 'signup') {
            if (password !== confirmPassword) {
                setError(t('emailLogin.errors.passwordMismatch'));
                return;
            }
        }

        setIsLoading(true);

        try {
            let result;
            if (mode === 'login') {
                result = await apiService.emailLogin(email, password);
            } else {
                result = await apiService.emailSignup(email, password, name || undefined);
            }
            onLoginSuccess(result);
        } catch (err: any) {
            console.error(`Email ${mode} error:`, err);
            setError(err.message || t('emailLogin.errors.generic'));
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'signup' : 'login');
        setError(null);
        setConfirmPassword('');
        setResetSent(false);
    };

    const goToForgotPassword = () => {
        setMode('forgot');
        setError(null);
        setResetSent(false);
    };

    const backToLogin = () => {
        setMode('login');
        setError(null);
        setResetSent(false);
    };

    const getTitle = () => {
        switch (mode) {
            case 'login': return t('emailLogin.loginTitle');
            case 'signup': return t('emailLogin.signupTitle');
            case 'forgot': return t('emailLogin.forgotTitle');
        }
    };

    const getHeading = () => {
        switch (mode) {
            case 'login': return t('emailLogin.welcomeBack');
            case 'signup': return t('emailLogin.createAccount');
            case 'forgot': return t('emailLogin.forgotHeading');
        }
    };

    const getSubtitle = () => {
        switch (mode) {
            case 'login': return t('emailLogin.loginSubtitle');
            case 'signup': return t('emailLogin.signupSubtitle');
            case 'forgot': return t('emailLogin.forgotSubtitle');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-screen bg-white"
            dir="ltr"
        >
            {/* Header */}
            <div className="flex items-center px-4 py-4 border-b border-gray-100">
                <button
                    onClick={mode === 'forgot' ? backToLogin : onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 pr-8">
                    {getTitle()}
                </h1>
            </div>

            <div className="flex-1 flex flex-col justify-center px-8 pb-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className={`w-20 h-20 ${mode === 'forgot' ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'} rounded-3xl flex items-center justify-center shadow-lg`}>
                        {mode === 'forgot' ? (
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        ) : (
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Success Message for Forgot Password */}
                <AnimatePresence mode="wait">
                    {mode === 'forgot' && resetSent ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {t('emailLogin.forgotSuccess')}
                            </h2>
                            <p className="text-gray-500 mb-6">
                                {t('emailLogin.forgotSuccessSubtitle')}
                            </p>
                            <p className="text-sm text-gray-400 mb-8">
                                {email}
                            </p>
                            <button
                                onClick={backToLogin}
                                className="w-full bg-emerald-500 text-white h-14 rounded-2xl font-semibold text-base shadow-sm hover:bg-emerald-600 active:scale-[0.98] transition-all"
                            >
                                {t('emailLogin.backToLogin')}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Title */}
                            <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
                                {getHeading()}
                            </h2>
                            <p className="text-gray-500 text-center mb-6">
                                {getSubtitle()}
                            </p>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name (only for signup) */}
                                <AnimatePresence>
                                    {mode === 'signup' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('emailLogin.name')}
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder={t('emailLogin.namePlaceholder')}
                                                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors text-gray-900 placeholder-gray-400"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('emailLogin.email')}
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t('emailLogin.emailPlaceholder')}
                                        autoComplete="email"
                                        className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors text-gray-900 placeholder-gray-400"
                                    />
                                </div>

                                {/* Password (not for forgot mode) */}
                                {mode !== 'forgot' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('emailLogin.password')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t('emailLogin.passwordPlaceholder')}
                                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                                className="w-full h-12 px-4 pr-12 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors text-gray-900 placeholder-gray-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Confirm Password (only for signup) */}
                                <AnimatePresence>
                                    {mode === 'signup' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('emailLogin.confirmPassword')}
                                            </label>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder={t('emailLogin.confirmPasswordPlaceholder')}
                                                autoComplete="new-password"
                                                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors text-gray-900 placeholder-gray-400"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Forgot Password Link (only for login) */}
                                {mode === 'login' && (
                                    <div className="text-right">
                                        <button
                                            type="button"
                                            onClick={goToForgotPassword}
                                            className="text-sm text-emerald-600 hover:underline"
                                        >
                                            {t('emailLogin.forgotPassword')}
                                        </button>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full ${mode === 'forgot' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white h-14 rounded-2xl font-semibold text-base shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-6`}
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {mode === 'login' && t('emailLogin.loginButton')}
                                            {mode === 'signup' && t('emailLogin.signupButton')}
                                            {mode === 'forgot' && t('emailLogin.sendResetLink')}
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Toggle Mode (not for forgot) */}
                            {mode !== 'forgot' && (
                                <p className="text-center text-gray-500 mt-6">
                                    {mode === 'login' ? t('emailLogin.noAccount') : t('emailLogin.hasAccount')}{' '}
                                    <button
                                        onClick={toggleMode}
                                        className="text-emerald-600 font-semibold hover:underline"
                                    >
                                        {mode === 'login' ? t('emailLogin.signupLink') : t('emailLogin.loginLink')}
                                    </button>
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

