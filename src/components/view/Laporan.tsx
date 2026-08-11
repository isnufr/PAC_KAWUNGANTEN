import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function LaporanView() {
  const [format, setFormat] = useState('EXCEL');
  const [bagian, setBagian] = useState('');
  const [desa, setDesa] = useState('');
  const [desaList, setDesaList] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const [cols, setCols] = useState({
    nik: true,
    nama: true,
    jenisKelamin: true,
    tanggalLahir: true,
    umur: true,
    nomorHp: true,
    bagian: true,
    jabatan: true,
    desa: true,
    dusun: true
  });

  useEffect(() => {
    fetch('/api/wilayah').then(r => r.json()).then(json => {
      if (json.success) {
        const desas = Array.from(new Set(json.data.map((w: any) => w.desa))).sort() as string[];
        setDesaList(desas);
      }
    }).catch(console.error);
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (bagian) params.append('bagian', bagian);
      if (desa) params.append('desa', desa);
      params.append('limit', '5000'); // Fetch a large amount for export

      const res = await fetch(`/api/anggota?${params.toString()}`);
      const json = await res.json();
      if (!json.success || !json.data.length) {
        alert('Tidak ada data anggota untuk filter tersebut.');
        return;
      }

      const rawData = json.data;
      
      // Filter columns
      const exportData = rawData.map((d: any, index: number) => {
        const row: any = { No: index + 1 };
        if (cols.nik) row['NIK'] = d.nik;
        if (cols.nama) row['Nama Lengkap'] = d.nama;
        if (cols.jenisKelamin) row['Jenis Kelamin'] = d.jenisKelamin;
        if (cols.tanggalLahir) row['Tanggal Lahir'] = d.tanggalLahir;
        if (cols.umur) row['Usia'] = d.umur;
        if (cols.nomorHp) row['Nomor HP'] = d.nomorHp;
        if (cols.bagian) row['Bagian'] = d.bagian;
        if (cols.jabatan) row['Jabatan'] = d.jabatan;
        if (cols.desa) row['Desa'] = d.desa;
        if (cols.dusun) row['Dusun'] = d.dusun;
        return row;
      });

      const fileName = `Laporan_Anggota_PAC_KAWUNGANTEN_${bagian || 'Semua'}_${desa || 'Semua'}`;

      if (format === 'EXCEL' || format === 'CSV') {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Anggota');
        XLSX.writeFile(workbook, `${fileName}.${format.toLowerCase()}`);
      } else if (format === 'PDF') {
        const doc = new jsPDF(cols.dusun ? 'landscape' : 'portrait');
        doc.text(`Laporan Data Anggota PAC KAWUNGANTEN`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Filter Bagian: ${bagian || 'Semua'} | Desa: ${desa || 'Semua'}`, 14, 22);
        
        const headers = Object.keys(exportData[0]);
        const body = exportData.map((row: any) => headers.map(h => row[h] || '-'));
        
        autoTable(doc, {
          head: [headers],
          body: body,
          startY: 28,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [220, 38, 38] } // Red theme
        });
        
        doc.save(`${fileName}.pdf`);
      }
    } catch (e) {
      console.error(e);
      alert('Gagal mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleCol = (k: keyof typeof cols) => {
    setCols(p => ({ ...p, [k]: !p[k] }));
  };

  return (
    <div id="menu-laporan" className="max-w-6xl mx-auto">
        <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-red-100 max-w-2xl mx-auto text-center">
            <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3.5 border border-red-200">
                <span className="material-icons text-red-600 text-2xl md:text-3xl">assignment_turned_in</span>
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-red-800 mb-1.5">Ekspor Laporan Data</h2>
            <p className="text-red-400 text-xs md:text-sm mb-5 pb-5 border-b border-red-50">Pilih filter dan format file dokumen yang Anda butuhkan untuk diunduh ke perangkat Anda.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:gap-4 mb-6 text-left">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-red-800 uppercase tracking-wide mb-2.5 text-center">Pilih Format Unduhan</label>
                    <select value={format} onChange={e => setFormat(e.target.value)} className="w-full p-3.5 border-2 border-red-200 rounded-2xl bg-white outline-none text-xs md:text-sm font-bold text-red-700 focus:border-red-500 text-center cursor-pointer transition shadow-sm hover:shadow-md">
                        <option value="EXCEL">Spreadsheet Excel (.xlsx)</option>
                        <option value="PDF">Dokumen PDF (.pdf)</option>
                        <option value="CSV">Data Mentah CSV (.csv)</option>
                    </select>
                </div>

                <div className="sm:col-span-2 pt-3 mt-1 border-t border-red-50"></div>

                <div>
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">Filter Bagian</label>
                    <select value={bagian} onChange={e => setBagian(e.target.value)} className="w-full p-2.5 md:p-3 border border-red-200 rounded-xl bg-red-50 outline-none text-xs md:text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800">
                        <option value="">- Semua Bagian -</option>
                        <option value="PAC">PAC</option>
                        <option value="RANTING">RANTING</option>
                        <option value="ANAK RANTING">ANAK RANTING</option>
                        <option value="SATGAS">SATGAS</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">Filter Desa</label>
                    <select value={desa} onChange={e => setDesa(e.target.value)} className="w-full p-2.5 md:p-3 border border-red-200 rounded-xl bg-red-50 outline-none text-xs md:text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-semibold text-red-800">
                        <option value="">- Semua Desa -</option>
                        {desaList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                <div className="sm:col-span-2 pt-3 mt-1 border-t border-red-50">
                    <label className="block text-xs font-bold text-red-800 uppercase tracking-wide mb-2.5 text-center">Pilih Kolom Ekspor</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        {Object.entries(cols).map(([k, v]) => (
                            <label key={k} className="flex items-center space-x-2 text-xs font-medium text-red-700 cursor-pointer">
                                <input type="checkbox" checked={v} onChange={() => toggleCol(k as keyof typeof cols)} className="form-checkbox h-4 w-4 text-red-600 rounded" />
                                <span className="uppercase">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <button onClick={handleExport} disabled={isExporting}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 md:py-4 rounded-full font-bold flex items-center justify-center space-x-2 w-full shadow-xl shadow-red-500/30 transition transform active:scale-95 text-sm disabled:opacity-50">
                <span className="material-icons">{isExporting ? 'hourglass_empty' : 'cloud_download'}</span>
                <span>{isExporting ? 'MENYIAPKAN FILE...' : 'UNDUH SEKARANG'}</span>
            </button>
        </div>
    </div>
  );
}
