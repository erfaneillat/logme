'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../services/apiService';

interface LoginGlobalProps {
    onLoginSuccess: (user: any) => void;
}

export default function LoginGlobal({ onLoginSuccess }: LoginGlobalProps) {
    const [isLoading, setIsLoading] = useState<'google' | 'apple' | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setIsLoading('google');
        setError(null);

        try {
            // For now, we'll use a simple Google Sign-In popup approach
            // In production, you'd integrate with @react-oauth/google or similar

            // Dynamically load Google Identity Services
            const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

            if (!googleClientId) {
                throw new Error('Google Client ID not configured');
            }

            // Create a promise to handle the Google Sign-In callback
            const googleUser = await new Promise<{ email: string, name: string, sub: string }>((resolve, reject) => {
                // Load the Google API script if not loaded
                if (!(window as any).google) {
                    const script = document.createElement('script');
                    script.src = 'https://accounts.google.com/gsi/client';
                    script.async = true;
                    script.defer = true;
                    script.onload = () => initializeGoogleSignIn(resolve, reject, googleClientId);
                    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
                    document.head.appendChild(script);
                } else {
                    initializeGoogleSignIn(resolve, reject, googleClientId);
                }
            });

            // Send to our backend
            const result = await apiService.oauthLogin(
                'google',
                googleUser.email,
                googleUser.name,
                googleUser.sub
            );

            onLoginSuccess(result);
        } catch (err: any) {
            console.error('Google login error:', err);
            setError(err.message || 'Failed to sign in with Google');
        } finally {
            setIsLoading(null);
        }
    };

    const initializeGoogleSignIn = (
        resolve: (value: { email: string, name: string, sub: string }) => void,
        reject: (reason?: any) => void,
        clientId: string
    ) => {
        const google = (window as any).google;

        google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
                if (response.credential) {
                    // Decode the JWT token
                    const payload = JSON.parse(atob(response.credential.split('.')[1]));
                    resolve({
                        email: payload.email,
                        name: payload.name || payload.email.split('@')[0],
                        sub: payload.sub
                    });
                } else {
                    reject(new Error('No credential received'));
                }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
        });

        // Render button then programmatically click
        const buttonDiv = document.createElement('div');
        buttonDiv.id = 'google-signin-btn';
        buttonDiv.style.display = 'none';
        document.body.appendChild(buttonDiv);

        google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
        });

        // Use One Tap or prompt
        google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Fallback: click the rendered button
                const btn = buttonDiv.querySelector('div[role="button"]') as HTMLElement;
                if (btn) btn.click();
            }
        });
    };

    const handleAppleLogin = async () => {
        setIsLoading('apple');
        setError(null);

        try {
            // Apple Sign In requires Apple JS SDK
            // For web, we use Sign in with Apple JS

            if (!(window as any).AppleID) {
                // Load Apple Sign In JS
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Failed to load Apple Sign-In'));
                    document.head.appendChild(script);
                });
            }

            const AppleID = (window as any).AppleID;

            AppleID.auth.init({
                clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || 'com.loqmeapp.global',
                scope: 'name email',
                redirectURI: window.location.origin + '/app/',
                usePopup: true
            });

            const response = await AppleID.auth.signIn();

            // Extract user info from response
            const idToken = response.authorization.id_token;
            const payload = JSON.parse(atob(idToken.split('.')[1]));

            const userName = response.user?.name
                ? `${response.user.name.firstName || ''} ${response.user.name.lastName || ''}`.trim()
                : undefined;

            // Send to our backend
            const result = await apiService.oauthLogin(
                'apple',
                payload.email,
                userName,
                payload.sub
            );

            onLoginSuccess(result);
        } catch (err: any) {
            console.error('Apple login error:', err);
            if (err.error !== 'popup_closed_by_user') {
                setError(err.message || 'Failed to sign in with Apple');
            }
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 pt-20"
        >
            <div className="flex-1 flex flex-col items-center max-w-sm mx-auto w-full">
                {/* Logo */}
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-lg overflow-hidden">
                    <img
                        src="/app/loqme_logo.png"
                        alt="Slice Logo"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-center mb-3 text-gray-900">
                    Welcome to Slice
                </h1>
                <p className="text-gray-500 text-center mb-12 leading-relaxed">
                    Track your nutrition with AI-powered food analysis
                </p>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Sign In Buttons */}
                <div className="w-full space-y-4">
                    {/* Continue with Google */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading !== null}
                        className="w-full bg-white border-2 border-gray-200 text-gray-700 h-14 rounded-2xl font-semibold text-base shadow-sm hover:shadow-md hover:border-gray-300 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading === 'google' ? (
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </button>

                    {/* Continue with Apple */}
                    <button
                        onClick={handleAppleLogin}
                        disabled={isLoading !== null}
                        className="w-full bg-black text-white h-14 rounded-2xl font-semibold text-base shadow-sm hover:shadow-md hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading === 'apple' ? (
                            <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                                Continue with Apple
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-auto w-full mb-8">
                    {/* Terms Text */}
                    <p className="text-xs text-center text-gray-500 leading-relaxed max-w-xs mx-auto">
                        By continuing, you agree to our{' '}
                        <a href="#" className="text-emerald-600 hover:underline">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
