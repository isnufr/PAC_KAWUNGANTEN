import React, { useState, useEffect } from 'react';

interface TopHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeMenu: string;
  userRole?: string;
}

export default function TopHeader({ isSidebarOpen, setIsSidebarOpen, activeMenu, userRole }: TopHeaderProps) {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const formatDate = () => {
      const now = new Date();
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      
      const dayName = days[now.getDay()];
      const date = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      
      return `${dayName}, ${date} ${monthName} ${year}`;
    };

    setCurrentDate(formatDate());

    // Update date at midnight
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const midnightTimer = setTimeout(() => {
      setCurrentDate(formatDate());
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  // Format judul agar lebih rapi (misal: "data_anggota" -> "Data Anggota")
  const formatTitle = (str: string) => {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <header className="bg-white/90 shadow-sm border-b border-slate-200/50 h-14 sm:h-16 flex items-center justify-between px-2.5 sm:px-6 z-10 flex-shrink-0 sticky top-0" style={{ backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)' }}>
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="md:hidden text-slate-500 hover:text-red-600 focus:outline-none p-1.5 rounded-xl hover:bg-slate-100 flex-shrink-0 active:scale-95 transition-all"
          aria-label="Toggle menu"
        >
          <span className="material-icons text-[18px] sm:text-[20px]">menu</span>
        </button>
        <h2 className="text-sm sm:text-lg font-semibold text-slate-700 truncate">{formatTitle(activeMenu)}</h2>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Refresh — mobile only */}
        <button onClick={() => window.location.reload()} className="md:hidden w-[28px] h-[28px] flex items-center justify-center text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors active:scale-95" title="Muat Ulang Halaman">
          <span className="material-icons text-[18px]">refresh</span>
        </button>

        {/* Global Add Button (Premium Design) - Muncul di semua halaman kecuali Viewer */}
        {userRole !== 'Viewer' && (
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('global-add-action'))} 
            className="w-[28px] h-[28px] sm:w-9 sm:h-9 flex items-center justify-center bg-gradient-to-tr from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 border border-red-500/50"
            title="Tambah Data Baru"
          >
            <span className="material-icons text-[18px] sm:text-[20px] font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>add</span>
          </button>
        )}

        {/* Date display */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 h-[28px] sm:h-9 sm:px-3 bg-red-50/80 border border-red-100 rounded-lg sm:rounded-xl">
          <span className="material-icons text-red-500 text-[14px]">calendar_today</span>
          <span className="text-[10px] sm:text-xs font-bold text-red-700 tracking-wide whitespace-nowrap">{currentDate}</span>
        </div>
      </div>
    </header>
  );
}
