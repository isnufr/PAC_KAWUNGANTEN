import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  userRole: string;
  onClose: () => void;
}

export default function Sidebar({ isOpen, activeMenu, setActiveMenu, userRole, onClose }: SidebarProps) {
  const router = useRouter();
  const [verificationCount, setVerificationCount] = useState(0);

  useEffect(() => {
    // Fetch verification count
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.verification) {
          const { tidakLengkap, nikGanda } = data.data.verification;
          setVerificationCount(tidakLengkap + nikGanda);
        }
      })
      .catch(console.error);
  }, []);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Hapus cookie auth_token
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu);
    router.push(`/?menu=${menu}`);
    // Auto-close sidebar on mobile
    onClose();
  };

  return (
    <>
      {/* Overlay / Backdrop — only visible on mobile when sidebar is open */}
      <div 
        className={`sidebar-overlay md:hidden ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside 
        id="sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col
          transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Header with close button on mobile */}
        <div className="flex items-center justify-between h-20 border-b border-gray-100 px-4">
          <div className="flex items-center">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 mr-3 flex-shrink-0">
              {/* Removed the background blur for transparency */}
              <img src="/logo.png" alt="Logo PAC" className="relative z-10 w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[10px] sm:text-xs font-black text-red-700 tracking-tight uppercase leading-none mb-0.5">Pimpinan Anak Cabang</h1>
              <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-widest uppercase leading-none">Kawunganten</h2>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Tutup sidebar"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* DASHBOARD */}
          <button onClick={() => handleMenuClick('beranda')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'beranda' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
            <span className="material-icons mr-3 text-lg">dashboard</span> Dashboard
          </button>
          
          {/* VERIFIKASI DATA */}
          <button onClick={() => handleMenuClick('verifikasi_data')} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'verifikasi_data' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
            <div className="flex items-center">
               <span className="material-icons mr-3 text-lg">fact_check</span> Verifikasi Data
            </div>
            {verificationCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{verificationCount}</span>
            )}
          </button>
          
          {/* DATA ANGGOTA */}
          <button onClick={() => handleMenuClick('data_anggota')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'data_anggota' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
            <span className="material-icons mr-3 text-lg">group</span> Data Anggota
          </button>

          {/* STRUKTUR ORGANISASI */}
          <button onClick={() => handleMenuClick('struktur_organisasi')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'struktur_organisasi' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
            <span className="material-icons mr-3 text-lg">account_tree</span> Struktur Organisasi
          </button>

          {/* EXPORT LAPORAN */}
          <button onClick={() => handleMenuClick('laporan')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'laporan' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
            <span className="material-icons mr-3 text-lg">assignment_turned_in</span> Export Laporan
          </button>

          {/* ADMIN SECTION */}
          {(userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Editor') && (
            <>
              <div className="pt-4 pb-2 px-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Keuangan</p>
              </div>
              <button onClick={() => handleMenuClick('kas_organisasi')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'kas_organisasi' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
                <span className="material-icons mr-3 text-lg">account_balance_wallet</span> Kas Organisasi
              </button>
            </>
          )}

          {/* SUPER ADMIN / EDITOR SECTION */}
          {(userRole === 'Super Admin' || userRole === 'Editor') && (
            <>
              <div className="pt-4 pb-2 px-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sistem</p>
              </div>
              <button onClick={() => handleMenuClick('log_aktivitas')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'log_aktivitas' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
                <span className="material-icons mr-3 text-lg">history</span> Log Aktivitas
              </button>
              <button onClick={() => handleMenuClick('manajemen_akun')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'manajemen_akun' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
                <span className="material-icons mr-3 text-lg">manage_accounts</span> Manajemen Akun
              </button>
            </>
          )}

        </div>
        
        {/* FOOTER SIDEBAR */}
        <div className="p-4 border-t border-gray-100">
          <button className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  onClick={handleLogout}>
            <span className="material-icons mr-2">logout</span> Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
