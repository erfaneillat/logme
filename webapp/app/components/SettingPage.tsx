"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, UserProfile } from '../services/apiService';
import PersonalDetailsPage from './PersonalDetailsPage';
import AdjustMacrosPage from './AdjustMacrosPage';
import WeightHistoryPage from './WeightHistoryPage';
import SupportTicketsPage from './SupportTicketsPage';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../translations';

const Toggle = ({ active, onChange, isRTL, activeColor = 'bg-orange-400' }: { active: boolean; onChange: () => void; isRTL: boolean; activeColor?: string }) => (
    <button
        onClick={onChange}
        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out relative flex items-center ${active ? activeColor : 'bg-gray-200'}`}
    >
        <div
            className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${active ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`}
        ></div>
    </button>
);

// Shimmer loading component
const Shimmer = ({ className }: { className?: string }) => (
    <div className={`relative overflow-hidden bg-white/20 ${className}`}>
        <div
            className="absolute inset-0 -translate-x-full animate-shimmer"
            style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            }}
        />
    </div>
);

// Shimmer skeleton for profile section (dark mode variant)
const ProfileSkeleton = () => (
    <div className="flex items-center gap-4">
        {/* Avatar skeleton */}
        <div className="w-16 h-16 rounded-2xl bg-white/10 relative overflow-hidden flex-shrink-0">
            <div
                className="absolute inset-0 -translate-x-full animate-shimmer"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                }}
            />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
            {/* Name skeleton */}
            <div className="h-6 w-28 bg-white/10 rounded-lg relative overflow-hidden">
                <div
                    className="absolute inset-0 -translate-x-full animate-shimmer"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                />
            </div>
            {/* Phone skeleton */}
            <div className="h-4 w-24 bg-white/10 rounded-md relative overflow-hidden">
                <div
                    className="absolute inset-0 -translate-x-full animate-shimmer"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                />
            </div>
        </div>
    </div>
);

// Subscription card skeleton - keeps purple design, shimmer on text/data only
const SubscriptionSkeleton = () => (
    <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-[32px] p-6 text-white shadow-lg shadow-purple-200 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

        {/* Header Section */}
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-start gap-3">
                {/* Icon - static */}
                <div className="bg-white/20 p-2 rounded-xl border border-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
                {/* Title & Subtitle - shimmer */}
                <div className="text-right space-y-2 pt-1">
                    <div className="h-5 w-24 bg-white/30 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                    </div>
                    <div className="h-3 w-16 bg-white/20 rounded-md relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Status Badge - shimmer */}
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse"></span>
                <div className="h-3 w-8 bg-white/30 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                </div>
            </div>
        </div>

        {/* Bottom Details Card */}
        <div className="bg-white/10 rounded-[20px] p-4 mb-4 backdrop-blur-sm border border-white/5 relative z-10">
            {/* Date Row - shimmer */}
            <div className="flex justify-between text-sm font-bold text-purple-100 mb-2">
                <div className="h-4 w-20 bg-white/20 rounded-md relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                </div>
                <div className="h-4 w-24 bg-white/20 rounded-md relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                </div>
            </div>

            {/* Progress Bar - shimmer */}
            <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mb-2 relative" dir="ltr">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </div>

            {/* Status Text - shimmer */}
            <div className="flex justify-center mt-1">
                <div className="h-3 w-24 bg-white/20 rounded-md relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                </div>
            </div>
        </div>
    </div>
);


type SettingView = 'main' | 'personal_details' | 'adjust_macros' | 'weight_history' | 'tickets';

interface SettingPageProps {
    onLogout: () => void;
    onSubscriptionClick: () => void;
}

