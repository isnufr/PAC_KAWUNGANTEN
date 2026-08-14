import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../LoadingSpinner';

function getDirectImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const match = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
    const match2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (match2 && match2[1]) return `https://lh3.googleusercontent.com/d/${match2[1]}`;
    return url;
}

interface AnggotaItem {
  id: number; nama: string; nik: string; bagian: string; jabatan: string;
  jenisKelamin?: string; nomorHp?: string; desa?: string; dusun?: string;
  passFotoUrl?: string;
}

export default function StrukturOrganisasiView() {
  const [bagian, setBagian] = useState('PAC');
  const [desa, setDesa] = useState('');
  const [dusun, setDusun] = useState('');
  const { data: wilayahListResponse = [] } = useQuery({
    queryKey: ['wilayah'],
    queryFn: async () => {
      const r = await fetch('/api/wilayah');
      const json = await r.json();
      return json.success ? json.data : [];
    }
  });

  const wilayahList: any[] = wilayahListResponse;
  const desaList = useMemo(() => Array.from(new Set(wilayahList.map((w: any) => w.desa))).sort() as string[], [wilayahList]);
  const dusunList = useMemo(() => {
    if (desa) return Array.from(new Set(wilayahList.filter((w: any) => w.desa === desa).map((w: any) => w.dusun).filter(Boolean))).sort() as string[];
    return [];
  }, [desa, wilayahList]);

  const { data = [], isLoading } = useQuery({
    queryKey: ['struktur', bagian, desa, dusun],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('bagian', bagian);
      if (desa) params.append('desa', desa);
      if (dusun) params.append('dusun', dusun);
      params.append('limit', '100');

      const res = await fetch(`/api/anggota?${params.toString()}`);
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  // Group by jabatan for org chart
  const ketua = data.filter((d: any) => d.jabatan === 'KETUA');
  const wakilKetua = data.filter((d: any) => d.jabatan === 'WAKIL KETUA');
  const sekretaris = data.filter((d: any) => d.jabatan === 'SEKRETARIS');
  const bendahara = data.filter((d: any) => d.jabatan === 'BENDAHARA');
  const komandan = data.filter((d: any) => d.jabatan === 'KOMANDAN');
  const anggota = data.filter((d: any) => d.jabatan === 'ANGGOTA' || !['KETUA', 'WAKIL KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOMANDAN'].includes(d.jabatan || ''));

  return (
    <div id="menu-strukturOrganisasi" className="space-y-5 max-w-6xl mx-auto">
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm space-y-4 border border-red-100">
            <h3 className="text-xs md:text-sm font-bold text-red-700 flex items-center uppercase tracking-wider border-b border-red-50 pb-2">
                <span className="material-icons text-sm mr-2 text-red-600 bg-red-100 p-1 rounded-lg">filter_alt</span>
                Filter Struktur Organisasi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">Bagian Kepengurusan</label>
                    <select value={bagian} onChange={e => { setBagian(e.target.value); setDesa(''); setDusun(''); }} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs w-full">
                        <option value="PAC">PAC (Kecamatan)</option>
                        <option value="RANTING">Ranting (Desa)</option>
                        <option value="ANAK RANTING">Anak Ranting (Dusun)</option>
                        <option value="SATGAS">Satgas</option>
                    </select>
                </div>
                {bagian !== 'PAC' && (
                    <div>
                        <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">Pilih Desa</label>
                        <select value={desa} onChange={e => { setDesa(e.target.value); setDusun(''); }} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs w-full">
                            <option value="">- Semua Desa -</option>
                            {desaList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                )}
                {bagian === 'ANAK RANTING' && (
                    <div>
                        <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">Pilih Dusun</label>
                        <select value={dusun} onChange={e => setDusun(e.target.value)} className="p-2.5 border border-red-200 rounded-xl bg-red-50 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800 text-xs w-full">
                            <option value="">- Semua Dusun -</option>
                            {wilayahList.filter(w => w.desa === desa && w.dusun).map(w => w.dusun).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                )}
            </div>
        </div>

        {/* Bagan Organisasi */}
        <div className="p-4 sm:p-10 bg-slate-50/80 border border-red-100 rounded-[2.5rem] min-h-[500px] relative overflow-hidden shadow-inner">
            {/* Soft decorative blur circles */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-200/20 rounded-full blur-3xl z-0 mix-blend-multiply"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl z-0 mix-blend-multiply"></div>
            
            {/* Dotted pattern overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_2px,transparent_2px)] [background-size:24px_24px] opacity-50 z-0"></div>

            <div className="relative z-10">
                <h3 className="text-center text-xs sm:text-sm font-black text-red-800 uppercase tracking-widest mb-8 drop-shadow-sm">
                    <span className="bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-red-100 shadow-sm inline-block">
                        Struktur Kepengurusan {bagian} {desa ? `- ${desa}` : ''} {dusun ? `- ${dusun}` : ''}
                    </span>
                </h3>

                {isLoading ? (
                    <LoadingSpinner />
                ) : data.length === 0 ? (
                    <p className="text-center text-slate-400 font-medium py-16 bg-white/50 rounded-3xl backdrop-blur-sm mx-auto max-w-md border border-white/60">Belum ada data pengurus untuk filter ini.</p>
                ) : (
                    <div className="space-y-4">
                        {/* KETUA */}
                        {ketua.length > 0 && (
                            <div className="flex justify-center relative z-20">
                                {ketua.map((k: any) => <OrgCard key={k.id} person={k} color="red" />)}
                            </div>
                        )}

                        {/* CONNECTOR */}
                        {(wakilKetua.length > 0 || sekretaris.length > 0 || bendahara.length > 0) && (
                            <div className="flex justify-center -my-3 relative z-10"><div className="w-1 h-12 bg-gradient-to-b from-red-300 via-red-200 to-red-300 rounded-full shadow-sm"></div></div>
                        )}

                        {/* WAKIL, SEKRETARIS, BENDAHARA */}
                        <div className="flex flex-wrap justify-center gap-6 relative z-20">
                            {wakilKetua.map((k: any) => <OrgCard key={k.id} person={k} color="orange" />)}
                            {sekretaris.map((k: any) => <OrgCard key={k.id} person={k} color="blue" />)}
                            {bendahara.map((k: any) => <OrgCard key={k.id} person={k} color="green" />)}
                            {komandan.map((k: any) => <OrgCard key={k.id} person={k} color="purple" />)}
                        </div>

                        {/* CONNECTOR */}
                        {anggota.length > 0 && (
                            <div className="flex justify-center -my-3 relative z-10"><div className="w-1 h-12 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-300 rounded-full shadow-sm"></div></div>
                        )}

                        {/* ANGGOTA */}
                        {anggota.length > 0 && (
                            <div className="relative z-20 pt-4">
                                <h4 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                                    <div className="h-[1px] w-12 bg-slate-200"></div>
                                    Anggota ({anggota.length})
                                    <div className="h-[1px] w-12 bg-slate-200"></div>
                                </h4>
                                <div className="flex flex-wrap justify-center gap-4">
                                    {anggota.map((k: any) => <OrgCard key={k.id} person={k} color="slate" small />)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

const colorMap: Record<string, { bg: string; bgGradient: string; badgeGradient: string }> = {
  red: { bg: 'bg-red-600', bgGradient: 'bg-gradient-to-b from-red-500 to-transparent', badgeGradient: 'bg-gradient-to-r from-red-600 to-red-500' },
  orange: { bg: 'bg-orange-500', bgGradient: 'bg-gradient-to-b from-orange-400 to-transparent', badgeGradient: 'bg-gradient-to-r from-orange-500 to-orange-400' },
  blue: { bg: 'bg-blue-600', bgGradient: 'bg-gradient-to-b from-blue-500 to-transparent', badgeGradient: 'bg-gradient-to-r from-blue-600 to-blue-500' },
  green: { bg: 'bg-emerald-600', bgGradient: 'bg-gradient-to-b from-emerald-500 to-transparent', badgeGradient: 'bg-gradient-to-r from-emerald-600 to-emerald-500' },
  purple: { bg: 'bg-purple-600', bgGradient: 'bg-gradient-to-b from-purple-500 to-transparent', badgeGradient: 'bg-gradient-to-r from-purple-600 to-purple-500' },
  slate: { bg: 'bg-slate-500', bgGradient: 'bg-gradient-to-b from-slate-400 to-transparent', badgeGradient: 'bg-gradient-to-r from-slate-500 to-slate-400' },
};

function OrgCard({ person, color, small = false }: { person: AnggotaItem; color: string; small?: boolean }) {
  const c = colorMap[color] || colorMap.slate;
  return (
    <div className={`relative flex flex-col items-center bg-white rounded-[2rem] ${small ? 'w-36 pt-10 pb-4 px-3 mt-6' : 'w-52 pt-12 pb-6 px-4 mt-10'} text-center shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-100 group`}>
      
      {/* Decorative Gradient Background */}
      <div className={`absolute top-0 left-0 w-full h-1/2 rounded-t-[2rem] ${c.bgGradient} opacity-10 transition-opacity duration-300 group-hover:opacity-20`}></div>

      {/* Avatar (Overlapping Top) */}
      <div className={`absolute ${small ? '-top-8 w-16 h-16' : '-top-10 w-24 h-24'} rounded-full bg-white p-1.5 shadow-xl shadow-red-900/10 group-hover:scale-105 group-hover:shadow-red-900/20 transition-all duration-300 z-10`}>
        <div className={`w-full h-full rounded-full overflow-hidden ${c.bg} flex items-center justify-center`}>
            {person.passFotoUrl ? (
              <img src={getDirectImageUrl(person.passFotoUrl) || ''} alt={person.nama} className="w-full h-full object-cover"
                   onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="material-icons text-white ${small ? 'text-xl' : 'text-3xl'}">person</span>`; }} />
            ) : (
              <span className={`material-icons text-white ${small ? 'text-xl' : 'text-3xl'}`}>person</span>
            )}
        </div>
      </div>
      
      <p className={`${small ? 'text-[11px]' : 'text-[13px]'} font-black text-slate-800 truncate w-full mb-1.5 relative z-10`}>{person.nama}</p>
      
      <span className={`relative z-10 inline-flex items-center justify-center ${c.badgeGradient} text-white ${small ? 'text-[8px] px-2 py-0.5' : 'text-[10px] px-3 py-1'} rounded-full font-bold uppercase tracking-widest shadow-md`}>
        {person.jabatan}
      </span>
      
      {person.desa && (
        <div className="flex items-center justify-center gap-1 mt-2.5 text-slate-400 relative z-10">
           <span className="material-icons text-[12px] text-red-400">location_on</span>
           <p className="text-[9px] font-extrabold uppercase truncate">{person.desa}</p>
        </div>
      )}
    </div>
  );
}
