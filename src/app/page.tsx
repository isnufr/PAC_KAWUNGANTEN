"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import InstallPrompt from '@/components/InstallPrompt';
import DashboardView from '@/components/view/Dashboard';
import DataAnggotaView from '@/components/view/DataAnggota';
import StrukturOrganisasiView from '@/components/view/StrukturOrganisasi';
import KasOrganisasiView from '@/components/view/KasOrganisasi';
import LaporanView from '@/components/view/Laporan';
import ManajemenAkunView from '@/components/view/ManajemenAkun';
import LogAktivitasView from '@/components/view/LogAktivitas';
import AgendaView from '@/components/view/Agenda';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function DashboardContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchParams = useSearchParams();
  const initialMenu = searchParams?.get('menu') || 'beranda';
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [userRole, setUserRole] = useState('Viewer');
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      logout();
    } else {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user && user.role) {
          setUserRole(user.role);
        }
        if (user && user.username) {
          setUserName(user.username);
        }
        if (user && user.userPhoto) {
          setUserPhoto(user.userPhoto);
        }
      } catch (e) {}
      setIsReady(true);
    }
  }, [logout]);

  // Cek token expiry setiap 60 detik
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        logout();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [logout]);

  // Listener untuk global-add-action dari TopHeader pada menu non-native
  useEffect(() => {
    const handleGlobalAdd = () => {
      const nativeAddMenus = ['data_anggota', 'kas_organisasi', 'manajemen_akun', 'verifikasi_data'];
      if (!nativeAddMenus.includes(activeMenu)) {
        setActiveMenu('data_anggota');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('global-add-action'));
        }, 100);
      }
    };
    window.addEventListener('global-add-action', handleGlobalAdd);
    return () => window.removeEventListener('global-add-action', handleGlobalAdd);
  }, [activeMenu]);

  // Scroll main content to top on menu change to avoid layout shift from stale scroll position
  const mainRef = React.useRef<HTMLElement>(null);
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [activeMenu]);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  if (!isReady) return <LoadingSpinner fullScreen text="sedang menghubungkan ke Kandang Banteng..." />;

  return (
    <div className="bg-[#fafafa] text-slate-800 h-screen flex overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        userRole={userRole}
        userName={userName}
        userPhoto={userPhoto}
        onClose={closeSidebar}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopHeader 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
          activeMenu={activeMenu} 
          userRole={userRole}
        />

        <main ref={mainRef} className="flex-1 overflow-x-hidden overflow-y-auto bg-[#fafafa] p-3 sm:p-6 lg:p-8">
           {/* key={activeMenu} forces re-mount → triggers page-transition animation on each menu change */}
           <div key={activeMenu} className="page-transition max-w-7xl mx-auto">
             {activeMenu === 'beranda' && <DashboardView />}
             {activeMenu === 'verifikasi_data' && <DataAnggotaView filter="verifikasi" userRole={userRole} />}
             {activeMenu === 'data_anggota' && <DataAnggotaView filter={searchParams?.get('filter') || ''} userRole={userRole} />}
             {activeMenu === 'agenda' && <AgendaView userRole={userRole} />}
             {activeMenu === 'struktur_organisasi' && <StrukturOrganisasiView />}
             {activeMenu === 'kas_organisasi' && <KasOrganisasiView userRole={userRole} />}
             {activeMenu === 'laporan' && <LaporanView />}
             {activeMenu === 'manajemen_akun' && <ManajemenAkunView userRole={userRole} />}
             {activeMenu === 'log_aktivitas' && <LogAktivitasView />}
           </div>
        </main>
      </div>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <DashboardContent />
    </Suspense>
  );
}
