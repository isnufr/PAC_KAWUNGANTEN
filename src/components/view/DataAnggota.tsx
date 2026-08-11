import React, { useState, useEffect } from 'react';

function getDirectImageUrl(url: string | null) {
    if (!url) return null;
    const match = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
    if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
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
    <div id="menu-dataAnggota" className="space-y-4 max-w-6xl mx-auto">
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm space-y-3 md:space-y-4 border border-red-100 theme-el">
            <h3 className="text-xs md:text-sm font-bold text-red-700 flex items-center uppercase tracking-wider border-b border-red-50 pb-2 theme-el">
                <span className="material-icons text-sm mr-2 text-red-600 bg-red-100 p-1 rounded-lg theme-el">filter_alt</span>
                Filter Pencarian
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                <input type="text" placeholder="Tulis Nama/NIK..." 
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="p-2.5 border border-red-200 rounded-xl outline-none w-full focus:ring-2 focus:ring-red-100 focus:border-red-500 transition bg-red-50 text-xs text-red-900 theme-el" />
                <select value={bagian} onChange={e => setBagian(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Bagian -</option>
                    <option value="PAC">PAC</option>
                    <option value="RANTING">RANTING</option>
                    <option value="ANAK RANTING">ANAK RANTING</option>
                    <option value="SATGAS">SATGAS</option>
                </select>
                <select value={jabatan} onChange={e => setJabatan(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Jabatan -</option>
                    <option value="KETUA">KETUA</option>
                    <option value="SEKRETARIS">SEKRETARIS</option>
                    <option value="BENDAHARA">BENDAHARA</option>
                    <option value="ANGGOTA">ANGGOTA</option>
                </select>
                <select value={kecamatan} onChange={e => setKecamatan(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Kecamatan -</option>
                    <option value="KAWUNGANTEN">KAWUNGANTEN</option>
                </select>
                <select value={desa} onChange={e => setDesa(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs theme-el">
                    <option value="">- Desa -</option>
                    <option value="BABAKAN">BABAKAN</option>
                    <option value="BOJONG">BOJONG</option>
                    <option value="BRINGKENG">BRINGKENG</option>
                    <option value="GOMBONG">GOMBONG</option>
                    <option value="KALIKUDI">KALIKUDI</option>
                    <option value="KAWUNGANTEN">KAWUNGANTEN</option>
                    <option value="KAWUNGANTEN LOR">KAWUNGANTEN LOR</option>
                    <option value="KUBANGKANGKUNG">KUBANGKANGKUNG</option>
                    <option value="MENTASAN">MENTASAN</option>
                    <option value="SARWADADI">SARWADADI</option>
                    <option value="SIDAURIP">SIDAURIP</option>
                    <option value="UJUNGMANIK">UJUNGMANIK</option>
                </select>
            </div>
            <div className="flex justify-end space-x-2.5 pt-1">
                <button onClick={handleReset} className="px-4 py-2 border border-red-200 rounded-xl text-red-600 text-xs font-bold hover:bg-red-50 transition theme-el">Reset</button>
                <button onClick={handleSearch} className="px-5 py-2 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800 shadow-md transition flex items-center space-x-1 theme-el">
                    <span className="material-icons text-sm">search</span><span>Cari Data</span>
                </button>
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
                                                <img src={getDirectImageUrl(item.passFotoUrl) || ''} alt={item.nama} className="w-full h-full object-cover" />
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
                                        <button className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg transition"><span className="material-icons text-[18px]">visibility</span></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

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
