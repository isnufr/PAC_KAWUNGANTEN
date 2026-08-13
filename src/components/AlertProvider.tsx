"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertContextProps {
  showAlert: (message: string, type?: AlertType) => void;
  showConfirm: (message: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within AlertProvider');
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [toastConfig, setToastConfig] = useState<{ id: number; message: string; type: AlertType } | null>(null);
  
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const showAlert = useCallback((message: string, type: AlertType = 'info') => {
    const id = Date.now();
    setToastConfig({ id, message, type });
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToastConfig((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  }, []);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmConfig({
        isOpen: true,
        message,
        onConfirm: () => {
          setConfirmConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmConfig(null);
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {/* Toast Notification (Modern & Premium, Floating Top) */}
      {toastConfig && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] px-4 w-full max-w-sm pointer-events-none animate-in slide-in-from-top-10 fade-in duration-300">
          <div className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl shadow-xl border-l-4 bg-white/95 backdrop-blur-md ${
            toastConfig.type === 'success' ? 'border-emerald-500 shadow-emerald-500/10' : 
            toastConfig.type === 'error' ? 'border-red-500 shadow-red-500/10' : 
            toastConfig.type === 'warning' ? 'border-amber-500 shadow-amber-500/10' : 
            'border-blue-500 shadow-blue-500/10'
          }`}>
             {/* Icon */}
             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
               toastConfig.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
               toastConfig.type === 'error' ? 'bg-red-100 text-red-600' : 
               toastConfig.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
               'bg-blue-100 text-blue-600'
             }`}>
                <span className="material-icons text-[20px]">
                  {toastConfig.type === 'success' ? 'check_circle' : 
                   toastConfig.type === 'error' ? 'error' : 
                   toastConfig.type === 'warning' ? 'warning' : 'info'}
                </span>
             </div>
             {/* Message */}
             <div className="flex-1">
               <h4 className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
                 toastConfig.type === 'success' ? 'text-emerald-700' : 
                 toastConfig.type === 'error' ? 'text-red-700' : 
                 toastConfig.type === 'warning' ? 'text-amber-700' : 
                 'text-blue-700'
               }`}>
                 {toastConfig.type === 'success' ? 'Berhasil' : 
                  toastConfig.type === 'error' ? 'Gagal' : 
                  toastConfig.type === 'warning' ? 'Peringatan' : 'Info'}
               </h4>
               <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-tight">
                 {toastConfig.message}
               </p>
             </div>
          </div>
        </div>
      )}

      {/* Confirm Popup */}
      {confirmConfig && confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[320px] sm:max-w-sm overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col items-center p-6 sm:p-8 text-center">
             <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 sm:mb-5 bg-amber-50 text-amber-500 shadow-inner">
                <span className="material-icons text-4xl sm:text-5xl">help_outline</span>
             </div>
             <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-2 tracking-tight">KONFIRMASI</h3>
             <p className="text-sm text-slate-500 font-semibold mb-6 sm:mb-8 leading-relaxed">{confirmConfig.message}</p>
             
             <div className="flex w-full gap-3 sm:gap-4">
               <button onClick={confirmConfig.onCancel} className="flex-1 py-3 sm:py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition transform active:scale-95 text-sm sm:text-base">
                 BATAL
               </button>
               <button onClick={confirmConfig.onConfirm} className="flex-1 py-3 sm:py-3.5 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition transform active:scale-95 text-sm sm:text-base">
                 YAKIN
               </button>
             </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
