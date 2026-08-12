import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  userRole: string;
  userName: string;
  onClose: () => void;
}

export default function Sidebar({ isOpen, activeMenu, setActiveMenu, userRole, userName, onClose }: SidebarProps) {
  const router = useRouter();
  const [verificationCount, setVerificationCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    if (menu === activeMenu) return; // Already on this menu, skip
    setActiveMenu(menu);
    // Use replaceState to update URL without triggering Next.js navigation overhead
    window.history.replaceState(null, '', `/?menu=${menu}`);
    // Auto-close sidebar on mobile
    onClose();
  };

  // Get user initials for avatar
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'U';

  // Format role label color
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'bg-red-600 text-white';
      case 'Admin': return 'bg-amber-500 text-white';
      case 'Editor': return 'bg-blue-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
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
        
        {/* FOOTER SIDEBAR — User Card + Logout */}
        <div className="border-t border-gray-100">
          {/* User Info Card */}
          <div className="p-3">
            <div className="bg-gradient-to-br from-slate-50 to-red-50/50 rounded-2xl p-3 border border-red-100/60">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-200">
                    {userInitial}
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                
                {/* User details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate leading-tight">{userName || 'User'}</p>
                  <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase ${getRoleBadge(userRole)}`}>
                    {userRole}
                  </span>
                </div>

                {/* Logout button */}
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-red-500 hover:text-red-700 transition-all active:scale-95"
                  title="Keluar"
                >
                  <span className="material-icons text-[18px]">logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Logout Confirmation */}
          {showLogoutConfirm && (
            <div className="px-3 pb-3 -mt-1">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2.5">
                <p className="text-[11px] font-bold text-red-700 text-center">Yakin ingin keluar dari sistem?</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)} 
                    className="flex-1 py-2 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleLogout} 
                    className="flex-1 py-2 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    <span className="material-icons text-[14px]">logout</span> Keluar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
