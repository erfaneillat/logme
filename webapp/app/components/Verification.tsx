'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

import { apiService, User } from '../services/apiService';

interface VerificationProps {
    phoneNumber: string;
    onBack: () => void;
    onVerify: (user: User) => void;
}

export default function Verification({ phoneNumber, onBack, onVerify }: VerificationProps) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    // Resend Timer Logic
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    useEffect(() => {
        // Focus first input on mount
        inputs.current[0]?.focus();
    }, []);

    const handleResend = async () => {
        if (countdown > 0) return;
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await apiService.sendCode(phoneNumber);
            setCountdown(60);
            setSuccessMessage('کد جدید ارسال شد.');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            setError(err.message || 'خطا در ارسال مجدد کد');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (index: number, value: string) => {
        if (error) setError(null);

        // Check if user is typing only numbers
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];

        if (value.length > 1) {
            // Handle paste or autofill event if supported (basic implementation)
            const pastedChars = value.split('').slice(0, 6);
            pastedChars.forEach((char, i) => {
                if (index + i < 6) newCode[index + i] = char;
            });
            setCode(newCode);
            const nextIndex = Math.min(index + pastedChars.length, 5);
            inputs.current[nextIndex]?.focus();
            if (newCode.every(c => c !== '')) handleVerify(newCode.join(''));
            return;
        }

        newCode[index] = value;
        setCode(newCode);

        // Auto-advance focus
        if (value !== '' && index < 5) {
            inputs.current[index + 1]?.focus();
        }

        // Auto-submit if full
        if (newCode.every(c => c !== '') && index === 5 && value !== '') {
            handleVerify(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (code[index] === '' && index > 0) {
                inputs.current[index - 1]?.focus();
                const newCode = [...code];
                newCode[index - 1] = ''; // Clear prev input on backspace if current is empty
                setCode(newCode);
            } else {
                const newCode = [...code];
                newCode[index] = '';
                setCode(newCode);
            }
        } else if (e.key === 'ArrowLeft' && index < 5) {
            inputs.current[index + 1]?.focus(); // RTL: Left moves to next (visually right if aligned ltr but logical flow?)
            // Let's stick to logical index: Prev is index-1, Next is index+1. 
            // In LTR: Left = index-1. In RTL: Left = index+1? 
            // Actually, for digit inputs, usually we want standard behavior.
            // Let's rely on browser default Nav or handle standard prev/next.
        }
    };

    const handleVerify = async (otp: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const user = await apiService.verifyCode(phoneNumber, otp);
            onVerify(user);
        } catch (err: any) {
            const msg = err.message || '';
            if (msg.includes('Invalid') || msg.includes('expired')) {
                setError('کد وارد شده صحیح نمی‌باشد یا منقضی شده است');
            } else {
                setError('خطایی رخ داد. لطفا مجددا تلاش کنید');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }} // Slide in from right (RTL sense of forward)
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-screen bg-white p-6"
        >
            {/* App Bar */}
            <div className="flex items-center pt-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /> {/* Arrow pointing Right for RTL Back */}
                    </svg>
                </button>
            </div>

            <div className="flex-1 flex flex-col items-start px-2">
                <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-4">
                    کد را وارد کنید
                </h1>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    ما یک کد تایید به شماره {phoneNumber} ارسال کردیم. لطفا آن را در زیر وارد کنید.
                </p>

                {/* OTP Inputs */}
                <div className="flex gap-3 justify-center w-full mb-12" dir="ltr">
                    {/* 
               Using flex-row-reverse and dir='ltr' to make the inputs visually 1-2-3-4-5-6 from Left to Right 
               which is standard for Numbers even in RTL context usually.
               Wait, in RTL apps, digits usually run Left-to-Right. 
               Let's stick to standard LTR arrangement for the digit boxes themselves.
            */}
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <input
                            key={idx}
                            ref={el => { inputs.current[idx] = el }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={code[idx]}
                            onChange={(e) => handleChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            className={`w-12 h-14 border-2 rounded-xl text-center text-2xl font-bold transition-all outline-none caret-[var(--color-secondary)]
                ${code[idx]
                                    ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5 shadow-[0_0_10px_rgba(255,107,53,0.2)]'
                                    : 'border-gray-200 focus:border-gray-400'}`}
                        />
                    ))}
                </div>

                {successMessage && (
                    <div className="w-full text-center text-green-600 bg-green-50 py-3 px-4 rounded-2xl text-sm font-bold mb-4 border border-green-100">
                        ✓ {successMessage}
                    </div>
                )}

                {error && (
                    <div className="w-full text-center text-red-500 text-sm font-bold mb-6">
                        {error}
                    </div>
                )}

                {/* Verify Button */}
                <button
                    onClick={() => handleVerify(code.join(''))}
                    disabled={isLoading || code.some(c => c === '')}
                    className="w-full bg-[var(--color-primary)] text-white h-14 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        'تایید'
                    )}
                </button>

                {/* Resend Link */}
                <div className="w-full flex justify-center items-center gap-2 text-sm">
                    <span className="text-gray-500">کد را دریافت نکردید؟</span>
                    <button
                        onClick={handleResend}
                        disabled={countdown > 0}
                        className={`font-bold ${countdown > 0 ? 'text-gray-400' : 'text-[var(--color-secondary)] hover:underline'}`}
                    >
                        {countdown > 0 ? `ارسال مجدد در ${countdown} ثانیه` : 'ارسال مجدد کد'}
                    </button>
                </div>

            </div>
        </motion.div>
    );
}
