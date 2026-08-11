import React from 'react';

export default function StrukturOrganisasiView() {
  return (
    <div id="menu-strukturOrganisasi" className="space-y-5 max-w-6xl mx-auto">
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm space-y-4 border border-red-100 theme-el">
            <h3 className="text-xs md:text-sm font-bold text-red-700 flex items-center uppercase tracking-wider border-b border-red-50 pb-2 theme-el">
                <span className="material-icons text-sm mr-2 text-red-600 bg-red-100 p-1 rounded-lg theme-el">filter_alt</span>
                Filter Struktur Organisasi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1 theme-el">Bagian Kepengurusan</label>
                    <select className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs w-full theme-el">
                        <option value="PAC">PAC (Kecamatan)</option>
                        <option value="RANTING">Ranting (Desa)</option>
                        <option value="ANAK RANTING">Anak Ranting (Dusun)</option>
                        <option value="SATGAS">Satgas</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1 theme-el">Pilih Desa</label>
                    <select className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs w-full theme-el">
                        <option value="">- Pilih Desa -</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1 theme-el">Pilih Dusun</label>
                    <select className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs w-full theme-el">
                        <option value="">- Pilih Dusun -</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Visual Container Tree Org Chart */}
        <div id="orgChartCanvas" className="p-4 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl min-h-[450px] flex flex-col items-center justify-center relative overflow-hidden theme-el">
            <p className="text-slate-400 font-medium">Bagan Organisasi akan dimuat di sini...</p>
        </div>
    </div>
  );
}
