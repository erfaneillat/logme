"use client";

import React, { useState, useCallback, useEffect } from 'react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  overlay: React.ReactNode;
  gradient: string;
}

// Weight Goal Overlay Component
const WeightGoalOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`absolute top-8 right-6 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
      }`}
    >
      <div className="backdrop-blur-xl bg-black/40 rounded-3xl p-5 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-white/80 text-sm">هدف وزن</span>
        </div>
        <div className="text-4xl font-bold text-white animate-count">
          <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">60</span>
          <span className="text-lg text-white/60 mr-2">کیلوگرم</span>
        </div>
        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full animate-progress"
            style={{ width: '75%' }}
          />
        </div>
      </div>
    </div>
  );
};

// Camera Overlay Component
const CameraOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div 
        className={`relative transition-all duration-700 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        {/* Scanning Lines Animation */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 animate-scan-line bg-gradient-to-b from-transparent via-orange-500/30 to-transparent" />
        </div>
        
        {/* Corner Brackets */}
        <div className="w-56 h-56 relative">
          {/* Top Left */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-orange-400 rounded-tl-2xl animate-pulse" />
          {/* Top Right */}
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-orange-400 rounded-tr-2xl animate-pulse" style={{ animationDelay: '0.2s' }} />
          {/* Bottom Left */}
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-orange-400 rounded-bl-2xl animate-pulse" style={{ animationDelay: '0.4s' }} />
          {/* Bottom Right */}
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-orange-400 rounded-br-2xl animate-pulse" style={{ animationDelay: '0.6s' }} />
          
          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 backdrop-blur-sm flex items-center justify-center animate-bounce-slow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* AI Badge */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-yellow-500 px-4 py-2 rounded-full shadow-lg">
          <span className="text-white text-sm font-bold">AI تشخیص هوشمند</span>
        </div>
      </div>
    </div>
  );
};

// Nutrition Overlay Component
const NutritionOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const nutrients = [
    { label: 'پروتئین', value: '35g', color: 'from-red-400 to-red-600', position: 'top-8 right-6', delay: '0s' },
    { label: 'کربوهیدرات', value: '45g', color: 'from-amber-400 to-orange-500', position: 'top-24 right-28', delay: '0.15s' },
    { label: 'چربی', value: '12g', color: 'from-blue-400 to-blue-600', position: 'top-8 left-6', delay: '0.3s' },
  ];

  return (
    <>
      {nutrients.map((nutrient, index) => (
        <div
          key={index}
          className={`absolute ${nutrient.position} transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
          }`}
          style={{ transitionDelay: nutrient.delay }}
        >
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl p-4 border border-white/10 shadow-xl hover:scale-105 transition-transform">
            <div className={`text-sm font-medium bg-gradient-to-r ${nutrient.color} bg-clip-text text-transparent mb-1`}>
              {nutrient.label}
            </div>
            <div className="text-2xl font-bold text-white">{nutrient.value}</div>
          </div>
        </div>
      ))}
      
      {/* Center Calorie Ring */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
        style={{ transitionDelay: '0.5s' }}
      >
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-white/10"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
            />
            <circle
              className="text-orange-500"
              strokeWidth="8"
              strokeDasharray={`${70 * 2.64} ${100 * 2.64}`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
              style={{ animation: 'draw-circle 1s ease-out forwards' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">450</span>
            <span className="text-xs text-white/60">کالری</span>
          </div>
        </div>
      </div>
    </>
  );
};

const slides: OnboardingSlide[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop',
    title: 'به هدف تناسب اندام برسید',
    subtitle: 'با برنامه غذایی هوشمند و شخصی‌سازی شده، به وزن ایده‌آل خود دست پیدا کنید',
    overlay: <WeightGoalOverlay />,
    gradient: 'from-purple-900/80 via-purple-900/40 to-transparent',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop',
    title: 'عکس بگیرید، کالری بشمارید',
    subtitle: 'با هوش مصنوعی پیشرفته، فقط با یک عکس از غذا، تمام اطلاعات تغذیه‌ای را دریافت کنید',
    overlay: <CameraOverlay />,
    gradient: 'from-blue-900/80 via-blue-900/40 to-transparent',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    title: 'تغذیه هوشمند با تحلیل دقیق',
    subtitle: 'پروتئین، کربوهیدرات و چربی هر وعده را به صورت دقیق محاسبه و پیگیری کنید',
    overlay: <NutritionOverlay />,
    gradient: 'from-orange-900/80 via-orange-900/40 to-transparent',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [currentSlide, isTransitioning]);

  const goToNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  }, [currentSlide, goToSlide, onComplete]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSlide < slides.length - 1) {
        goToSlide(currentSlide + 1);
      } else if (diff < 0 && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    }
    setTouchStart(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#0f0f1a] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image with Transition */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${slide.gradient}`} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />
          </div>
        ))}
      </div>

      {/* Dynamic Overlay Content */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {index === currentSlide && slide.overlay}
          </div>
        ))}
      </div>

      {/* Content Card */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a] to-transparent pt-20 pb-8 px-6">
          {/* Text Content */}
          <div className="text-center mb-8">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`transition-all duration-500 ${
                  index === currentSlide 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-10 absolute inset-x-0'
                }`}
              >
                {index === currentSlide && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-4 leading-relaxed">
                      {slide.title}
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed max-w-sm mx-auto">
                      {slide.subtitle}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide 
                    ? 'w-8 h-3 bg-gradient-to-r from-orange-500 to-yellow-500' 
                    : 'w-3 h-3 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <button
              onClick={goToNext}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              {currentSlide === slides.length - 1 ? 'شروع کنید' : 'بعدی'}
            </button>
            
            {currentSlide < slides.length - 1 && (
              <button
                onClick={onComplete}
                className="w-full py-4 rounded-2xl text-white/60 font-medium hover:text-white/80 transition-colors"
              >
                رد شدن
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        @keyframes draw-circle {
          0% {
            stroke-dasharray: 0 264;
          }
          100% {
            stroke-dasharray: 185 264;
          }
        }

        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 75%;
          }
        }
        .animate-progress {
          animation: progress 1s ease-out forwards;
          animation-delay: 0.5s;
          width: 0%;
        }
      `}</style>
    </div>
  );
}
