import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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
  const [usia, setUsia] = useState({ genZ: 0, milenial: 0, genX: 0, babyBoomer: 0 });
  const [topDesa, setTopDesa] = useState<any[]>([]);
  const [ulangTahun, setUlangTahun] = useState<any[]>([]);
  const [kuota, setKuota] = useState<{ wilayah: any[]; rantingCounts: any[]; anakRantingCounts: any[] }>({ wilayah: [], rantingCounts: [], anakRantingCounts: [] });
  const [selectedDesa, setSelectedDesa] = useState<string>('');
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
          if (data.data.usia) {
            setUsia(data.data.usia);
          }
          if (data.data.topDesa) {
            setTopDesa(data.data.topDesa);
          }
          if (data.data.ulangTahun) {
            setUlangTahun(data.data.ulangTahun);
          }
          if (data.data.kuota) {
            setKuota(data.data.kuota);
            const uniqueDesas = Array.from(new Set(data.data.kuota.wilayah.map((w: any) => w.desa))).sort();
            if (uniqueDesas.length > 0) {
              setSelectedDesa(uniqueDesas[0] as string);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [router]);

  const totalGender = gender.pria + gender.wanita;
  const priaPercent = totalGender > 0 ? Math.round((gender.pria / totalGender) * 100) : 0;
  const wanitaPercent = totalGender > 0 ? Math.round((gender.wanita / totalGender) * 100) : 0;

  // Visualisasi Data ChartJS
  const genderChartData = {
    labels: [`Laki-Laki (${priaPercent}%)`, `Perempuan (${wanitaPercent}%)`],
    datasets: [{
      data: [gender.pria, gender.wanita],
      backgroundColor: ['#2563eb', '#db2777'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };
  
  const totalUsia = usia.genZ + usia.milenial + usia.genX + usia.babyBoomer;
  const usiaChartData = {
    labels: [
      `Gen Z (13-28 thn)`,
      `Milenial (29-43 thn)`,
      `Gen X (44-59 thn)`,
      `Baby Boomer (>59 thn)`
    ],
    datasets: [{
      data: [usia.genZ, usia.milenial, usia.genX, usia.babyBoomer],
      backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const topDesaChartData = {
    labels: topDesa.map(d => d.desa),
    datasets: [{
      label: 'Jumlah Anggota',
      data: topDesa.map(d => d.count),
      backgroundColor: '#dc2626',
      borderRadius: 4
    }]
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 45 } }
    }
  };
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 10 } } }
    }
  };

  // Calculate Progress Data
  const dataLengkap = stats.total - verification.tidakLengkap;
  const progressPercent = stats.total > 0 ? Math.round((dataLengkap / stats.total) * 100) : 0;

  // Calculate Kesiapan PAC
  const targetPac = 11;
  const targetSatgas = 5;
  const targetRantingPerDesa = 9;
  const targetAnakRantingPerDusun = 5;

  const uniqueDesas = Array.from(new Set(kuota.wilayah.map(w => w.desa))).sort() as string[];
  const numDesa = uniqueDesas.length;
  const numDusun = kuota.wilayah.filter(w => w.dusun && w.dusun.trim() !== '').length;
  
  const totalTarget = targetPac + targetSatgas + (numDesa * targetRantingPerDesa) + (numDusun * targetAnakRantingPerDusun);

  const achievedPac = Math.min(stats.pac, targetPac);
  const achievedSatgas = Math.min(stats.satgas, targetSatgas);
  
  let achievedRanting = 0;
  kuota.rantingCounts.forEach(r => { achievedRanting += Math.min(r._count.id, targetRantingPerDesa); });
  
  let achievedAnakRanting = 0;
  kuota.anakRantingCounts.forEach(a => { achievedAnakRanting += Math.min(a._count.id, targetAnakRantingPerDusun); });

  const totalAchieved = achievedPac + achievedSatgas + achievedRanting + achievedAnakRanting;
  const kesiapanPacPercent = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

  // Data for selected desa
  const currentRantingCount = kuota.rantingCounts.find(r => r.desa === selectedDesa)?._count.id || 0;
  const currentRantingPercent = Math.min(100, Math.round((currentRantingCount / targetRantingPerDesa) * 100));

  const dusunsInSelectedDesa = Array.from(new Set(kuota.wilayah.filter(w => w.desa === selectedDesa && w.dusun).map(w => w.dusun))).sort() as string[];

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
              <button onClick={() => router.push('/?menu=verifikasi_data')} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md whitespace-nowrap">
                  Perbaiki Sekarang
              </button>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          
          {/* VISUALISASI DATA BARU */}
          <div className="lg:col-span-3 space-y-5">
              {/* Progress Data */}
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 theme-el relative">
                  {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"></div>}
                  <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black tracking-tight flex items-center gap-2.5 text-slate-800">
                          <span className="material-icons text-red-600 bg-red-50 p-1.5 rounded-lg text-lg">data_usage</span>
                          Progress Data
                      </h3>
                      <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden border border-slate-200">
                      <div className="bg-red-600 h-3 rounded-full transition-all duration-1000 relative overflow-hidden" style={{ width: `${progressPercent}%` }}>
                           <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-4">
                          <span className="material-icons text-emerald-600 bg-emerald-100 p-2 rounded-full">verified_user</span>
                          <div>
                              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Data Lengkap</p>
                              <p className="text-xl font-black text-slate-800">{dataLengkap}</p>
                          </div>
                      </div>
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center gap-4">
                          <span className="material-icons text-amber-600 bg-amber-100 p-2 rounded-full">privacy_tip</span>
                          <div>
                              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Perlu Dilengkapi</p>
                              <p className="text-xl font-black text-slate-800">{verification.tidakLengkap}</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Tiga Grafik */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative">
                      {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"></div>}
                      <h3 className="text-[11px] font-black tracking-widest uppercase flex items-center gap-2 text-slate-700 mb-6 border-b border-slate-100 pb-3">
                          <span className="material-icons text-red-500 text-base">pie_chart</span>
                          Komposisi Gender
                      </h3>
                      <div className="flex-1 min-h-[200px] flex items-center justify-center">
                          <Doughnut data={genderChartData} options={pieOptions} />
                      </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative">
                      {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"></div>}
                      <h3 className="text-[11px] font-black tracking-widest uppercase flex items-center gap-2 text-slate-700 mb-6 border-b border-slate-100 pb-3">
                          <span className="material-icons text-red-500 text-base">hourglass_bottom</span>
                          Kelompok Usia
                      </h3>
                      <div className="flex-1 min-h-[200px] flex items-center justify-center">
                          <Pie data={usiaChartData} options={pieOptions} />
                      </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative">
                      {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"></div>}
                      <h3 className="text-[11px] font-black tracking-widest uppercase flex items-center gap-2 text-slate-700 mb-6 border-b border-slate-100 pb-3">
                          <span className="material-icons text-red-500 text-base">bar_chart</span>
                          5 Desa Terbanyak
                      </h3>
                      <div className="flex-1 min-h-[200px] w-full">
                          <Bar data={topDesaChartData} options={barOptions} />
                      </div>
                  </div>
              </div>
          </div>
          {/* END VISUALISASI DATA BARU */}

          <div className="lg:col-span-2 space-y-5 md:space-y-6">
              {/* MONITORING KUOTA KEPENGURUSAN */}
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 text-slate-800 theme-el relative">
                  {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"><span className="text-red-600 font-bold">Memuat...</span></div>}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                      <div>
                          <h3 className="text-sm md:text-base font-black tracking-tight flex items-center gap-2.5 text-slate-800">
                              <span className="material-icons text-red-600 bg-red-50 p-2 rounded-xl text-xl">people_alt</span>
                              Monitoring Kuota
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium mt-1 ml-[44px]">Pantau kelengkapan formasi pengurus berdasarkan wilayah.</p>
                      </div>
                  </div>

                  {/* Top 3 Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-red-50/50 to-rose-50/50 rounded-2xl p-4 border border-red-100/60 flex flex-col justify-between">
                          <div className="flex items-center gap-3 mb-6">
                              <span className="material-icons text-red-600 bg-white shadow-sm p-1.5 rounded-lg border border-red-100 text-base">analytics</span>
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Kesiapan PAC</span>
                          </div>
                          <div className="flex items-end justify-between">
                              <div className="w-full mr-4 bg-white rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-100 mb-1">
                                  <div className="bg-red-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${kesiapanPacPercent}%` }}></div>
                              </div>
                              <span className="text-2xl font-black text-red-700 leading-none">{kesiapanPacPercent}%</span>
                          </div>
                      </div>

                      <div className="bg-gradient-to-br from-red-50/50 to-rose-50/50 rounded-2xl p-4 border border-red-100/60 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                  <span className="material-icons text-red-600 bg-white shadow-sm p-1.5 rounded-lg border border-red-100 text-base">account_balance</span>
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Pengurus PAC</span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">Target: {targetPac}</span>
                          </div>
                          <div className="flex items-end justify-between">
                              <div className="w-full mr-4 bg-white rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-100 mb-1">
                                  <div className="bg-red-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (stats.pac/targetPac)*100)}%` }}></div>
                              </div>
                              <div className="flex flex-col items-end">
                                  <span className="text-lg font-black text-red-700 leading-none">{Math.min(100, Math.round((stats.pac/targetPac)*100))}%</span>
                                  <span className="text-[9px] font-bold text-slate-400 mt-1">{stats.pac} / {targetPac}</span>
                              </div>
                          </div>
                      </div>

                      <div className="bg-gradient-to-br from-red-50/50 to-rose-50/50 rounded-2xl p-4 border border-red-100/60 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                  <span className="material-icons text-red-600 bg-white shadow-sm p-1.5 rounded-lg border border-red-100 text-base">security</span>
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Satgas PAC</span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">Target: {targetSatgas}</span>
                          </div>
                          <div className="flex items-end justify-between">
                              <div className="w-full mr-4 bg-white rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-100 mb-1">
                                  <div className="bg-red-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (stats.satgas/targetSatgas)*100)}%` }}></div>
                              </div>
                              <div className="flex flex-col items-end">
                                  <span className="text-lg font-black text-red-700 leading-none">{Math.min(100, Math.round((stats.satgas/targetSatgas)*100))}%</span>
                                  <span className="text-[9px] font-bold text-slate-400 mt-1">{stats.satgas} / {targetSatgas}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Desa Dropdown */}
                  <div className="mb-4">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pilih Desa Untuk Melihat Kuota Ranting</label>
                      <div className="relative">
                          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-red-600 text-lg">location_on</span>
                          <select value={selectedDesa} onChange={e => setSelectedDesa(e.target.value)}
                              className="w-full p-2.5 pl-10 border border-red-400 rounded-xl bg-white outline-none focus:ring-2 focus:ring-red-100 transition font-black text-red-700 text-xs uppercase appearance-none shadow-sm">
                              {uniqueDesas.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-red-600 text-lg pointer-events-none">expand_more</span>
                      </div>
                  </div>

                  {/* Ranting Card */}
                  <div className="bg-gradient-to-br from-red-50/50 to-rose-50/50 rounded-2xl p-4 border border-red-100/60 mb-4">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-red-800 uppercase tracking-widest">Ranting</span>
                          <span className="text-[9px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-100">Target: {targetRantingPerDesa}</span>
                      </div>
                      <div className="flex justify-between items-end mb-2">
                          <span className={`text-[10px] font-black ${currentRantingPercent >= 100 ? 'text-teal-600' : 'text-slate-700'}`}>{currentRantingPercent}% TERPENUHI</span>
                          <span className={`text-[10px] font-bold ${currentRantingCount >= targetRantingPerDesa ? 'text-teal-600' : 'text-red-600'}`}>{currentRantingCount} / {targetRantingPerDesa}</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-1.5 overflow-hidden border border-slate-100">
                          <div className={`h-1.5 rounded-full transition-all duration-1000 ${currentRantingPercent >= 100 ? 'bg-teal-500' : 'bg-red-500'}`} style={{ width: `${currentRantingPercent}%` }}></div>
                      </div>
                  </div>

                  {/* Anak Ranting Dusuns */}
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                      <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-3">Anak Ranting Menurut Dusun (Target: {targetAnakRantingPerDusun}/Dusun)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {dusunsInSelectedDesa.map(dusunName => {
                              const arCount = kuota.anakRantingCounts.find(a => a.desa === selectedDesa && a.dusun === dusunName)?._count.id || 0;
                              const arPercent = Math.min(100, Math.round((arCount / targetAnakRantingPerDusun) * 100));
                              return (
                                  <div key={dusunName} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                      <div className="flex justify-between items-center mb-2">
                                          <span className="text-[10px] font-black text-slate-700 uppercase">{dusunName}</span>
                                          <span className={`text-[10px] font-bold ${arCount >= targetAnakRantingPerDusun ? 'text-teal-600' : 'text-red-600'}`}>{arCount} / {targetAnakRantingPerDusun}</span>
                                      </div>
                                      <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                          <div className={`h-1 rounded-full transition-all duration-1000 ${arCount >= targetAnakRantingPerDusun ? 'bg-teal-500' : 'bg-red-500'}`} style={{ width: `${arPercent}%` }}></div>
                                      </div>
                                  </div>
                              );
                          })}
                          {dusunsInSelectedDesa.length === 0 && (
                              <div className="col-span-2 text-center text-[10px] text-slate-400 py-2">Tidak ada data dusun untuk desa ini.</div>
                          )}
                      </div>
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
