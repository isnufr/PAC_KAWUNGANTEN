import React, { useState, useEffect } from 'react';
import { useAlert } from '../AlertProvider';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../LoadingSpinner';

function getDirectImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('/uploads/')) {
        return `/api${url}`;
    }
    const match = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
    if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    const match2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (match2 && match2[1]) {
        return `https://lh3.googleusercontent.com/d/${match2[1]}`;
    }
    return url;
}

export default function ManajemenAkunView({ userRole }: { userRole?: string }) {
  const { showAlert, showConfirm } = useAlert();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAnggotaModal, setShowAnggotaModal] = useState(false);

  // Data for Anggota Selection
  const [semuaAnggota, setSemuaAnggota] = useState<any[]>([]);
  const [loadingAnggota, setLoadingAnggota] = useState(false);
  const [searchAnggota, setSearchAnggota] = useState('');

  useEffect(() => {
    const handleGlobalAdd = async () => {
      setEditUser(null);
      setFormData({ username: '', password: '', role: 'Viewer', anggotaId: null });
      setSelectedAnggotaName('');
      setFormError('');
      setFormSuccess('');
      setIsModalOpen(true);
    };
    window.addEventListener('global-add-action', handleGlobalAdd);
    return () => window.removeEventListener('global-add-action', handleGlobalAdd);
  }, []);
  const [editUser, setEditUser] = useState<any>(null);

  // Form
  const [formData, setFormData] = useState<{username: string, password: string, role: string, anggotaId: number | null}>({ 
    username: '', password: '', role: 'Viewer', anggotaId: null 
  });
  const [selectedAnggotaName, setSelectedAnggotaName] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  const openAddModal = () => {
    setEditUser(null);
    setFormData({ username: '', password: '', role: 'Viewer', anggotaId: null });
    setSelectedAnggotaName('');
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditUser(user);
    setFormData({ username: user.username, password: '', role: user.role, anggotaId: user.anggotaId || null });
    setSelectedAnggotaName(user.anggota?.nama || '');
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const fetchSemuaAnggota = async () => {
    setLoadingAnggota(true);
    try {
      const res = await fetch(`/api/anggota?limit=1000`);
      const data = await res.json();
      if (data.success) {
        setSemuaAnggota(data.data);
      }
    } catch (error) {
      console.error(error);
    }
    setLoadingAnggota(false);
  };

  const openAnggotaModal = () => {
    fetchSemuaAnggota();
    setShowAnggotaModal(true);
  };

  const selectAnggota = (anggota: any) => {
    setFormData(p => ({ ...p, anggotaId: anggota.id }));
    setSelectedAnggotaName(anggota.nama);
    setShowAnggotaModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!formData.username) { setFormError('Username wajib diisi!'); return; }
    if (!editUser && !formData.password) { setFormError('Password wajib diisi!'); return; }
    if (!formData.anggotaId) { setFormError('Data anggota wajib dipilih!'); return; }

    setIsSubmitting(true);
    try {
      let res;
      if (editUser) {
        const body: any = { username: formData.username, role: formData.role, anggotaId: formData.anggotaId };
        if (formData.password) body.password = formData.password;
        res = await fetch(`/api/users/${editUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } else {
        res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      const json = await res.json();
      if (res.ok && json.success) {
        setFormSuccess(editUser ? 'Akun berhasil diperbarui!' : 'Akun berhasil ditambahkan!');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setTimeout(() => { setIsModalOpen(false); setFormSuccess(''); }, 1500);
      } else { setFormError(json.error || 'Gagal menyimpan akun'); }
    } catch (err) { setFormError('Terjadi kesalahan koneksi'); }
    finally { setIsSubmitting(false); }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: (json) => {
      if (json.success) queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleDelete = async (id: number, username: string) => {
    const confirmed = await showConfirm(`Yakin ingin menghapus akun "${username}"?`);
    if (!confirmed) return;
    deleteMutation.mutate(id);
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'Admin': return 'bg-red-50 text-red-600 border-red-200';
      case 'Editor': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div id="menu-akunManager" className="space-y-5 max-w-6xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-red-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-50 pb-4 mb-4">
                <div>
                    <h2 className="text-sm md:text-base font-bold text-red-700 flex items-center gap-2 uppercase tracking-wide">
                        <span className="material-icons text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-200">manage_accounts</span>
                        Manajemen Hak Akses Login
                    </h2>
                    <p className="text-xs text-red-400 mt-1">Daftar kredensial pengguna yang dapat masuk ke dalam sistem.</p>
                </div>
                {userRole === 'Super Admin' && (
                  <button onClick={openAddModal} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95">
                      <span className="material-icons text-sm">add_circle</span> Tambah Akun Baru
                  </button>
                )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-red-100">
                <table className="w-full text-left text-xs sm:text-sm text-red-800">
                    <thead className="bg-red-50 text-[10px] sm:text-xs uppercase text-red-600 border-b border-red-100 font-bold tracking-wider">
                        <tr>
                            <th className="p-3 sm:p-4">No</th>
                            <th className="p-3 sm:p-4">Pemilik Akun</th>
                            <th className="p-3 sm:p-4">Username</th>
                            <th className="p-3 sm:p-4">Level Role</th>
                            {userRole === 'Super Admin' && <th className="p-3 sm:p-4 text-center">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50 bg-white">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-0"><LoadingSpinner /></td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-6 text-red-400 font-bold">Tidak ada akun ditemukan.</td></tr>
                        ) : users.map((user: any, index: number) => (
                            <tr key={user.id} className="hover:bg-red-50/30 transition">
                                <td className="p-3 sm:p-4 font-medium">{index + 1}</td>
                                <td className="p-3 sm:p-4">
                                  {user.anggota ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200">
                                        {user.anggota.passFotoUrl ? (
                                          <img src={getDirectImageUrl(user.anggota.passFotoUrl) || ''} alt={user.anggota.nama} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="material-icons text-slate-400 text-[14px]">person</span>
                                        )}
                                      </div>
                                      <span className="font-bold text-slate-700">{user.anggota.nama}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic font-medium">- Belum Ditautkan -</span>
                                  )}
                                </td>
                                <td className="p-3 sm:p-4 font-bold">{user.username}</td>
                                <td className="p-3 sm:p-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${roleColor(user.role)}`}>{user.role}</span>
                                </td>
                                {userRole === 'Super Admin' && (
                                  <td className="p-3 sm:p-4 text-center">
                                      <div className="flex justify-center gap-2">
                                          <button onClick={() => openEditModal(user)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg transition"><span className="material-icons text-[16px]">edit</span></button>
                                          <button onClick={() => handleDelete(user.id, user.username)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-lg transition"><span className="material-icons text-[16px]">delete</span></button>
                                      </div>
                                  </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL TAMBAH/EDIT AKUN */}
        {mounted && isModalOpen && createPortal(
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-red-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto flex flex-col border border-red-200">
                    <div className="bg-red-700 p-4 sm:p-5 text-white flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <span className="material-icons text-white text-lg">{editUser ? 'edit' : 'person_add'}</span>
                            <h3 className="font-extrabold text-sm sm:text-base tracking-wide">{editUser ? 'Edit Akun' : 'Tambah Akun Baru'}</h3>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="text-red-100 hover:text-white transition bg-red-800 p-1.5 rounded-lg"><span className="material-icons text-sm block">close</span></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-800">
                        {formError && <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center font-bold text-xs">{formError}</div>}
                        {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100 text-center font-bold text-xs">{formSuccess}</div>}

                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Data Anggota *</label>
                            <button 
                                type="button"
                                onClick={openAnggotaModal}
                                className="w-full p-2.5 flex justify-between items-center border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 focus:ring-2 focus:ring-red-100 focus:border-red-500 transition text-left text-xs"
                            >
                                <span className={selectedAnggotaName ? "font-bold text-slate-800" : "text-slate-400"}>
                                    {selectedAnggotaName || 'Pilih data anggota...'}
                                </span>
                                <span className="material-icons text-[16px] text-slate-400">search</span>
                            </button>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Username *</label>
                            <input type="text" value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} placeholder="Masukkan username"
                                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-slate-50 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Password {editUser ? '(kosongkan jika tidak diubah)' : '*'}</label>
                            <input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="Masukkan password"
                                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-slate-50 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Level Role *</label>
                            <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-xs">
                                <option value="Super Admin">Super Admin</option>
                                <option value="Admin">Admin</option>
                                <option value="Editor">Editor</option>
                                <option value="Viewer">Viewer</option>
                            </select>
                        </div>

                        <button type="submit" disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-3.5 rounded-xl font-bold shadow-lg transition-all flex justify-center items-center gap-2 text-sm active:scale-95 disabled:opacity-70">
                            {isSubmitting ? 'Menyimpan...' : <><span className="material-icons text-sm">save</span> {editUser ? 'PERBARUI AKUN' : 'SIMPAN AKUN BARU'}</>}
                        </button>
                    </form>
                </div>
            </div>
        , document.body)}

        {/* MODAL PENCARIAN ANGGOTA (Agenda Style) */}
        {mounted && showAnggotaModal && createPortal(
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAnggotaModal(false)}></div>
                <div className="modal-content bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-slate-800">Pilih Data Anggota</h3>
                            <button onClick={() => setShowAnggotaModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-icons text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="relative">
                            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                            <input 
                                type="text" 
                                placeholder="Cari nama atau NIK..." 
                                value={searchAnggota}
                                onChange={(e) => setSearchAnggota(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-[50vh] bg-slate-50/50">
                        {loadingAnggota ? (
                            <div className="flex justify-center py-10"><LoadingSpinner /></div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {semuaAnggota
                                    .filter(a => a.nama.toLowerCase().includes(searchAnggota.toLowerCase()) || a.nik.includes(searchAnggota))
                                    .sort((a, b) => a.nama.localeCompare(b.nama))
                                    .map(anggota => {
                                        const isSelected = formData.anggotaId === anggota.id;
                                        return (
                                            <div 
                                                key={anggota.id} 
                                                onClick={() => selectAnggota(anggota)}
                                                className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-slate-200 hover:border-red-300'}`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200 mr-3">
                                                    {anggota.passFotoUrl ? (
                                                        <img src={getDirectImageUrl(anggota.passFotoUrl) || ''} alt={anggota.nama} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-icons text-slate-400 text-[18px]">person</span>
                                                    )}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-red-900' : 'text-slate-700'}`}>{anggota.nama}</p>
                                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                                        <p className={`text-[11px] truncate ${isSelected ? 'text-red-600/70' : 'text-slate-500'}`}>{anggota.nik}</p>
                                                        {(anggota.dusun || anggota.desa) && (
                                                            <p className={`text-[10px] truncate ${isSelected ? 'text-red-500/80' : 'text-slate-400'}`}>
                                                                {anggota.dusun || '-'} - {anggota.desa || '-'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        , document.body)}
    </div>
  );
}
