'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AppVersionCheck {
    isForceUpdate: boolean;
    isOptionalUpdate: boolean;
    updateTitle?: string;
    updateMessage?: string;
    storeUrl?: string;
    latestVersion?: string;
    latestBuildNumber?: number;
}

interface UpdateDialogProps {
    versionCheck: AppVersionCheck;
    onClose?: () => void;
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({ versionCheck, onClose }) => {
    const {
        isForceUpdate,
        updateTitle = 'بروزرسانی جدید موجود است',
        updateMessage = 'لطفاً برای استفاده از آخرین امکانات، برنامه را بروزرسانی کنید.',
        storeUrl
    } = versionCheck;

    const handleUpdate = () => {
        if (storeUrl) {
            window.open(storeUrl, '_blank');
        } else {
            // Reload if no store URL (assume web update)
            window.location.reload();
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={!isForceUpdate ? onClose : undefined}
                />

                {/* Dialog Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                    className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
                >
                    {/* Header Graphic */}
                    <div className="relative h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                        {/* Abstract Circles for decoration */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl" />
                        <div className="absolute top-10 -left-10 w-40 h-40 rounded-full bg-black/10 blur-xl" />

                        {/* Icon */}
                        <div className="relative z-10 p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                        </div>
                    </div>

                    <div className="p-6 text-center">
                        {/* Title */}
                        <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                            {updateTitle}
                        </h2>

                        {/* Message */}
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            {updateMessage}
                        </p>

                        {/* Buttons */}
                        <div className="mt-8 flex flex-col gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleUpdate}
                                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow"
                            >
                                بروزرسانی
                            </motion.button>

                            {!isForceUpdate && onClose && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    className="w-full py-3.5 px-4 rounded-xl text-gray-500 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    بعداً
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
