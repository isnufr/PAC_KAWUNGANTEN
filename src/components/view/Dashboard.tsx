import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardView() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    pac: 0,
    ranting: 0,
    anakRanting: 0,
    satgas: 0
  });
  const [gender, setGender] = useState({ pria: 0, wanita: 0 });
  const [verification, setVerification] = useState({ tidakLengkap: 0, nikGanda: 0 });
  const [ulangTahun, setUlangTahun] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        if (data.success) {
          setStats({
            total: data.data.stats.total || 0,
            pac: data.data.stats.pac || 0,
            ranting: data.data.stats.ranting || 0,
            anakRanting: data.data.stats.anakRanting || 0,
            satgas: data.data.stats.satgas || 0
          });
          setGender({
            pria: data.data.gender.LAKI_LAKI || 0,
            wanita: data.data.gender.PEREMPUAN || 0
          });
          if (data.data.verification) {
            setVerification(data.data.verification);
          }
          if (data.data.ulangTahun) {
            setUlangTahun(data.data.ulangTahun);
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [router]);

  const totalGender = gender.pria + gender.wanita;
  const priaPercent = totalGender > 0 ? Math.round((gender.pria / totalGender) * 100) : 0;
  const wanitaPercent = totalGender > 0 ? Math.round((gender.wanita / totalGender) * 100) : 0;

  return (
    <div id="menu-dashboard" className="space-y-5 md:space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-[20px] p-5 sm:p-6 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2"></div>
          <div className="relative z-10">
              <h2 className="text-lg sm:text-xl font-black tracking-tight">Selamat Datang 👋</h2>
              <p className="text-white/70 text-xs sm:text-sm font-medium mt-1">Panel Kontrol Database Anggota PAC Kawunganten</p>
          </div>
      </div>

      {/* Dashboard Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 relative">
          {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl"><span className="text-red-600 font-bold">Memuat data...</span></div>}
          <StatCard title="Anggota" subtitle="Total" icon="groups" value={stats.total} />
          <StatCard title="Pengurus" subtitle="PAC" icon="account_balance" value={stats.pac} />
          <StatCard title="Pengurus" subtitle="Ranting" icon="store" value={stats.ranting} />
          <StatCard title="Pengurus" subtitle="Anak Ranting" icon="holiday_village" value={stats.anakRanting} />
          <StatCard title="Anggota" subtitle="Satgas" icon="security" value={stats.satgas} isWide />
      </div>

      {/* VERIFICATION WARNINGS */}
      {(verification.tidakLengkap > 0 || verification.nikGanda > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row gap-4 sm:items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                  <span className="material-icons text-yellow-600 bg-yellow-100 p-2 rounded-xl text-xl">warning</span>
                  <div>
                      <h3 className="text-sm font-bold text-yellow-800 tracking-tight">Perhatian: Verifikasi Data Diperlukan!</h3>
                      <p className="text-xs text-yellow-700 mt-0.5">
                          Terdapat {verification.tidakLengkap > 0 && <strong className="text-red-600">{verification.tidakLengkap} anggota data tidak lengkap</strong>} 
                          {verification.tidakLengkap > 0 && verification.nikGanda > 0 && ' dan '}
                          {verification.nikGanda > 0 && <strong className="text-red-600">{verification.nikGanda} anggota dengan NIK ganda</strong>}.
                      </p>
                  </div>
              </div>
              <button onClick={() => router.push('/?menu=dataAnggota')} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md whitespace-nowrap">
                  Perbaiki Sekarang
              </button>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          <div className="lg:col-span-2 space-y-5 md:space-y-6">
              {/* MONITORING KUOTA KEPENGURUSAN */}
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 text-slate-800 theme-el">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                      <div>
                          <h3 className="text-sm md:text-base font-black tracking-tight flex items-center gap-2.5 text-slate-800">
                              <span className="material-icons text-red-600 bg-red-50 p-2 rounded-xl text-xl">people_alt</span>
                              Monitoring Kuota
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium mt-1 ml-[44px]">Pantau kelengkapan formasi pengurus berdasarkan wilayah.</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 relative">
                      {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl"><span className="text-red-600 font-bold">Memuat...</span></div>}
                      <QuotaCard title="Kesiapan PAC" icon="analytics" target={null} current={stats.pac} percent={Math.min(100, Math.round((stats.pac / 11) * 100) || 0)} />
                      <QuotaCard title="Pengurus PAC" icon="account_balance" target={11} current={stats.pac} percent={Math.min(100, Math.round((stats.pac / 11) * 100) || 0)} />
                      <QuotaCard title="Satgas PAC" icon="security" target={5} current={stats.satgas} percent={Math.min(100, Math.round((stats.satgas / 5) * 100) || 0)} />
                  </div>
              </div>

              {/* STATISTIK GENDER */}
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 text-slate-800 theme-el">
                  <h3 className="text-sm md:text-base font-black tracking-tight flex items-center gap-2.5 text-slate-800 border-b border-slate-100 pb-4 mb-5">
                      <span className="material-icons text-blue-600 bg-blue-50 p-2 rounded-xl text-xl">wc</span>
                      Statistik Gender Anggota
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center gap-4">
                      <div className="bg-blue-600 text-white p-3 rounded-xl shadow-md shadow-blue-200">
                        <span className="material-icons text-2xl">male</span>
                      </div>
                      <div>
                        <span className="text-2xl font-black text-blue-700">{gender.pria}</span>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Laki-laki ({priaPercent}%)</p>
                      </div>
                    </div>
                    <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100 flex items-center gap-4">
                      <div className="bg-pink-600 text-white p-3 rounded-xl shadow-md shadow-pink-200">
                        <span className="material-icons text-2xl">female</span>
                      </div>
                      <div>
                        <span className="text-2xl font-black text-pink-700">{gender.wanita}</span>
                        <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">Perempuan ({wanitaPercent}%)</p>
                      </div>
                    </div>
                  </div>
              </div>
          </div>

          <div className="space-y-5 md:space-y-6">
              {/* ULANG TAHUN BULAN INI */}
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 text-slate-800 theme-el h-full flex flex-col">
                  <h3 className="text-sm md:text-base font-black tracking-tight flex items-center gap-2.5 text-slate-800 border-b border-slate-100 pb-4 mb-4">
                      <span className="material-icons text-orange-600 bg-orange-50 p-2 rounded-xl text-xl">cake</span>
                      Ulang Tahun Bulan Ini
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto max-h-80 space-y-3 pr-2">
                      {ulangTahun.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50 py-10">
                              <span className="material-icons text-4xl mb-2">event_busy</span>
                              <p className="text-xs font-bold uppercase tracking-wider">Tidak ada yang berulang tahun</p>
                          </div>
                      ) : (
                          ulangTahun.map((u, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/50 border border-orange-100 hover:bg-orange-50 transition">
                                  <div className="w-10 h-10 bg-orange-200 text-orange-700 font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                                      {u.nama.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-bold text-slate-800 truncate">{u.nama}</h4>
                                      <p className="text-[10px] text-slate-500 font-medium font-mono mt-0.5">{u.tanggalLahir}</p>
                                  </div>
                                  <span className="material-icons text-orange-500 text-sm">celebration</span>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

// Sub-components
function StatCard({ title, subtitle, icon, value, isWide = false }: { title: string, subtitle: string, icon: string, value: number, isWide?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 border-t-4 border-t-red-600 border-x border-b border-slate-100 shadow-[0_4px_16px_rgba(220,38,38,0.06)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${isWide ? 'col-span-2 sm:col-span-1' : ''}`}>
        <div className="absolute -right-2 -top-2 opacity-[0.05] group-hover:opacity-[0.15] transition-opacity"><span className="material-icons text-6xl text-red-600">{icon}</span></div>
        <div className="flex items-center gap-2 mb-2.5">
            <span className="material-icons text-white bg-red-600 p-1.5 rounded-lg text-base shadow-sm shadow-red-200">{icon}</span>
            <span className="text-[9px] font-black text-red-700 tracking-widest uppercase truncate max-w-full">{subtitle}</span>
        </div>
        <span className="text-2xl md:text-3xl font-black text-slate-800 block">{value}</span>
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{title}</span>
    </div>
  )
}

function QuotaCard({ title, icon, target, current, percent }: { title: string, icon: string, target: number | null, current: number, percent: number }) {
  return (
    <div className="bg-gradient-to-br from-red-50/80 to-rose-50/80 rounded-2xl p-4 border border-red-100/60 theme-el flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
                <span className="material-icons text-red-600 bg-white shadow-sm p-2 rounded-xl border border-red-100 text-lg">{icon}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
            </div>
            {target !== null && (
              <span className="text-[10px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-100">Target: {target}</span>
            )}
        </div>
        <div className="flex items-center justify-between">
            <div className="w-full mr-4 bg-white rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-100">
                <div className="bg-gradient-to-r from-red-500 to-red-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-xl font-black text-red-700 leading-none">{percent}%</span>
                {target !== null && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{current} / {target}</span>
                )}
            </div>
        </div>
    </div>
  )
}
