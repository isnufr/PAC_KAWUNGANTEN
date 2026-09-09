export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logAktivitas } from '@/lib/logger';

const prisma = new PrismaClient();

// Helper: Bulan ke Romawi
const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// Generate nomor surat keluar otomatis: 001/EX/PAC/IX/2026
async function generateNomorSurat(): Promise<string> {
  const now = new Date();
  const bulan = now.getMonth(); // 0-indexed
  const tahun = now.getFullYear();

  // Hitung surat keluar bulan ini
  const startOfMonth = new Date(tahun, bulan, 1);
  const endOfMonth = new Date(tahun, bulan + 1, 1);

  const count = await prisma.suratKeluar.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
  });

  const urutan = String(count + 1).padStart(3, '0');
  return `${urutan}/EX/PAC/${bulanRomawi[bulan]}/${tahun}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const jenis = searchParams.get('jenis');
    const preview = searchParams.get('preview'); // preview nomor surat berikutnya

    if (preview === 'nomor') {
      const nomor = await generateNomorSurat();
      return NextResponse.json({ success: true, nomor });
    }

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { nomorSurat: { contains: search } },
        { tujuan: { contains: search } },
        { perihal: { contains: search } },
      ];
    }
    if (status) {
      whereClause.status = status;
    }
    if (jenis) {
      whereClause.jenisSurat = jenis;
    }

    const data = await prisma.suratKeluar.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Summary counts
    const allData = await prisma.suratKeluar.findMany();
    const summary = {
      total: allData.length,
      draft: allData.filter(d => d.status === 'DRAFT').length,
      terkirim: allData.filter(d => d.status === 'TERKIRIM').length,
      selesai: allData.filter(d => d.status === 'SELESAI').length,
    };

    return NextResponse.json({ success: true, data, summary });
  } catch (error) {
    console.error('API Surat Keluar GET Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const nomorSurat = await generateNomorSurat();

    const newSurat = await prisma.suratKeluar.create({
      data: {
        nomorSurat,
        tanggalSurat: new Date(body.tanggalSurat),
        tujuan: body.tujuan,
        perihal: body.perihal,
        jenisSurat: body.jenisSurat,
        isiRingkas: body.isiRingkas || null,
        status: body.status || 'DRAFT',
        operator: body.operator || null,
      },
    });

    await logAktivitas(req, 'CREATE_SURAT_KELUAR', `Membuat surat keluar: ${nomorSurat} kepada ${body.tujuan} - ${body.perihal}`);

    return NextResponse.json({
      success: true,
      message: 'Surat keluar berhasil dibuat',
      data: newSurat,
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Surat Keluar POST Error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal membuat surat keluar' }, { status: 500 });
  }
}
