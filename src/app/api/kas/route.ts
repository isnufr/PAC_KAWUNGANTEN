export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logAktivitas } from '@/lib/logger';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const tipe = searchParams.get('tipe');
    const kategori = searchParams.get('kategori');

    const whereClause: any = {};

    if (search) {
      whereClause.keterangan = { contains: search };
    }
    if (tipe) whereClause.tipe = tipe;
    if (kategori) whereClause.kategori = kategori;

    const data = await prisma.kasOrganisasi.findMany({
      where: whereClause,
      orderBy: { tanggal: 'desc' }
    });

    // Calculate summary
    const allData = await prisma.kasOrganisasi.findMany();
    const totalPemasukan = allData.filter(d => d.tipe === 'PEMASUKAN').reduce((sum, d) => sum + d.nominal, 0);
    const totalPengeluaran = allData.filter(d => d.tipe === 'PENGELUARAN').reduce((sum, d) => sum + d.nominal, 0);

    return NextResponse.json({
      success: true,
      data,
      summary: {
        totalPemasukan,
        totalPengeluaran,
        saldoAkhir: totalPemasukan - totalPengeluaran
      }
    });

  } catch (error) {
    console.error('API Kas GET Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newKas = await prisma.kasOrganisasi.create({
      data: {
        tanggal: new Date(body.tanggal),
        tipe: body.tipe,
        nominal: body.nominal,
        kategori: body.kategori || null,
        keterangan: body.keterangan || null,
        operator: body.operator || null
      }
    });

    await logAktivitas(req, 'CREATE_KAS', `Mencatat ${body.tipe} kas: Rp ${body.nominal.toLocaleString('id-ID')} (${body.keterangan || '-'})`);

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil dicatat',
      data: newKas
    }, { status: 201 });

  } catch (error) {
    console.error('API Kas POST Error:', error);
    return NextResponse.json({ error: 'Gagal mencatat transaksi' }, { status: 500 });
  }
}
