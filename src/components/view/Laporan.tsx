import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAlert } from '../AlertProvider';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WilayahItem {
  id: number;
  kecamatan: string;
  desa: string;
  dusun: string;
}

export default function LaporanView() {
  const { showAlert, showConfirm } = useAlert();
  const [format, setFormat] = useState('EXCEL');
  const [bagian, setBagian] = useState('');
  const [desa, setDesa] = useState('');
  const [selectedDusuns, setSelectedDusuns] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // States for Photo Export
  const [photoBagian, setPhotoBagian] = useState('');
  const [photoDesa, setPhotoDesa] = useState('');
  const [photoDusun, setPhotoDusun] = useState('');
  const [isExportingPhoto, setIsExportingPhoto] = useState(false);
  const [cols, setCols] = useState({
    nik: true,
    nama: true,
    jenisKelamin: true,
    tanggalLahir: true,
    usia: true,
    nomorHp: true,
    desa: true,
    dusun: true,
    bagian: true,
    jabatan: true
  });
  
  const { data: wilayahListResponse = [] } = useQuery({
    queryKey: ['wilayah'],
    queryFn: async () => {
      const r = await fetch('/api/wilayah');
      const json = await r.json();
      return json.success ? json.data : [];
    }
  });

  const wilayahList: WilayahItem[] = wilayahListResponse;
  
  const desaList = useMemo(() => {
    return Array.from(new Set(wilayahList.map((w) => w.desa))).sort() as string[];
  }, [wilayahList]);
  
  const dusunList = useMemo(() => {
    if (desa) return Array.from(new Set(wilayahList.filter((w) => w.desa === desa).map((w) => w.dusun).filter(Boolean))).sort() as string[];
    return [];
  }, [desa, wilayahList]);

  const photoDusunList = useMemo(() => {
    if (photoDesa) return Array.from(new Set(wilayahList.filter((w) => w.desa === photoDesa).map((w) => w.dusun).filter(Boolean))).sort() as string[];
    return [];
  }, [photoDesa, wilayahList]);

  // We should clear selectedDusuns when desa changes. We can do this in the select onChange.

  const toggleCol = (k: keyof typeof cols) => {
    setCols(p => ({ ...p, [k]: !p[k] }));
  };

  const toggleDusun = (d: string) => {
    setSelectedDusuns(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

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
        showAlert('Tidak ada data anggota untuk filter tersebut.', 'error');
        setIsExporting(false);
        return;
      }

      let rawData = json.data;
      
      // Filter Dusun if selected
      if (selectedDusuns.length > 0) {
          rawData = rawData.filter((d: any) => selectedDusuns.includes(d.dusun));
      }

      if (rawData.length === 0) {
        showAlert('Tidak ada data untuk kombinasi filter tersebut.', 'error');
        setIsExporting(false);
        return;
      }

      // Sorting by Jabatan
      const urutanJabatan: Record<string, number> = { "KETUA": 1, "SEKRETARIS": 2, "BENDAHARA": 3, "ANGGOTA": 4 };
      rawData.sort((a: any, b: any) => {
          const jA = urutanJabatan[String(a.jabatan).toUpperCase()] || 5;
          const jB = urutanJabatan[String(b.jabatan).toUpperCase()] || 5;
          return jA - jB;
      });

      const countL = rawData.filter((d: any) => String(d.jenisKelamin).toUpperCase() === 'LAKI-LAKI').length;
      const countP = rawData.filter((d: any) => String(d.jenisKelamin).toUpperCase() === 'PEREMPUAN').length;

      let filterArr = [];
      if (bagian) filterArr.push("BAGIAN: " + bagian);
      if (desa) filterArr.push("DESA: " + desa);
      if (selectedDusuns.length > 0) filterArr.push("DUSUN: " + selectedDusuns.join(", "));

      const filterLeftText = "DATA " + (filterArr.length > 0 ? filterArr.join(" | ") : "KESELURUHAN ANGGOTA");
      const summaryRightText = `Jumlah Data : ${rawData.length} | Laki-Laki : ${countL} | Perempuan : ${countP}`;
      let fileName = bagian ? bagian.toUpperCase() : "LAPORAN_DATA_KESELURUHAN";
      if (selectedDusuns.length > 0) fileName += `_DUSUN ${selectedDusuns.join("_").toUpperCase()}`;
      if (desa) fileName += `_DESA ${desa.toUpperCase()}`;

      // Build Headers
      const headers = ["NO"];
      if (cols.nik) headers.push("NIK");
      if (cols.nama) headers.push("NAMA");
      if (cols.jenisKelamin) headers.push("L/P");
      if (cols.tanggalLahir) headers.push("TGL LAHIR");
      if (cols.usia) headers.push("UMUR");
      if (cols.nomorHp) headers.push("NOMOR HP");
      if (cols.desa) headers.push("DESA");
      if (cols.dusun) headers.push("DUSUN");
      if (cols.bagian) headers.push("BAGIAN");
      if (cols.jabatan) headers.push("JABATAN");

      // Common rows
      const commonDataRows = rawData.map((d: any, idx: number) => {
          let row: any[] = [idx + 1];
          if (cols.nik) row.push(d.nik ? "'" + d.nik : '-');
          if (cols.nama) row.push(d.nama || '-');
          if (cols.jenisKelamin) {
              let jk = '-';
              if (String(d.jenisKelamin).toUpperCase() === 'LAKI-LAKI') jk = 'L';
              else if (String(d.jenisKelamin).toUpperCase() === 'PEREMPUAN') jk = 'P';
              row.push(jk);
          }
          if (cols.tanggalLahir) row.push(d.tanggalLahir || '-');
          if (cols.usia) row.push(d.umur || '-');
          if (cols.nomorHp) row.push(d.nomorHp || '-');
          if (cols.desa) row.push(d.desa || '-');
          if (cols.dusun) row.push(d.dusun || '-');
          if (cols.bagian) row.push(d.bagian || '-');
          if (cols.jabatan) row.push(d.jabatan || '-');
          return row;
      });

      if (format === 'CSV') {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += '"PDI PERJUANGAN"\r\n';
        csvContent += '"PAC KAWUNGANTEN"\r\n';
        csvContent += '"PERIODE 2026 - 2031"\r\n\r\n';
        const emptyCols = headers.slice(1).map(() => '""').join(",");
        csvContent += `"${filterLeftText}",${emptyCols.length > 3 ? emptyCols.substring(3) : ''},"${summaryRightText}"\r\n\r\n`;
        commonDataRows.forEach((row: any[]) => {
            let csvRow = row.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",");
            csvContent += csvRow + "\r\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", fileName + ".csv");
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }
      else if (format === 'EXCEL') {
        if (bagian === 'RANTING') {
            const excelData: any[][] = [
                ["STRUKTUR, KOMPOSISI DAN PERSONALIA"],
                ["PENGURUS RANTING PDI PERJUANGAN"],
                ["DESA " + (desa || ".............").toUpperCase() + " KECAMATAN KAWUNGANTEN"],
                ["KABUPATEN CILACAP"],
                [],
                [],
                ["NO", "JABATAN", "NAMA SESUAI KTP", "NIK", "TGL LAHIR", "L/P", "NO. HP"]
            ];
            const posRanting = ["KETUA", "Wakil Ketua", "Wakil Ketua", "Wakil Ketua", "Wakil Ketua", "Wakil Ketua", "Wakil Ketua", "SEKRETARIS", "BENDAHARA"];
            rawData.forEach((d: any) => d._used = false);
            
            const getPerson = (jab: string) => {
                let searchJab = String(jab).toUpperCase();
                if (searchJab === "WAKIL KETUA") searchJab = "ANGGOTA";
                let p = rawData.find((d: any) => String(d.jabatan).toUpperCase() === searchJab && !d._used);
                if (!p && searchJab.startsWith("WAKIL")) p = rawData.find((d: any) => String(d.jabatan).toUpperCase().includes("WAKIL") && !d._used);
                if (p) p._used = true;
                return p;
            };

            posRanting.forEach((pos, idx) => {
                let p = getPerson(pos);
                if (p) {
                    let jk = '-';
                    if (String(p.jenisKelamin).toUpperCase() === 'LAKI-LAKI') jk = 'L';
                    else if (String(p.jenisKelamin).toUpperCase() === 'PEREMPUAN') jk = 'P';
                    let hpVal = p.nomorHp || '-';
                    excelData.push([ idx + 1, pos, p.nama || '-', p.nik ? "'" + p.nik : '-', p.tanggalLahir || '-', jk, hpVal ]);
                } else {
                    excelData.push([idx + 1, pos, "", "", "", "", ""]);
                }
            });

            const ws = XLSX.utils.aoa_to_sheet(excelData);
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
                { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }
            ];
            ws['!merges'].forEach(m => {
                const cellRef = XLSX.utils.encode_cell({ c: m.s.c, r: m.s.r });
                if (ws[cellRef]) {
                    ws[cellRef].s = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' } };
                }
            });
            ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 5 }, { wch: 15 }];
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Laporan Ranting");
            XLSX.writeFile(wb, fileName + ".xlsx");
            
        } else if (bagian === 'ANAK RANTING') {
            const excelData: any[][] = [
                ["ANAK RANTING PDI PERJUANGAN DESA " + (desa || ".............").toUpperCase()],
                [],
                []
            ];
            const dusunToExport = selectedDusuns.length > 0 ? selectedDusuns : [...Array.from(new Set(rawData.map((d: any) => d.dusun).filter(Boolean)))].sort() as string[];
            const posAnak = ["KETUA", "WAKIL KETUA", "WAKIL KETUA", "SEKRETARIS", "BENDAHARA"];
            const merges: any[] = [ { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } } ];

            dusunToExport.forEach(dsn => {
                merges.push({ s: { r: excelData.length, c: 0 }, e: { r: excelData.length, c: 6 } });
                excelData.push(["DATA ANAK RANTING PDI PERJUANGAN (" + dsn.toUpperCase() + ")"]);
                excelData.push([]);
                excelData.push(["NO", "NAMA SESUAI KTP", "JABATAN", "NIK ", "TGL LAHIR", "L/P", "NO. HP"]);

                const dusunData = rawData.filter((d: any) => d.dusun === dsn);
                dusunData.forEach((d: any) => d._used = false);

                const getPerson = (jab: string) => {
                    let searchJab = jab;
                    if (jab === "WAKIL KETUA") searchJab = "ANGGOTA";
                    let p = dusunData.find((d: any) => String(d.jabatan).toUpperCase() === searchJab && !d._used);
                    if (!p && searchJab.startsWith("WAKIL")) p = dusunData.find((d: any) => String(d.jabatan).toUpperCase().includes("WAKIL") && !d._used);
                    if (p) p._used = true;
                    return p;
                };

                posAnak.forEach((pos, idx) => {
                    let p = getPerson(pos);
                    if (p) {
                        let jk = '-';
                        if (String(p.jenisKelamin).toUpperCase() === 'LAKI-LAKI') jk = 'L';
                        else if (String(p.jenisKelamin).toUpperCase() === 'PEREMPUAN') jk = 'P';
                        let hpVal = p.nomorHp || '-';
                        excelData.push([ idx + 1, p.nama || '-', pos, p.nik ? "'" + p.nik : '-', p.tanggalLahir || '-', jk, hpVal ]);
                    } else {
                        excelData.push([idx + 1, "", pos, "", "", "", ""]);
                    }
                });
                excelData.push([]); excelData.push([]); excelData.push([]);
            });

            const ws = XLSX.utils.aoa_to_sheet(excelData);
            ws['!merges'] = merges;
            merges.forEach(m => {
                const cellRef = XLSX.utils.encode_cell({ c: m.s.c, r: m.s.r });
                if (ws[cellRef]) {
                    ws[cellRef].s = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' } };
                }
            });
            ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 5 }, { wch: 15 }];
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Laporan Anak Ranting");
            XLSX.writeFile(wb, fileName + ".xlsx");

        } else {
            const excelData: any[][] = [
                ["PDI PERJUANGAN"],
                ["PAC KAWUNGANTEN"],
                ["PERIODE 2026 - 2031"],
                [],
            ];
            const filterRow = [filterLeftText];
            for (let i = 1; i < headers.length - 1; i++) filterRow.push("");
            filterRow.push(summaryRightText);
            excelData.push(filterRow);
            excelData.push(headers);
            commonDataRows.forEach((row: any[]) => excelData.push(row));

            const ws = XLSX.utils.aoa_to_sheet(excelData);
            const totalCols = headers.length;
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } }
            ];
            ws['!merges'].forEach(m => {
                const cellRef = XLSX.utils.encode_cell({ c: m.s.c, r: m.s.r });
                if (ws[cellRef]) {
                    ws[cellRef].s = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center', vertical: 'center' } };
                }
            });
            ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length, 5) + 2 }));
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Laporan");
            XLSX.writeFile(wb, fileName + ".xlsx");
        }
      } else if (format === 'PDF') {
        const doc = new jsPDF('landscape');

        if (bagian === 'ANAK RANTING' && desa) {
            const dusunToExport = selectedDusuns.length > 0 ? selectedDusuns : [...Array.from(new Set(rawData.map((d: any) => d.dusun).filter(Boolean)))].sort() as string[];
            let isFirst = true;
            let currentY = 36;

            dusunToExport.forEach((dsn) => {
                const dusunDataRaw = rawData.filter((d: any) => d.dusun === dsn);
                if (dusunDataRaw.length === 0) return;
                
                const total = dusunDataRaw.length;
                const l = dusunDataRaw.filter((d: any) => String(d.jenisKelamin).toUpperCase() === 'LAKI-LAKI').length;
                const p = dusunDataRaw.filter((d: any) => String(d.jenisKelamin).toUpperCase() === 'PEREMPUAN').length;

                const dusunRows = dusunDataRaw.map((d: any, idx: number) => {
                    let row: any[] = [idx + 1];
                    if (cols.nik) row.push(d.nik ? "'" + d.nik : '-');
                    if (cols.nama) row.push(d.nama || '-');
                    if (cols.jenisKelamin) {
                        let jk = '-';
                        if (String(d.jenisKelamin).toUpperCase() === 'LAKI-LAKI') jk = 'L';
                        else if (String(d.jenisKelamin).toUpperCase() === 'PEREMPUAN') jk = 'P';
                        row.push(jk);
                    }
                    if (cols.tanggalLahir) row.push(d.tanggalLahir || '-');
                    if (cols.usia) row.push(d.umur || '-');
                    if (cols.nomorHp) row.push(d.nomorHp || '-');
                    if (cols.desa) row.push(d.desa || '-');
                    if (cols.dusun) row.push(d.dusun || '-');
                    if (cols.bagian) row.push(d.bagian || '-');
                    if (cols.jabatan) row.push(d.jabatan || '-');
                    return row;
                });

                if (currentY > doc.internal.pageSize.getHeight() - 40 && !isFirst) {
                    doc.addPage();
                    currentY = 36;
                }

                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text(`DUSUN: ${dsn.toUpperCase()}`, 14, currentY);
                doc.text(`Total: ${total} Anggota | Laki-laki: ${l} | Perempuan: ${p}`, doc.internal.pageSize.getWidth() - 14, currentY, { align: "right" });
                
                currentY += 4; // Jarak teks ke tabel

                autoTable(doc, {
                    startY: currentY,
                    head: [headers],
                    body: dusunRows,
                    headStyles: { fillColor: [220, 38, 38] },
                    styles: { fontSize: 8, cellPadding: 2 },
                    margin: { top: 36 },
                    didDrawPage: (data) => {
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(12);
                        const pw = doc.internal.pageSize.getWidth();
                        doc.text("PDI PERJUANGAN", pw / 2, 12, { align: "center" });
                        doc.text("PAC KAWUNGANTEN", pw / 2, 18, { align: "center" });
                        doc.text("PERIODE 2026 - 2031", pw / 2, 24, { align: "center" });
                    }
                });

                currentY = (doc as any).lastAutoTable.finalY + 10;
                isFirst = false;
            });

            if (isFirst) {
                doc.setFont("helvetica", "bold");
                doc.text("Data Kosong", 14, 20);
            }

            doc.save(`${fileName}.pdf`);
        } else {
            const pageWidth = doc.internal.pageSize.getWidth();
            autoTable(doc, {
                startY: 36,
                head: [headers],
                body: commonDataRows,
                headStyles: { fillColor: [220, 38, 38] },
                styles: { fontSize: 8, cellPadding: 2 },
                margin: { top: 36 },
                didDrawPage: (data) => {
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(12);
                    doc.text("PDI PERJUANGAN", pageWidth / 2, 12, { align: "center" });
                    doc.text("PAC KAWUNGANTEN", pageWidth / 2, 18, { align: "center" });
                    doc.text("PERIODE 2026 - 2031", pageWidth / 2, 24, { align: "center" });
                    doc.setFontSize(10);
                    doc.text(filterLeftText, 14, 32);
                    doc.text(summaryRightText, pageWidth - 14, 32, { align: "right" });
                }
            });

            doc.save(`${fileName}.pdf`);
        }
      }
      
      showAlert('Laporan berhasil diekspor dan diunduh!', 'success');
    } catch (e) {
      console.error(e);
      showAlert('Gagal mengekspor data.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPhoto = async () => {
    if (!photoBagian) {
      showAlert('Silakan pilih Bagian terlebih dahulu.', 'error');
      return;
    }
    setIsExportingPhoto(true);
    try {
      const params = new URLSearchParams();
      params.append('bagian', photoBagian);
      if (photoDesa) params.append('desa', photoDesa);
      if (photoDusun) params.append('dusun', photoDusun);

      const response = await fetch(`/api/export-images?${params.toString()}`);
      if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          showAlert(errJson.error || 'Gagal export foto.', 'error');
      } else {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          let zipName = photoBagian && photoBagian !== 'Semua' ? photoBagian.toUpperCase() : "FOTO_KESELURUHAN";
          if (photoDusun && photoDusun !== 'Semua') zipName += `_DUSUN ${photoDusun.toUpperCase()}`;
          if (photoDesa && photoDesa !== 'Semua') zipName += `_DESA ${photoDesa.toUpperCase()}`;
          a.download = `${zipName.replace(/\s+/g, '_')}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          showAlert('Export foto berhasil diunduh.', 'success');
      }
    } catch (e) {
      showAlert('Gagal menghubungi server.', 'error');
    }
    setIsExportingPhoto(false);
  };

  const hideKolomEkspor = format === 'EXCEL' && (bagian === 'RANTING' || bagian === 'ANAK RANTING');
  const showDusunFilter = bagian === 'ANAK RANTING' && desa;

  const [activeMenu, setActiveMenu] = useState<'data' | 'foto' | null>(null);

  return (
    <div id="menu-laporan" className="max-w-6xl mx-auto space-y-6">
        
        {/* TAB SELECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
            <button 
                onClick={() => setActiveMenu(activeMenu === 'data' ? null : 'data')}
                className={`p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 ${activeMenu === 'data' ? 'bg-red-50 border-red-500 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-red-200 hover:bg-red-50/50 hover:shadow-md'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm ${activeMenu === 'data' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600'}`}>
                    <span className="material-icons text-3xl">assignment_turned_in</span>
                </div>
                <h3 className={`font-black text-lg ${activeMenu === 'data' ? 'text-red-800' : 'text-slate-700'}`}>Ekspor Laporan Data</h3>
                <p className="text-xs text-slate-500 text-center px-4">Unduh data anggota dalam format Spreadsheet Excel, PDF, atau CSV terstruktur.</p>
            </button>
            
            <button 
                onClick={() => setActiveMenu(activeMenu === 'foto' ? null : 'foto')}
                className={`p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 ${activeMenu === 'foto' ? 'bg-red-50 border-red-500 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-red-200 hover:bg-red-50/50 hover:shadow-md'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm ${activeMenu === 'foto' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600'}`}>
                    <span className="material-icons text-3xl">photo_library</span>
                </div>
                <h3 className={`font-black text-lg ${activeMenu === 'foto' ? 'text-red-800' : 'text-slate-700'}`}>Ekspor Foto Anggota (ZIP)</h3>
                <p className="text-xs text-slate-500 text-center px-4">Unduh massal Pass Foto dan KTP dalam folder ZIP yang tersusun rapi otomatis.</p>
            </button>
        </div>

        {activeMenu === 'data' && (
            <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl border border-red-100 max-w-2xl mx-auto text-center relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl md:text-2xl font-extrabold text-red-800 mb-2">Form Ekspor Laporan Data</h2>
                <p className="text-red-400 text-xs md:text-sm mb-6 pb-6 border-b border-red-50">Silakan atur filter di bawah ini untuk mengunduh laporan ke perangkat Anda.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-8 text-left relative z-10">
                    <div className="sm:col-span-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Pilih Format Unduhan</label>
                        <select value={format} onChange={e => setFormat(e.target.value)} className="w-full p-4 border-2 border-red-200 rounded-2xl bg-white outline-none text-sm font-bold text-red-700 focus:border-red-500 text-center cursor-pointer transition shadow-sm hover:shadow-md">
                            <option value="EXCEL">Spreadsheet Excel (.xlsx)</option>
                            <option value="PDF">Dokumen PDF (.pdf)</option>
                            <option value="CSV">Data Mentah CSV (.csv)</option>
                        </select>
                    </div>

                    <div className="sm:col-span-2 pt-4 mt-2 border-t border-slate-100"></div>

                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Filter Bagian</label>
                        <select value={bagian} onChange={e => setBagian(e.target.value)} className="w-full p-3.5 border border-red-200 rounded-xl bg-red-50 outline-none text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-bold text-red-800">
                            <option value="">- Semua Bagian -</option>
                            <option value="PAC">PAC</option>
                            <option value="RANTING">RANTING</option>
                            <option value="ANAK RANTING">ANAK RANTING</option>
                            <option value="SATGAS">SATGAS</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Filter Desa</label>
                        <select value={desa} onChange={e => { setDesa(e.target.value); setSelectedDusuns([]); }} className="w-full p-3.5 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition font-bold text-slate-700 text-sm">
                            <option value="">- Semua Desa -</option>
                            {desaList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {showDusunFilter && (
                        <div className="sm:col-span-2 mt-2">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Filter Dusun (Bisa Pilih Banyak)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                {dusunList.map(dsn => (
                                    <label key={dsn} className="flex items-center space-x-3 text-xs font-bold text-slate-700 cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition">
                                        <input type="checkbox" checked={selectedDusuns.includes(dsn)} onChange={() => toggleDusun(dsn)} className="form-checkbox h-4 w-4 text-red-600 rounded border-slate-300 focus:ring-red-500 transition" />
                                        <span>{dsn}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {!hideKolomEkspor && (
                        <div className="sm:col-span-2 pt-4 mt-2 border-t border-slate-100 transition-all duration-300">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Pilih Kolom Ekspor</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(cols).map(([k, v]) => (
                                    <label key={k} className="flex items-center space-x-2 text-[11px] font-bold text-slate-600 cursor-pointer p-2 rounded-xl bg-white border border-slate-100 hover:border-slate-300 transition hover:bg-slate-50">
                                        <input type="checkbox" checked={v} onChange={() => toggleCol(k as keyof typeof cols)} className="form-checkbox h-4 w-4 text-red-600 rounded border-slate-300 focus:ring-red-500" />
                                        <span className="uppercase">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={handleExport} disabled={isExporting}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-full font-black flex items-center justify-center space-x-2 w-full shadow-xl shadow-red-600/30 transition-all transform active:scale-95 text-sm disabled:opacity-50 relative z-10">
                    <span className="material-icons">{isExporting ? 'hourglass_empty' : 'cloud_download'}</span>
                    <span>{isExporting ? 'MENYIAPKAN FILE...' : 'UNDUH SEKARANG'}</span>
                </button>
            </div>
        )}

        {/* EXPORT FOTO MASSAL (ZIP) */}
        {activeMenu === 'foto' && (
            <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl border border-red-100 max-w-2xl mx-auto text-center relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl md:text-2xl font-extrabold text-red-800 mb-2">Form Ekspor Foto Anggota</h2>
                <p className="text-red-400 text-xs md:text-sm mb-6 pb-6 border-b border-red-50">Unduh massal Pass Foto dan Foto KTP dalam bentuk ZIP.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-8 text-left relative z-10">
                    <div className="sm:col-span-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">1. Filter Bagian (Wajib)</label>
                        <select value={photoBagian} onChange={e => { setPhotoBagian(e.target.value); setPhotoDesa(''); setPhotoDusun(''); }} className="w-full p-4 border border-red-200 rounded-2xl bg-red-50 outline-none text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 transition font-bold text-red-800">
                            <option value="">- Pilih Bagian -</option>
                            <option value="Semua">Semua Bagian</option>
                            <option value="PAC">PAC</option>
                            <option value="RANTING">RANTING</option>
                            <option value="ANAK RANTING">ANAK RANTING</option>
                            <option value="SATGAS">SATGAS</option>
                        </select>
                    </div>

                    {photoBagian && (
                        <>
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">2. Filter Desa (Opsional)</label>
                            <select 
                                disabled={photoBagian === 'PAC' || photoBagian === 'SATGAS'} 
                                value={photoDesa} 
                                onChange={e => { setPhotoDesa(e.target.value); setPhotoDusun(''); }} 
                                className="w-full p-3.5 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition font-bold text-slate-700 text-sm disabled:opacity-50 disabled:bg-slate-50">
                                <option value="">- Pilih Desa (Semua) -</option>
                                {desaList.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">3. Filter Dusun (Opsional)</label>
                            <select 
                                disabled={photoBagian !== 'ANAK RANTING' || !photoDesa} 
                                value={photoDusun} 
                                onChange={e => setPhotoDusun(e.target.value)} 
                                className="w-full p-3.5 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition font-bold text-slate-700 text-sm disabled:opacity-50 disabled:bg-slate-50">
                                <option value="">- Pilih Dusun (Semua) -</option>
                                {photoDusunList.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        </>
                    )}
                </div>

                <button onClick={handleExportPhoto} disabled={isExportingPhoto}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-full font-black flex items-center justify-center space-x-2 w-full shadow-xl shadow-red-600/30 transition-all transform active:scale-95 text-sm disabled:opacity-50 relative z-10">
                    <span className="material-icons">{isExportingPhoto ? 'hourglass_empty' : 'archive'}</span>
                    <span>{isExportingPhoto ? 'MEMBUAT ZIP...' : 'UNDUH FOTO (ZIP)'}</span>
                </button>
            </div>
        )}

        {/* LOADING OVERLAY MODERN */}
        {mounted && (isExporting || isExportingPhoto) && createPortal(
            <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center max-w-sm w-full animate-in zoom-in-95 duration-300 border border-slate-100">
                    <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 border-4 border-red-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-icons text-red-600 animate-pulse">cloud_download</span>
                        </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">
                        Mengunduh File...
                    </h3>
                    <p className="text-xs md:text-sm font-semibold text-slate-500 leading-relaxed">
                        Mohon tunggu sebentar, sistem sedang memproses dan menyiapkan file yang Anda minta.
                    </p>
                </div>
            </div>
        , document.body)}
    </div>
  );
}
