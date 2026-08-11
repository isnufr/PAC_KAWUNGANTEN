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
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 z-10">
      <div className="flex items-center">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="md:hidden text-slate-500 hover:text-red-600 focus:outline-none p-2 rounded-lg hover:bg-slate-100 mr-2"
        >
          <span className="material-icons">menu</span>
        </button>
        <h2 className="text-lg font-semibold text-slate-700">{formatTitle(activeMenu)}</h2>
      </div>
      
      <div className="flex items-center space-x-3">
        <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors" title="Toggle Theme">
          <span className="material-icons">dark_mode</span>
        </button>
        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold border border-red-200 shadow-sm cursor-pointer hover:bg-red-200 transition-colors">
          A
        </div>
      </div>
    </header>
  );
}
