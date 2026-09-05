import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingSpinner from '../LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAlert } from '../AlertProvider';

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

export default function AgendaView({ userRole }: { userRole: string }) {
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const { data: agendas = [], isLoading: loading } = useQuery<any[]>({
    queryKey: ['agendas'],
    queryFn: async () => {
      const res = await fetch('/api/agenda');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agendaToDelete, setAgendaToDelete] = useState<any>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [showKehadiranModal, setShowKehadiranModal] = useState(false);
  
  // Data for Kehadiran
  const [semuaAnggota, setSemuaAnggota] = useState<any[]>([]);
  const [loadingAnggota, setLoadingAnggota] = useState(false);
  const [searchAnggota, setSearchAnggota] = useState('');
  const [selectedAnggotaIds, setSelectedAnggotaIds] = useState<number[]>([]);

  // Data for Lampiran
  const [isUploadingLampiran, setIsUploadingLampiran] = useState(false);
  const [previewLampiran, setPreviewLampiran] = useState<any>(null);
  const [deletingLampiranId, setDeletingLampiranId] = useState<number | null>(null);
  const [showKehadiranList, setShowKehadiranList] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    namaAcara: '',
    tempat: '',
    waktu: '',
    deskripsi: '',
    fotoUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAgendaDetail = async (id: number) => {
    setIsDetailLoading(true);
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
    setIsDetailLoading(false);
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
        showAlert('Kehadiran berhasil disimpan!', 'success');
      } else {
        showAlert(data.error || 'Gagal menyimpan kehadiran', 'error');
      }
    } catch (error) {
      console.error(error);
      showAlert('Terjadi kesalahan saat menyimpan kehadiran.', 'error');
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

  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editId ? `/api/agenda/${editId}` : '/api/agenda';
      const method = editId ? 'PUT' : 'POST';
      
      // Force the input time to be treated as WIB (UTC+7)
      const payload = { ...formData };
      if (payload.waktu && payload.waktu.length === 16) {
        payload.waktu = `${payload.waktu}:00+07:00`;
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({ namaAcara: '', tempat: '', waktu: '', deskripsi: '', fotoUrl: '' });
        setEditId(null);
        queryClient.invalidateQueries({ queryKey: ['agendas'] });
        if (editId && selectedAgenda?.id === editId) {
          fetchAgendaDetail(editId);
        }
        showAlert(editId ? 'Agenda berhasil diperbarui!' : 'Agenda berhasil ditambahkan!', 'success');
      } else {
        showAlert(data.error || 'Gagal menyimpan agenda', 'error');
      }
    } catch (error) {
      console.error(error);
    }
    setIsSubmitting(false);
  };

  const handleExportPDF = async () => {
    if (!selectedAgenda) return;
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const namaKetua = 'TURIJAN';

      // PDF Content Generation
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PDIP PAC KAWUNGANTEN', 105, 15, { align: 'center' });
      doc.text(selectedAgenda.namaAcara.toUpperCase(), 105, 22, { align: 'center' });
      
      // Tanggal (Kanan)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const tglStr = new Date(selectedAgenda.waktu).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(tglStr, 195, 30, { align: 'right' });
      
      // Split Data
      const pacMembers: any[] = [];
      const nonPacMembers: any[] = [];
      
      selectedAgenda.kehadiran?.forEach((k: any) => {
        const ag = k.anggota;
        if (ag.bagian && ag.bagian.toUpperCase().includes('PAC')) {
          pacMembers.push(ag);
        } else {
          nonPacMembers.push(ag);
        }
      });
      
      // Urutkan Ranting dan Anak Ranting berdasarkan Desa
      nonPacMembers.sort((a, b) => {
        const desaA = a.desa || '';
        const desaB = b.desa || '';
        return desaA.localeCompare(desaB);
      });

      let currentY = 35;

      // Helper for table
      const generateTable = (title: string, members: any[], startY: number) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, startY);
        
        const tableData = members.map((m, i) => [
          i + 1,
          m.nama,
          m.nomorHp || '-',
          m.desa || '-',
          m.dusun || '-',
          i % 2 === 0 ? `${i + 1}. .........` : `      ${i + 1}. .........`
        ]);

        autoTable(doc, {
          startY: startY + 5,
          head: [['No', 'Nama', 'Nomor HP', 'Desa', 'Dusun', 'Paraf']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 1.5, valign: 'middle' },
          headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 8 },
            1: { cellWidth: 50 },
            2: { cellWidth: 28 },
            3: { cellWidth: 35 },
            4: { cellWidth: 35 },
            5: { cellWidth: 26, valign: 'middle' },
          },
          didDrawPage: (data) => {
            currentY = data.cursor!.y;
          }
        });
      };

      if (pacMembers.length > 0) {
        generateTable('PAC', pacMembers, currentY);
        currentY += 10;
      }

      if (nonPacMembers.length > 0) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        generateTable('RANTING dan ANAK RANTING', nonPacMembers, currentY);
        currentY += 10;
      }

      // Signature
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      currentY += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Mengetahui,', 145, currentY);
      currentY += 6;
      doc.text('KETUA', 145, currentY);
      currentY += 6;
      doc.text('PAC KAWUNGANTEN', 145, currentY);
      
      currentY += 25; // Space for signature
      doc.setFont('helvetica', 'bold');
      doc.text(namaKetua.toUpperCase(), 145, currentY);
      
      doc.save(`Daftar_Hadir_${selectedAgenda.namaAcara.replace(/\s+/g, '_')}.pdf`);
      showAlert('PDF berhasil diunduh!', 'success');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showAlert('Gagal membuat file PDF.', 'error');
    }
  };

  const handleDeleteAgenda = async () => {
    if (!agendaToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agenda/${agendaToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(false);
        setAgendaToDelete(null);
        queryClient.invalidateQueries({ queryKey: ['agendas'] });
        if (selectedAgenda?.id === agendaToDelete.id) {
          setView('list');
          setSelectedAgenda(null);
        }
        showAlert('Agenda berhasil dihapus!', 'success');
      } else {
        showAlert(data.error || 'Gagal menghapus agenda', 'error');
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
      timeZone: 'Asia/Jakarta',
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) + ' WIB';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (tipeFile: string) => {
    switch (tipeFile) {
      case 'image': return 'image';
      case 'pdf': return 'picture_as_pdf';
      case 'document': return 'description';
      case 'spreadsheet': return 'table_chart';
      default: return 'insert_drive_file';
    }
  };

  const getFileColor = (tipeFile: string) => {
    switch (tipeFile) {
      case 'image': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'pdf': return 'text-red-600 bg-red-50 border-red-200';
      case 'document': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'spreadsheet': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const handleUploadLampiran = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedAgenda) return;

    setIsUploadingLampiran(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch(`/api/agenda/${selectedAgenda.id}/lampiran`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        fetchAgendaDetail(selectedAgenda.id);
        showAlert(`${files.length} file berhasil diunggah!`, 'success');
      } else {
        showAlert(data.error || 'Gagal mengunggah file', 'error');
      }
    } catch (error) {
      console.error(error);
      showAlert('Terjadi kesalahan saat mengunggah file.', 'error');
    }
    setIsUploadingLampiran(false);
    // Reset input agar bisa upload file yang sama lagi
    e.target.value = '';
  };

  const handleDeleteLampiran = async (lampiranId: number) => {
    if (!selectedAgenda) return;
    setDeletingLampiranId(lampiranId);
    try {
      const res = await fetch(`/api/agenda/${selectedAgenda.id}/lampiran`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lampiranId })
      });
      const data = await res.json();
      if (data.success) {
        fetchAgendaDetail(selectedAgenda.id);
        showAlert('Lampiran berhasil dihapus!', 'success');
      } else {
        showAlert(data.error || 'Gagal menghapus lampiran', 'error');
      }
    } catch (error) {
      console.error(error);
      showAlert('Terjadi kesalahan saat menghapus lampiran.', 'error');
    }
    setDeletingLampiranId(null);
  };

  if ((loading && view === 'list') || isDetailLoading) return <LoadingSpinner />;

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
              onClick={() => { setView('list'); setSelectedAgenda(null); }}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <span className="material-icons text-[18px]">arrow_back</span> Kembali
            </button>
          )}
          {view === 'list' && (userRole === 'Super Admin' || userRole === 'Admin') && (
            <button 
              onClick={() => {
                setEditId(null);
                setFormData({ namaAcara: '', tempat: '', waktu: '', deskripsi: '', fotoUrl: '' });
                setShowAddModal(true);
              }}
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
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${isPast ? 'bg-slate-800/80 text-white' : 'bg-red-600/90 text-white'}`}>
                        {isPast ? 'Selesai' : 'Akan Datang'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
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
                    {(userRole === 'Super Admin' || userRole === 'Admin') && (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditId(agenda.id);
                            
                            // Convert UTC date to WIB for input field
                            const dt = new Date(agenda.waktu);
                            const wibTime = new Date(dt.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
                            const year = wibTime.getFullYear();
                            const month = String(wibTime.getMonth() + 1).padStart(2, '0');
                            const day = String(wibTime.getDate()).padStart(2, '0');
                            const hours = String(wibTime.getHours()).padStart(2, '0');
                            const minutes = String(wibTime.getMinutes()).padStart(2, '0');
                            const localISOTime = `${year}-${month}-${day}T${hours}:${minutes}`;
                            
                            setFormData({
                              namaAcara: agenda.namaAcara,
                              tempat: agenda.tempat,
                              waktu: localISOTime,
                              deskripsi: agenda.deskripsi || '',
                              fotoUrl: agenda.fotoUrl || ''
                            });
                            setShowAddModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-colors"
                          title="Edit Agenda"
                        >
                          <span className="material-icons text-[16px]">edit</span>
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setAgendaToDelete(agenda);
                            setShowDeleteModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors"
                          title="Hapus Agenda"
                        >
                          <span className="material-icons text-[16px]">delete</span>
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
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
                  <div 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => setShowKehadiranList(!showKehadiranList)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <span className="material-icons">groups</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Daftar Kehadiran</h3>
                        <p className="text-xs text-slate-500">{selectedAgenda.kehadiran?.length || 0} anggota hadir</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleExportPDF(); }}
                        className="w-9 h-9 flex items-center justify-center bg-white text-red-700 rounded-lg hover:bg-red-50 border border-red-200 transition-colors"
                        title="Ekspor PDF"
                      >
                        <span className="material-icons text-[20px]">picture_as_pdf</span>
                      </button>
                      {(userRole === 'Super Admin' || userRole === 'Admin') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); openKehadiranModal(); }}
                          className="w-9 h-9 flex items-center justify-center bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
                          title="Kelola Absensi"
                        >
                          <span className="material-icons text-[20px]">edit_document</span>
                        </button>
                      )}
                      <span className={`material-icons text-slate-400 transition-transform duration-300 ${showKehadiranList ? 'rotate-180' : ''}`}>expand_more</span>
                    </div>
                  </div>
                  
                  {showKehadiranList && (
                    <div className="mt-4">
                      {selectedAgenda.kehadiran?.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-sm text-slate-500">
                          Belum ada data kehadiran untuk acara ini.
                        </div>
                      ) : (
                        (() => {
                          const groups: Record<string, any[]> = {};
                          selectedAgenda.kehadiran.forEach((k: any) => {
                            const ag = k.anggota;
                            let groupName = ag.desa || 'Lainnya';
                            if (ag.bagian && ag.bagian.toUpperCase().includes('PAC')) {
                              groupName = 'PENGURUS PAC';
                            }
                            if (!groups[groupName]) groups[groupName] = [];
                            groups[groupName].push(k);
                          });
                          
                          return (
                            <div className="space-y-6">
                              {Object.entries(groups).map(([groupName, items]) => (
                                <div key={groupName}>
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {groupName} ({items.length})
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {items.map((k: any) => (
                                      <div key={k.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                          {k.anggota.passFotoUrl ? (
                                            <img 
                                              src={getDirectImageUrl(k.anggota.passFotoUrl) || ''} 
                                              alt={k.anggota.nama} 
                                              className="w-full h-full object-cover" 
                                              onError={(e) => { 
                                                (e.target as HTMLImageElement).style.display = 'none'; 
                                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400"><span class="material-icons text-lg">person</span></div>'; 
                                              }} 
                                            />
                                          ) : (
                                            <span className="material-icons text-slate-400 text-lg">person</span>
                                          )}
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                          <p className="text-sm font-bold text-slate-800 truncate">{k.anggota.nama}</p>
                                          <div className="flex flex-col mt-0.5">
                                            <p className="text-[11px] text-slate-500 truncate">{k.anggota.nik}</p>
                                            <p className="text-[10px] font-medium text-slate-500 truncate mt-1">
                                              <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                {k.anggota.dusun || '-'} - {k.anggota.bagian || '-'} - {k.anggota.jabatan || '-'}
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>

                {/* SECTION LAMPIRAN / DOKUMEN */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">
                      Lampiran & Dokumen ({selectedAgenda.lampiran?.length || 0})
                    </h3>
                    {(userRole === 'Super Admin' || userRole === 'Admin') && (
                      <label className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all hover:shadow-sm ${isUploadingLampiran ? 'opacity-50 pointer-events-none bg-slate-100 text-slate-400 border-slate-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
                        <span className="material-icons text-[18px]">{isUploadingLampiran ? 'hourglass_empty' : 'upload_file'}</span>
                        {isUploadingLampiran ? 'Mengunggah...' : 'Upload File'}
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                          onChange={handleUploadLampiran}
                          className="hidden"
                          disabled={isUploadingLampiran}
                        />
                      </label>
                    )}
                  </div>

                  {!selectedAgenda.lampiran || selectedAgenda.lampiran.length === 0 ? (
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center">
                      <span className="material-icons text-4xl text-slate-300 mb-2">folder_open</span>
                      <p className="text-sm text-slate-500">Belum ada lampiran untuk agenda ini.</p>
                      {(userRole === 'Super Admin' || userRole === 'Admin') && (
                        <p className="text-xs text-slate-400 mt-1">Klik tombol "Upload File" untuk menambahkan.</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedAgenda.lampiran.map((lamp: any) => (
                        <div key={lamp.id} className={`relative group flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md ${getFileColor(lamp.tipeFile)}`}>
                          {/* Thumbnail atau Icon */}
                          {lamp.tipeFile === 'image' ? (
                            <div 
                              onClick={() => setPreviewLampiran(lamp)}
                              className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-white/50 shadow-sm"
                            >
                              <img src={lamp.fileUrl} alt={lamp.namaFile} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/70 border border-current/10">
                              <span className="material-icons text-3xl">{getFileIcon(lamp.tipeFile)}</span>
                            </div>
                          )}
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-slate-800">{lamp.namaFile}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{lamp.tipeFile}</span>
                              <span className="text-[10px] opacity-50">•</span>
                              <span className="text-[10px] opacity-70">{formatFileSize(lamp.ukuran)}</span>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {lamp.tipeFile === 'image' && (
                              <button 
                                onClick={() => setPreviewLampiran(lamp)}
                                className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-800 transition-colors shadow-sm"
                                title="Preview"
                              >
                                <span className="material-icons text-[16px]">visibility</span>
                              </button>
                            )}
                            <a 
                              href={lamp.fileUrl} 
                              download={lamp.namaFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-800 transition-colors shadow-sm"
                              title="Download"
                            >
                              <span className="material-icons text-[16px]">download</span>
                            </a>
                            {(userRole === 'Super Admin' || userRole === 'Admin') && (
                              <button 
                                onClick={() => handleDeleteLampiran(lamp.id)}
                                disabled={deletingLampiranId === lamp.id}
                                className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors shadow-sm disabled:opacity-50"
                                title="Hapus"
                              >
                                <span className="material-icons text-[16px]">{deletingLampiranId === lamp.id ? 'hourglass_empty' : 'delete'}</span>
                              </button>
                            )}
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

          {/* MODAL PREVIEW LAMPIRAN GAMBAR */}
          {previewLampiran && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewLampiran(null)}>
              <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setPreviewLampiran(null)}
                  className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <span className="material-icons">close</span>
                </button>
                <img 
                  src={previewLampiran.fileUrl} 
                  alt={previewLampiran.namaFile} 
                  className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
                  <p className="text-white font-bold text-sm truncate">{previewLampiran.namaFile}</p>
                  <p className="text-white/70 text-xs">{formatFileSize(previewLampiran.ukuran)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL TAMBAH AGENDA */}
      {mounted && showAddModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="modal-content bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black text-slate-800">{editId ? 'Edit Agenda' : 'Tambah Agenda Baru'}</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-icons text-[20px]">close</span>
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0">
              <form id="agendaForm" onSubmit={handleSaveAgenda} className="space-y-4">
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
                {isSubmitting ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Simpan Agenda')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL HAPUS AGENDA */}
      {mounted && showDeleteModal && agendaToDelete && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full relative z-10 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="material-icons text-red-600 text-3xl">delete_outline</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Hapus Agenda?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus agenda <span className="font-bold text-slate-700">"{agendaToDelete.namaAcara}"</span>? Data kehadiran anggota pada agenda ini juga akan terhapus secara permanen.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteAgenda}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md shadow-red-200 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL KELOLA KEHADIRAN */}
      {mounted && showKehadiranModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowKehadiranModal(false)}></div>
          <div className="modal-content bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
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
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
                {searchAnggota && (
                  <button 
                    onClick={() => setSearchAnggota('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Hapus pencarian"
                  >
                    <span className="material-icons text-[16px]">close</span>
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => {
                    const filteredIds = semuaAnggota
                      .filter(a => a.nama.toLowerCase().includes(searchAnggota.toLowerCase()) || a.nik.includes(searchAnggota))
                      .map(a => a.id);
                    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedAnggotaIds.includes(id));
                    if (allFilteredSelected) {
                      setSelectedAnggotaIds(prev => prev.filter(id => !filteredIds.includes(id)));
                    } else {
                      setSelectedAnggotaIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all hover:shadow-sm"
                  style={{
                    ...((() => {
                      const filteredIds = semuaAnggota
                        .filter(a => a.nama.toLowerCase().includes(searchAnggota.toLowerCase()) || a.nik.includes(searchAnggota))
                        .map(a => a.id);
                      return filteredIds.length > 0 && filteredIds.every(id => selectedAnggotaIds.includes(id));
                    })() 
                      ? { color: '#dc2626', borderColor: '#fecaca', backgroundColor: '#fef2f2' }
                      : { color: '#475569', borderColor: '#e2e8f0', backgroundColor: '#ffffff' })
                  }}
                >
                  <span className="material-icons text-[16px]">
                    {(() => {
                      const filteredIds = semuaAnggota
                        .filter(a => a.nama.toLowerCase().includes(searchAnggota.toLowerCase()) || a.nik.includes(searchAnggota))
                        .map(a => a.id);
                      return filteredIds.length > 0 && filteredIds.every(id => selectedAnggotaIds.includes(id));
                    })() ? 'deselect' : 'select_all'}
                  </span>
                  {(() => {
                    const filteredIds = semuaAnggota
                      .filter(a => a.nama.toLowerCase().includes(searchAnggota.toLowerCase()) || a.nik.includes(searchAnggota))
                      .map(a => a.id);
                    return filteredIds.length > 0 && filteredIds.every(id => selectedAnggotaIds.includes(id));
                  })() ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 bg-slate-50/50">
              {loadingAnggota ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {semuaAnggota
                    .filter(a => a.nama.toLowerCase().includes(searchAnggota.toLowerCase()) || a.nik.includes(searchAnggota))
                    .sort((a, b) => {
                      const aSelected = selectedAnggotaIds.includes(a.id);
                      const bSelected = selectedAnggotaIds.includes(b.id);
                      if (aSelected && !bSelected) return -1;
                      if (!aSelected && bSelected) return 1;
                      return a.nama.localeCompare(b.nama);
                    })
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
        </div>,
        document.body
      )}
    </div>
  );
}
