import React, { useState, useEffect } from 'react';

interface TopHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeMenu: string;
}

export default function TopHeader({ isSidebarOpen, setIsSidebarOpen, activeMenu }: TopHeaderProps) {
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
    <header className="bg-white shadow-sm h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 z-10 flex-shrink-0">
      <div className="flex items-center min-w-0">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="md:hidden text-slate-500 hover:text-red-600 focus:outline-none p-2 rounded-lg hover:bg-slate-100 mr-2 flex-shrink-0 active:scale-95 transition-all"
          aria-label="Toggle menu"
        >
          <span className="material-icons text-[22px]">menu</span>
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-slate-700 truncate">{formatTitle(activeMenu)}</h2>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Refresh — mobile only */}
        <button onClick={() => window.location.reload()} className="md:hidden text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors active:scale-95" title="Muat Ulang Halaman">
          <span className="material-icons text-[20px]">refresh</span>
        </button>

        {/* Date display */}
        <div className="flex items-center gap-1.5 bg-red-50/80 border border-red-100 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2">
          <span className="material-icons text-red-500 text-[14px] sm:text-[16px]">calendar_today</span>
          <span className="text-[10px] sm:text-xs font-bold text-red-700 tracking-wide whitespace-nowrap">{currentDate}</span>
        </div>
      </div>
    </header>
  );
}
