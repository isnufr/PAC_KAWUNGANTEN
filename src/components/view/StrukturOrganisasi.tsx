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
        <div className="p-4 sm:p-8 bg-white border border-slate-200 rounded-3xl min-h-[450px] relative overflow-hidden">
            <h3 className="text-center text-sm font-black text-red-700 uppercase tracking-wider mb-6">
                Struktur Kepengurusan {bagian} {desa ? `- ${desa}` : ''} {dusun ? `- ${dusun}` : ''}
            </h3>

            {isLoading ? (
                <LoadingSpinner />
            ) : data.length === 0 ? (
                <p className="text-center text-slate-400 font-medium py-12">Belum ada data pengurus untuk filter ini.</p>
            ) : (
                <div className="space-y-6">
                    {/* KETUA */}
                    {ketua.length > 0 && (
                        <div className="flex justify-center">
                            {ketua.map((k: any) => <OrgCard key={k.id} person={k} color="red" />)}
                        </div>
                    )}

                    {/* CONNECTOR */}
                    {(wakilKetua.length > 0 || sekretaris.length > 0 || bendahara.length > 0) && (
                        <div className="flex justify-center"><div className="w-0.5 h-6 bg-red-200"></div></div>
                    )}

                    {/* WAKIL, SEKRETARIS, BENDAHARA */}
                    <div className="flex flex-wrap justify-center gap-4">
                        {wakilKetua.map((k: any) => <OrgCard key={k.id} person={k} color="orange" />)}
                        {sekretaris.map((k: any) => <OrgCard key={k.id} person={k} color="blue" />)}
                        {bendahara.map((k: any) => <OrgCard key={k.id} person={k} color="green" />)}
                        {komandan.map((k: any) => <OrgCard key={k.id} person={k} color="purple" />)}
                    </div>

                    {/* CONNECTOR */}
                    {anggota.length > 0 && (
                        <div className="flex justify-center"><div className="w-0.5 h-6 bg-slate-200"></div></div>
                    )}

                    {/* ANGGOTA */}
                    {anggota.length > 0 && (
                        <div>
                            <h4 className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Anggota ({anggota.length})</h4>
                            <div className="flex flex-wrap justify-center gap-3">
                                {anggota.map((k: any) => <OrgCard key={k.id} person={k} color="slate" small />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
}

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-600 text-white' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500 text-white' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-600 text-white' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-600 text-white' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-600 text-white' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-500 text-white' },
};

function OrgCard({ person, color, small = false }: { person: AnggotaItem; color: string; small?: boolean }) {
  const c = colorMap[color] || colorMap.slate;
  return (
    <div className={`${c.bg} ${c.border} border rounded-2xl ${small ? 'p-3 w-36' : 'p-4 w-48'} text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}>
      <div className={`mx-auto ${small ? 'w-10 h-10' : 'w-14 h-14'} rounded-full bg-white overflow-hidden border-2 ${c.border} shadow-sm mb-2`}>
        {person.passFotoUrl ? (
          <img src={getDirectImageUrl(person.passFotoUrl) || ''} alt={person.nama} className="w-full h-full object-cover"
               onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${c.bg} ${c.text}"><span class="material-icons text-sm">person</span></div>`; }} />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${c.bg} ${c.text}`}><span className="material-icons text-sm">person</span></div>
        )}
      </div>
      <p className={`${small ? 'text-[10px]' : 'text-xs'} font-bold ${c.text} truncate`}>{person.nama}</p>
      <span className={`inline-block mt-1 ${c.badge} ${small ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-0.5'} rounded-full font-bold uppercase tracking-wider`}>{person.jabatan}</span>
      {person.desa && <p className="text-[9px] text-slate-400 mt-1 truncate">{person.desa}</p>}
    </div>
  );
}
