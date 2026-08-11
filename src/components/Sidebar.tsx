import React from 'react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  userRole: string;
}

export default function Sidebar({ isOpen, activeMenu, setActiveMenu, userRole }: SidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Hapus cookie auth_token
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  return (
    <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
      <div className="flex items-center justify-center h-20 border-b border-gray-100">
         <div className="relative w-12 h-12 mr-3 animate-blob">
            <div className="absolute inset-0 bg-red-100 rounded-full blur-md"></div>
            <img src="/logo.png" alt="Logo PAC" className="relative z-10 w-full h-full object-contain drop-shadow-md" />
         </div>
         <h1 className="text-xl font-bold text-red-700 tracking-tight">PAC KWT</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {/* BERANDA */}
        <button onClick={() => setActiveMenu('beranda')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'beranda' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
          <span className="material-icons mr-3 text-lg">dashboard</span> Beranda
        </button>
        
        {/* DATA ANGGOTA */}
        <button onClick={() => setActiveMenu('data_anggota')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'data_anggota' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
          <span className="material-icons mr-3 text-lg">group</span> Data Anggota
        </button>

        {/* STRUKTUR ORGANISASI */}
        <button onClick={() => setActiveMenu('struktur_organisasi')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'struktur_organisasi' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
          <span className="material-icons mr-3 text-lg">account_tree</span> Struktur Organisasi
        </button>

        {/* ADMIN SECTION */}
        {(userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Editor') && (
          <>
            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Keuangan</p>
            </div>
            <button onClick={() => setActiveMenu('kas_organisasi')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'kas_organisasi' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
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
            <button onClick={() => setActiveMenu('log_aktivitas')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'log_aktivitas' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
              <span className="material-icons mr-3 text-lg">history</span> Log Aktivitas
            </button>
            <button onClick={() => setActiveMenu('manajemen_akun')} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeMenu === 'manajemen_akun' ? 'active-menu' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>
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
  );
}
