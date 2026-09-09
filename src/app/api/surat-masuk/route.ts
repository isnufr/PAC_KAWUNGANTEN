export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logAktivitas } from '@/lib/logger';

const prisma = new PrismaClient();

// Helper: Bulan ke Romawi
const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// Generate nomor agenda otomatis: 001/IN/PAC/IX/2026
async function generateNomorAgenda(): Promise<string> {
  const now = new Date();
  const bulan = now.getMonth(); // 0-indexed
  const tahun = now.getFullYear();

  // Hitung surat masuk bulan ini
  const startOfMonth = new Date(tahun, bulan, 1);
  const endOfMonth = new Date(tahun, bulan + 1, 1);

  const count = await prisma.suratMasuk.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
  });

  const urutan = String(count + 1).padStart(3, '0');
  return `${urutan}/IN/PAC/${bulanRomawi[bulan]}/${tahun}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const preview = searchParams.get('preview'); // untuk preview nomor agenda berikutnya

    if (preview === 'nomor') {
      const nomor = await generateNomorAgenda();
      return NextResponse.json({ success: true, nomor });
    }

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { nomorSurat: { contains: search } },
        { nomorAgenda: { contains: search } },
        { pengirim: { contains: search } },
        { perihal: { contains: search } },
      ];
    }
    if (status) {
      whereClause.status = status;
    }

    const data = await prisma.suratMasuk.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Summary counts
    const allData = await prisma.suratMasuk.findMany();
    const summary = {
      total: allData.length,
      belumDibaca: allData.filter(d => d.status === 'BELUM_DIBACA').length,
      dibaca: allData.filter(d => d.status === 'DIBACA').length,
      diproses: allData.filter(d => d.status === 'DIPROSES').length,
      selesai: allData.filter(d => d.status === 'SELESAI').length,
    };

    return NextResponse.json({ success: true, data, summary });
  } catch (error) {
    console.error('API Surat Masuk GET Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const nomorAgenda = await generateNomorAgenda();

    const newSurat = await prisma.suratMasuk.create({
      data: {
        nomorSurat: body.nomorSurat,
        nomorAgenda,
        tanggalSurat: new Date(body.tanggalSurat),
        tanggalTerima: new Date(body.tanggalTerima),
        pengirim: body.pengirim,
        perihal: body.perihal,
        isiRingkas: body.isiRingkas || null,
        lampiranUrl: body.lampiranUrl || null,
        disposisi: body.disposisi || null,
        status: 'BELUM_DIBACA',
        operator: body.operator || null,
      },
    });

    await logAktivitas(req, 'CREATE_SURAT_MASUK', `Mencatat surat masuk: ${nomorAgenda} dari ${body.pengirim} - ${body.perihal}`);

    return NextResponse.json({
      success: true,
      message: 'Surat masuk berhasil dicatat',
      data: newSurat,
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Surat Masuk POST Error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal mencatat surat masuk' }, { status: 500 });
  }
}
