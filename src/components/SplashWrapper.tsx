"use client";

import React, { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Hanya tampilkan splash screen sekali setiap sesi buka tab
    const hasShown = sessionStorage.getItem('splash_shown');
    if (hasShown) {
      setShowSplash(false);
    }
  }, []);

  const handleFinish = () => {
    sessionStorage.setItem('splash_shown', 'true');
    setShowSplash(false);
  };

  return (
    <>
      {isClient && showSplash && <SplashScreen onFinish={handleFinish} />}
      {children}
    </>
  );
}
