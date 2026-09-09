import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAlert } from '../AlertProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SkeletonList from '../SkeletonList';
import jsPDF from 'jspdf';

// ============================================================
// ARSIP SURAT MENYURAT — PAC PDI PERJUANGAN KEC. KAWUNGANTEN
// ============================================================

const formatTanggal = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTanggalLengkap = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const JENIS_SURAT_OPTIONS = [
  { value: 'UNDANGAN', label: 'Surat Undangan' },
  { value: 'SURAT_TUGAS', label: 'Surat Tugas / Mandat' },
  { value: 'SURAT_KETERANGAN', label: 'Surat Keterangan' },
  { value: 'SURAT_EDARAN', label: 'Surat Edaran' },
  { value: 'SK_PANITIA', label: 'SK Panitia' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

const STATUS_MASUK_OPTIONS = [
  { value: 'BELUM_DIBACA', label: 'Belum Dibaca', color: 'bg-red-100 text-red-700', icon: 'mark_email_unread' },
  { value: 'DIBACA', label: 'Dibaca', color: 'bg-blue-100 text-blue-700', icon: 'drafts' },
  { value: 'DIPROSES', label: 'Diproses', color: 'bg-amber-100 text-amber-700', icon: 'pending_actions' },
  { value: 'SELESAI', label: 'Selesai', color: 'bg-emerald-100 text-emerald-700', icon: 'check_circle' },
];

const STATUS_KELUAR_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: 'edit_note' },
  { value: 'TERKIRIM', label: 'Terkirim', color: 'bg-blue-100 text-blue-700', icon: 'send' },
  { value: 'SELESAI', label: 'Selesai', color: 'bg-emerald-100 text-emerald-700', icon: 'check_circle' },
];

function getStatusBadge(status: string, type: 'masuk' | 'keluar') {
  const options = type === 'masuk' ? STATUS_MASUK_OPTIONS : STATUS_KELUAR_OPTIONS;
  const opt = options.find(o => o.value === status);
  if (!opt) return { label: status, color: 'bg-slate-100 text-slate-600', icon: 'help' };
  return opt;
}

