import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ text = 'MEMUAT DATA...', fullScreen = false }: LoadingSpinnerProps) {
  const spinnerContent = (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 animate-in fade-in duration-500">
      <div className="relative">
        {/* Background track */}
        <div className="w-16 h-16 border-[4px] border-red-100 rounded-full"></div>
        {/* Spinning red segment */}
        <div className="w-16 h-16 border-[4px] border-transparent border-t-red-600 border-r-red-600 rounded-full animate-spin absolute top-0 left-0"></div>
        {/* Subtle inner glow */}
        <div className="absolute inset-2 bg-red-600/5 rounded-full blur-sm"></div>
      </div>
      <p className="text-xs md:text-sm font-black tracking-[0.2em] text-red-600 uppercase" style={{ textShadow: '0 2px 4px rgba(220,38,38,0.1)' }}>
        {text}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[300px] flex items-center justify-center">
      {spinnerContent}
    </div>
  );
}
