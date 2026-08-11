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

  // Wilayah data for filters
  const [wilayahList, setWilayahList] = useState<WilayahItem[]>([]);
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);
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

  // Load wilayah data
  useEffect(() => {
    fetch('/api/wilayah').then(r => r.json()).then(json => {
      if (json.success) {
        setWilayahList(json.data);
        const kecs = [...new Set(json.data.map((w: WilayahItem) => w.kecamatan))].sort() as string[];
        setKecamatanList(kecs);
      }
    }).catch(console.error);
  }, []);

  // Update desa list when kecamatan changes
  useEffect(() => {
    if (kecamatan) {
      const desas = [...new Set(wilayahList.filter(w => w.kecamatan === kecamatan).map(w => w.desa))].sort() as string[];
      setDesaList(desas);
    } else {
      setDesaList([]);
    }
    setDesa('');
    setDusun('');
  }, [kecamatan, wilayahList]);

  // Update dusun list when desa changes
  useEffect(() => {
    if (desa) {
      const dusuns = [...new Set(wilayahList.filter(w => w.kecamatan === kecamatan && w.desa === desa).map(w => w.dusun).filter(Boolean))].sort() as string[];
      setDusunList(dusuns);
    } else {
      setDusunList([]);
    }
    setDusun('');
  }, [desa, kecamatan, wilayahList]);

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
        setFormSuccess('Anggota berhasil ditambahkan!');
        setFormData({ nik: '', nama: '', tanggalLahir: '', jenisKelamin: '', umur: '', nomorHp: '', bagian: '', jabatan: '', kecamatan: '', desa: '', dusun: '', fotoKtpUrl: '', passFotoUrl: '' });
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

                {/* Filter Kecamatan */}
                <select value={kecamatan} onChange={e => setKecamatan(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs">
                    <option value="">- Semua Kecamatan -</option>
                    {kecamatanList.map(k => <option key={k} value={k}>{k}</option>)}
                </select>

                {/* Filter Desa */}
                <select value={desa} onChange={e => setDesa(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs" disabled={!kecamatan}>
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
                        <div className="flex justify-center mb-4">
                            <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg">
                                {selectedAnggota.passFotoUrl ? (
                                    <img src={getDirectImageUrl(selectedAnggota.passFotoUrl) || ''} alt={selectedAnggota.nama} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-500"><span className="material-icons text-3xl">person</span></div>
                                )}
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
                    <form onSubmit={handleSubmitAnggota} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm text-slate-800">
                        {formError && <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center font-bold text-xs">{formError}</div>}
                        {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100 text-center font-bold text-xs">{formSuccess}</div>}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormInput label="NIK *" value={formData.nik} onChange={v => handleFormChange('nik', v)} placeholder="Masukkan NIK (16 digit)" />
                            <FormInput label="Nama Lengkap *" value={formData.nama} onChange={v => handleFormChange('nama', v)} placeholder="Masukkan nama lengkap" />
                            <FormInput label="Tanggal Lahir" value={formData.tanggalLahir} onChange={v => handleFormChange('tanggalLahir', v)} placeholder="DD/MM/YYYY" />
                            <FormSelect label="Jenis Kelamin" value={formData.jenisKelamin} onChange={v => handleFormChange('jenisKelamin', v)}
                                options={[{ v: '', l: '- Pilih -' }, { v: 'LAKI-LAKI', l: 'LAKI-LAKI' }, { v: 'PEREMPUAN', l: 'PEREMPUAN' }]} />
                            <FormInput label="Umur" value={formData.umur} onChange={v => handleFormChange('umur', v)} placeholder="Umur (angka)" type="number" />
                            <FormInput label="Nomor HP" value={formData.nomorHp} onChange={v => handleFormChange('nomorHp', v)} placeholder="08xxxxxxxxxx" />
                            <FormSelect label="Bagian" value={formData.bagian} onChange={v => handleFormChange('bagian', v)}
                                options={[{ v: '', l: '- Pilih Bagian -' }, { v: 'PAC', l: 'PAC' }, { v: 'RANTING', l: 'RANTING' }, { v: 'ANAK RANTING', l: 'ANAK RANTING' }, { v: 'SATGAS', l: 'SATGAS' }]} />
                            <FormSelect label="Jabatan" value={formData.jabatan} onChange={v => handleFormChange('jabatan', v)}
                                options={[{ v: '', l: '- Pilih Jabatan -' }, { v: 'KETUA', l: 'KETUA' }, { v: 'WAKIL KETUA', l: 'WAKIL KETUA' }, { v: 'SEKRETARIS', l: 'SEKRETARIS' }, { v: 'BENDAHARA', l: 'BENDAHARA' }, { v: 'ANGGOTA', l: 'ANGGOTA' }, { v: 'KOMANDAN', l: 'KOMANDAN' }]} />
                            <FormInput label="Kecamatan" value={formData.kecamatan} onChange={v => handleFormChange('kecamatan', v)} placeholder="Nama kecamatan" />
                            <FormInput label="Desa" value={formData.desa} onChange={v => handleFormChange('desa', v)} placeholder="Nama desa" />
                            <FormInput label="Dusun" value={formData.dusun} onChange={v => handleFormChange('dusun', v)} placeholder="Nama dusun" />
                            <div className="sm:col-span-2"><FormInput label="Link Pass Foto (Google Drive)" value={formData.passFotoUrl} onChange={v => handleFormChange('passFotoUrl', v)} placeholder="https://drive.google.com/..." /></div>
                            <div className="sm:col-span-2"><FormInput label="Link Foto KTP (Google Drive)" value={formData.fotoKtpUrl} onChange={v => handleFormChange('fotoKtpUrl', v)} placeholder="https://drive.google.com/..." /></div>
                        </div>

                        <button type="submit" disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-3.5 rounded-xl font-bold shadow-lg transition-all flex justify-center items-center gap-2 text-sm active:scale-95 disabled:opacity-70">
                            {isSubmitting ? 'Menyimpan...' : <><span className="material-icons text-sm">save</span> SIMPAN DATA ANGGOTA</>}
                        </button>
                    </form>
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

function FormInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full p-2.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-red-50 text-xs text-red-900" />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}
