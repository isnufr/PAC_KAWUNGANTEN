"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import DashboardView from '@/components/view/Dashboard';
import DataAnggotaView from '@/components/view/DataAnggota';
import StrukturOrganisasiView from '@/components/view/StrukturOrganisasi';
import KasOrganisasiView from '@/components/view/KasOrganisasi';
import LaporanView from '@/components/view/Laporan';
import ManajemenAkunView from '@/components/view/ManajemenAkun';
import LogAktivitasView from '@/components/view/LogAktivitas';

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

  if (!isReady) return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-red-700 font-bold">Memuat...</div>;

  return (
    <div className="bg-slate-50 text-slate-800 h-screen flex overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        userRole={userRole} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
          activeMenu={activeMenu} 
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
           <div className="max-w-7xl mx-auto">
             {activeMenu === 'beranda' && <DashboardView />}
             {activeMenu === 'data_anggota' && <DataAnggotaView filter={searchParams?.get('filter') || ''} />}
             {activeMenu === 'struktur_organisasi' && <StrukturOrganisasiView />}
             {activeMenu === 'kas_organisasi' && <KasOrganisasiView />}
             {activeMenu === 'laporan' && <LaporanView />}
             {activeMenu === 'manajemen_akun' && <ManajemenAkunView />}
             {activeMenu === 'log_aktivitas' && <LogAktivitasView />}
           </div>
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-red-700 font-bold">Memuat Aplikasi...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
