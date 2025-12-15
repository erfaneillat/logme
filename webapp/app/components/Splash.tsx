import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface SplashProps {
    onFinish: () => void;
}

interface VersionInfo {
    version: string;
    buildTime: string;
    buildHash: string;
}

export default function Splash({ onFinish }: SplashProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<'checking' | 'downloading' | 'installing'>('checking');

    useEffect(() => {
        const checkVersionAndProceed = async () => {
            try {
                // Fetch version.json with cache-busting to always get the latest
                const response = await fetch(`/app/version.json?t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });

                if (response.ok) {
                    const serverVersion: VersionInfo = await response.json();
                    const cachedVersion = localStorage.getItem('app_version_hash');

                    console.log('[Version Check] Server:', serverVersion.buildHash, 'Cached:', cachedVersion);

                    // Check if there's a new version
                    if (cachedVersion && cachedVersion !== serverVersion.buildHash) {
                        console.log('[Version Check] New version detected! Updating...');
                        setIsUpdating(true);
                        setUpdateStatus('downloading');

                        // Clear caches and reload
                        await clearCachesAndUpdate();

                        setUpdateStatus('installing');

                        // Store new version
                        localStorage.setItem('app_version_hash', serverVersion.buildHash);
                        localStorage.setItem('app_version', serverVersion.version);

                        // Brief delay before reload
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // Force reload to get fresh assets
                        window.location.reload();
                        return;
                    }

                    // Store current version (first time or same version)
                    localStorage.setItem('app_version_hash', serverVersion.buildHash);
                    localStorage.setItem('app_version', serverVersion.version);
                }
            } catch (error) {
                console.error('[Version Check] Error:', error);
                // Continue with splash even if version check fails
            }

            // Normal splash timeout
            await new Promise(resolve => setTimeout(resolve, 2000));
            onFinish();
        };

        checkVersionAndProceed();
    }, [onFinish]);

    const clearCachesAndUpdate = async (): Promise<void> => {
        try {
            // 1. Clear Service Worker caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                console.log('[Update] Clearing caches:', cacheNames);
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }

            // 2. Unregister and re-register service worker
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    console.log('[Update] Unregistering service worker:', registration.scope);
                    await registration.unregister();
                }
            }

            // Small delay to ensure everything is cleared
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('[Update] Error clearing caches:', error);
        }
    };

    const getStatusText = () => {
        switch (updateStatus) {
            case 'downloading':
                return 'در حال دریافت نسخه جدید...';
            case 'installing':
                return 'در حال نصب نسخه جدید...';
            default:
                return 'در حال بررسی بروزرسانی...';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    duration: 0.8,
                    ease: [0, 0.71, 0.2, 1.01],
                    scale: {
                        type: "spring",
                        damping: 10,
                        stiffness: 100,
                        restDelta: 0.001
                    }
                }}
                className="relative flex flex-col items-center"
            >
                <div className="relative w-32 h-32 mb-4">
                    {/* Pulsing effect behind logo */}
                    <motion.div
                        className="absolute inset-0 bg-orange-500/10 rounded-full blur-xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <Image
                        src="/app/images/loqme_logo.png"
                        alt="Loqme Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-2xl font-bold text-gray-800"
                >
                    لقمه
                </motion.h1>

                {/* Update Status */}
                <AnimatePresence>
                    {isUpdating && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-8 flex flex-col items-center"
                        >
                            {/* Indeterminate Progress Bar */}
                            <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                                <motion.div
                                    className="absolute h-full w-1/3 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 rounded-full"
                                    animate={{
                                        x: ['-100%', '250%'],
                                    }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    style={{ width: '40%' }}
                                />
                            </div>

                            {/* Update Text */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mt-3 text-sm text-gray-500 flex items-center gap-2"
                            >
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                    className="inline-block"
                                >
                                    <svg
                                        className="w-4 h-4 text-orange-500"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                </motion.span>
                                <motion.span
                                    key={updateStatus}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {getStatusText()}
                                </motion.span>
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

