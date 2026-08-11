import React, { useState, useEffect } from 'react';

export default function ManajemenAkunView() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  // Form
  const [formData, setFormData] = useState({ username: '', password: '', role: 'Viewer' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const openAddModal = () => {
    setEditUser(null);
    setFormData({ username: '', password: '', role: 'Viewer' });
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditUser(user);
    setFormData({ username: user.username, password: '', role: user.role });
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!formData.username) { setFormError('Username wajib diisi!'); return; }
    if (!editUser && !formData.password) { setFormError('Password wajib diisi!'); return; }

    setIsSubmitting(true);
    try {
      let res;
      if (editUser) {
        const body: any = { username: formData.username, role: formData.role };
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
        fetchUsers();
        setTimeout(() => { setIsModalOpen(false); setFormSuccess(''); }, 1500);
      } else { setFormError(json.error || 'Gagal menyimpan akun'); }
    } catch (err) { setFormError('Terjadi kesalahan koneksi'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Yakin ingin menghapus akun "${username}"?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchUsers();
    } catch (e) { console.error(e); }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'Admin': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Editor': return 'bg-blue-100 text-blue-700 border-blue-200';
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
                <button onClick={openAddModal} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95">
                    <span className="material-icons text-sm">add_circle</span> Tambah Akun Baru
                </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-red-100">
                <table className="w-full text-left text-xs sm:text-sm text-red-800">
                    <thead className="bg-red-50 text-[10px] sm:text-xs uppercase text-red-600 border-b border-red-100 font-bold tracking-wider">
                        <tr>
                            <th className="p-3 sm:p-4">No</th>
                            <th className="p-3 sm:p-4">Username</th>
                            <th className="p-3 sm:p-4">Level Role</th>
                            <th className="p-3 sm:p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50 bg-white">
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center py-6 text-red-400 font-bold">Memuat data akun login...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-6 text-red-400 font-bold">Tidak ada akun ditemukan.</td></tr>
                        ) : users.map((user, index) => (
                            <tr key={user.id} className="hover:bg-red-50/30 transition">
                                <td className="p-3 sm:p-4 font-medium">{index + 1}</td>
                                <td className="p-3 sm:p-4 font-bold">{user.username}</td>
                                <td className="p-3 sm:p-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${roleColor(user.role)}`}>{user.role}</span>
                                </td>
                                <td className="p-3 sm:p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => openEditModal(user)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg transition"><span className="material-icons text-[16px]">edit</span></button>
                                        <button onClick={() => handleDelete(user.id, user.username)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-lg transition"><span className="material-icons text-[16px]">delete</span></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL TAMBAH/EDIT AKUN */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
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
        )}
    </div>
  );
}
