"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import AnalysisPage from './components/AnalysisPage';
import AddFoodModal from './components/AddFoodModal';
import AddExerciseModal from './components/AddExerciseModal';
import FoodDetailModal from './components/FoodDetailModal';
import ChatPage from './components/ChatPage';
import SettingPage from './components/SettingPage';
import SubscriptionPage from './components/SubscriptionPage';
import Splash from './components/Splash';
import Onboarding from './components/Onboarding';
import Login from './components/Login';
import Verification from './components/Verification';
import AdditionalInfo from './components/AdditionalInfo';
import PlanGeneration from './components/PlanGeneration';
import PlanSummary from './components/PlanSummary';
import PaymentResultModal from './components/PaymentResultModal';
import { FoodItem } from './types';
import { apiService, User, FoodAnalysisResponse } from './services/apiService';

type ViewState = 'dashboard' | 'analysis' | 'chat' | 'settings' | 'subscription';
type AppState = 'SPLASH' | 'ONBOARDING' | 'LOGIN' | 'VERIFICATION' | 'ADDITIONAL_INFO' | 'PLAN_GENERATION' | 'PLAN_SUMMARY' | 'MAIN';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('SPLASH');
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  // Move skip-splash logic to useEffect to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const hasPayment = searchParams.get('payment') || hashParams.get('payment');

      if (hasPayment) {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const hasCompletedInfo = localStorage.getItem('hasCompletedAdditionalInfo') === 'true';
        if (isLoggedIn) {
          setAppState(hasCompletedInfo ? 'MAIN' : 'ADDITIONAL_INFO');
        }
      }

      // Track App Open
      const trackOpen = async () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
          const ua = navigator.userAgent;
          let platform: 'web' | 'android' | 'ios' = 'web';

          if (ua.includes('Loqme Flutter WebView')) {
            if (/iPhone|iPad|iPod/i.test(ua)) {
              platform = 'ios';
            } else {
              platform = 'android';
            }
          }

          await apiService.trackAppOpen(platform);
        }
      };

      trackOpen();
    }
  }, []);

  // Navigation history management
  const navigateToView = useCallback((view: ViewState) => {
    if (view !== 'dashboard') {
      // Push a new history state when navigating away from dashboard
      window.history.pushState({ view }, '', `#${view}`);
    }
    setCurrentView(view);
  }, []);

  const navigateBack = useCallback(() => {
    // Go back to dashboard
    setCurrentView('dashboard');
  }, []);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // When user presses back button, check the state
      if (event.state?.view) {
        // Navigate to the view in history state
        setCurrentView(event.state.view);
      } else {
        // If no state (at dashboard), stay at dashboard
        // Push a state to prevent closing the app
        if (currentView !== 'dashboard') {
          setCurrentView('dashboard');
        } else {
          // Push an empty state to prevent app from closing
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Initialize: Push initial state to prevent immediate back-close
    if (typeof window !== 'undefined') {
      // Replace current state with our app state - PRESERVE search params and hash!
      const fullUrl = window.location.pathname + window.location.search + window.location.hash;
      window.history.replaceState({ view: 'dashboard' }, '', fullUrl);
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentView]);

  // Auth State
  const [phoneNumber, setPhoneNumber] = useState('');

  // State for Food Detail Modal
  const [selectedFood, setSelectedFood] = useState<any>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

  // State for dashboard refresh
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  // Payment result modal state
  const [paymentResult, setPaymentResult] = useState<{
    isOpen: boolean;
    status: 'success' | 'failed' | 'cancelled' | 'error';
    refId?: string;
    errorCode?: string;
  }>({ isOpen: false, status: 'success' });

  // Global Notification (Snackbar)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle payment callback from Zarinpal
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Try reading from Query Params first, then Hash Fragment
    let urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('payment') && window.location.hash) {
      // Parse hash (remove # first)
      urlParams = new URLSearchParams(window.location.hash.substring(1));
    }

    const paymentStatus = urlParams.get('payment');
    const refId = urlParams.get('refId');
    const errorCode = urlParams.get('code');

    console.log('🔗 Full URL:', window.location.href);
    console.log('🔗 Search string:', window.location.search);
    console.log('� Hash fragment:', window.location.hash);
    console.log('�🔍 Payment callback check:', { paymentStatus, refId, errorCode, appState });

    if (paymentStatus) {
      console.log('✅ Payment param detected, showing modal...');

      if (paymentStatus === 'success') {
        setPaymentResult({
          isOpen: true,
          status: 'success',
          refId: refId || undefined,
        });
        // Navigate to dashboard
        setCurrentView('dashboard');
      } else if (paymentStatus === 'cancelled') {
        setPaymentResult({
          isOpen: true,
          status: 'cancelled',
        });
        setCurrentView('subscription');
      } else if (paymentStatus === 'failed') {
        setPaymentResult({
          isOpen: true,
          status: 'failed',
          errorCode: errorCode || undefined,
        });
        setCurrentView('subscription');
      } else if (paymentStatus === 'error') {
        setPaymentResult({
          isOpen: true,
          status: 'error',
        });
        setCurrentView('subscription');
      }

      // Delay URL cleanup to ensure state updates complete
      setTimeout(() => {
        console.log('🧹 Cleaning up URL parameters...');
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 2000);
    }
  }, []);

  const handleSplashFinish = () => {
    const hasOnboarded = localStorage.getItem('hasOnboarded');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const hasCompletedInfo = localStorage.getItem('hasCompletedAdditionalInfo') === 'true';

    if (isLoggedIn) {
      if (hasCompletedInfo) {
        setAppState('MAIN');
      } else {
        setAppState('ADDITIONAL_INFO');
      }
    } else if (hasOnboarded) {
      setAppState('LOGIN');
    } else {
      setAppState('ONBOARDING');
    }
  };

  const handleOnboardingFinish = () => {
    localStorage.setItem('hasOnboarded', 'true');
    setAppState('LOGIN');
  };

  const handleLoginSubmit = (phone: string) => {
    setPhoneNumber(phone);
    setAppState('VERIFICATION');
  };

  const handleVerificationSubmit = (user: User) => {
    localStorage.setItem('isLoggedIn', 'true');
    // Save completion status
    if (user.hasCompletedAdditionalInfo) {
      localStorage.setItem('hasCompletedAdditionalInfo', 'true');
      setAppState('MAIN');
    } else {
      localStorage.setItem('hasCompletedAdditionalInfo', 'false');
      setAppState('ADDITIONAL_INFO');
    }
  };

  const handleAdditionalInfoFinish = () => {
    // After additional info, go to plan generation
    setAppState('PLAN_GENERATION');
  };

  const handlePlanGenerationComplete = () => {
    // After plan generation, show the summary
    setAppState('PLAN_SUMMARY');
  };

  const handlePlanSummaryComplete = async () => {
    try {
      await apiService.markAdditionalInfoCompleted();
      localStorage.setItem('hasCompletedAdditionalInfo', 'true');
      localStorage.setItem('hasGeneratedPlan', 'true');
      setAppState('MAIN');
    } catch (error: any) {
      console.error('Failed to mark additional info as completed:', error);
      if (error.message && error.message.includes('incomplete')) {
        alert('اطلاعات شما کامل نیست. لطفاً مجدداً تلاش کنید.');
        setAppState('ADDITIONAL_INFO');
      } else {
        alert('خطا در ذخیره وضعیت. لطفاً مجدداً تلاش کنید.');
      }
    }
  };

  const handleAddFood = (analysis: FoodAnalysisResponse, image?: string) => {
    // Trigger dashboard refresh
    setDashboardRefreshTrigger(prev => prev + 1);
    console.log('Food added:', analysis.title);
  };

  // Pending Analysis State
  const [pendingAnalyses, setPendingAnalyses] = useState<{
    id: string;
    image?: string;
    type: 'image' | 'text';
    startTime: number;
  }[]>([]);

  const handleStartAnalysis = async (imageFile: File | null, textInput: string | null, previewImage: string | null) => {
    const tempId = Date.now().toString();

    // 1. Add to pending list
    setPendingAnalyses(prev => [{
      id: tempId,
      image: previewImage || undefined,
      type: imageFile ? 'image' : 'text',
      startTime: Date.now()
    }, ...prev]);

    // 2. Perform Analysis & Add in Background
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // A. Analyze (Backend automatically adds the item)
      if (imageFile) {
        await apiService.analyzeFoodImage(imageFile, dateStr);
      } else if (textInput) {
        await apiService.analyzeFoodText(textInput, dateStr);
      } else {
        throw new Error("No input");
      }

      // B. Refresh & Remove Pending
      setDashboardRefreshTrigger(prev => prev + 1);
      setPendingAnalyses(prev => prev.filter(p => p.id !== tempId));

    } catch (error: any) {
      console.error("Background analysis failed:", error);

      const errorMessage = error.message || "متاسفانه تحلیل غذا با خطا مواجه شد.";

      // Show notification for all errors
      showNotification(errorMessage, 'error');

      // Check if error is related to subscription limits - navigate to subscription page
      if (errorMessage.includes('محدودیت') || errorMessage.includes('limit') || errorMessage.includes('اشتراک') || errorMessage.includes('رایگان')) {
        navigateToView('subscription');
      }

      setPendingAnalyses(prev => prev.filter(p => p.id !== tempId));
    }
  };

  const handleAddExercise = (calories: number) => {
    // Trigger dashboard refresh
    setDashboardRefreshTrigger(prev => prev + 1);
    console.log('Exercise added:', calories, 'calories burned');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    // localStorage.removeItem('hasOnboarded'); // Keep onboarding status
    setAppState('LOGIN');
    navigateToView('dashboard');
  };

  if (appState === 'SPLASH') {
    return <Splash onFinish={handleSplashFinish} />;
  }

  if (appState === 'ONBOARDING') {
    return <Onboarding onFinish={handleOnboardingFinish} />;
  }

  if (appState === 'LOGIN') {
    return <Login onPhoneSubmit={handleLoginSubmit} />;
  }

  if (appState === 'ADDITIONAL_INFO') {
    return <AdditionalInfo onFinish={handleAdditionalInfoFinish} />;
  }

  if (appState === 'PLAN_GENERATION') {
    return <PlanGeneration onComplete={handlePlanGenerationComplete} />;
  }

  if (appState === 'PLAN_SUMMARY') {
    return <PlanSummary onComplete={handlePlanSummaryComplete} />;
  }

  if (appState === 'VERIFICATION') {
    return (
      <Verification
        phoneNumber={phoneNumber}
        onBack={() => setAppState('LOGIN')}
        onVerify={handleVerificationSubmit}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8F9FB] flex flex-col relative overflow-hidden shadow-2xl sm:rounded-[40px] sm:my-8 sm:border-[8px] sm:border-gray-900 pb-28">

      {currentView === 'dashboard' && (
        <Dashboard
          setIsModalOpen={setIsModalOpen}
          setIsExerciseModalOpen={setIsExerciseModalOpen}
          onFoodClick={setSelectedFood}
          refreshTrigger={dashboardRefreshTrigger}
          pendingAnalyses={pendingAnalyses}
          onSubscriptionClick={() => navigateToView('subscription')}
        />
      )}

      {currentView === 'analysis' && (
        <AnalysisPage />
      )}

      {currentView === 'chat' && (
        <ChatPage
          onBack={() => setCurrentView('dashboard')}
          onSubscriptionClick={() => navigateToView('subscription')}
        />
      )}

      {currentView === 'subscription' && (
        <SubscriptionPage onBack={() => setCurrentView('dashboard')} />
      )}

      {currentView === 'settings' && (
        <SettingPage
          onLogout={handleLogout}
          onSubscriptionClick={() => navigateToView('subscription')}
        />
      )}

      <AddFoodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddFood={handleAddFood}
        onStartAnalysis={handleStartAnalysis}
      />

      <AddExerciseModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onAddExercise={handleAddExercise}
      />

      <FoodDetailModal
        food={selectedFood}
        onClose={() => {
          setSelectedFood(null);
          // Refresh dashboard data in background
          setDashboardRefreshTrigger(prev => prev + 1);
        }}
      />

      <PaymentResultModal
        isOpen={paymentResult.isOpen}
        onClose={() => setPaymentResult(prev => ({ ...prev, isOpen: false }))}
        status={paymentResult.status}
        refId={paymentResult.refId}
        errorCode={paymentResult.errorCode}
      />

      {/* Modern Floating Navigation - Hidden when in Chat or Subscription view */}
      {currentView !== 'chat' && currentView !== 'subscription' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-[calc(100%-3rem)] bg-white h-20 rounded-[32px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between px-2 z-30">

          <div className="flex-1 flex justify-center">
            <button
              onClick={() => navigateToView('dashboard')}
              className={`flex flex-col items-center justify-center h-full w-full rounded-[24px] transition-all duration-300 group ${currentView === 'dashboard' ? '' : 'hover:bg-gray-50'}`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${currentView === 'dashboard' ? 'bg-orange-50 text-orange-500 -translate-y-1' : 'text-gray-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              {currentView === 'dashboard' && <span className="text-[10px] font-bold text-orange-500 mt-1 animate-fade-in">خانه</span>}
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            <button
              onClick={() => navigateToView('analysis')}
              className={`flex flex-col items-center justify-center h-full w-full rounded-[24px] transition-all duration-300 group ${currentView === 'analysis' ? '' : 'hover:bg-gray-50'}`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${currentView === 'analysis' ? 'bg-blue-50 text-blue-500 -translate-y-1' : 'text-gray-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              {currentView === 'analysis' && <span className="text-[10px] font-bold text-blue-500 mt-1 animate-fade-in">تحلیل</span>}
            </button>
          </div>

          {/* Center FAB - integrated in navbar */}
          <div className="flex-1 flex justify-center items-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center shadow-lg shadow-gray-900/20 hover:scale-105 active:scale-95 transition-all duration-300 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            <button
              onClick={() => navigateToView('chat')}
              className="flex flex-col items-center justify-center h-full w-full rounded-[24px] transition-all duration-300 group hover:bg-gray-50"
            >
              <div className="p-2 rounded-xl transition-all duration-300 text-gray-300 hover:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            <button
              onClick={() => navigateToView('settings')}
              className={`flex flex-col items-center justify-center h-full w-full rounded-[24px] transition-all duration-300 group ${currentView === 'settings' ? '' : 'hover:bg-gray-50'}`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${currentView === 'settings' ? 'bg-purple-50 text-purple-500 -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {currentView === 'settings' && <span className="text-[10px] font-bold text-purple-500 mt-1 animate-fade-in">پروفایل</span>}
            </button>
          </div>
        </div>
      )}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-2xl shadow-2xl z-[100] animate-fade-in flex items-start gap-3 border border-gray-700/50">
          <div className={`mt-0.5 ${notification.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {notification.type === 'error' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-xs font-medium leading-relaxed opacity-90">{notification.message}</p>
        </div>
      )}
    </div>
  );
}
