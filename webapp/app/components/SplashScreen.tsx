"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '../translations';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(true);
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    // Show tagline after logo animation
    const taglineTimer = setTimeout(() => {
      setShowTagline(true);
    }, 800);

    // Complete splash after duration
    const completeTimer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(onComplete, 500); // Wait for fade out animation
    }, duration);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `rgba(255, 165, 0, ${Math.random() * 0.3 + 0.1})`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      {/* Glowing Ring Effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full animate-pulse-ring opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(255,165,0,0.4) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Logo Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with Scale and Glow Animation */}
        <div className="relative animate-logo-entry">
          {/* Glow Effect Behind Logo */}
          <div
            className="absolute inset-0 blur-3xl animate-glow"
            style={{
              background: 'radial-gradient(circle, rgba(255,165,0,0.6) 0%, rgba(255,120,0,0.3) 50%, transparent 100%)',
              transform: 'scale(1.5)',
            }}
          />

          {/* Logo */}
          <div className="relative animate-bounce-subtle">
            <Image
              src="/app/loqme_logo.png"
              alt={t('splash.appName')}
              width={140}
              height={140}
              className="drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* App Name */}
        <h1
          className={`text-5xl font-bold text-white mt-8 animate-title-entry`}
          style={{
            textShadow: '0 0 40px rgba(255,165,0,0.5), 0 0 80px rgba(255,165,0,0.3)',
          }}
        >
          {t('splash.appName')}
        </h1>

        {/* Tagline */}
        <p
          className={`text-gray-400 text-lg mt-4 transition-all duration-700 ${showTagline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          {t('splash.tagline')}
        </p>

        {/* Loading Indicator */}
        <div className="mt-12 flex items-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-orange-500 animate-bounce"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.6s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: 'linear-gradient(to top, rgba(255,165,0,0.1) 0%, transparent 100%)',
        }}
      />

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-30px) translateX(20px);
            opacity: 1;
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }

        @keyframes pulse-ring {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.5;
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 3s ease-in-out infinite;
        }

        @keyframes logo-entry {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-logo-entry {
          animation: logo-entry 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
          animation-delay: 0.8s;
        }

        @keyframes title-entry {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-title-entry {
          animation: title-entry 0.6s ease-out forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }

        @keyframes glow {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