const SettingPage: React.FC<SettingPageProps> = ({ onLogout, onSubscriptionClick }) => {
    const { t, isRTL, locale, setLocale, isGlobal } = useTranslation();
    const [currentView, setCurrentView] = useState<SettingView>('main');
    const [animate, setAnimate] = useState(false);

    // API Data States
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [preferences, setPreferences] = useState({ addBurnedCalories: true, rolloverCalories: true });
    const [subscriptionStatus, setSubscriptionStatus] = useState<{ isActive: boolean; expiryDate?: string | null; startDate?: string | null } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Edit Name States
    const [showEditNameModal, setShowEditNameModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [isUpdatingName, setIsUpdatingName] = useState(false);

    // Logout Modal
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Delete Account State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        requestAnimationFrame(() => setAnimate(true));
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [profile, prefs, subStatus] = await Promise.all([
                apiService.getUserProfile(),
                apiService.getPreferences(),
                apiService.getSubscriptionStatus()
            ]);

            if (profile) {
                setUserProfile(profile);
                setNewName(profile.name || '');
            }
            if (prefs) {
                setPreferences(prefs);
            }
            if (subStatus) {
                setSubscriptionStatus(subStatus);
            }
        } catch (error) {
            console.error('Failed to fetch settings data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreferenceChange = async (key: 'addBurnedCalories' | 'rolloverCalories') => {
        const newValue = !preferences[key];
        // Optimistic update
        setPreferences(prev => ({ ...prev, [key]: newValue }));

        try {
            await apiService.updatePreferences({ [key]: newValue });
            showToast(t('settings.toast.success'), 'success');
        } catch (error) {
            console.error('Failed to update preference:', error);
            showToast(t('settings.toast.error'), 'error');
            // Revert on error
            setPreferences(prev => ({ ...prev, [key]: !newValue }));
        }
    };

    const handleUpdateName = async () => {
        if (!newName.trim()) return;

        try {
            setIsUpdatingName(true);
            const updatedProfile = await apiService.updateProfile(newName.trim());
            if (updatedProfile) {
                setUserProfile(updatedProfile);
                setShowEditNameModal(false);
            }
        } catch (error) {
            console.error('Failed to update name:', error);
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setIsDeleting(true);
            await apiService.deleteAccount(deleteReason);
            setShowDeleteModal(false);
            onLogout();
        } catch (error) {
            console.error('Failed to delete account', error);
            showToast(t('settings.toast.deleteError'), 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseModal = () => setCurrentView('main');

    return (
        <div className="bg-[#F5F7FA] min-h-screen pb-safe-bottom" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header with gradient background */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 pb-16 pt-safe-top px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="flex justify-between items-center mb-8 relative z-10 pt-4">
                    <h1 className="text-2xl font-black text-white">{t('settings.title')}</h1>
                    <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                </div>

                <div className={`bg-white/10 backdrop-blur-lg rounded-[28px] p-5 border border-white/10 flex items-center gap-4 relative overflow-hidden transition-all duration-700 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    {isLoading ? (
                        <ProfileSkeleton />
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/20 flex-shrink-0">
                                <div className="w-full h-full bg-gray-800 rounded-[14px] flex items-center justify-center overflow-hidden relative">
                                    {/* Avatar generic if no image */}
                                    <span className="text-2xl text-white font-bold">{userProfile?.name?.charAt(0) || '👤'}</span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-black text-white truncate">{userProfile?.name || t('settings.dearUser')}</h2>
                                    <button
                                        onClick={() => {
                                            setNewName(userProfile?.name || '');
                                            setShowEditNameModal(true);
                                        }}
                                        className="p-1 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-gray-400 text-sm font-medium tracking-wider" dir="ltr">
                                    {userProfile?.phone || ''}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="px-6 -mt-8 space-y-4">
                {/* Subscription Card */}
                {(() => {
                    // Hide loading state completely
                    if (isLoading) {
                        return null;
                    }

                    const isSubscribed = subscriptionStatus?.isActive || false;

                    if (!isSubscribed) {
                        return (
                            <div
                                onClick={onSubscriptionClick}
                                className={`bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-[32px] p-6 text-white shadow-lg shadow-purple-200 relative overflow-hidden transition-all duration-700 delay-100 transform cursor-pointer active:scale-95 group ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            >
                                {/* Animated background elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -ml-10 -mb-10 animate-pulse delay-700"></div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-3 rounded-2xl shadow-lg shadow-yellow-400/30 ring-4 ring-white/10">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-900" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827 1.035L17.477 8l2.056 3.846a1 1 0 01-1.125 1.488h-1.39l-.49 4.887a1 1 0 01-1.99.027l-.491-4.914h-3.09l-.49 4.914a1 1 0 01-1.99-.027l-.49-4.887h-1.39a1 1 0 01-1.126-1.488L5.522 8 3.522 3.899a1 1 0 011.827-1.035l1.699 3.181L10 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="pt-1">
                                            <h3 className="font-black text-xl text-white leading-tight">{t('settings.subscription.title')}</h3>
                                            <p className="text-purple-200 text-xs font-bold mt-1.5 opacity-90">{t('settings.subscription.subtitle')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/10 rounded-[20px] p-4 backdrop-blur-sm border border-white/10 relative z-10 group-hover:bg-white/15 transition-all duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-white">
                                            <span className="font-bold text-sm">{t('settings.subscription.buy')}</span>
                                        </div>
                                        <div className={`bg-white text-purple-600 rounded-full p-2 w-8 h-8 flex items-center justify-center transform transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Active Subscription View
                    let endDate = new Date();
                    if (subscriptionStatus?.expiryDate) {
                        endDate = new Date(subscriptionStatus.expiryDate);
                    }

                    // Safe calculation for progress
                    let progressPercent = 100;
                    if (subscriptionStatus?.startDate && subscriptionStatus?.expiryDate) {
                        const start = new Date(subscriptionStatus.startDate).getTime();
                        const end = new Date(subscriptionStatus.expiryDate).getTime();
                        const now = new Date().getTime();
                        const total = end - start;
                        const elapsed = now - start;
                        if (total > 0) {
                            progressPercent = Math.min(100, Math.max(0, (elapsed / total) * 100));
                        }
                    }

                    return (
                        <div
                            onClick={onSubscriptionClick}
                            className={`bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-[32px] p-6 text-white shadow-lg shadow-purple-200 relative overflow-hidden transition-all duration-700 delay-100 transform cursor-pointer active:scale-95 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="flex items-start gap-3">
                                    <div className="bg-white/20 p-2 rounded-xl border border-white/10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="font-black text-lg">{t('settings.subscription.title')}</h3>
                                        <p className="text-purple-200 text-xs font-bold">{t('settings.subscription.fullAccess')}</p>
                                    </div>
                                </div>

                                <div className={`bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10`}>
                                    <span className={`w-2 h-2 rounded-full animate-pulse bg-green-400 shadow-[0_0_8px_rgba(255,255,255,0.3)]`}></span>
                                    <span className="text-xs font-bold">{t('settings.subscription.statusActive')}</span>
                                </div>
                            </div>

                            <div className="bg-white/10 rounded-[20px] p-4 mb-4 backdrop-blur-sm border border-white/5 relative z-10">
                                <div className="flex justify-between text-sm font-bold text-purple-100 mb-2">
                                    <span dir="ltr">{endDate.toLocaleDateString(isRTL ? 'fa-IR' : 'en-US')}</span>
                                    <span>{t('settings.subscription.expiresOn')}</span>
                                </div>
                                <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mb-2" dir="ltr">
                                    <div
                                        className="bg-white h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                <div className="text-center text-xs font-medium text-purple-200 mt-1 flex items-center justify-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{t('settings.subscription.active')}</span>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Quick Actions Grid */}
                <div className={`space-y-4 transition-all duration-700 delay-200 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h3 className="font-black text-xl text-gray-800 px-1">{t('settings.quickActions.title')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setCurrentView('personal_details')}
                            className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md active:scale-95 transition-all flex flex-col items-center text-center group"
                        >
                            <div className="w-full flex justify-start items-center gap-2 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
                                    👤
                                </div>
                                <span className={`text-gray-300 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </span>
                            </div>
                            <span className="font-bold text-gray-800 text-sm mb-1">{t('settings.quickActions.personalDetails')}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{t('settings.quickActions.personalDetailsSub')}</span>
                        </button>

                        <button
                            onClick={() => setCurrentView('adjust_macros')}
                            className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md active:scale-95 transition-all flex flex-col items-center text-center group"
                        >
                            <div className="w-full flex justify-start items-center gap-2 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl">
                                    🍽️
                                </div>
                                <span className={`text-gray-300 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </span>
                            </div>
                            <span className="font-bold text-gray-800 text-sm mb-1">{t('settings.quickActions.adjustMacros')}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{t('settings.quickActions.adjustMacrosSub')}</span>
                        </button>

                        <button
                            onClick={() => setCurrentView('personal_details')} // Reusing for now
                            className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md active:scale-95 transition-all flex flex-col items-center text-center group"
                        >
                            <div className="w-full flex justify-start items-center gap-2 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-xl">
                                    🚩
                                </div>
                                <span className={`text-gray-300 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </span>
                            </div>
                            <span className="font-bold text-gray-800 text-sm mb-1">{t('settings.quickActions.goalAndWeight')}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{t('settings.quickActions.goalAndWeightSub')}</span>
                        </button>

                        <button
                            onClick={() => setCurrentView('weight_history')}
                            className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md active:scale-95 transition-all flex flex-col items-center text-center group"
                        >
                            <div className="w-full flex justify-start items-center gap-2 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                                    📉
                                </div>
                                <span className={`text-gray-300 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </span>
                            </div>
                            <span className="font-bold text-gray-800 text-sm mb-1">{t('settings.quickActions.weightHistory')}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{t('settings.quickActions.weightHistorySub')}</span>
                        </button>
                    </div>


                </div>

                {/* Preferences */}
                <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all duration-700 delay-300 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex items-center gap-2 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <h3 className="font-black text-lg text-gray-800">{t('settings.preferences.title')}</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                            <div className="flex-1 me-4">
                                <div className="flex items-center justify-start gap-2 mb-1">
                                    <span className="text-orange-500 bg-orange-50 p-1 rounded-lg">🔥</span>
                                    <h4 className="font-bold text-gray-800 text-sm">{t('settings.preferences.addBurned')}</h4>
                                </div>
                                <p className="text-xs text-gray-400 ms-8">{t('settings.preferences.addBurnedSub')}</p>
                            </div>
                            <Toggle active={preferences.addBurnedCalories} onChange={() => handlePreferenceChange('addBurnedCalories')} isRTL={isRTL} activeColor="bg-orange-500" />
                        </div>

                        <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                            <div className="flex-1 me-4">
                                <div className="flex items-center justify-start gap-2 mb-1">
                                    <span className="text-green-500 bg-green-50 p-1 rounded-lg">↺</span>
                                    <h4 className="font-bold text-gray-800 text-sm">{t('settings.preferences.rollover')}</h4>
                                </div>
                                <p className="text-xs text-gray-400 ms-8">{t('settings.preferences.rolloverSub')}</p>
                            </div>
                            <Toggle active={preferences.rolloverCalories} onChange={() => handlePreferenceChange('rolloverCalories')} isRTL={isRTL} activeColor="bg-green-500" />
                        </div>

                        {/* Language Selector - Only shown in Global mode */}
                        {isGlobal && (
                            <div className="flex justify-between items-center">
                                <div className="flex-1 me-4">
                                    <div className="flex items-center justify-start gap-2 mb-1">
                                        <span className="text-blue-500 bg-blue-50 p-1 rounded-lg">🌐</span>
                                        <h4 className="font-bold text-gray-800 text-sm">{t('settings.preferences.language')}</h4>
                                    </div>
                                    <p className="text-xs text-gray-400 ms-8">{t('settings.preferences.languageSub')}</p>
                                </div>
                                <div className="relative">
                                    <select
                                        value={locale}
                                        onChange={(e) => setLocale(e.target.value as 'en' | 'fa')}
                                        className="appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-4 py-2.5 pe-10 rounded-xl cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                        <option value="en">{t('settings.preferences.english')}</option>
                                    </select>
                                    <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Support & Legal */}
                <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all duration-700 delay-500 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex items-center gap-2 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="font-black text-lg text-gray-800">{t('settings.support.title')}</h3>
                    </div>

                    <div className="space-y-1">
                        {[
                            { id: 'privacy', label: t('settings.support.privacy'), icon: '🛡️', color: 'bg-purple-50 text-purple-500', link: isGlobal ? 'https://loqmeapp.ir/privacy-policy/en' : 'https://loqmeapp.ir/privacy-policy' },
                            { id: 'tickets', label: t('settings.support.tickets'), icon: '🎧', color: 'bg-blue-50 text-blue-500', isAction: true },
                            { id: 'contact', label: t('settings.support.contact'), icon: '✉️', color: 'bg-green-50 text-green-500', link: 'https://loqmeapp.ir/contact' },
                            { id: 'delete', label: t('settings.support.deleteAccount'), icon: '⚠️', color: 'bg-red-50 text-red-500', isAction: true },
                        ].filter(item => !isGlobal || item.id !== 'contact').map((item, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    if (item.link) window.open(item.link, '_blank');
                                    else if (item.id === 'tickets') setCurrentView('tickets');
                                    else if (item.id === 'delete') setShowDeleteModal(true);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-[20px] hover:bg-gray-50 transition-colors group ${(!item.link && !item.isAction) ? 'opacity-80 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${item.color}`}>
                                        {item.icon}
                                    </div>
                                    <span className={`font-bold text-sm ${item.icon === '⚠️' ? 'text-red-500' : 'text-gray-700'}`}>{item.label}</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors ${!isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={() => setShowLogoutModal(true)}
                    className={`w-full py-4 bg-[#EF4444] text-white rounded-[20px] font-bold text-lg shadow-lg shadow-red-200 hover:bg-red-600 active:scale-95 transition-all transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} duration-700 delay-700`}
                >
                    {t('settings.logout')}
                </button>

                <div className={`text-center pb-4 transform ${animate ? 'opacity-100' : 'opacity-0'} transition-opacity delay-1000`}>
                    <p className="text-gray-300 text-xs font-mono">{t('settings.version')} 1.0.0</p>
                </div>
            </div>



            {/* Modals - AnimatePresence ensures exit animations play */}
            <AnimatePresence>
                {
                    currentView === 'personal_details' && (
                        <PersonalDetailsPage onClose={handleCloseModal} />
                    )
                }
                {
                    currentView === 'adjust_macros' && (
                        <AdjustMacrosPage onClose={handleCloseModal} />
                    )
                }
                {
                    currentView === 'weight_history' && (
                        <WeightHistoryPage onClose={handleCloseModal} />
                    )
                }
                {
                    currentView === 'tickets' && (
                        <SupportTicketsPage onClose={handleCloseModal} />
                    )
                }
            </AnimatePresence >

            {/* Logout Modal */}
            <AnimatePresence>
                {
                    showLogoutModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                            onClick={() => setShowLogoutModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    🚪
                                </div>

                                <h3 className="text-xl font-black text-gray-800 text-center mb-2">{t('settings.modals.logoutTitle')}</h3>
                                <p className="text-gray-500 text-center text-sm font-medium mb-8">
                                    {t('settings.modals.logoutDesc')}
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowLogoutModal(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        {t('settings.modals.cancel')}
                                    </button>
                                    <button
                                        onClick={() => { setShowLogoutModal(false); onLogout(); }}
                                        className="flex-1 py-3 bg-[#EF4444] text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 hover:bg-red-600 transition-all"
                                    >
                                        {t('settings.modals.confirmLogout')}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Edit Name Modal */}
            <AnimatePresence>
                {
                    showEditNameModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
                            onClick={() => setShowEditNameModal(false)}
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="bg-white rounded-t-[32px] sm:rounded-[32px] p-6 w-full max-w-md shadow-2xl overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-800">{t('settings.modals.editNameTitle')}</h3>
                                </div>

                                <div className="mb-8">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.modals.yourName')}</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder={t('settings.modals.namePlaceholder')}
                                        className="w-full px-4 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all font-medium text-gray-800 placeholder-gray-400"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowEditNameModal(false)}
                                        className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        {t('settings.modals.cancel')}
                                    </button>
                                    <button
                                        onClick={handleUpdateName}
                                        disabled={isUpdatingName || !newName.trim()}
                                        className="flex-[2] py-4 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-gray-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {isUpdatingName ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        ) : (
                                            t('settings.modals.saveChanges')
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Delete Account Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                ⚠️
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">{t('settings.modals.deleteTitle')}</h3>
                            <p className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
                                {t('settings.modals.deleteDesc')}
                            </p>

                            <textarea
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder={t('settings.modals.deleteReason')}
                                className="w-full p-3 bg-gray-50 rounded-xl mb-6 text-sm outline-none border border-gray-100 focus:border-red-200 transition-colors resize-none h-24"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    {t('settings.modals.cancel')}
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? t('settings.modals.deleting') : t('settings.modals.deleteConfirm')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingPage;
