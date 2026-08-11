import React, { useState, useEffect } from 'react';

function getDirectImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    // Google Drive: extract file ID and use lh3.googleusercontent.com for direct image
    const match = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
    if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    // Google Drive alternate format
    const match2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (match2 && match2[1]) {
        return `https://lh3.googleusercontent.com/d/${match2[1]}`;
    }
    return url;
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
  const [selectedAnggota, setSelectedAnggota] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [bagian, jabatan, kecamatan, desa]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (bagian) params.append('bagian', bagian);
      if (jabatan) params.append('jabatan', jabatan);
      if (kecamatan) params.append('kecamatan', kecamatan);
      if (desa) params.append('desa', desa);

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

  const handleSearch = () => {
    fetchData();
  };

  const handleReset = () => {
    setSearch('');
    setBagian('');
    setJabatan('');
    setKecamatan('');
    setDesa('');
    setTimeout(fetchData, 100);
  };

  return (
    <div id="menu-dataAnggota" className="space-y-5 max-w-6xl mx-auto">
        {/* FILTER DATA */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-red-100 shadow-sm space-y-4 theme-el">
            <h3 className="text-xs md:text-sm font-extrabold text-red-700 uppercase tracking-wider flex items-center gap-2 border-b border-red-50 pb-3">
                <span className="material-icons text-red-600 bg-red-100 p-1 rounded-lg">filter_alt</span>
                Filter Data Anggota
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
                <input type="text" placeholder="Cari nama / NIK..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="col-span-1 sm:col-span-3 md:col-span-2 p-2.5 border border-red-200 rounded-xl outline-none w-full focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-red-50 text-xs text-red-900 theme-el" />

                <select value={bagian} onChange={e => setBagian(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Semua Bagian -</option>
                    <option value="PAC">PAC</option>
                    <option value="RANTING">RANTING</option>
                    <option value="ANAK RANTING">ANAK RANTING</option>
                    <option value="SATGAS">SATGAS</option>
                </select>

                <select value={jabatan} onChange={e => setJabatan(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Semua Jabatan -</option>
                    <option value="KETUA">KETUA</option>
                    <option value="WAKIL KETUA">WAKIL KETUA</option>
                    <option value="SEKRETARIS">SEKRETARIS</option>
                    <option value="BENDAHARA">BENDAHARA</option>
                    <option value="ANGGOTA">ANGGOTA</option>
                    <option value="KOMANDAN">KOMANDAN</option>
                </select>

                <div className="flex gap-2">
                    <button onClick={handleReset} className="flex-1 py-2.5 border border-red-200 rounded-xl text-red-600 font-bold hover:bg-red-50 transition theme-el">Reset</button>
                    <button onClick={handleSearch} className="flex-1 py-2.5 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 shadow-md transition flex items-center justify-center gap-1 theme-el">
                        <span className="material-icons text-sm">search</span>Cari Data
                    </button>
                </div>
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
            <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-red-100 overflow-x-auto">
                {isLoading ? (
                    <p className="text-center text-slate-500 py-8">Memuat Data Anggota...</p>
                ) : data.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Tidak ada data anggota yang ditemukan.</p>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b-2 border-red-100 text-red-800 text-[10px] md:text-xs uppercase tracking-wider">
                                <th className="p-3 font-bold text-center">No</th>
                                <th className="p-3 font-bold">Foto</th>
                                <th className="p-3 font-bold">NIK / Nama</th>
                                <th className="p-3 font-bold">Bagian</th>
                                <th className="p-3 font-bold">Jabatan</th>
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
                                                     onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling && ((e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-red-100 text-red-500"><span class="material-icons text-sm">person</span></div>'); }} />
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
                                    <td className="p-3 text-center">
                                        <button onClick={() => setSelectedAnggota(item)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg transition"><span className="material-icons text-[18px]">visibility</span></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

        {/* MODAL DETAIL ANGGOTA */}
        {selectedAnggota && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto max-h-[92vh] flex flex-col transform transition-all border border-red-200 theme-el">
                    <div className="bg-red-700 p-4 sm:p-5 text-white flex justify-between items-center border-b border-red-800 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <span className="material-icons text-white text-lg">badge</span>
                            <h3 className="font-extrabold text-sm sm:text-base tracking-wide">Detail Anggota</h3>
                        </div>
                        <button onClick={() => setSelectedAnggota(null)}
                            className="text-red-100 hover:text-white transition bg-red-800 p-1.5 rounded-lg"><span
                                className="material-icons text-sm block">close</span></button>
                    </div>
                    <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm text-slate-800">
                        {/* Foto */}
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="font-semibold text-slate-700">{value}</span>
    </div>
  );
}
