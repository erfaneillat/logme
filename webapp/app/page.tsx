"use client";

import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import AnalysisPage from './components/AnalysisPage';
import AddFoodModal from './components/AddFoodModal';
import FoodDetailModal from './components/FoodDetailModal';
import ChatPage from './components/ChatPage';
import SettingPage from './components/SettingPage';
import Splash from './components/Splash';
import Onboarding from './components/Onboarding';
import Login from './components/Login';
import Verification from './components/Verification';
import AdditionalInfo from './components/AdditionalInfo';
import PlanGeneration from './components/PlanGeneration';
import PlanSummary from './components/PlanSummary';
import { FoodItem, DailyGoals } from './types';
import { FoodAnalysisResult } from './services/geminiService';
import { apiService, User } from './services/apiService';

// Initial Mock Data
const INITIAL_GOALS: DailyGoals = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70,
};

const MOCK_FOODS: FoodItem[] = [
  {
    id: '1',
    name: '۸ عدد بال مرغ با سس گوجه',
    calories: 1250,
    protein: 68,
    carbs: 56,
    fat: 84,
    timestamp: new Date(new Date().setHours(11, 10)),
    imageUrl: 'https://images.unsplash.com/photo-1527477396000-64ca9c001733?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'سینی غذا با همبرگر، استیک و میوه',
    calories: 1132,
    protein: 62,
    carbs: 104,
    fat: 52,
    timestamp: new Date(new Date().setHours(11, 8)),
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'صبحانه با تخم‌مرغ، نان سبوس‌دار و گردو',
    calories: 328,
    protein: 20,
    carbs: 35,
    fat: 12,
    timestamp: new Date(new Date().setHours(10, 57)),
    imageUrl: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=200&auto=format&fit=crop'
  }
];

type ViewState = 'dashboard' | 'analysis' | 'chat' | 'settings';
type AppState = 'SPLASH' | 'ONBOARDING' | 'LOGIN' | 'VERIFICATION' | 'ADDITIONAL_INFO' | 'PLAN_GENERATION' | 'PLAN_SUMMARY' | 'MAIN';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('SPLASH');
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [goals] = useState<DailyGoals>(INITIAL_GOALS);
  const [foods, setFoods] = useState<FoodItem[]>(MOCK_FOODS);

  // Auth State
  const [phoneNumber, setPhoneNumber] = useState('');

  // State for Food Detail Modal
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // Calculate initial consumed from mock data
  const initialConsumed = MOCK_FOODS.reduce((acc, food) => ({
    calories: acc.calories + food.calories,
    protein: acc.protein + food.protein,
    carbs: acc.carbs + food.carbs,
    fat: acc.fat + food.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const [consumed, setConsumed] = useState(initialConsumed);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    } catch (error) {
      console.error('Failed to mark additional info as completed:', error);
    }
    localStorage.setItem('hasCompletedAdditionalInfo', 'true');
    localStorage.setItem('hasGeneratedPlan', 'true');
    setAppState('MAIN');
  };

  const handleAddFood = (analysis: FoodAnalysisResult, image?: string) => {
    const newFood: FoodItem = {
      id: Date.now().toString(),
      name: analysis.foodName,
      calories: analysis.estimatedCalories,
      protein: analysis.proteinGrams,
      carbs: analysis.carbsGrams,
      fat: analysis.fatGrams,
      timestamp: new Date(),
      imageUrl: image,
    };

    setFoods(prev => [newFood, ...prev]);
    setConsumed(prev => ({
      calories: prev.calories + newFood.calories,
      protein: prev.protein + newFood.protein,
      carbs: prev.carbs + newFood.carbs,
      fat: prev.fat + newFood.fat,
    }));
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
          goals={goals}
          consumed={consumed}
          foods={foods}
          setIsModalOpen={setIsModalOpen}
          onFoodClick={setSelectedFood}
        />
      )}

      {currentView === 'analysis' && (
        <AnalysisPage />
      )}

      {currentView === 'chat' && (
        <ChatPage onBack={() => setCurrentView('dashboard')} />
      )}

      {currentView === 'settings' && (
        <SettingPage onLogout={handleLogout} />
      )}

      <AddFoodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddFood={handleAddFood}
      />

      <FoodDetailModal
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
      />

      {/* Modern Floating Navigation - Hidden when in Chat view */}
      {currentView !== 'chat' && (
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

          {/* Center FAB */}
          <div className="w-16 relative flex justify-center items-end h-full">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(17,24,39,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 border-[6px] border-[#F8F9FB] group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
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
    </div>
  );
}
