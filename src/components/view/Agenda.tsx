import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner';

export default function AgendaView({ userRole }: { userRole: string }) {
  const [agendas, setAgendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showKehadiranModal, setShowKehadiranModal] = useState(false);
  
  // Data for Kehadiran
  const [semuaAnggota, setSemuaAnggota] = useState<any[]>([]);
  const [loadingAnggota, setLoadingAnggota] = useState(false);
  const [searchAnggota, setSearchAnggota] = useState('');
  const [selectedAnggotaIds, setSelectedAnggotaIds] = useState<number[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    namaAcara: '',
    tempat: '',
    waktu: '',
    deskripsi: '',
    fotoUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAgendas();
  }, []);

  const fetchAgendas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agenda');
      const data = await res.json();
      if (data.success) {
        setAgendas(data.data);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const fetchAgendaDetail = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agenda/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedAgenda(data.data);
        setView('detail');
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const fetchSemuaAnggota = async () => {
    setLoadingAnggota(true);
    try {
      // Fetch maximum to show in list for check-in
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

  const openKehadiranModal = () => {
    fetchSemuaAnggota();
    const currentIds = selectedAgenda.kehadiran.map((k: any) => k.anggotaId);
    setSelectedAnggotaIds(currentIds);
    setShowKehadiranModal(true);
  };

  const handleSaveKehadiran = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agenda/${selectedAgenda.id}/kehadiran`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anggotaIds: selectedAnggotaIds })
      });
      const data = await res.json();
      if (data.success) {
        setShowKehadiranModal(false);
        fetchAgendaDetail(selectedAgenda.id); // Refresh detail
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan kehadiran.');
    }
    setIsSubmitting(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, fotoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({ namaAcara: '', tempat: '', waktu: '', deskripsi: '', fotoUrl: '' });
        fetchAgendas();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
    setIsSubmitting(false);
  };

  const toggleAnggotaSelection = (id: number) => {
    setSelectedAnggotaIds(prev => 
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

  const formatTanggal = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading && view === 'list') return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span className="material-icons text-red-600">event</span>
            {view === 'list' ? 'Agenda & Kegiatan' : selectedAgenda?.namaAcara}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {view === 'list' 
              ? 'Kelola jadwal kegiatan dan daftar absensi kehadiran anggota.' 
              : 'Detail informasi kegiatan dan anggota yang berpartisipasi.'}
          </p>
        </div>
        <div className="flex gap-2">
          {view === 'detail' && (
            <button 
              onClick={() => { setView('list'); setSelectedAgenda(null); fetchAgendas(); }}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <span className="material-icons text-[18px]">arrow_back</span> Kembali
            </button>
          )}
          {view === 'list' && (userRole === 'Super Admin' || userRole === 'Admin') && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md shadow-red-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="material-icons text-[18px]">add</span> Tambah Agenda
            </button>
          )}
        </div>
      </div>

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agendas.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">Belum ada agenda yang dijadwalkan.</div>
          ) : (
            agendas.map((agenda) => {
              const isPast = new Date(agenda.waktu) < new Date();
              return (
                <div 
                  key={agenda.id} 
                  onClick={() => fetchAgendaDetail(agenda.id)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                >
                  <div className="h-48 relative bg-slate-100 overflow-hidden">
                    {agenda.fotoUrl ? (
                      <img src={agenda.fotoUrl} alt={agenda.namaAcara} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center">
                        <span className="material-icons text-6xl text-slate-300">event_note</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${isPast ? 'bg-slate-800/80 text-white' : 'bg-red-600/90 text-white'}`}>
                        {isPast ? 'Selesai' : 'Akan Datang'}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2">{agenda.namaAcara}</h3>
                    <div className="space-y-2 mt-auto">
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="material-icons text-[16px] text-red-500 mt-0.5">place</span>
                        <span className="line-clamp-1">{agenda.tempat}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="material-icons text-[16px] text-blue-500 mt-0.5">schedule</span>
                        <span>{formatTanggal(agenda.waktu)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="material-icons text-[16px] text-emerald-500 mt-0.5">group</span>
                        <span>{agenda._count?.kehadiran || 0} Anggota Hadir</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DETAIL VIEW */}
      {view === 'detail' && selectedAgenda && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
            {selectedAgenda.fotoUrl ? (
               <div className="h-64 sm:h-80 relative w-full">
                 <img src={selectedAgenda.fotoUrl} alt={selectedAgenda.namaAcara} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6 sm:p-8">
                    <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">{selectedAgenda.namaAcara}</h1>
                 </div>
               </div>
            ) : (
               <div className="p-6 sm:p-8 bg-gradient-to-br from-red-600 to-red-800 rounded-t-3xl">
                 <h1 className="text-3xl sm:text-4xl font-black text-white">{selectedAgenda.namaAcara}</h1>
               </div>
            )}
            
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Deskripsi Acara</h3>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedAgenda.deskripsi || 'Tidak ada deskripsi.'}</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Daftar Kehadiran ({selectedAgenda.kehadiran?.length || 0})</h3>
                    {(userRole === 'Super Admin' || userRole === 'Admin') && (
                      <button 
                        onClick={openKehadiranModal}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                      >
                        <span className="material-icons text-[16px]">edit_document</span> Kelola Absensi
                      </button>
                    )}
                  </div>
                  
                  {selectedAgenda.kehadiran?.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-sm text-slate-500">
                      Belum ada data kehadiran untuk acara ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedAgenda.kehadiran.map((k: any) => (
                        <div key={k.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {k.anggota.passFotoUrl ? (
                              <img src={k.anggota.passFotoUrl} alt={k.anggota.nama} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-icons text-slate-400 text-lg">person</span>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-800 truncate">{k.anggota.nama}</p>
                            <p className="text-xs text-slate-500 truncate">{k.anggota.nik}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Informasi Pelaksanaan</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-blue-500">
                        <span className="material-icons">event</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Tanggal & Waktu</p>
                        <p className="text-sm font-bold text-slate-800">{formatTanggal(selectedAgenda.waktu)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-red-500">
                        <span className="material-icons">location_on</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Tempat / Lokasi</p>
                        <p className="text-sm font-bold text-slate-800">{selectedAgenda.tempat}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH AGENDA */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-full sm:max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black text-slate-800">Tambah Agenda Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-icons text-[20px]">close</span>
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0">
              <form id="agendaForm" onSubmit={handleCreateAgenda} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Acara <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.namaAcara} onChange={(e) => setFormData({...formData, namaAcara: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all" placeholder="Contoh: Pertemuan Rutin..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tempat <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.tempat} onChange={(e) => setFormData({...formData, tempat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all" placeholder="Lokasi kegiatan" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Waktu Kegiatan <span className="text-red-500">*</span></label>
                  <input type="datetime-local" required value={formData.waktu} onChange={(e) => setFormData({...formData, waktu: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
                  <textarea rows={3} value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all" placeholder="Catatan tambahan..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Foto Acara (Opsional)</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 transition-all cursor-pointer" />
                  {formData.fotoUrl && (
                    <div className="mt-2 h-32 rounded-xl overflow-hidden border border-slate-200">
                      <img src={formData.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </form>
            </div>
            <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Batal</button>
              <button form="agendaForm" type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Agenda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KELOLA KEHADIRAN */}
      {showKehadiranModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowKehadiranModal(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-full sm:max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-800">Kelola Kehadiran Anggota</h3>
                <button onClick={() => setShowKehadiranModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
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
            
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 bg-slate-50/50">
              {loadingAnggota ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {semuaAnggota
                    .filter(a => a.nama.toLowerCase().includes(searchAnggota.toLowerCase()) || a.nik.includes(searchAnggota))
                    .map(anggota => {
                      const isSelected = selectedAnggotaIds.includes(anggota.id);
                      return (
                        <div 
                          key={anggota.id} 
                          onClick={() => toggleAnggotaSelection(anggota.id)}
                          className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-slate-200 hover:border-red-300'}`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border mr-3 flex-shrink-0 transition-colors ${isSelected ? 'bg-red-600 border-red-600 text-white' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <span className="material-icons text-[14px]">check</span>}
                          </div>
                          <div className="overflow-hidden">
                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-red-900' : 'text-slate-700'}`}>{anggota.nama}</p>
                            <p className={`text-[11px] truncate ${isSelected ? 'text-red-600/70' : 'text-slate-500'}`}>{anggota.nik}</p>
                          </div>
                        </div>
                      );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-sm font-bold text-slate-600">
                Terpilih: <span className="text-red-600">{selectedAnggotaIds.length}</span>
              </span>
              <div className="flex gap-2">
                <button onClick={() => setShowKehadiranModal(false)} className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Batal</button>
                <button 
                  onClick={handleSaveKehadiran} 
                  disabled={isSubmitting} 
                  className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-200 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Menyimpan...' : (
                    <><span className="material-icons text-[18px]">save</span> Simpan</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
