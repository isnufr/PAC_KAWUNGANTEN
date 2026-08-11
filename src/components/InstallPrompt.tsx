"use client";

import React, { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Check if already dismissed or installed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    if (dismissed || isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      // Delay showing banner so it doesn't appear immediately on load
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPromptRef.current) return;

    try {
      await deferredPromptRef.current.prompt();
      const choice = await deferredPromptRef.current.userChoice;
      if (choice.outcome === 'accepted') {
        closeBanner();
      }
    } catch {
      // User cancelled or error
    }
    deferredPromptRef.current = null;
  };

  const closeBanner = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowBanner(false);
      setIsExiting(false);
      localStorage.setItem('pwa-install-dismissed', 'true');
    }, 300);
  };

  if (!showBanner) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[200] px-3 pb-3 sm:px-4 sm:pb-4 ${isExiting ? 'install-banner-exit' : 'install-banner-enter'}`}>
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.15)] border border-red-100 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
            <span className="material-icons text-white text-xl">install_mobile</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 leading-tight">Install Aplikasi PAC KWT</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Akses lebih cepat langsung dari home screen</p>
          </div>

          {/* Close */}
          <button
            onClick={closeBanner}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 -mt-1 -mr-1 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Tutup"
          >
            <span className="material-icons text-lg">close</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={closeBanner}
            className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Nanti Saja
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 shadow-md shadow-red-200 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <span className="material-icons text-sm">download</span>
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
