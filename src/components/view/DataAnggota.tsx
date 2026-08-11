import React, { useState, useEffect } from 'react';

function getDirectImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
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

interface WilayahItem {
  id: number;
  kecamatan: string;
  desa: string;
  dusun: string;
}

export default function DataAnggotaView({ filter }: { filter?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bagian, setBagian] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [desa, setDesa] = useState('');
  const [dusun, setDusun] = useState('');
  const [selectedAnggota, setSelectedAnggota] = useState<any>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Wilayah data for filters
  const [wilayahList, setWilayahList] = useState<WilayahItem[]>([]);
  const [desaList, setDesaList] = useState<string[]>([]);
  const [dusunList, setDusunList] = useState<string[]>([]);

  // Form state for input baru
  const [formData, setFormData] = useState({
    nik: '', nama: '', tanggalLahir: '', jenisKelamin: '', umur: '',
    nomorHp: '', bagian: '', jabatan: '', kecamatan: '', desa: '', dusun: '',
    fotoKtpUrl: '', passFotoUrl: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload & OCR State
  const [fileKtp, setFileKtp] = useState<File | null>(null);
  const [filePassFoto, setFilePassFoto] = useState<File | null>(null);
  const [ocrStatus, setOcrStatus] = useState('');

  const uploadFile = async (file: File, type: string, id: number, nama: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    fd.append('id', id.toString());
    fd.append('nama', nama);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    return res.json();
  };

  const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileKtp(e.target.files[0]);
      setOcrStatus('');
    } else {
      setFileKtp(null);
      setOcrStatus('');
    }
  };

  const handleScanKtp = async () => {
    if (!fileKtp) {
      setOcrStatus('Pilih file KTP terlebih dahulu.');
      return;
    }
    setOcrStatus('Memindai KTP dengan AI (harap tunggu)...');
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const worker = await Tesseract.createWorker('ind');
      const { data: { text } } = await worker.recognize(fileKtp);
      await worker.terminate();

      setOcrStatus('Selesai memindai.');
      
      // Extract NIK
      const cleaned = text.replace(/[^a-zA-Z0-9\n:-]/g, ' ').replace(/\s+/g, ' ');
      const rawDigits = text.replace(/\D/g, '');
      const nikMatch = rawDigits.match(/\d{16}/);
      if (nikMatch) handleFormChange('nik', nikMatch[0]);
      
      // Extract Tanggal Lahir (DD-MM-YYYY)
      const tglMatch = text.match(/\b\d{2}-\d{2}-\d{4}\b/);
      if (tglMatch) handleFormChange('tanggalLahir', tglMatch[0]);

      // Extract Jenis Kelamin
      const textLower = text.toLowerCase();
      if (textLower.includes('laki')) {
        handleFormChange('jenisKelamin', 'LAKI-LAKI');
      } else if (textLower.includes('perempuan')) {
        handleFormChange('jenisKelamin', 'PEREMPUAN');
      }

      // Extract Nama
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('nama')) {
          let namaRaw = lines[i].replace(/nama/i, '').replace(/[:;-]/g, '').replace(/[^a-zA-Z\s]/g, '').trim();
          if (namaRaw.length > 2) {
            handleFormChange('nama', namaRaw);
          } else if (i + 1 < lines.length) {
            handleFormChange('nama', lines[i+1].replace(/[^a-zA-Z\s]/g, '').trim());
          }
          break;
        }
      }
    } catch (err) {
      setOcrStatus('Gagal memindai teks.');
      console.error(err);
    }
  };

  // Load wilayah data
  useEffect(() => {
    fetch('/api/wilayah').then(r => r.json()).then(json => {
      if (json.success) {
        setWilayahList(json.data);
        const desas = Array.from(new Set(json.data.map((w: WilayahItem) => w.desa))).sort() as string[];
        setDesaList(desas);
      }
    }).catch(console.error);
  }, []);



  // Update dusun list when desa changes
  useEffect(() => {
    if (desa) {
      const dusuns = Array.from(new Set(wilayahList.filter(w => w.desa === desa).map(w => w.dusun).filter(Boolean))).sort() as string[];
      setDusunList(dusuns);
    } else {
      setDusunList([]);
    }
    setDusun('');
  }, [desa, wilayahList]);

  useEffect(() => {
    fetchData();
  }, [bagian, jabatan, kecamatan, desa, dusun]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (bagian) params.append('bagian', bagian);
      if (jabatan) params.append('jabatan', jabatan);
      if (kecamatan) params.append('kecamatan', kecamatan);
      if (desa) params.append('desa', desa);
      if (dusun) params.append('dusun', dusun);
      if (filter) params.append('filter', filter);

      const res = await fetch(`/api/anggota?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => { fetchData(); };
  const handleReset = () => {
    setSearch(''); setBagian(''); setJabatan(''); setKecamatan(''); setDesa(''); setDusun('');
    setTimeout(fetchData, 100);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
      setEditId(selectedAnggota.id);
      setFormData({
          nik: selectedAnggota.nik || '',
          nama: selectedAnggota.nama || '',
          tanggalLahir: selectedAnggota.tanggalLahir || '',
          jenisKelamin: selectedAnggota.jenisKelamin || '',
          umur: selectedAnggota.umur?.toString() || '',
          nomorHp: selectedAnggota.nomorHp || '',
          bagian: selectedAnggota.bagian || '',
          jabatan: selectedAnggota.jabatan || '',
          kecamatan: selectedAnggota.kecamatan || '',
          desa: selectedAnggota.desa || '',
          dusun: selectedAnggota.dusun || '',
          fotoKtpUrl: selectedAnggota.fotoKtpUrl || '',
          passFotoUrl: selectedAnggota.passFotoUrl || ''
      });
      setFileKtp(null);
      setFilePassFoto(null);
      setFormError('');
      setFormSuccess('');
      setIsModalOpen(true);
      setSelectedAnggota(null);
  };

  const handleDelete = async () => {
      if (!window.confirm("Apakah Anda yakin ingin menghapus data anggota ini secara permanen?")) return;
      try {
          const res = await fetch(`/api/anggota/${selectedAnggota.id}`, { method: 'DELETE' });
          const json = await res.json();
          if (res.ok && json.success) {
              alert("Data berhasil dihapus!");
              setSelectedAnggota(null);
              fetchData();
          } else {
              alert(json.error || "Gagal menghapus data");
          }
      } catch (e) {
          alert("Terjadi kesalahan koneksi");
      }
  };

  const handleSubmitAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.nik || !formData.nama) {
      setFormError('NIK dan Nama wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        nik: formData.nik,
        nama: formData.nama,
        tanggalLahir: formData.tanggalLahir || null,
        jenisKelamin: formData.jenisKelamin || null,
        umur: formData.umur ? parseInt(formData.umur) : null,
        nomorHp: formData.nomorHp || null,
        bagian: formData.bagian || null,
        jabatan: formData.jabatan || null,
        kecamatan: formData.kecamatan || null,
        desa: formData.desa || null,
        dusun: formData.dusun || null,
        fotoKtpUrl: formData.fotoKtpUrl || null,
        passFotoUrl: formData.passFotoUrl || null,
      };

      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/anggota/${editId}` : '/api/anggota';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (res.ok && json.success) {
        const targetId = editId || json.data.id;
        
        if (fileKtp || filePassFoto) {
            setFormSuccess('Menyimpan foto...');
            let uploadSuccess = true;
            if (fileKtp) {
                const ktpRes = await uploadFile(fileKtp, 'KTP', targetId, formData.nama);
                if (!ktpRes.success) uploadSuccess = false;
            }
            if (filePassFoto) {
                const passRes = await uploadFile(filePassFoto, 'PASSFOTO', targetId, formData.nama);
                if (!passRes.success) uploadSuccess = false;
            }
            if (uploadSuccess) {
                setFormSuccess('Data & Foto berhasil disimpan!');
            } else {
                setFormSuccess('Data disimpan, namun sebagian foto gagal diunggah.');
            }
        } else {
            setFormSuccess(editId ? 'Data anggota berhasil diperbarui!' : 'Anggota berhasil ditambahkan!');
        }

        setFormData({ nik: '', nama: '', tanggalLahir: '', jenisKelamin: '', umur: '', nomorHp: '', bagian: '', jabatan: '', kecamatan: '', desa: '', dusun: '', fotoKtpUrl: '', passFotoUrl: '' });
        setFileKtp(null);
        setFilePassFoto(null);
        setOcrStatus('');
        setEditId(null);
        fetchData();
        setTimeout(() => { setIsModalOpen(false); setFormSuccess(''); }, 1500);
      } else {
        setFormError(json.error || 'Gagal menyimpan data anggota');
      }
    } catch (err) {
      setFormError('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="menu-dataAnggota" className="space-y-5 max-w-6xl mx-auto">
        {/* FILTER DATA */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-red-100 shadow-sm theme-el mb-6">
            <h3 className="text-xs md:text-sm font-extrabold text-red-700 uppercase tracking-wider flex items-center gap-2 mb-4">
                <span className="material-icons text-red-600 bg-red-100 p-1.5 rounded-lg text-lg">filter_alt</span>
                FILTER PENCARIAN
                {filter === 'verifikasi' && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] ml-2">MODE VERIFIKASI</span>}
            </h3>
            
            <div className="flex flex-col md:flex-row gap-3">
                <input type="text" placeholder="Tulis Nama/NIK..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="flex-1 p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-red-50 text-xs text-red-900" />

                <select value={bagian} onChange={e => setBagian(e.target.value)} className="w-full md:w-32 p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs">
                    <option value="">- Bagian -</option>
                    <option value="PAC">PAC</option>
                    <option value="RANTING">RANTING</option>
                    <option value="ANAK RANTING">ANAK RANTING</option>
                    <option value="SATGAS">SATGAS</option>
                </select>

                <select value={jabatan} onChange={e => setJabatan(e.target.value)} className="w-full md:w-32 p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs">
                    <option value="">- Jabatan -</option>
                    <option value="KETUA">KETUA</option>
                    <option value="SEKRETARIS">SEKRETARIS</option>
                    <option value="BENDAHARA">BENDAHARA</option>
                    <option value="ANGGOTA">ANGGOTA</option>
                </select>

                {/* Filter Desa */}
                <select value={desa} onChange={e => setDesa(e.target.value)} className="w-full md:w-32 p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs">
                    <option value="">- Desa -</option>
                    {desaList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {/* Filter Dusun */}
                <select value={dusun} onChange={e => setDusun(e.target.value)} className="w-full md:w-32 p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs" disabled={!desa}>
                    <option value="">- Dusun -</option>
                    {dusunList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <div className="flex gap-2">
                    <button onClick={handleReset} className="w-11 h-11 border border-red-200 rounded-xl text-red-600 flex items-center justify-center hover:bg-red-50 transition" title="Reset Filter">
                        <span className="material-icons text-xl">restart_alt</span>
                    </button>
                    <button onClick={handleSearch} className="w-11 h-11 bg-red-700 text-white rounded-xl hover:bg-red-800 shadow-md transition flex items-center justify-center" title="Cari Data">
                        <span className="material-icons text-xl">search</span>
                    </button>
                </div>
            </div>
        </div>

        {/* ACTION PANEL INPUT DATA */}
        <div className="mb-6 flex justify-center md:justify-end">
            <button onClick={() => { setIsModalOpen(true); setFormError(''); setFormSuccess(''); }}
                className="w-full md:w-auto bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg font-bold flex items-center justify-center gap-2 transform active:scale-95 transition-all duration-300 text-sm">
                <span className="material-icons">add_circle</span> INPUT DATA BARU
            </button>
        </div>

        {/* LIST DATA */}
        <div className="space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-red-100 theme-el">
                {/* Header (Desa/Dusun title) */}
                <div className="flex items-center justify-between border-b border-red-50 pb-4 mb-4">
                    <h3 className="text-xs md:text-sm font-extrabold text-red-700 uppercase tracking-wider flex items-center gap-2">
                        <span className="material-icons text-red-600 bg-red-100 p-1.5 rounded-lg text-lg">location_on</span>
                        {dusun ? `DUSUN: ${dusun}` : desa ? `DESA: ${desa}` : 'SEMUA WILAYAH'}
                    </h3>
                    <span className="bg-red-700 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">{data.length} DATA</span>
                </div>

                {isLoading ? (
                    <p className="text-center text-slate-500 py-8">Memuat Data Anggota...</p>
                ) : data.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Tidak ada data anggota yang ditemukan.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {data.map((item, index) => {
                            const isLengkap = item.fotoKtpUrl && item.passFotoUrl && item.nik;
                            return (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white hover:bg-red-50/30 rounded-2xl border border-slate-100 transition duration-200 group">
                                    <div className="flex items-center gap-4">
                                        {/* Kolom ID */}
                                        <div className="w-8 text-center text-[10px] font-bold text-slate-400">#{item.id}</div>
                                        
                                        {/* Foto */}
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-red-200 shadow-sm flex-shrink-0">
                                            {item.passFotoUrl ? (
                                                <img src={getDirectImageUrl(item.passFotoUrl) || ''} alt={item.nama} className="w-full h-full object-cover"
                                                     onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-red-100 text-red-500"><span class="material-icons text-xl">person</span></div>'; }} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-400"><span className="material-icons text-xl">person</span></div>
                                            )}
                                        </div>
                                        
                                        {/* Info */}
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <h4 className="text-sm font-black text-red-900 tracking-tight">{item.nama}</h4>
                                                {isLengkap && <span className="material-icons text-emerald-500 text-[16px]" title="Data Lengkap">verified</span>}
                                            </div>
                                            <div className="text-[10px] md:text-xs font-bold tracking-wider flex items-center flex-wrap gap-1.5">
                                                <span className="text-red-500">{item.bagian || '-'}</span>
                                                <span className="text-red-200">|</span>
                                                <span className="text-red-700">{item.jabatan || '-'}</span>
                                                <span className="text-red-200">|</span>
                                                <span className="text-red-500">{item.jenisKelamin || '-'}</span>
                                                <span className="text-red-200">|</span>
                                                <span className="text-red-500">{item.umur ? `${item.umur} THN` : '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mt-4 sm:mt-0 pl-16 sm:pl-0">
                                        {item.nomorHp && (
                                            <a href={`https://wa.me/${item.nomorHp.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center transition" title="WhatsApp">
                                                <span className="material-icons text-[18px]">chat</span>
                                            </a>
                                        )}
                                        <button onClick={() => setSelectedAnggota(item)} className="w-9 h-9 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center justify-center transition" title="Lihat Detail">
                                            <span className="material-icons text-[18px]">visibility</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>

        {/* MODAL DETAIL ANGGOTA */}
        {selectedAnggota && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="bg-slate-50 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col border border-red-100 max-h-[95vh] my-auto">
                    {/* Header Background */}
                    <div className="bg-red-700 h-32 w-full absolute top-0 left-0 rounded-b-[20%]"></div>
                    
                    {/* Close Button */}
                    <button onClick={() => setSelectedAnggota(null)} className="absolute top-4 right-4 z-10 text-red-100 hover:text-white transition bg-red-800/50 hover:bg-red-800 p-1.5 rounded-full backdrop-blur-md">
                        <span className="material-icons text-sm block">close</span>
                    </button>

                    {/* Content Scrollable */}
                    <div className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-6 mt-12 scrollbar-hide">
                        {/* Avatar */}
                        <div className="flex justify-center mb-4">
                             <div className="w-28 h-28 rounded-2xl bg-slate-200 overflow-hidden border-[6px] border-white shadow-xl group relative cursor-pointer" onClick={() => selectedAnggota.passFotoUrl && setFullScreenImage(getDirectImageUrl(selectedAnggota.passFotoUrl))}>
                                 {selectedAnggota.passFotoUrl ? (
                                     <>
                                        <img src={getDirectImageUrl(selectedAnggota.passFotoUrl) || ''} alt={selectedAnggota.nama} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <span className="material-icons text-white text-3xl drop-shadow-md">zoom_in</span>
                                        </div>
                                     </>
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-500"><span className="material-icons text-4xl">person</span></div>
                                 )}
                             </div>
                        </div>

                        {/* Name & Badges */}
                        <div className="text-center mb-6">
                            <h3 className="font-black text-xl text-slate-800 tracking-tight mb-2">{selectedAnggota.nama}</h3>
                            <div className="flex justify-center gap-2">
                                <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">{selectedAnggota.bagian || '-'}</span>
                                <span className="bg-white text-red-600 border border-red-200 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">{selectedAnggota.jabatan || '-'}</span>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-3 mb-6">
                            {/* Card 1: ID & NIK */}
                            <div className="flex gap-3">
                                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-1">
                                    <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-icons text-[10px]">tag</span> ID SISTEM</p>
                                    <p className="font-black text-slate-700 text-sm">{selectedAnggota.id}</p>
                                </div>
                                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-1">
                                    <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-icons text-[10px]">badge</span> NOMOR NIK</p>
                                    <p className="font-black text-slate-700 text-sm tracking-wide">{selectedAnggota.nik}</p>
                                </div>
                            </div>

                            {/* Card 2: TTL & Jenis Kelamin */}
                            <div className="flex gap-3">
                                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-[3]">
                                    <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-icons text-[10px]">cake</span> TTL (UMUR)</p>
                                    <p className="font-bold text-slate-700 text-xs">{selectedAnggota.tanggalLahir || '-'} {selectedAnggota.umur ? `(${selectedAnggota.umur} Tahun)` : ''}</p>
                                </div>
                                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-[2]">
                                    <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-icons text-[10px]">wc</span> JENIS KELAMIN</p>
                                    <p className="font-bold text-slate-700 text-xs">{selectedAnggota.jenisKelamin || '-'}</p>
                                </div>
                            </div>

                            {/* Card 3: WhatsApp */}
                            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-icons text-[10px]">phone</span> KONTAK WHATSAPP</p>
                                    <p className="font-black text-slate-700 text-sm tracking-wide">{selectedAnggota.nomorHp || '-'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <a href={`https://wa.me/${selectedAnggota.nomorHp?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center text-white shadow-sm transition transform hover:scale-105">
                                        <span className="material-icons text-sm">chat</span>
                                    </a>
                                    <a href={`tel:${selectedAnggota.nomorHp?.replace(/\D/g,'')}`} className="w-8 h-8 bg-slate-700 hover:bg-slate-800 rounded-lg flex items-center justify-center text-white shadow-sm transition transform hover:scale-105">
                                        <span className="material-icons text-sm">contacts</span>
                                    </a>
                                </div>
                            </div>

                            {/* Card 4: Alamat */}
                            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-icons text-[10px]">location_on</span> ALAMAT DOMISILI</p>
                                <p className="font-bold text-slate-700 text-xs leading-relaxed">
                                    {selectedAnggota.dusun ? `Dsn. ${selectedAnggota.dusun}, ` : ''}
                                    {selectedAnggota.desa ? `Ds. ${selectedAnggota.desa}, ` : ''}
                                    Kec. KAWUNGANTEN
                                </p>
                            </div>

                            {/* Card 5: KTP */}
                            {selectedAnggota.fotoKtpUrl && (
                                <div className="mt-2">
                                    <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1"><span className="material-icons text-[10px]">credit_card</span> FOTO KTP</p>
                                    <div className="relative group rounded-2xl border-2 border-dashed border-red-200 overflow-hidden bg-white p-1 cursor-pointer" onClick={() => setFullScreenImage(getDirectImageUrl(selectedAnggota.fotoKtpUrl) || null)}>
                                        <img src={getDirectImageUrl(selectedAnggota.fotoKtpUrl) || ''} alt="Foto KTP" className="w-full rounded-xl object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <span className="material-icons text-white text-4xl drop-shadow-md">zoom_in</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* CTA Button */}
                        <div className="flex gap-2">
                            <button onClick={handleEdit} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white p-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-500/30 flex justify-center items-center gap-2 transition transform active:scale-95">
                                <span className="material-icons text-base">edit</span> EDIT
                            </button>
                            <button onClick={handleDelete} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white p-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-800/30 flex justify-center items-center gap-2 transition transform active:scale-95">
                                <span className="material-icons text-base">delete</span> HAPUS
                            </button>
                        </div>
                        <button onClick={() => { setIsPrinting(true); setTimeout(() => window.print(), 300); setTimeout(() => setIsPrinting(false), 2000); }} 
                                className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white p-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 flex justify-center items-center gap-2 transition transform active:scale-95">
                            <span className="material-icons text-base">badge</span> BUAT KARTU ANGGOTA DIGITAL
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL INPUT DATA BARU */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-red-200">
                    <div className="bg-red-700 p-4 sm:p-5 text-white flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <span className="material-icons text-white text-lg">edit_document</span>
                            <h3 className="font-extrabold text-sm sm:text-base tracking-wide">{editId ? 'Edit Data Anggota' : 'Input Data Anggota Baru'}</h3>
                        </div>
                        <button onClick={() => { setIsModalOpen(false); setEditId(null); setFormData({ nik: '', nama: '', tanggalLahir: '', jenisKelamin: '', umur: '', nomorHp: '', bagian: '', jabatan: '', kecamatan: '', desa: '', dusun: '', fotoKtpUrl: '', passFotoUrl: '' }); }} className="text-red-100 hover:text-white transition bg-red-800 p-1.5 rounded-lg"><span className="material-icons text-sm block">close</span></button>
                    </div>
                    <form onSubmit={handleSubmitAnggota} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm text-slate-800 bg-red-50/30">
                        {formError && <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center font-bold text-xs">{formError}</div>}
                        {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100 text-center font-bold text-xs">{formSuccess}</div>}

                        {/* Top: Upload KTP */}
                        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col gap-3">
                            <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest">Unggah Foto KTP</label>
                            <div className="border-2 border-dashed border-red-200 rounded-xl p-3 flex items-center gap-3">
                                <label className="cursor-pointer bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition">
                                    Pilih File
                                    <input type="file" accept="image/*" onChange={handleKtpChange} className="hidden" />
                                </label>
                                <span className="text-xs text-slate-400 font-medium">{fileKtp ? fileKtp.name : 'Tidak ada file yang dipilih'}</span>
                            </div>

                            {(fileKtp || formData.fotoKtpUrl) && (
                                <div className="mt-1 flex gap-4 bg-red-50/50 p-3 rounded-xl border border-red-100 overflow-x-auto">
                                    {formData.fotoKtpUrl && (
                                        <div className="flex flex-col items-center flex-shrink-0">
                                            <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2">FOTO KTP SAAT INI:</span>
                                            <img src={getDirectImageUrl(formData.fotoKtpUrl) || ''} alt="KTP Saat Ini" className="max-h-48 object-contain rounded-lg shadow-sm" />
                                        </div>
                                    )}
                                    {fileKtp && (
                                        <div className="flex flex-col items-center flex-shrink-0">
                                            <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-2">FOTO KTP BARU:</span>
                                            <img src={URL.createObjectURL(fileKtp)} alt="Preview KTP Baru" className="max-h-48 object-contain rounded-lg shadow-sm border-2 border-green-400" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-3 mt-1">
                                <button type="button" onClick={handleScanKtp} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-2">
                                    <span className="material-icons text-sm">document_scanner</span> Scan Data dari KTP
                                </button>
                                <span className="text-xs text-red-500 font-semibold">{ocrStatus || 'Bantu isi NIK, Nama & TTL otomatis'}</span>
                            </div>
                        </div>

                        {/* Middle: Data Fields */}
                        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1.5">Nomor NIK</label>
                                    <input type="text" value={formData.nik} onChange={e => handleFormChange('nik', e.target.value)} className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 transition text-xs font-semibold text-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                                    <input type="text" value={formData.nama} onChange={e => handleFormChange('nama', e.target.value)} className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 transition text-xs font-semibold text-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1.5">Tanggal Lahir</label>
                                    <input type="text" value={formData.tanggalLahir} onChange={e => handleFormChange('tanggalLahir', e.target.value)} placeholder="DD-MM-YYYY" className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 transition text-xs font-semibold text-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1.5">Jenis Kelamin</label>
                                    <select value={formData.jenisKelamin} onChange={e => handleFormChange('jenisKelamin', e.target.value)} className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 transition text-xs font-semibold text-slate-700">
                                        <option value="">- Pilih -</option>
                                        <option value="LAKI-LAKI">LAKI-LAKI</option>
                                        <option value="PEREMPUAN">PEREMPUAN</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1.5">Nomor Handphone (WA)</label>
                                    <input type="text" value={formData.nomorHp} onChange={e => handleFormChange('nomorHp', e.target.value)} placeholder="08..." className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 transition text-xs font-semibold text-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1.5">Posisi Bagian</label>
                                    <select value={formData.bagian} onChange={e => handleFormChange('bagian', e.target.value)} className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 transition text-xs font-semibold text-slate-700">
                                        <option value="">- Pilih -</option>
                                        <option value="PAC">PAC</option>
                                        <option value="RANTING">RANTING</option>
                                        <option value="ANAK RANTING">ANAK RANTING</option>
                                        <option value="SATGAS">SATGAS</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1.5">Jabatan Struktural</label>
                                    <select value={formData.jabatan} onChange={e => handleFormChange('jabatan', e.target.value)} className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 transition text-xs font-semibold text-slate-700">
                                        <option value="">- Pilih -</option>
                                        <option value="KETUA">KETUA</option>
                                        <option value="SEKRETARIS">SEKRETARIS</option>
                                        <option value="BENDAHARA">BENDAHARA</option>
                                        <option value="ANGGOTA">ANGGOTA</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Wilayah */}
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1.5">Desa</label>
                                <select value={formData.desa} onChange={e => handleFormChange('desa', e.target.value)} className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 transition text-xs font-semibold text-slate-700 bg-white">
                                    <option value="">- Pilih -</option>
                                    {desaList.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1.5">Dusun</label>
                                <select value={formData.dusun} onChange={e => handleFormChange('dusun', e.target.value)} className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 transition text-xs font-semibold text-slate-700 bg-white">
                                    <option value="">- Pilih -</option>
                                    {wilayahList.filter(w => w.desa === formData.desa && w.dusun).map(w => w.dusun).map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Bottom: Upload Pass Foto */}
                        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col gap-3">
                            <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest">Unggah Pass Foto</label>
                            <div className="border-2 border-dashed border-red-200 rounded-xl p-3 flex items-center gap-3">
                                <label className="cursor-pointer bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition">
                                    Pilih File
                                    <input type="file" accept="image/*" onChange={(e) => { if(e.target.files) setFilePassFoto(e.target.files[0]) }} className="hidden" />
                                </label>
                                <span className="text-xs text-slate-400 font-medium">{filePassFoto ? filePassFoto.name : 'Tidak ada file yang dipilih'}</span>
                            </div>

                            {(filePassFoto || formData.passFotoUrl) && (
                                <div className="mt-1 flex gap-4 bg-red-50/50 p-3 rounded-xl border border-red-100 overflow-x-auto">
                                    {formData.passFotoUrl && (
                                        <div className="flex flex-col items-center flex-shrink-0">
                                            <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2">PASS FOTO SAAT INI:</span>
                                            <img src={getDirectImageUrl(formData.passFotoUrl) || ''} alt="Pass Foto Saat Ini" className="max-h-48 object-contain rounded-lg shadow-sm" />
                                        </div>
                                    )}
                                    {filePassFoto && (
                                        <div className="flex flex-col items-center flex-shrink-0">
                                            <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-2">PASS FOTO BARU:</span>
                                            <img src={URL.createObjectURL(filePassFoto)} alt="Preview Pass Foto Baru" className="max-h-48 object-contain rounded-lg shadow-sm border-2 border-green-400" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-full font-bold text-xs text-red-600 border border-red-600 hover:bg-red-50 transition">
                                Batal
                            </button>
                            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-md transition-all flex justify-center items-center gap-2 text-xs active:scale-95 disabled:opacity-70">
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        {/* PRINTABLE ID CARD (Hidden except on print) */}
        {isPrinting && selectedAnggota && (
            <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center" id="printable-id-card">
                <style>{`
                  @media print {
                    body * { visibility: hidden; }
                    #printable-id-card, #printable-id-card * { visibility: visible; }
                    #printable-id-card { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
                    @page { size: landscape; margin: 0; }
                  }
                `}</style>
                <div className="w-[85.6mm] h-[53.98mm] bg-red-600 rounded-xl shadow-2xl relative overflow-hidden border border-red-800 text-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 rounded-full mix-blend-screen opacity-50 -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-700 rounded-full mix-blend-multiply opacity-50 -ml-10 -mb-10"></div>

                    {/* Header */}
                    <div className="h-10 bg-red-800 w-full flex items-center px-3 relative z-10 border-b-2 border-yellow-500">
                        <img src="/logo.png" alt="Logo PDIP" className="w-6 h-6 mr-2 object-contain bg-white rounded-full p-0.5" />
                        <div>
                            <h1 className="text-[10px] font-black leading-none text-white tracking-widest">KARTU TANDA ANGGOTA</h1>
                            <h2 className="text-[7px] font-bold text-yellow-400">PDI PERJUANGAN KAWUNGANTEN</h2>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex p-2 gap-2 relative z-10 h-[calc(100%-40px)]">
                        {/* Photo */}
                        <div className="w-[20mm] h-[25mm] bg-white rounded-md p-0.5 shadow-sm mt-1">
                            {selectedAnggota.passFotoUrl ? (
                                <img src={getDirectImageUrl(selectedAnggota.passFotoUrl) || ''} alt="Foto" className="w-full h-full object-cover rounded-sm" />
                            ) : (
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center rounded-sm"><span className="material-icons text-slate-400 text-xl">person</span></div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-center space-y-0.5 mt-1">
                            <div className="font-black text-xs uppercase text-yellow-400 drop-shadow-md">{selectedAnggota.nama}</div>
                            <div className="text-[8px] font-bold text-red-100 tracking-wider font-mono bg-red-900/50 inline-block px-1 rounded-sm w-max mb-1">{selectedAnggota.nik}</div>
                            
                            <table className="text-[6px] w-full mt-1">
                                <tbody>
                                    <tr><td className="w-12 font-bold text-red-200">Bagian</td><td>: {selectedAnggota.bagian || '-'}</td></tr>
                                    <tr><td className="font-bold text-red-200">Jabatan</td><td>: {selectedAnggota.jabatan || '-'}</td></tr>
                                    <tr><td className="font-bold text-red-200">Desa</td><td>: {selectedAnggota.desa || '-'}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL FULL SCREEN IMAGE */}
        {fullScreenImage && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <button onClick={() => setFullScreenImage(null)} className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10 text-white/70 hover:text-white transition bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md">
                    <span className="material-icons text-2xl block">close</span>
                </button>
                <img src={fullScreenImage} alt="Fullscreen" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                <a href={fullScreenImage} target="_blank" rel="noreferrer" download className="absolute bottom-8 bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-full font-bold flex items-center justify-center space-x-2 shadow-xl shadow-red-600/40 transition transform hover:scale-105 active:scale-95 text-sm border-2 border-red-500/50">
                    <span className="material-icons text-xl">download</span>
                    <span>UNDUH FOTO UTUH</span>
                </a>
            </div>
        )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="font-semibold text-slate-700 text-right">{value}</span>
    </div>
  );
}

