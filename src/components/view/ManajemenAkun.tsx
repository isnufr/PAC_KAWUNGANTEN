import React from 'react';

export default function ManajemenAkunView() {
  return (
    <div id="menu-akunManager" className="space-y-5 max-w-6xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-red-100 theme-el">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-50 pb-4 mb-4">
                <div>
                    <h2 className="text-sm md:text-base font-bold text-red-700 flex items-center gap-2 uppercase tracking-wide theme-el">
                        <span className="material-icons text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-200 theme-el">manage_accounts</span>
                        Manajemen Hak Akses Login
                    </h2>
                    <p className="text-xs text-red-400 mt-1">Daftar kredensial pengguna yang dapat masuk ke dalam sistem.</p>
                </div>
                <button className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95">
                    <span className="material-icons text-sm">add_circle</span> Tambah Akun Baru
                </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-red-100 theme-el">
                <table className="w-full text-left text-xs sm:text-sm text-red-800 theme-el">
                    <thead className="bg-red-50 text-[10px] sm:text-xs uppercase text-red-600 border-b border-red-100 font-bold tracking-wider theme-el">
                        <tr>
                            <th className="p-3 sm:p-4">No</th>
                            <th className="p-3 sm:p-4">Username</th>
                            <th className="p-3 sm:p-4">Level Role</th>
                            <th className="p-3 sm:p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50 bg-white theme-el">
                        <tr>
                            <td colSpan={4} className="text-center py-6 text-red-400">Memuat data akun login...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
