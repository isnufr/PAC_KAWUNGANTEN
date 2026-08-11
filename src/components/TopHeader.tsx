import React from 'react';

interface TopHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeMenu: string;
}

export default function TopHeader({ isSidebarOpen, setIsSidebarOpen, activeMenu }: TopHeaderProps) {
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
      
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        <button onClick={() => window.location.reload()} className="md:hidden text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-slate-100 transition-colors active:scale-95" title="Muat Ulang Halaman">
          <span className="material-icons text-[20px]">refresh</span>
        </button>
        <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors active:scale-95" title="Toggle Theme">
          <span className="material-icons text-[20px] sm:text-[24px]">dark_mode</span>
        </button>
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs sm:text-sm border border-red-200 shadow-sm cursor-pointer hover:bg-red-200 transition-colors">
          A
        </div>
      </div>
    </header>
  );
}
