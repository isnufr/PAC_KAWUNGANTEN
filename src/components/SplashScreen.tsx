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
      
      {/* Spacer Atas */}
      <div className="flex-1"></div>

      {/* Konten Utama */}
      <div className="flex flex-col items-center">
        {/* Logo */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 mb-8 relative rounded-full border border-red-900 shadow-[0_0_30px_rgba(220,38,38,0.15)] bg-red-950/30 overflow-hidden flex items-center justify-center p-3">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>

        {/* Judul Utama */}
        <h1 className="text-white text-lg sm:text-xl font-black tracking-[0.2em] uppercase mb-3 text-center drop-shadow-md">
          PDIP PAC KAWUNGANTEN
        </h1>

        {/* Subjudul */}
        <p className="text-slate-400/80 text-[10px] sm:text-xs font-light tracking-widest text-center mb-16 px-4">
          System Database dan Operasional
        </p>

        {/* Spinner Animasi */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 border-[3px] border-transparent border-t-red-600 rounded-full animate-spin"></div>
      </div>

      {/* Footer */}
      <div className="flex-1 flex flex-col justify-end pb-10">
        <p className="text-slate-500/40 text-[9px] sm:text-[10px] font-light tracking-widest text-center">
          Hak Cipta &copy; PAC PDI Perjuangan Kawunganten
        </p>
      </div>

    </div>
  );
}