export default function ArsipSuratView() {
  const { showAlert, showConfirm } = useAlert();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'masuk' | 'keluar'>('masuk');

  // === Surat Masuk State ===
  const [searchMasuk, setSearchMasuk] = useState('');
  const [filterStatusMasuk, setFilterStatusMasuk] = useState('');
  const [isModalMasuk, setIsModalMasuk] = useState(false);
  const [editMasuk, setEditMasuk] = useState<any>(null);
  const [formMasuk, setFormMasuk] = useState({
    nomorSurat: '', tanggalSurat: '', tanggalTerima: '', pengirim: '', perihal: '', isiRingkas: '', disposisi: '',
  });
  const [previewNomorMasuk, setPreviewNomorMasuk] = useState('');
  const [isSubmittingMasuk, setIsSubmittingMasuk] = useState(false);
  const [formErrorMasuk, setFormErrorMasuk] = useState('');
  const [detailMasuk, setDetailMasuk] = useState<any>(null);
  // Upload lampiran
  const [lampiranFile, setLampiranFile] = useState<File | null>(null);
  const [isUploadingLampiran, setIsUploadingLampiran] = useState(false);

  // === Surat Keluar State ===
  const [searchKeluar, setSearchKeluar] = useState('');
  const [filterStatusKeluar, setFilterStatusKeluar] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [isModalKeluar, setIsModalKeluar] = useState(false);
  const [editKeluar, setEditKeluar] = useState<any>(null);
  const [formKeluar, setFormKeluar] = useState({
    tanggalSurat: '', tujuan: '', perihal: '', jenisSurat: 'UNDANGAN', isiRingkas: '',
  });
  const [previewNomorKeluar, setPreviewNomorKeluar] = useState('');
  const [isSubmittingKeluar, setIsSubmittingKeluar] = useState(false);
  const [formErrorKeluar, setFormErrorKeluar] = useState('');
  const [detailKeluar, setDetailKeluar] = useState<any>(null);

  useEffect(() => { setMounted(true); }, []);

  // Fetch preview nomor when modal opens
  useEffect(() => {
    if (isModalMasuk && !editMasuk) {
      fetch('/api/surat-masuk?preview=nomor')
        .then(r => r.json())
        .then(d => { if (d.success) setPreviewNomorMasuk(d.nomor); })
        .catch(() => {});
    }
  }, [isModalMasuk, editMasuk]);

  useEffect(() => {
    if (isModalKeluar && !editKeluar) {
      fetch('/api/surat-keluar?preview=nomor')
        .then(r => r.json())
        .then(d => { if (d.success) setPreviewNomorKeluar(d.nomor); })
        .catch(() => {});
    }
  }, [isModalKeluar, editKeluar]);

  // === Data Queries ===
  const { data: masukData, isLoading: isLoadingMasuk } = useQuery({
    queryKey: ['surat-masuk', searchMasuk, filterStatusMasuk],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchMasuk) params.append('search', searchMasuk);
      if (filterStatusMasuk) params.append('status', filterStatusMasuk);
      const res = await fetch(`/api/surat-masuk?${params.toString()}`);
      const json = await res.json();
      return json.success ? json : { data: [], summary: { total: 0, belumDibaca: 0, dibaca: 0, diproses: 0, selesai: 0 } };
    },
  });

  const { data: keluarData, isLoading: isLoadingKeluar } = useQuery({
    queryKey: ['surat-keluar', searchKeluar, filterStatusKeluar, filterJenis],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchKeluar) params.append('search', searchKeluar);
      if (filterStatusKeluar) params.append('status', filterStatusKeluar);
      if (filterJenis) params.append('jenis', filterJenis);
      const res = await fetch(`/api/surat-keluar?${params.toString()}`);
      const json = await res.json();
      return json.success ? json : { data: [], summary: { total: 0, draft: 0, terkirim: 0, selesai: 0 } };
    },
  });

  const dataMasuk = masukData?.data || [];
  const summaryMasuk = masukData?.summary || { total: 0, belumDibaca: 0, dibaca: 0, diproses: 0, selesai: 0 };
  const dataKeluar = keluarData?.data || [];
  const summaryKeluar = keluarData?.summary || { total: 0, draft: 0, terkirim: 0, selesai: 0 };

  // === Handlers Surat Masuk ===
  const resetFormMasuk = () => {
    setFormMasuk({ nomorSurat: '', tanggalSurat: '', tanggalTerima: '', pengirim: '', perihal: '', isiRingkas: '', disposisi: '' });
    setFormErrorMasuk('');
    setEditMasuk(null);
    setLampiranFile(null);
  };

  const openAddMasuk = () => {
    resetFormMasuk();
    setIsModalMasuk(true);
  };

  const openEditMasuk = (surat: any) => {
    setEditMasuk(surat);
    setFormMasuk({
      nomorSurat: surat.nomorSurat || '',
      tanggalSurat: surat.tanggalSurat ? new Date(surat.tanggalSurat).toISOString().slice(0, 10) : '',
      tanggalTerima: surat.tanggalTerima ? new Date(surat.tanggalTerima).toISOString().slice(0, 10) : '',
      pengirim: surat.pengirim || '',
      perihal: surat.perihal || '',
      isiRingkas: surat.isiRingkas || '',
      disposisi: surat.disposisi || '',
    });
    setFormErrorMasuk('');
    setLampiranFile(null);
    setIsModalMasuk(true);
  };

  const handleSubmitMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMasuk('');

    if (!formMasuk.nomorSurat || !formMasuk.tanggalSurat || !formMasuk.tanggalTerima || !formMasuk.pengirim || !formMasuk.perihal) {
      setFormErrorMasuk('Nomor Surat, Tanggal Surat, Tanggal Terima, Pengirim, dan Perihal wajib diisi!');
      return;
    }

    setIsSubmittingMasuk(true);
    try {
      // Upload lampiran terlebih dahulu jika ada
      let lampiranUrl = editMasuk?.lampiranUrl || null;
      if (lampiranFile) {
        setIsUploadingLampiran(true);
        const formData = new FormData();
        formData.append('file', lampiranFile);
        formData.append('type', 'SURAT');
        formData.append('id', '0');
        formData.append('nama', 'Lampiran');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success) {
          lampiranUrl = uploadJson.url;
        }
        setIsUploadingLampiran(false);
      }

      const payload = {
        ...formMasuk,
        lampiranUrl,
        operator: JSON.parse(localStorage.getItem('user') || '{}').username || 'SYSTEM',
      };

      const url = editMasuk ? `/api/surat-masuk/${editMasuk.id}` : '/api/surat-masuk';
      const method = editMasuk ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        showAlert(editMasuk ? 'Surat masuk berhasil diupdate!' : 'Surat masuk berhasil dicatat!', 'success');
        queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
        setIsModalMasuk(false);
        resetFormMasuk();
      } else {
        setFormErrorMasuk(json.error || 'Gagal menyimpan surat masuk');
      }
    } catch {
      setFormErrorMasuk('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmittingMasuk(false);
      setIsUploadingLampiran(false);
    }
  };

  const handleDeleteMasuk = async (id: number) => {
    const confirmed = await showConfirm('Yakin ingin menghapus surat masuk ini?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/surat-masuk/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showAlert('Surat masuk berhasil dihapus', 'success');
        queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
        if (detailMasuk?.id === id) setDetailMasuk(null);
      }
    } catch { showAlert('Gagal menghapus surat', 'error'); }
  };

  const handleUpdateStatusMasuk = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/surat-masuk/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
        if (detailMasuk?.id === id) setDetailMasuk({ ...detailMasuk, status: newStatus });
      }
    } catch { showAlert('Gagal mengupdate status', 'error'); }
  };

  // === Handlers Surat Keluar ===
  const resetFormKeluar = () => {
    setFormKeluar({ tanggalSurat: '', tujuan: '', perihal: '', jenisSurat: 'UNDANGAN', isiRingkas: '' });
    setFormErrorKeluar('');
    setEditKeluar(null);
  };

  const openAddKeluar = () => {
    resetFormKeluar();
    setIsModalKeluar(true);
  };

  const openEditKeluar = (surat: any) => {
    setEditKeluar(surat);
    setFormKeluar({
      tanggalSurat: surat.tanggalSurat ? new Date(surat.tanggalSurat).toISOString().slice(0, 10) : '',
      tujuan: surat.tujuan || '',
      perihal: surat.perihal || '',
      jenisSurat: surat.jenisSurat || 'UNDANGAN',
      isiRingkas: surat.isiRingkas || '',
    });
    setFormErrorKeluar('');
    setIsModalKeluar(true);
  };

  const handleSubmitKeluar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorKeluar('');

    if (!formKeluar.tanggalSurat || !formKeluar.tujuan || !formKeluar.perihal || !formKeluar.jenisSurat) {
      setFormErrorKeluar('Tanggal Surat, Tujuan, Perihal, dan Jenis Surat wajib diisi!');
      return;
    }

    setIsSubmittingKeluar(true);
    try {
      const payload = {
        ...formKeluar,
        operator: JSON.parse(localStorage.getItem('user') || '{}').username || 'SYSTEM',
      };

      const url = editKeluar ? `/api/surat-keluar/${editKeluar.id}` : '/api/surat-keluar';
      const method = editKeluar ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        showAlert(editKeluar ? 'Surat keluar berhasil diupdate!' : 'Surat keluar berhasil dibuat!', 'success');
        queryClient.invalidateQueries({ queryKey: ['surat-keluar'] });
        setIsModalKeluar(false);
        resetFormKeluar();
      } else {
        setFormErrorKeluar(json.error || 'Gagal menyimpan surat keluar');
      }
    } catch {
      setFormErrorKeluar('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmittingKeluar(false);
    }
  };

  const handleDeleteKeluar = async (id: number) => {
    const confirmed = await showConfirm('Yakin ingin menghapus surat keluar ini?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/surat-keluar/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showAlert('Surat keluar berhasil dihapus', 'success');
        queryClient.invalidateQueries({ queryKey: ['surat-keluar'] });
        if (detailKeluar?.id === id) setDetailKeluar(null);
      }
    } catch { showAlert('Gagal menghapus surat', 'error'); }
  };

  const handleUpdateStatusKeluar = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/surat-keluar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        queryClient.invalidateQueries({ queryKey: ['surat-keluar'] });
        if (detailKeluar?.id === id) setDetailKeluar({ ...detailKeluar, status: newStatus });
      }
    } catch { showAlert('Gagal mengupdate status', 'error'); }
  };

  // === PDF Generator for Surat Keluar ===
  const handleCetakPDF = async (surat: any) => {
    try {
      // Load images
      const loadImgAsBase64 = async (url: string): Promise<string> => {
        const resp = await fetch(url);
        const blob = await resp.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      };

      const [logoB64, stempelB64, ttdKetuaB64, ttdSekretarisB64] = await Promise.all([
        loadImgAsBase64('/images/logopdi.png'),
        loadImgAsBase64('/images/stempel.png'),
        loadImgAsBase64('/images/ttd_ketua.png'),
        loadImgAsBase64('/images/ttd_sekretaris.png'),
      ]);

      const doc = new jsPDF('p', 'mm', [215.9, 330.2]); // F4
      const pw = doc.internal.pageSize.getWidth();
      const ml = 15;
      const mr = 15;
      const contentWidth = pw - ml - mr;
      let y = 15;

      // ===== KOP SURAT =====
      try { doc.addImage(logoB64, 'PNG', ml + 5, y - 3, 22, 27); } catch {}

      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.text("PENGURUS ANAK CABANG", pw / 2, y + 2, { align: "center" });
      y += 8;
      doc.text("PARTAI DEMOKRASI INDONESIA", pw / 2, y + 2, { align: "center" });
      y += 8;
      doc.text("( PAC \u2013 PDI PERJUANGAN )", pw / 2, y + 2, { align: "center" });
      y += 8;
      doc.text("KECAMATAN KAWUNGANTEN", pw / 2, y + 2, { align: "center" });
      y += 6;

      // Double line border
      doc.setLineWidth(0.5);
      doc.line(ml, y, pw - mr, y);
      doc.setLineWidth(1.5);
      doc.line(ml, y + 2, pw - mr, y + 2);
      y += 10;

      // ===== NOMOR, LAMPIRAN, PERIHAL =====
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      doc.text("Nomor", ml, y);
      doc.text(`: ${surat.nomorSurat}`, ml + 25, y);
      doc.text(`Kawunganten, ${formatTanggalLengkap(surat.tanggalSurat)}`, pw - mr, y, { align: "right" });
      y += 6;
      doc.text("Lampiran", ml, y);
      doc.text(": -", ml + 25, y);
      y += 6;
      doc.text("Perihal", ml, y);
      const perihalLines = doc.splitTextToSize(`: ${surat.perihal}`, contentWidth - 25);
      doc.text(perihalLines, ml + 25, y);
      y += perihalLines.length * 6 + 6;

      // ===== TUJUAN =====
      doc.text("Kepada Yth.", ml, y);
      y += 6;
      doc.setFont("helvetica", "bold");
      const tujuanLines = doc.splitTextToSize(`      ${surat.tujuan}`, contentWidth);
      doc.text(tujuanLines, ml, y);
      y += tujuanLines.length * 6 + 2;
      doc.setFont("helvetica", "normal");
      doc.text("      di-", ml, y);
      y += 6;
      doc.text("      TEMPAT", ml, y);
      y += 12;

      // ===== ISI SURAT =====
      if (surat.isiRingkas) {
        const isiLines = doc.splitTextToSize(`\t${surat.isiRingkas}`, contentWidth);
        doc.text(isiLines, ml, y);
        y += isiLines.length * 6 + 6;
      }

      // ===== CLOSING =====
      const closingText = "\tDemikian surat ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan Terima Kasih.";
      const closingLines = doc.splitTextToSize(closingText, contentWidth);
      doc.text(closingLines, ml, y);
      y += closingLines.length * 6 + 16;

      // ===== SIGNATURE =====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("PENGURUS ANAK CABANG", pw / 2, y, { align: "center" });
      y += 7;
      doc.text("PARTAI DEMOKRASI INDONESIA PERJUANGAN", pw / 2, y, { align: "center" });
      y += 7;
      doc.text("KECAMATAN KAWUNGANTEN", pw / 2, y, { align: "center" });
      y += 11;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const leftCol = ml + 35;
      const rightCol = pw - mr - 35;

      // Stempel
      const stempelSize = 45;
      try { doc.addImage(stempelB64, 'PNG', leftCol - 7, y - 9, stempelSize, stempelSize); } catch {}

      doc.text("Ketua", leftCol, y + 2, { align: "center" });
      doc.text("Sekretaris", rightCol, y + 2, { align: "center" });

      // TTD
      const ttdW = 20;
      const ttdH = 22;
      try { doc.addImage(ttdKetuaB64, 'PNG', leftCol - ttdW / 2, y + 4, ttdW, ttdH); } catch {}
      try { doc.addImage(ttdSekretarisB64, 'PNG', rightCol - ttdW / 2, y + 4, ttdW, ttdH); } catch {}

      y += ttdH + 7;

      // Names
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);

      doc.text("TURIJAN", leftCol, y, { align: "center" });
      const ketuaNameW = doc.getTextWidth("TURIJAN");
      doc.setLineWidth(0.3);
      doc.line(leftCol - ketuaNameW / 2, y + 1, leftCol + ketuaNameW / 2, y + 1);

      doc.text("ISNU FADKHUL ROIS", rightCol, y, { align: "center" });
      const sekNameW = doc.getTextWidth("ISNU FADKHUL ROIS");
      doc.line(rightCol - sekNameW / 2, y + 1, rightCol + sekNameW / 2, y + 1);

      const jenisLabel = JENIS_SURAT_OPTIONS.find(j => j.value === surat.jenisSurat)?.label || surat.jenisSurat;
      doc.save(`${jenisLabel.replace(/\s+/g, '_')}_${surat.nomorSurat.replace(/\//g, '-')}.pdf`);

      showAlert('Surat berhasil dicetak sebagai PDF!', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Gagal mencetak PDF', 'error');
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div id="menu-arsipSurat" className="space-y-6 max-w-6xl mx-auto">
      {/* TAB TOGGLE */}
      <div className="flex bg-white rounded-2xl shadow-sm border border-red-100 p-1.5 gap-1.5">
        <button
          onClick={() => setActiveTab('masuk')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'masuk'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-200'
              : 'text-slate-500 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <span className="material-icons text-[18px]">move_to_inbox</span>
          Surat Masuk
          {summaryMasuk.belumDibaca > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'masuk' ? 'bg-white/20 text-white' : 'bg-red-600 text-white'}`}>
              {summaryMasuk.belumDibaca}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('keluar')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'keluar'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-200'
              : 'text-slate-500 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <span className="material-icons text-[18px]">outgoing_mail</span>
          Surat Keluar
        </button>
      </div>

      {/* ============================================ */}
      {/* ====== SURAT MASUK TAB ====== */}
      {/* ============================================ */}
      {activeTab === 'masuk' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'TOTAL', value: summaryMasuk.total, icon: 'mail', gradient: 'from-red-600 to-red-700', shadow: 'shadow-red-200' },
              { label: 'BELUM DIBACA', value: summaryMasuk.belumDibaca, icon: 'mark_email_unread', gradient: 'from-rose-500 to-red-600', shadow: 'shadow-rose-200' },
              { label: 'DIPROSES', value: summaryMasuk.diproses, icon: 'pending_actions', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-200' },
              { label: 'SELESAI', value: summaryMasuk.selesai, icon: 'check_circle', gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-200' },
            ].map((c, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden card-hover">
                <div className="absolute -right-2 -top-2 opacity-[0.06]"><span className="material-icons text-5xl text-red-600">{c.icon}</span></div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`material-icons text-white bg-gradient-to-br ${c.gradient} p-1.5 rounded-lg text-sm ${c.shadow} shadow-sm`}>{c.icon}</span>
                  <span className="font-bold text-[8px] sm:text-[9px] tracking-widest uppercase text-red-400">{c.label}</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-800">{c.value}</span>
              </div>
            ))}
          </div>

          {/* Search + Filter + Add */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Cari nomor surat, pengirim, perihal..."
                value={searchMasuk}
                onChange={e => setSearchMasuk(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all bg-white"
              />
            </div>
            <select value={filterStatusMasuk} onChange={e => setFilterStatusMasuk(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-red-200">
              <option value="">Semua Status</option>
              {STATUS_MASUK_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={openAddMasuk} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95">
              <span className="material-icons text-[18px]">add</span> Catat Surat Masuk
            </button>
          </div>

          {/* List */}
          {isLoadingMasuk ? <SkeletonList rows={4} /> : dataMasuk.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
              <span className="material-icons text-5xl text-slate-300 mb-3 block">inbox</span>
              <p className="text-sm font-bold text-slate-400">Belum ada surat masuk tercatat</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dataMasuk.map((s: any) => {
                const badge = getStatusBadge(s.status, 'masuk');
                return (
                  <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4 flex items-start gap-3 cursor-pointer group" onClick={() => setDetailMasuk(s)}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badge.color}`}>
                      <span className="material-icons text-lg">{badge.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">{s.nomorAgenda}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.color}`}>{badge.label}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 truncate">{s.perihal}</h4>
                      <p className="text-xs text-slate-500 truncate">Dari: <strong>{s.pengirim}</strong> · No: {s.nomorSurat}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatTanggal(s.tanggalSurat)} · Diterima {formatTanggal(s.tanggalTerima)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openEditMasuk(s); }} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors" title="Edit">
                        <span className="material-icons text-[16px]">edit</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteMasuk(s.id); }} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors" title="Hapus">
                        <span className="material-icons text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ============================================ */}
      {/* ====== SURAT KELUAR TAB ====== */}
      {/* ============================================ */}
      {activeTab === 'keluar' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'TOTAL', value: summaryKeluar.total, icon: 'send', gradient: 'from-red-600 to-red-700', shadow: 'shadow-red-200' },
              { label: 'DRAFT', value: summaryKeluar.draft, icon: 'edit_note', gradient: 'from-slate-500 to-slate-600', shadow: 'shadow-slate-200' },
              { label: 'TERKIRIM', value: summaryKeluar.terkirim, icon: 'mark_email_read', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200' },
              { label: 'SELESAI', value: summaryKeluar.selesai, icon: 'check_circle', gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-200' },
            ].map((c, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden card-hover">
                <div className="absolute -right-2 -top-2 opacity-[0.06]"><span className="material-icons text-5xl text-red-600">{c.icon}</span></div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`material-icons text-white bg-gradient-to-br ${c.gradient} p-1.5 rounded-lg text-sm ${c.shadow} shadow-sm`}>{c.icon}</span>
                  <span className="font-bold text-[8px] sm:text-[9px] tracking-widest uppercase text-red-400">{c.label}</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-800">{c.value}</span>
              </div>
            ))}
          </div>

          {/* Search + Filter + Add */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Cari nomor surat, tujuan, perihal..."
                value={searchKeluar}
                onChange={e => setSearchKeluar(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all bg-white"
              />
            </div>
            <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-red-200">
              <option value="">Semua Jenis</option>
              {JENIS_SURAT_OPTIONS.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
            </select>
            <select value={filterStatusKeluar} onChange={e => setFilterStatusKeluar(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-red-200">
              <option value="">Semua Status</option>
              {STATUS_KELUAR_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={openAddKeluar} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95">
              <span className="material-icons text-[18px]">add</span> Buat Surat Keluar
            </button>
          </div>

          {/* List */}
          {isLoadingKeluar ? <SkeletonList rows={4} /> : dataKeluar.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
              <span className="material-icons text-5xl text-slate-300 mb-3 block">outgoing_mail</span>
              <p className="text-sm font-bold text-slate-400">Belum ada surat keluar tercatat</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dataKeluar.map((s: any) => {
                const badge = getStatusBadge(s.status, 'keluar');
                const jenisLabel = JENIS_SURAT_OPTIONS.find(j => j.value === s.jenisSurat)?.label || s.jenisSurat;
                return (
                  <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4 flex items-start gap-3 cursor-pointer group" onClick={() => setDetailKeluar(s)}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badge.color}`}>
                      <span className="material-icons text-lg">{badge.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">{s.nomorSurat}</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{jenisLabel}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.color}`}>{badge.label}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 truncate">{s.perihal}</h4>
                      <p className="text-xs text-slate-500 truncate">Kepada: <strong>{s.tujuan}</strong></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatTanggal(s.tanggalSurat)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleCetakPDF(s); }} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors" title="Cetak PDF">
                        <span className="material-icons text-[16px]">print</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openEditKeluar(s); }} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors" title="Edit">
                        <span className="material-icons text-[16px]">edit</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteKeluar(s.id); }} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors" title="Hapus">
                        <span className="material-icons text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ============================================ */}
      {/* ====== MODAL FORM SURAT MASUK ====== */}
      {/* ============================================ */}
      {mounted && isModalMasuk && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsModalMasuk(false)}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-300" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
              <h3 className="text-base font-black text-slate-800">{editMasuk ? '✏️ Edit Surat Masuk' : '📩 Catat Surat Masuk Baru'}</h3>
              <button onClick={() => setIsModalMasuk(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors">
                <span className="material-icons text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitMasuk} className="p-6 space-y-4">
              {/* Preview Nomor Agenda */}
              {!editMasuk && previewNomorMasuk && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Nomor Agenda (Otomatis)</p>
                  <p className="text-lg font-black text-red-700 tracking-wider">{previewNomorMasuk}</p>
                </div>
              )}
              {editMasuk && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Agenda</p>
                  <p className="text-lg font-black text-slate-700 tracking-wider">{editMasuk.nomorAgenda}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Nomor Surat (dari Pengirim) *</label>
                <input type="text" value={formMasuk.nomorSurat} onChange={e => setFormMasuk({...formMasuk, nomorSurat: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400" placeholder="Contoh: 045/DPC/VIII/2026" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Tanggal Surat *</label>
                  <input type="date" value={formMasuk.tanggalSurat} onChange={e => setFormMasuk({...formMasuk, tanggalSurat: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Tanggal Diterima *</label>
                  <input type="date" value={formMasuk.tanggalTerima} onChange={e => setFormMasuk({...formMasuk, tanggalTerima: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Pengirim *</label>
                <input type="text" value={formMasuk.pengirim} onChange={e => setFormMasuk({...formMasuk, pengirim: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400" placeholder="Contoh: DPC PDI Perjuangan Kab. Cilacap" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Perihal *</label>
                <input type="text" value={formMasuk.perihal} onChange={e => setFormMasuk({...formMasuk, perihal: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400" placeholder="Contoh: Undangan Rakerda" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Ringkasan Isi Surat <span className="text-slate-400 font-normal">(opsional)</span></label>
                <textarea value={formMasuk.isiRingkas} onChange={e => setFormMasuk({...formMasuk, isiRingkas: e.target.value})} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none" placeholder="Ringkasan singkat isi surat..." />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Disposisi <span className="text-slate-400 font-normal">(opsional)</span></label>
                <textarea value={formMasuk.disposisi} onChange={e => setFormMasuk({...formMasuk, disposisi: e.target.value})} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none" placeholder="Catatan disposisi dari pimpinan..." />
              </div>

              {/* Upload Lampiran */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Lampiran (Scan Surat) <span className="text-slate-400 font-normal">(opsional)</span></label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => setLampiranFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm bg-slate-50 file:mr-3 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-red-100 file:text-red-700 file:text-xs file:font-bold hover:border-red-300 transition-colors cursor-pointer"
                  />
                </div>
                {lampiranFile && <p className="text-[10px] text-emerald-600 mt-1 font-bold">📎 {lampiranFile.name}</p>}
                {editMasuk?.lampiranUrl && !lampiranFile && (
                  <p className="text-[10px] text-blue-600 mt-1 font-bold">📎 Lampiran sudah ada (tidak akan diganti)</p>
                )}
              </div>

              {formErrorMasuk && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-bold">{formErrorMasuk}</div>
              )}

              <button type="submit" disabled={isSubmittingMasuk} className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmittingMasuk ? (
                  <><span className="material-icons text-[18px] animate-spin">autorenew</span> {isUploadingLampiran ? 'Mengunggah lampiran...' : 'Menyimpan...'}</>
                ) : (
                  <><span className="material-icons text-[18px]">{editMasuk ? 'save' : 'add'}</span> {editMasuk ? 'Simpan Perubahan' : 'Catat Surat Masuk'}</>
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================ */}
      {/* ====== MODAL FORM SURAT KELUAR ====== */}
      {/* ============================================ */}
      {mounted && isModalKeluar && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsModalKeluar(false)}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-300" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
              <h3 className="text-base font-black text-slate-800">{editKeluar ? '✏️ Edit Surat Keluar' : '📤 Buat Surat Keluar Baru'}</h3>
              <button onClick={() => setIsModalKeluar(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors">
                <span className="material-icons text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitKeluar} className="p-6 space-y-4">
              {/* Preview Nomor Surat */}
              {!editKeluar && previewNomorKeluar && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Nomor Surat (Otomatis)</p>
                  <p className="text-lg font-black text-red-700 tracking-wider">{previewNomorKeluar}</p>
                </div>
              )}
              {editKeluar && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Surat</p>
                  <p className="text-lg font-black text-slate-700 tracking-wider">{editKeluar.nomorSurat}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Jenis Surat *</label>
                <select value={formKeluar.jenisSurat} onChange={e => setFormKeluar({...formKeluar, jenisSurat: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white">
                  {JENIS_SURAT_OPTIONS.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Tanggal Surat *</label>
                <input type="date" value={formKeluar.tanggalSurat} onChange={e => setFormKeluar({...formKeluar, tanggalSurat: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Tujuan *</label>
                <input type="text" value={formKeluar.tujuan} onChange={e => setFormKeluar({...formKeluar, tujuan: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400" placeholder="Contoh: Pengurus Ranting Desa Kawunganten" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Perihal *</label>
                <input type="text" value={formKeluar.perihal} onChange={e => setFormKeluar({...formKeluar, perihal: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400" placeholder="Contoh: Undangan Rapat Pleno" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Isi Surat <span className="text-slate-400 font-normal">(opsional, akan masuk ke badan surat PDF)</span></label>
                <textarea value={formKeluar.isiRingkas} onChange={e => setFormKeluar({...formKeluar, isiRingkas: e.target.value})} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none" placeholder="Isi badan surat yang akan dimuat di PDF..." />
              </div>

              {formErrorKeluar && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-bold">{formErrorKeluar}</div>
              )}

              <button type="submit" disabled={isSubmittingKeluar} className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmittingKeluar ? (
                  <><span className="material-icons text-[18px] animate-spin">autorenew</span> Menyimpan...</>
                ) : (
                  <><span className="material-icons text-[18px]">{editKeluar ? 'save' : 'add'}</span> {editKeluar ? 'Simpan Perubahan' : 'Buat Surat Keluar'}</>
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================ */}
      {/* ====== DETAIL SURAT MASUK POPUP ====== */}
      {/* ============================================ */}
      {mounted && detailMasuk && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setDetailMasuk(null)}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-300" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
              <h3 className="text-base font-black text-slate-800">📩 Detail Surat Masuk</h3>
              <button onClick={() => setDetailMasuk(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors">
                <span className="material-icons text-[18px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Nomor Agenda */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Nomor Agenda</p>
                <p className="text-lg font-black text-red-700">{detailMasuk.nomorAgenda}</p>
              </div>

              {/* Info Fields */}
              <div className="space-y-3">
                {[
                  { label: 'Nomor Surat', value: detailMasuk.nomorSurat, icon: 'tag' },
                  { label: 'Pengirim', value: detailMasuk.pengirim, icon: 'business' },
                  { label: 'Perihal', value: detailMasuk.perihal, icon: 'subject' },
                  { label: 'Tanggal Surat', value: formatTanggal(detailMasuk.tanggalSurat), icon: 'calendar_today' },
                  { label: 'Tanggal Diterima', value: formatTanggal(detailMasuk.tanggalTerima), icon: 'event_available' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="material-icons text-red-400 text-[16px] mt-0.5 shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm font-semibold text-slate-700">{f.value || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Isi Ringkas */}
              {detailMasuk.isiRingkas && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ringkasan Isi</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{detailMasuk.isiRingkas}</p>
                </div>
              )}

              {/* Disposisi */}
              {detailMasuk.disposisi && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">📋 Disposisi</p>
                  <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">{detailMasuk.disposisi}</p>
                </div>
              )}

              {/* Lampiran */}
              {detailMasuk.lampiranUrl && (
                <a href={detailMasuk.lampiranUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 hover:bg-blue-100 transition-colors">
                  <span className="material-icons text-blue-600 text-lg">attachment</span>
                  <span className="text-sm font-bold text-blue-700">Lihat / Download Lampiran</span>
                </a>
              )}

              {/* Status Changer */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ubah Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_MASUK_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleUpdateStatusMasuk(detailMasuk.id, opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        detailMasuk.status === opt.value
                          ? `${opt.color} ring-2 ring-offset-1 ring-current shadow-sm`
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-icons text-[14px] mr-1 align-middle">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setDetailMasuk(null); openEditMasuk(detailMasuk); }} className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                  <span className="material-icons text-[16px]">edit</span> Edit
                </button>
                <button onClick={() => { handleDeleteMasuk(detailMasuk.id); }} className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                  <span className="material-icons text-[16px]">delete</span> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================ */}
      {/* ====== DETAIL SURAT KELUAR POPUP ====== */}
      {/* ============================================ */}
      {mounted && detailKeluar && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setDetailKeluar(null)}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-300" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
              <h3 className="text-base font-black text-slate-800">📤 Detail Surat Keluar</h3>
              <button onClick={() => setDetailKeluar(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors">
                <span className="material-icons text-[18px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Nomor Surat */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Nomor Surat</p>
                <p className="text-lg font-black text-red-700">{detailKeluar.nomorSurat}</p>
              </div>

              {/* Info Fields */}
              <div className="space-y-3">
                {[
                  { label: 'Jenis Surat', value: JENIS_SURAT_OPTIONS.find(j => j.value === detailKeluar.jenisSurat)?.label || detailKeluar.jenisSurat, icon: 'category' },
                  { label: 'Tujuan', value: detailKeluar.tujuan, icon: 'person' },
                  { label: 'Perihal', value: detailKeluar.perihal, icon: 'subject' },
                  { label: 'Tanggal Surat', value: formatTanggal(detailKeluar.tanggalSurat), icon: 'calendar_today' },
                  { label: 'Operator', value: detailKeluar.operator || '-', icon: 'admin_panel_settings' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="material-icons text-red-400 text-[16px] mt-0.5 shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm font-semibold text-slate-700">{f.value || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Isi Surat */}
              {detailKeluar.isiRingkas && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Isi Surat</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{detailKeluar.isiRingkas}</p>
                </div>
              )}

              {/* Status Changer */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ubah Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_KELUAR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleUpdateStatusKeluar(detailKeluar.id, opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        detailKeluar.status === opt.value
                          ? `${opt.color} ring-2 ring-offset-1 ring-current shadow-sm`
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-icons text-[14px] mr-1 align-middle">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button onClick={() => handleCetakPDF(detailKeluar)} className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                  <span className="material-icons text-[16px]">print</span> Cetak PDF
                </button>
                <button onClick={() => { setDetailKeluar(null); openEditKeluar(detailKeluar); }} className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                  <span className="material-icons text-[16px]">edit</span> Edit
                </button>
                <button onClick={() => { handleDeleteKeluar(detailKeluar.id); }} className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                  <span className="material-icons text-[16px]">delete</span> Hapus
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
