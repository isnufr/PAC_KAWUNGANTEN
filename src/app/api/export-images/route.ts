export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// @ts-ignore
import archiver from 'archiver';
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

    // Create archiver
    const archive = archiver('zip', {
      zlib: { level: 5 } // tingkat kompresi moderate
    });

    // Bridge Node Stream to Web Stream using ReadableStream
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk: any) => controller.enqueue(chunk));
        archive.on('end', () => controller.close());
        archive.on('error', (err: any) => controller.error(err));
      }
    });

    let hasFiles = false;

    // Tambahkan file ke arsip
    for (const anggota of anggotaList) {
      const folderBagian = anggota.bagian || 'TANPA_BAGIAN';
      const folderDesa = anggota.desa || 'TANPA_DESA';
      const folderDusun = anggota.dusun || 'TANPA_DUSUN';
      const safeNama = anggota.nama.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'TanpaNama';

      const processFile = (url: string | null, typeFolder: string, typePrefix: string) => {
        if (!url) return;
        // Hanya proses file lokal dari /api/uploads/
        if (url.startsWith('/api/uploads/')) {
          const fileName = url.split('/').pop();
          if (fileName) {
            const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
            if (fs.existsSync(filePath)) {
               const zipPath = `${folderBagian}/${folderDesa}/${folderDusun}/${typeFolder}/${typePrefix}_${anggota.id}_${safeNama}.jpg`;
               archive.file(filePath, { name: zipPath });
               hasFiles = true;
            }
          }
        }
      };

      processFile(anggota.passFotoUrl, 'PASS FOTO', 'PASSFOTO');
      processFile(anggota.fotoKtpUrl, 'FOTO KTP', 'KTP');
    }

    if (!hasFiles) {
       writer.close(); // Prevent hanging stream
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

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server saat melakukan export' }, { status: 500 });
  }
}
