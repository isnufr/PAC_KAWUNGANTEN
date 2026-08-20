"use client";

import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Tampilkan splash screen selama 2.5 detik lalu mulai fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Tunggu transisi fade selesai (500ms) sebelum komponen di-unmount
      setTimeout(() => {
        onFinish();
      }, 500); 
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#121212] flex flex-col justify-between items-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950 via-red-900 to-red-950" />
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />
      
      {/* Floating decorative orbs */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-red-600/20 rounded-full blur-3xl splash-orb-1" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-red-800/15 rounded-full blur-3xl splash-orb-2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-700/10 rounded-full blur-3xl splash-orb-3" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 h-full w-full">
        
        {/* Logo with glow */}
        <div className="relative splash-logo">
          {/* Glow behind logo */}
          <div className="absolute inset-0 scale-125 bg-red-500/20 rounded-3xl blur-2xl splash-glow" />
          
          {/* Logo container */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Logo PAC Kawunganten" 
              className="w-full h-full object-contain drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}
            />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="mt-8 text-center splash-text">
          <h1 className="text-white/90 text-lg sm:text-xl font-extrabold tracking-wide" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            Selamat Datang di
          </h1>
          <h2 className="text-yellow-400/90 text-2xl sm:text-3xl font-black tracking-widest uppercase mt-1" style={{ textShadow: '0 2px 16px rgba(234,179,8,0.3)' }}>
            Kandang Banteng
          </h2>
          <p className="text-red-200/60 text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase mt-3 mb-10">
            PAC Kawunganten
          </p>
        </div>

        {/* Premium Loading Animation */}
        <div className="mt-6 flex flex-col items-center splash-loader">
          {/* Orbital rings */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-red-400/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-400 border-r-yellow-400/50 animate-spin" style={{ animationDuration: '1.5s' }} />
            
            {/* Inner ring — counter-rotate */}
            <div className="absolute inset-2 sm:inset-3 rounded-full border-2 border-red-400/10" />
            <div className="absolute inset-2 sm:inset-3 rounded-full border-2 border-transparent border-b-red-300 border-l-red-300/50 splash-spin-reverse" />
            
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-yellow-400 rounded-full splash-pulse-dot" style={{ boxShadow: '0 0 12px rgba(234,179,8,0.6)' }} />
            </div>
          </div>

          {/* Loading dots */}
          <div className="flex items-center gap-1.5 mt-5">
            <div className="w-1.5 h-1.5 bg-red-300/70 rounded-full splash-dot splash-dot-1" />
            <div className="w-1.5 h-1.5 bg-red-300/70 rounded-full splash-dot splash-dot-2" />
            <div className="w-1.5 h-1.5 bg-red-300/70 rounded-full splash-dot splash-dot-3" />
          </div>
        </div>

      </div>

    </div>
  );
}
