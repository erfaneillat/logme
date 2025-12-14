"use client";

import React, { useState } from 'react';
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
import { FoodItem } from './types';
import { apiService, User, FoodAnalysisResponse } from './services/apiService';

type ViewState = 'dashboard' | 'analysis' | 'chat' | 'settings' | 'subscription';
type AppState = 'SPLASH' | 'ONBOARDING' | 'LOGIN' | 'VERIFICATION' | 'ADDITIONAL_INFO' | 'PLAN_GENERATION' | 'PLAN_SUMMARY' | 'MAIN';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('SPLASH');
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  // Auth State
  const [phoneNumber, setPhoneNumber] = useState('');

  // State for Food Detail Modal
  const [selectedFood, setSelectedFood] = useState<any>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

  // State for dashboard refresh
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  // Global Notification (Snackbar)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

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

      const errorMessage = error.message || "";

      // Check if error is related to limits
      if (errorMessage.includes('محدودیت') || errorMessage.includes('limit') || errorMessage.includes('اشتراک') || errorMessage.includes('رایگان')) {
        showNotification(errorMessage, 'error');
        setCurrentView('subscription');
      } else {
        alert("متاسفانه تحلیل غذا با خطا مواجه شد.");
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
    setCurrentView('dashboard');
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
          onSubscriptionClick={() => setCurrentView('subscription')}
        />
      )}

      {currentView === 'analysis' && (
        <AnalysisPage />
      )}

      {currentView === 'chat' && (
        <ChatPage
          onBack={() => setCurrentView('dashboard')}
          onSubscriptionClick={() => setCurrentView('subscription')}
        />
      )}

      {currentView === 'subscription' && (
        <SubscriptionPage onBack={() => setCurrentView('dashboard')} />
      )}

      {currentView === 'settings' && (
        <SettingPage onLogout={handleLogout} />
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

      {/* Modern Floating Navigation - Hidden when in Chat or Subscription view */}
      {currentView !== 'chat' && currentView !== 'subscription' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-[calc(100%-3rem)] bg-white h-20 rounded-[32px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between px-2 z-30">

          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setCurrentView('dashboard')}
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
              onClick={() => setCurrentView('analysis')}
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
              onClick={() => setCurrentView('chat')}
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
              onClick={() => setCurrentView('settings')}
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
