import React from 'react';

export default function LogAktivitasView() {
  return (
    <div id="menu-logAktivitas" className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-red-100 theme-el">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-red-50 pb-4 theme-el">
                <div>
                    <h2 className="text-sm md:text-base font-bold text-red-700 flex items-center gap-2 uppercase tracking-wide theme-el">
                        <span className="material-icons text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-200 theme-el">history</span>
                        Log Aktivitas Sistem
                    </h2>
                    <p className="text-xs text-red-400 mt-1">Daftar riwayat aksi terbaru yang dilakukan oleh pengguna sistem.</p>
                </div>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-95">
                    <span className="material-icons text-sm">refresh</span> Muat Ulang Log
                </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-red-100 max-h-[50vh] overflow-y-auto theme-el">
                <table className="w-full text-left text-xs sm:text-sm text-red-800 theme-el">
                    <thead className="bg-red-50 text-[10px] sm:text-xs uppercase text-red-600 border-b border-red-100 font-bold tracking-wider sticky top-0 z-10 theme-el">
                        <tr>
                            <th className="p-3 sm:p-4">Waktu</th>
                            <th className="p-3 sm:p-4">Pengguna</th>
                            <th className="p-3 sm:p-4">Aksi / Aktivitas</th>
                            <th className="p-3 sm:p-4">Detail</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50 bg-white theme-el">
                        <tr>
                            <td colSpan={4} className="text-center py-6 text-red-400">Memuat log aktivitas...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
