import React from 'react';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../LoadingSpinner';
import SkeletonList from '../SkeletonList';

export default function LogAktivitasView() {
  const { data: logs = [], isLoading, refetch: fetchLogs } = useQuery({
    queryKey: ['logAktivitas'],
    queryFn: async () => {
      const res = await fetch('/api/log-aktivitas');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  return (
    <div id="menu-logAktivitas" className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-red-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-red-50 pb-4">
                <div>
                    <h2 className="text-sm md:text-base font-bold text-red-700 flex items-center gap-2 uppercase tracking-wide">
                        <span className="material-icons text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-200">history</span>
                        Log Aktivitas Sistem
                    </h2>
                    <p className="text-xs text-red-400 mt-1">Daftar riwayat aksi terbaru yang dilakukan oleh pengguna sistem.</p>
                </div>
                <button onClick={() => fetchLogs()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-95">
                    <span className="material-icons text-sm">refresh</span> Muat Ulang Log
                </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-red-100 max-h-[50vh] overflow-y-auto">
                <table className="w-full text-left text-xs sm:text-sm text-red-800">
                    <thead className="bg-red-50 text-[10px] sm:text-xs uppercase text-red-600 border-b border-red-100 font-bold tracking-wider sticky top-0 z-10">
                        <tr>
                            <th className="p-3 sm:p-4">Waktu</th>
                            <th className="p-3 sm:p-4">Pengguna</th>
                            <th className="p-3 sm:p-4">Aksi / Aktivitas</th>
                            <th className="p-3 sm:p-4">Detail</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50 bg-white">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-0 bg-white"><div className="p-4"><SkeletonList rows={4} /></div></td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-6 text-red-400 font-bold">Belum ada log aktivitas.</td></tr>
                        ) : logs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-red-50/30 transition">
                                <td className="p-3 sm:p-4 text-slate-500 whitespace-nowrap">{new Date(log.waktu).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</td>
                                <td className="p-3 sm:p-4 font-bold">{log.pengguna}</td>
                                <td className="p-3 sm:p-4">
                                    <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-red-100">{log.aksi}</span>
                                </td>
                                <td className="p-3 sm:p-4 text-slate-600">{log.detail || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
