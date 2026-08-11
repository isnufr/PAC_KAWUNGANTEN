"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import DashboardView from '@/components/view/Dashboard';
import DataAnggotaView from '@/components/view/DataAnggota';
import StrukturOrganisasiView from '@/components/view/StrukturOrganisasi';
import KasOrganisasiView from '@/components/view/KasOrganisasi';
import LaporanView from '@/components/view/Laporan';
import ManajemenAkunView from '@/components/view/ManajemenAkun';
import LogAktivitasView from '@/components/view/LogAktivitas';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('beranda');
  
  // Dummy user role for now, akan diganti dengan data dari JWT
  const userRole = 'Super Admin';

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
             {activeMenu === 'data_anggota' && <DataAnggotaView />}
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

