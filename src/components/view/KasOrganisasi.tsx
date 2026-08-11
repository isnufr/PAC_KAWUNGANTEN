import React, { useState } from 'react';

export default function KasOrganisasiView() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div id="menu-kasOrganisasi" className="space-y-6 max-w-6xl mx-auto">
        {/* Kartu Summary Keuangan Kas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-3xl shadow-lg shadow-emerald-500/20 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-3 -top-3 opacity-20"><span className="material-icons text-7xl">account_balance_wallet</span></div>
                <span className="font-bold text-[10px] tracking-widest uppercase opacity-80">TOTAL PEMASUKAN</span>
                <span className="text-xl sm:text-2xl font-black mt-2">Rp0</span>
            </div>
            <div className="bg-gradient-to-br from-rose-500 to-red-600 p-5 rounded-3xl shadow-lg shadow-red-500/20 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-3 -top-3 opacity-20"><span className="material-icons text-7xl">shopping_cart</span></div>
                <span className="font-bold text-[10px] tracking-widest uppercase opacity-80">TOTAL PENGELUARAN</span>
                <span className="text-xl sm:text-2xl font-black mt-2">Rp0</span>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-5 rounded-3xl shadow-lg shadow-blue-500/20 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-3 -top-3 opacity-20"><span className="material-icons text-7xl">savings</span></div>
                <span className="font-bold text-[10px] tracking-widest uppercase opacity-80">SALDO AKTIF KAS</span>
                <span className="text-xl sm:text-2xl font-black mt-2">Rp0</span>
            </div>
        </div>

        {/* Filter & Penambahan Transaksi Kas */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-red-100 shadow-sm space-y-4 theme-el">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-50 pb-3 theme-el">
                <h3 className="text-xs md:text-sm font-extrabold text-red-700 uppercase tracking-wider flex items-center gap-2 theme-el">
                    <span className="material-icons text-red-600 bg-red-100 p-1 rounded-lg theme-el">filter_alt</span>
                    Filter Transaksi Kas
                </h3>
                <button onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all duration-200">
                    <span className="material-icons text-sm">add_circle</span> CATAT TRANSAKSI
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <input type="text" placeholder="Cari keterangan..."
                    className="p-2.5 border border-red-200 rounded-xl outline-none w-full focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-red-50 text-xs text-red-900 theme-el" />

                <select className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Semua Tipe -</option>
                    <option value="PEMASUKAN">PEMASUKAN</option>
                    <option value="PENGELUARAN">PENGELUARAN</option>
                </select>

                <select className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Semua Kategori -</option>
                    <option value="Iuran Anggota">Iuran Anggota</option>
                    <option value="Sumbangan">Sumbangan</option>
                    <option value="Kegiatan Sosial">Kegiatan Sosial</option>
                    <option value="Operasional PAC">Operasional PAC</option>
                    <option value="Atribut Partai">Atribut / Alat Peraga</option>
                    <option value="Lain-lain">Lain-lain</option>
                </select>

                <div className="flex gap-2">
                    <button className="flex-1 py-2.5 border border-red-200 rounded-xl text-red-600 font-bold hover:bg-red-50 transition theme-el">Reset</button>
                    <button className="flex-1 py-2.5 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 shadow-md transition flex items-center justify-center gap-1 theme-el">
                        <span className="material-icons text-sm">search</span> Cari
                    </button>
                </div>
            </div>
        </div>

        {/* Visual Grafik Pengeluaran Kas per Kategori */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:col-span-1 theme-el">
                <h3 className="text-xs md:text-sm font-bold text-slate-800 flex items-center uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 theme-el">
                    <span className="material-icons mr-2 text-rose-500 bg-rose-50 p-1 rounded-lg text-sm theme-el">pie_chart</span>
                    Kategori Pengeluaran
                </h3>
                <div className="chart-container flex items-center justify-center h-48">
                    <p className="text-slate-400 text-xs">Chart akan dimuat di sini</p>
                </div>
            </div>

            {/* Daftar Riwayat Buku Kas */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:col-span-2 theme-el">
                <h3 className="text-xs md:text-sm font-bold text-slate-800 flex items-center uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 theme-el">
                    <span className="material-icons mr-2 text-red-600 bg-red-100 p-1 rounded-lg text-sm theme-el">view_list</span>
                    Arus Mutasi Transaksi Kas
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-red-100 max-h-[350px] overflow-y-auto theme-el">
                    <table className="w-full text-left text-xs sm:text-sm text-red-800 theme-el">
                        <thead className="bg-red-50 text-[10px] sm:text-xs uppercase text-red-600 border-b border-red-100 font-bold tracking-wider sticky top-0 z-10 theme-el">
                            <tr>
                                <th className="p-3">Tanggal</th>
                                <th className="p-3">Tipe</th>
                                <th className="p-3">Kategori</th>
                                <th className="p-3">Keterangan</th>
                                <th className="p-3">Nominal</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-red-50 bg-white theme-el">
                            <tr>
                                <td colSpan={6} className="text-center py-6 text-red-400">Memuat catatan keuangan...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* MODAL INPUT KAS */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto flex flex-col border border-red-200">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 sm:p-5 text-white flex justify-between items-center border-b border-emerald-800 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <span className="material-icons text-white text-lg">payments</span>
                            <h3 className="font-extrabold text-sm sm:text-base tracking-wide">Catat Kas Baru</h3>
                        </div>
                        <button onClick={() => setIsModalOpen(false)}
                            className="text-emerald-100 hover:text-white transition bg-emerald-800 p-1.5 rounded-lg"><span
                                className="material-icons text-sm block">close</span></button>
                    </div>
                    <div className="p-4 sm:p-6 text-xs sm:text-sm text-slate-800 text-center">
                        <p className="text-slate-500">Form Transaksi Kas... (Segera dimigrasi)</p>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
