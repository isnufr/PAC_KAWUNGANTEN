import React, { useState } from 'react';

export default function LaporanView() {
  return (
    <div id="menu-laporan" className="max-w-6xl mx-auto">
        <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-red-100 max-w-2xl mx-auto text-center theme-el">
            <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3.5 border border-red-200 theme-el">
                <span className="material-icons text-red-600 text-2xl md:text-3xl theme-el">assignment_turned_in</span>
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-red-800 mb-1.5 theme-el">Ekspor Laporan Data</h2>
            <p className="text-red-400 text-xs md:text-sm mb-5 pb-5 border-b border-red-50 theme-el">Pilih filter dan format file dokumen yang Anda butuhkan untuk diunduh ke perangkat Anda.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:gap-4 mb-6 text-left">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-red-800 uppercase tracking-wide mb-2.5 text-center theme-el">Pilih Format Unduhan</label>
                    <select className="w-full p-3.5 border-2 border-red-200 rounded-2xl bg-white outline-none text-xs md:text-sm font-bold text-red-700 focus:border-red-500 text-center cursor-pointer transition shadow-sm hover:shadow-md theme-el">
                        <option value="EXCEL">Spreadsheet Excel (.xlsx)</option>
                        <option value="PDF">Dokumen PDF (.pdf)</option>
                        <option value="CSV">Data Mentah CSV (.csv)</option>
                    </select>
                </div>

                <div className="sm:col-span-2 pt-3 mt-1 border-t border-red-50 theme-el"></div>

                <div>
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1 theme-el">Filter Bagian</label>
                    <select className="w-full p-2.5 md:p-3 border border-red-200 rounded-xl bg-red-50 outline-none text-xs md:text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 theme-el">
                        <option value="">- Semua Bagian -</option>
                        <option value="PAC">PAC</option>
                        <option value="RANTING">RANTING</option>
                        <option value="ANAK RANTING">ANAK RANTING</option>
                        <option value="SATGAS">SATGAS</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1 theme-el">Filter Desa</label>
                    <select className="w-full p-2.5 md:p-3 border border-red-200 rounded-xl bg-red-50 outline-none text-xs md:text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 theme-el">
                        <option value="">- Semua Desa -</option>
                    </select>
                </div>
                <div className="hidden sm:col-span-2">
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1 theme-el">Filter Dusun (Bisa Pilih Banyak)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1 p-3 border border-red-200 rounded-xl bg-white max-h-40 overflow-y-auto">
                        {/* Checkboxes Dusun disuntik ke sini */}
                    </div>
                </div>
                  <div className="sm:col-span-2 pt-3 mt-1 border-t border-red-50 theme-el">
                      <label className="block text-xs font-bold text-red-800 uppercase tracking-wide mb-2.5 text-center theme-el">Pilih Kolom Ekspor</label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                          <label className="flex items-center space-x-2 text-xs font-medium text-red-700 cursor-pointer"><input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-red-600 rounded" /><span>NIK</span></label>
                          <label className="flex items-center space-x-2 text-xs font-medium text-red-700 cursor-pointer"><input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-red-600 rounded" /><span>NAMA</span></label>
                          <label className="flex items-center space-x-2 text-xs font-medium text-red-700 cursor-pointer"><input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-red-600 rounded" /><span>JENIS KELAMIN</span></label>
                          <label className="flex items-center space-x-2 text-xs font-medium text-red-700 cursor-pointer"><input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-red-600 rounded" /><span>TANGGAL LAHIR</span></label>
                          <label className="flex items-center space-x-2 text-xs font-medium text-red-700 cursor-pointer"><input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-red-600 rounded" /><span>USIA</span></label>
                      </div>
                  </div>
            </div>

            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 md:py-4 rounded-full font-bold flex items-center justify-center space-x-2 w-full shadow-xl shadow-red-500/30 transition transform active:scale-95 text-sm">
                <span className="material-icons">cloud_download</span><span>UNDUH SEKARANG</span>
            </button>
        </div>
    </div>
  );
}
