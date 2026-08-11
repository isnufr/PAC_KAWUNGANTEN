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

export default function DataAnggotaView() {
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
  const [isPrinting, setIsPrinting] = useState(false);

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
      
      // Better regex logic for bad quality scans
      const cleaned = text.replace(/[^a-zA-Z0-9\n:]/g, ' ').replace(/\s+/g, ' ');
      const rawDigits = cleaned.replace(/\D/g, '');
      const nikMatch = rawDigits.match(/\d{16}/);
      if (nikMatch) handleFormChange('nik', nikMatch[0]);
      
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

      const res = await fetch('/api/anggota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (res.ok && json.success) {
        const newId = json.data.id;
        
        if (fileKtp || filePassFoto) {
            setFormSuccess('Menyimpan foto...');
            let uploadSuccess = true;
            if (fileKtp) {
                const ktpRes = await uploadFile(fileKtp, 'KTP', newId, formData.nama);
                if (!ktpRes.success) uploadSuccess = false;
            }
            if (filePassFoto) {
                const passRes = await uploadFile(filePassFoto, 'PASSFOTO', newId, formData.nama);
                if (!passRes.success) uploadSuccess = false;
            }
            if (uploadSuccess) {
                setFormSuccess('Data & Foto berhasil ditambahkan!');
            } else {
                setFormSuccess('Data ditambahkan, namun sebagian foto gagal diunggah.');
            }
        } else {
            setFormSuccess('Anggota berhasil ditambahkan!');
        }

        setFormData({ nik: '', nama: '', tanggalLahir: '', jenisKelamin: '', umur: '', nomorHp: '', bagian: '', jabatan: '', kecamatan: '', desa: '', dusun: '', fotoKtpUrl: '', passFotoUrl: '' });
        setFileKtp(null);
        setFilePassFoto(null);
        setOcrStatus('');
        fetchData();
        setTimeout(() => { setIsModalOpen(false); setFormSuccess(''); }, 1500);
      } else {
        setFormError(json.error || 'Gagal menambahkan anggota');
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
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-red-100 shadow-sm space-y-4 theme-el">
            <h3 className="text-xs md:text-sm font-extrabold text-red-700 uppercase tracking-wider flex items-center gap-2 border-b border-red-50 pb-3">
                <span className="material-icons text-red-600 bg-red-100 p-1 rounded-lg">filter_alt</span>
                Filter Data Anggota
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                <input type="text" placeholder="Cari nama / NIK..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="sm:col-span-2 md:col-span-2 p-2.5 border border-red-200 rounded-xl outline-none w-full focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-red-50 text-xs text-red-900" />

                <select value={bagian} onChange={e => setBagian(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs">
                    <option value="">- Semua Bagian -</option>
                    <option value="PAC">PAC</option>
                    <option value="RANTING">RANTING</option>
                    <option value="ANAK RANTING">ANAK RANTING</option>
                    <option value="SATGAS">SATGAS</option>
                </select>

                <select value={jabatan} onChange={e => setJabatan(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs">
                    <option value="">- Semua Jabatan -</option>
                    <option value="KETUA">KETUA</option>
                    <option value="WAKIL KETUA">WAKIL KETUA</option>
                    <option value="SEKRETARIS">SEKRETARIS</option>
                    <option value="BENDAHARA">BENDAHARA</option>
                    <option value="ANGGOTA">ANGGOTA</option>
                    <option value="KOMANDAN">KOMANDAN</option>
                </select>



                {/* Filter Desa */}
                <select value={desa} onChange={e => setDesa(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs">
                    <option value="">- Semua Desa -</option>
                    {desaList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {/* Filter Dusun */}
                <select value={dusun} onChange={e => setDusun(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs" disabled={!desa}>
                    <option value="">- Semua Dusun -</option>
                    {dusunList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <div className="flex gap-2">
                    <button onClick={handleReset} className="flex-1 py-2.5 border border-red-200 rounded-xl text-red-600 font-bold hover:bg-red-50 transition">Reset</button>
                    <button onClick={handleSearch} className="flex-1 py-2.5 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 shadow-md transition flex items-center justify-center gap-1">
                        <span className="material-icons text-sm">search</span>Cari
                    </button>
                </div>
            </div>
        </div>

        {/* ACTION PANEL INPUT DATA */}
        <div className="mt-2 mb-2 flex justify-center">
            <button onClick={() => { setIsModalOpen(true); setFormError(''); setFormSuccess(''); }}
                className="w-full sm:w-auto bg-red-700 hover:bg-red-800 text-white px-6 py-3 md:py-3.5 rounded-2xl sm:rounded-xl shadow-md hover:shadow-lg font-bold flex items-center justify-center space-x-2 transform active:scale-95 transition-all duration-300 text-sm">
                <span className="material-icons">add_circle</span><span>INPUT DATA BARU</span>
            </button>
        </div>

        {/* LIST DATA */}
        <div className="space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-red-100 overflow-x-auto">
                {isLoading ? (
                    <p className="text-center text-slate-500 py-8">Memuat Data Anggota...</p>
                ) : data.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Tidak ada data anggota yang ditemukan.</p>
                ) : (
                    <>
                    <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Menampilkan {data.length} data anggota</p>
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b-2 border-red-100 text-red-800 text-[10px] md:text-xs uppercase tracking-wider">
                                <th className="p-3 font-bold text-center">No</th>
                                <th className="p-3 font-bold">Foto</th>
                                <th className="p-3 font-bold">NIK / Nama</th>
                                <th className="p-3 font-bold">Bagian</th>
                                <th className="p-3 font-bold">Jabatan</th>
                                <th className="p-3 font-bold">Desa</th>
                                <th className="p-3 font-bold text-center">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs md:text-sm text-slate-700">
                            {data.map((item, index) => (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-red-50/50 transition duration-150">
                                    <td className="p-3 font-medium text-center">{index + 1}</td>
                                    <td className="p-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                                            {item.passFotoUrl ? (
                                                <img src={getDirectImageUrl(item.passFotoUrl) || ''} alt={item.nama} className="w-full h-full object-cover"
                                                     onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-red-100 text-red-500"><span class="material-icons text-sm">person</span></div>'; }} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-500"><span className="material-icons text-sm">person</span></div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="font-bold text-slate-800">{item.nama}</div>
                                        <div className="text-[10px] text-slate-500 tracking-wider">{item.nik}</div>
                                    </td>
                                    <td className="p-3 font-semibold text-red-600">{item.bagian || '-'}</td>
                                    <td className="p-3 text-slate-600">{item.jabatan || '-'}</td>
                                    <td className="p-3 text-slate-600 text-xs">{item.desa || '-'}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => setSelectedAnggota(item)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg transition"><span className="material-icons text-[18px]">visibility</span></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </>
                )}
            </div>
        </div>

        {/* MODAL DETAIL ANGGOTA */}
        {selectedAnggota && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto max-h-[92vh] flex flex-col border border-red-200">
                    <div className="bg-red-700 p-4 sm:p-5 text-white flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <span className="material-icons text-white text-lg">badge</span>
                            <h3 className="font-extrabold text-sm sm:text-base tracking-wide">Detail Anggota</h3>
                        </div>
                        <button onClick={() => setSelectedAnggota(null)} className="text-red-100 hover:text-white transition bg-red-800 p-1.5 rounded-lg"><span className="material-icons text-sm block">close</span></button>
                    </div>
                    <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 text-xs sm:text-sm text-slate-800">
                        <div className="flex justify-between items-center mb-4">
                             <div className="flex-1"></div>
                             <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg mx-auto">
                                 {selectedAnggota.passFotoUrl ? (
                                     <img src={getDirectImageUrl(selectedAnggota.passFotoUrl) || ''} alt={selectedAnggota.nama} className="w-full h-full object-cover" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-500"><span className="material-icons text-3xl">person</span></div>
                                 )}
                             </div>
                             <div className="flex-1 flex justify-end">
                                 <button onClick={() => { setIsPrinting(true); setTimeout(() => window.print(), 300); setTimeout(() => setIsPrinting(false), 2000); }} 
                                         className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1 transition">
                                     <span className="material-icons text-sm">print</span> CETAK KTA
                                 </button>
                             </div>
                        </div>
                        <DetailRow label="Nama" value={selectedAnggota.nama} />
                        <DetailRow label="NIK" value={selectedAnggota.nik} />
                        <DetailRow label="Tanggal Lahir" value={selectedAnggota.tanggalLahir || '-'} />
                        <DetailRow label="Jenis Kelamin" value={selectedAnggota.jenisKelamin || '-'} />
                        <DetailRow label="Umur" value={selectedAnggota.umur ? `${selectedAnggota.umur} tahun` : '-'} />
                        <DetailRow label="Nomor HP" value={selectedAnggota.nomorHp || '-'} />
                        <DetailRow label="Bagian" value={selectedAnggota.bagian || '-'} />
                        <DetailRow label="Jabatan" value={selectedAnggota.jabatan || '-'} />
                        <DetailRow label="Kecamatan" value={selectedAnggota.kecamatan || '-'} />
                        <DetailRow label="Desa" value={selectedAnggota.desa || '-'} />
                        <DetailRow label="Dusun" value={selectedAnggota.dusun || '-'} />
                        {selectedAnggota.fotoKtpUrl && (
                          <div className="mt-4 border-t border-slate-100 pt-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Foto KTP</p>
                            <img src={getDirectImageUrl(selectedAnggota.fotoKtpUrl) || ''} alt="Foto KTP" className="w-full rounded-xl border border-slate-200 shadow-sm" />
                          </div>
                        )}
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
                            <h3 className="font-extrabold text-sm sm:text-base tracking-wide">Input Data Anggota Baru</h3>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="text-red-100 hover:text-white transition bg-red-800 p-1.5 rounded-lg"><span className="material-icons text-sm block">close</span></button>
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
                            <div className="flex items-center gap-3 mt-1">
                                <button type="button" onClick={handleScanKtp} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-2">
                                    <span className="material-icons text-sm">document_scanner</span> Scan Data dari KTP
                                </button>
                                <span className="text-xs text-red-500 font-semibold">{ocrStatus || 'Bantu isi NIK & Nama otomatis'}</span>
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
                                        <option value="WAKIL KETUA">WAKIL KETUA</option>
                                        <option value="SEKRETARIS">SEKRETARIS</option>
                                        <option value="BENDAHARA">BENDAHARA</option>
                                        <option value="ANGGOTA">ANGGOTA</option>
                                        <option value="KOMANDAN">KOMANDAN</option>
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

