export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// @ts-ignore
import * as archiver from 'archiver';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bagian = searchParams.get('bagian');
    const desa = searchParams.get('desa');
    const dusun = searchParams.get('dusun');

    if (!bagian) {
      return NextResponse.json({ error: 'Filter Bagian wajib diisi' }, { status: 400 });
    }

    // Build query
    const where: any = {};
    if (bagian !== 'Semua') where.bagian = bagian;
    if (desa && desa !== 'Semua') where.desa = desa;
    if (dusun && dusun !== 'Semua') where.dusun = dusun;

    const anggotaList = await prisma.anggota.findMany({
      where,
      select: {
        id: true,
        nama: true,
        bagian: true,
        desa: true,
        dusun: true,
        fotoKtpUrl: true,
        passFotoUrl: true
      }
    });

    if (anggotaList.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data anggota ditemukan dengan filter tersebut' }, { status: 404 });
    }

    // Gunakan ZipArchive dari import statis archiver v8+
    const ZipArchive = (archiver as any).ZipArchive || (archiver as any).default?.ZipArchive;
    const archive = new ZipArchive({
      zlib: { level: 5 } // tingkat kompresi moderate
    });

    // Gunakan PassThrough untuk menghubungkan archiver ke Web Stream secara native
    const { PassThrough } = require('stream');
    const { Readable } = require('stream');
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    let hasFiles = false;

    // Tambahkan file ke arsip
    for (const anggota of anggotaList) {
      const folderBagian = anggota.bagian || 'TANPA_BAGIAN';
      const folderDesa = anggota.desa || 'TANPA_DESA';
      const folderDusun = anggota.dusun || 'TANPA_DUSUN';
      const safeNama = anggota.nama.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'TanpaNama';
      const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'development' ? 'http' : 'https');
      const host = request.headers.get('host') || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;

      const processFile = async (url: string | null, typeFolder: string, typePrefix: string) => {
        if (!url) return;
        const zipPath = `${folderBagian}/${folderDesa}/${folderDusun}/${typeFolder}/${typePrefix}_${anggota.id}_${safeNama}.jpg`;

        // Ubah semua URL menjadi absolute URL agar bisa di-fetch
        let absoluteUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
           absoluteUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
        }

        // Otomatis ubah link Google Drive ke format direct download
        if (absoluteUrl.includes('drive.google.com/file/d/')) {
           const fileId = absoluteUrl.split('/d/')[1]?.split('/')[0];
           if (fileId) absoluteUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        } else if (absoluteUrl.includes('drive.google.com/uc') && !absoluteUrl.includes('export=download')) {
           absoluteUrl = absoluteUrl.replace('uc?', 'uc?export=download&');
        }

        let fileProcessed = false;

        try {
          const response = await fetch(absoluteUrl);
          if (response.ok && response.body) {
            const contentType = response.headers.get('content-type') || '';
            // Jangan masukkan file HTML ke dalam ZIP (biasanya error page dari Google Drive)
            if (!contentType.includes('text/html')) {
              const { Readable } = require('stream');
              archive.append(Readable.fromWeb(response.body), { name: zipPath });
              hasFiles = true;
              fileProcessed = true;
            } else {
              console.warn('File eksternal dicegah masuk ZIP karena berupa halaman web (HTML):', absoluteUrl);
            }
          }
        } catch (err) {
          console.error('Gagal mengunduh file:', absoluteUrl, err);
        }

        // Fallback terakhir: Jika HTTP fetch gagal (atau di-block) dan ini adalah file lokal, baca langsung dari disk
        if (!fileProcessed && url.includes('/uploads/')) {
          let fileName = url.split('/').pop() || '';
          if (fileName.includes('?')) fileName = fileName.split('?')[0];
          fileName = decodeURIComponent(fileName);
          if (fileName) {
            const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
            if (fs.existsSync(filePath)) {
               archive.append(fs.createReadStream(filePath), { name: zipPath });
               hasFiles = true;
            }
          }
        }
      };

      await processFile(anggota.passFotoUrl, 'PASS FOTO', 'PASSFOTO');
      await processFile(anggota.fotoKtpUrl, 'FOTO KTP', 'KTP');
    }

    if (!hasFiles) {
       return NextResponse.json({ error: 'Tidak ada file gambar fisik yang ditemukan untuk diexport. (Mungkin data lama menggunakan Google Drive)' }, { status: 404 });
    }

    // Mulai kompresi
    archive.finalize();

    // Bikin nama file berdasarkan filter
    let zipName = bagian && bagian !== 'Semua' ? bagian.toUpperCase() : "FOTO_KESELURUHAN";
    if (dusun && dusun !== 'Semua') zipName += `_DUSUN ${dusun.toUpperCase()}`;
    if (desa && desa !== 'Semua') zipName += `_DESA ${desa.toUpperCase()}`;
    zipName += '.zip';
    zipName = zipName.replace(/\s+/g, '_');

    const webStream = Readable.toWeb(passThrough);

    return new NextResponse(webStream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Terjadi kesalahan pada server: ${errorMessage}` }, { status: 500 });
  }
}
