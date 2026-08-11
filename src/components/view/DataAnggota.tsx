import React, { useState } from 'react';

export default function DataAnggotaView() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div id="menu-dataAnggota" className="space-y-4 max-w-6xl mx-auto">
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm space-y-3 md:space-y-4 border border-red-100 theme-el">
            <h3 className="text-xs md:text-sm font-bold text-red-700 flex items-center uppercase tracking-wider border-b border-red-50 pb-2 theme-el">
                <span className="material-icons text-sm mr-2 text-red-600 bg-red-100 p-1 rounded-lg theme-el">filter_alt</span>
                Filter Pencarian
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                <input type="text" placeholder="Tulis Nama/NIK..." 
                    className="p-2.5 border border-red-200 rounded-xl outline-none w-full focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-red-50 text-xs text-red-900 theme-el" />
                <select className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Bagian -</option>
                    <option value="PAC">PAC</option>
                    <option value="RANTING">RANTING</option>
                    <option value="ANAK RANTING">ANAK RANTING</option>
                    <option value="SATGAS">SATGAS</option>
                </select>
                <select className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Jabatan -</option>
                    <option value="KETUA">KETUA</option>
                    <option value="SEKRETARIS">SEKRETARIS</option>
                    <option value="BENDAHARA">BENDAHARA</option>
                    <option value="ANGGOTA">ANGGOTA</option>
                </select>
                <select className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Kecamatan -</option>
                </select>
                <select className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Desa -</option>
                </select>
                <select className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Dusun -</option>
                </select>
            </div>
            <div className="flex justify-end space-x-2.5 pt-1">
                <button className="px-4 py-2 border border-red-200 rounded-xl text-red-600 text-xs font-bold hover:bg-red-50 transition theme-el">Reset</button>
                <button className="px-5 py-2 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800 shadow-md transition flex items-center space-x-1 theme-el">
                    <span className="material-icons text-sm">search</span><span>Cari Data</span>
                </button>
            </div>
        </div>

        {/* ACTION PANEL INPUT DATA */}
        <div className="mt-2 mb-2 flex justify-center">
            <button onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto bg-red-700 hover:bg-red-800 text-white px-6 py-3 md:py-3.5 rounded-2xl sm:rounded-xl shadow-md hover:shadow-lg font-bold flex items-center justify-center space-x-2 transform active:scale-95 transition-all duration-300 text-sm">
                <span className="material-icons">add_circle</span><span>INPUT DATA BARU</span>
            </button>
        </div>

        {/* LIST DATA */}
        <div className="space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-red-100">
                <p className="text-center text-slate-500 py-8">Memuat Data Anggota...</p>
                {/* Tabel Anggota akan ditaruh di sini nantinya */}
            </div>
        </div>

        {/* MODAL INPUT DATA */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transform transition-all border border-red-200 theme-el">
                    <div className="bg-red-700 p-4 sm:p-5 text-white flex justify-between items-center border-b border-red-800 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <span className="material-icons text-white text-lg">edit_document</span>
                            <h3 className="font-extrabold text-sm sm:text-base tracking-wide">Input Data Anggota Baru</h3>
                        </div>
                        <button onClick={() => setIsModalOpen(false)}
                            className="text-red-100 hover:text-white transition bg-red-800 p-1.5 rounded-lg"><span
                                className="material-icons text-sm block">close</span></button>
                    </div>
                    <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 text-xs sm:text-sm text-slate-800">
                        <p className="text-center text-slate-500">Form Input Data... (Segera dimigrasi secara utuh)</p>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
