import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../LoadingSpinner';

export default function KasOrganisasiView() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tipe, setTipe] = useState('');
  const [kategori, setKategori] = useState('');

  // Form state
  const [formData, setFormData] = useState({ tanggal: '', tipe: 'PEMASUKAN', nominal: '', kategori: '', keterangan: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: kasData, isLoading, refetch: fetchData } = useQuery({
    queryKey: ['kas', search, tipe, kategori],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (tipe) params.append('tipe', tipe);
      if (kategori) params.append('kategori', kategori);

      const res = await fetch(`/api/kas?${params.toString()}`);
      const json = await res.json();
      return json.success ? json : { data: [], summary: { totalPemasukan: 0, totalPengeluaran: 0, saldoAkhir: 0 } };
    }
  });

  const data = kasData?.data || [];
  const saldo = {
    pemasukan: kasData?.summary?.totalPemasukan || 0,
    pengeluaran: kasData?.summary?.totalPengeluaran || 0,
    aktif: kasData?.summary?.saldoAkhir || 0
  };

  const handleSearch = () => { fetchData(); };
  const handleReset = () => { setSearch(''); setTipe(''); setKategori(''); };

  const handleSubmitKas = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!formData.tanggal || !formData.nominal) { setFormError('Tanggal dan Nominal wajib diisi!'); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/kas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: new Date(formData.tanggal).toISOString(),
          tipe: formData.tipe,
          nominal: parseInt(formData.nominal),
          kategori: formData.kategori || null,
          keterangan: formData.keterangan || null,
          operator: JSON.parse(localStorage.getItem('user') || '{}').username || 'SYSTEM'
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFormSuccess('Transaksi berhasil dicatat!');
        setFormData({ tanggal: '', tipe: 'PEMASUKAN', nominal: '', kategori: '', keterangan: '' });
        queryClient.invalidateQueries({ queryKey: ['kas'] });
        setTimeout(() => { setIsModalOpen(false); setFormSuccess(''); }, 1500);
      } else { setFormError(json.error || 'Gagal mencatat transaksi'); }
    } catch (err) { setFormError('Terjadi kesalahan koneksi'); }
    finally { setIsSubmitting(false); }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/kas/${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: (json) => {
      if (json.success) queryClient.invalidateQueries({ queryKey: ['kas'] });
    }
  });

  const handleDeleteKas = (id: number) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    deleteMutation.mutate(id);
  };

  return (
    <div id="menu-kasOrganisasi" className="space-y-6 max-w-6xl mx-auto">
        {/* Kartu Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-red-100 flex flex-col justify-between relative overflow-hidden card-hover">
                <div className="absolute -right-3 -top-3 opacity-[0.06]"><span className="material-icons text-7xl text-red-600">account_balance_wallet</span></div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons text-white bg-red-500 p-2 rounded-xl text-lg shadow-sm shadow-red-200">trending_up</span>
                    <span className="font-bold text-[10px] tracking-widest uppercase text-red-400">TOTAL PEMASUKAN</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-red-700">Rp{saldo.pemasukan.toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-red-100 flex flex-col justify-between relative overflow-hidden card-hover">
                <div className="absolute -right-3 -top-3 opacity-[0.06]"><span className="material-icons text-7xl text-red-600">shopping_cart</span></div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons text-white bg-red-700 p-2 rounded-xl text-lg shadow-sm shadow-red-200">trending_down</span>
                    <span className="font-bold text-[10px] tracking-widest uppercase text-red-400">TOTAL PENGELUARAN</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-red-700">Rp{saldo.pengeluaran.toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-5 rounded-3xl shadow-lg shadow-red-500/20 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-3 -top-3 opacity-20"><span className="material-icons text-7xl">savings</span></div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons text-red-600 bg-white p-2 rounded-xl text-lg shadow-sm">account_balance</span>
                    <span className="font-bold text-[10px] tracking-widest uppercase text-red-100">SALDO AKTIF KAS</span>
                </div>
                <span className="text-xl sm:text-2xl font-black">Rp{saldo.aktif.toLocaleString('id-ID')}</span>
            </div>
        </div>

        {/* Filter */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-red-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-50 pb-3">
                <h3 className="text-xs md:text-sm font-extrabold text-red-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-icons text-red-600 bg-red-100 p-1 rounded-lg">filter_alt</span>Filter Transaksi Kas
                </h3>
                <button onClick={() => { setIsModalOpen(true); setFormError(''); setFormSuccess(''); }}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-red-200 active:scale-95 transition-all duration-200">
                    <span className="material-icons text-sm">add_circle</span> CATAT TRANSAKSI
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <input type="text" placeholder="Cari keterangan..." value={search} onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="p-2.5 border border-red-200 rounded-xl outline-none w-full focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-red-50 text-xs text-red-900" />
                <select value={tipe} onChange={e => setTipe(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs">
                    <option value="">- Tipe Transaksi -</option>
                    <option value="PEMASUKAN">PEMASUKAN</option>
                    <option value="PENGELUARAN">PENGELUARAN</option>
                </select>
                <select value={kategori} onChange={e => setKategori(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs">
                    <option value="">- Kategori -</option>
                    <option value="Iuran Anggota">Iuran Anggota</option>
                    <option value="Sumbangan">Sumbangan</option>
                    <option value="Kegiatan Sosial">Kegiatan Sosial</option>
                    <option value="Operasional PAC">Operasional PAC</option>
                    <option value="Atribut Partai">Atribut / Alat Peraga</option>
                    <option value="Lain-lain">Lain-lain</option>
                </select>
                <div className="flex gap-2">
                    <button onClick={handleReset} className="flex-1 py-2.5 border border-red-200 rounded-xl text-red-600 font-bold hover:bg-red-50 transition">Reset</button>
                    <button onClick={handleSearch} className="flex-1 py-2.5 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 shadow-md transition flex items-center justify-center gap-1">
                        <span className="material-icons text-sm">search</span> Cari
                    </button>
                </div>
            </div>
        </div>

        {/* Tabel */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-xs md:text-sm font-bold text-slate-800 flex items-center uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                <span className="material-icons mr-2 text-red-600 bg-red-100 p-1 rounded-lg text-sm">view_list</span>
                Arus Mutasi Transaksi Kas
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-red-100 max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs sm:text-sm text-red-800">
                    <thead className="bg-red-50 text-[10px] sm:text-xs uppercase text-red-600 border-b border-red-100 font-bold tracking-wider sticky top-0 z-10">
                        <tr>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Tipe</th>
                            <th className="p-3">Kategori</th>
                            <th className="p-3">Keterangan</th>
                            <th className="p-3">Nominal</th>
                            <th className="p-3">Operator</th>
                            <th className="p-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50 bg-white">
                        {isLoading ? (
                            <tr><td colSpan={7} className="p-0"><LoadingSpinner /></td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-6 text-red-400 font-bold">Tidak ada transaksi ditemukan.</td></tr>
                        ) : data.map((item: any) => (
                            <tr key={item.id} className="hover:bg-red-50/30 transition">
                                <td className="p-3">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                <td className="p-3 font-bold text-[10px] md:text-xs">
                                    <span className={item.tipe === 'PEMASUKAN' ? 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100' : 'text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100'}>{item.tipe}</span>
                                </td>
                                <td className="p-3">{item.kategori || '-'}</td>
                                <td className="p-3">{item.keterangan || '-'}</td>
                                <td className="p-3 font-bold text-slate-700">Rp{item.nominal.toLocaleString('id-ID')}</td>
                                <td className="p-3 text-slate-500">{item.operator || '-'}</td>
                                <td className="p-3 text-center">
                                    <button onClick={() => handleDeleteKas(item.id)} className="text-slate-400 hover:text-red-600 transition"><span className="material-icons text-sm">delete</span></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL INPUT KAS */}
        {mounted && isModalOpen && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto flex flex-col border border-red-200">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-5 text-white flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <span className="material-icons text-white text-lg">payments</span>
                            <h3 className="font-extrabold text-sm sm:text-base tracking-wide">Catat Transaksi Kas Baru</h3>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="text-red-100 hover:text-white transition bg-red-800 p-1.5 rounded-lg"><span className="material-icons text-sm block">close</span></button>
                    </div>
                    <form onSubmit={handleSubmitKas} className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-800">
                        {formError && <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center font-bold text-xs">{formError}</div>}
                        {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100 text-center font-bold text-xs">{formSuccess}</div>}

                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tanggal *</label>
                            <input type="date" value={formData.tanggal} onChange={e => setFormData(p => ({ ...p, tanggal: e.target.value }))}
                                className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-red-50/30 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tipe Transaksi *</label>
                            <select value={formData.tipe} onChange={e => setFormData(p => ({ ...p, tipe: e.target.value }))}
                                className="w-full p-2.5 border border-red-200 rounded-xl bg-red-50/30 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-xs">
                                <option value="PEMASUKAN">PEMASUKAN</option>
                                <option value="PENGELUARAN">PENGELUARAN</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Nominal (Rp) *</label>
                            <input type="number" value={formData.nominal} onChange={e => setFormData(p => ({ ...p, nominal: e.target.value }))} placeholder="Masukkan nominal"
                            className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-red-50/30 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Kategori</label>
                            <select value={formData.kategori} onChange={e => setFormData(p => ({ ...p, kategori: e.target.value }))}
                                className="w-full p-2.5 border border-red-200 rounded-xl bg-red-50/30 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-xs">
                                <option value="">- Pilih Kategori -</option>
                                <option value="Iuran Anggota">Iuran Anggota</option>
                                <option value="Sumbangan">Sumbangan</option>
                                <option value="Kegiatan Sosial">Kegiatan Sosial</option>
                                <option value="Operasional PAC">Operasional PAC</option>
                                <option value="Atribut Partai">Atribut / Alat Peraga</option>
                                <option value="Lain-lain">Lain-lain</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Keterangan</label>
                            <textarea value={formData.keterangan} onChange={e => setFormData(p => ({ ...p, keterangan: e.target.value }))} placeholder="Keterangan transaksi..."
                                className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-red-50/30 text-xs resize-none h-20" />
                        </div>

                        <button type="submit" disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-red-200 transition-all flex justify-center items-center gap-2 text-sm active:scale-95 disabled:opacity-70">
                            {isSubmitting ? 'Menyimpan...' : <><span className="material-icons text-sm">save</span> SIMPAN TRANSAKSI</>}
                        </button>
                    </form>
                </div>
            </div>
        , document.body)}
    </div>
  );
}
