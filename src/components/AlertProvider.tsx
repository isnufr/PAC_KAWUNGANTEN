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
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; message: string; type: AlertType } | null>(null);
  
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const showAlert = useCallback((message: string, type: AlertType = 'info') => {
    setAlertConfig({ isOpen: true, message, type });
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

  const closeAlert = () => setAlertConfig(null);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {/* Alert Popup (Modern & Premium, Floating Center) */}
      {alertConfig && alertConfig.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[320px] sm:max-w-sm overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col items-center p-6 sm:p-8 text-center">
             {/* Icon */}
             <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 sm:mb-5 shadow-inner ${alertConfig.type === 'success' ? 'bg-emerald-50 text-emerald-500' : alertConfig.type === 'error' ? 'bg-red-50 text-red-500' : alertConfig.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                <span className="material-icons text-4xl sm:text-5xl">
                  {alertConfig.type === 'success' ? 'check_circle' : alertConfig.type === 'error' ? 'error' : alertConfig.type === 'warning' ? 'warning' : 'info'}
                </span>
             </div>
             {/* Message */}
             <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-2 tracking-tight">
                 {alertConfig.type === 'success' ? 'BERHASIL' : alertConfig.type === 'error' ? 'GAGAL' : alertConfig.type === 'warning' ? 'PERINGATAN' : 'INFORMASI'}
             </h3>
             <p className="text-sm text-slate-500 font-semibold mb-6 sm:mb-8 leading-relaxed">{alertConfig.message}</p>
             {/* Action */}
             <button onClick={closeAlert} className={`w-full py-3 sm:py-3.5 rounded-2xl font-bold text-white transition transform active:scale-95 text-sm sm:text-base ${alertConfig.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : alertConfig.type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : alertConfig.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30'} shadow-lg`}>
               MENGERTI
             </button>
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
