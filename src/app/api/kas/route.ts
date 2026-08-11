import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipe = searchParams.get('tipe');
    const kategori = searchParams.get('kategori');
    const search = searchParams.get('search');
    
    const whereClause: any = {};

    if (tipe) whereClause.tipe = tipe;
    if (kategori) whereClause.kategori = kategori;
    if (search) {
      whereClause.keterangan = { contains: search };
    }

    const data = await prisma.kasOrganisasi.findMany({
      where: whereClause,
      orderBy: { tanggal: 'desc' }
    });

    // Kalkulasi summary
    const totalPemasukan = data.filter(k => k.tipe === 'PEMASUKAN').reduce((acc, curr) => acc + curr.nominal, 0);
    const totalPengeluaran = data.filter(k => k.tipe === 'PENGELUARAN').reduce((acc, curr) => acc + curr.nominal, 0);
    const saldoAktif = totalPemasukan - totalPengeluaran;

    return NextResponse.json({
      success: true,
      data,
      summary: {
        totalPemasukan,
        totalPengeluaran,
        saldoAktif
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
      data: body
    });

    return NextResponse.json({
      success: true,
      message: 'Transaksi kas berhasil dicatat',
      data: newKas
    }, { status: 201 });

  } catch (error) {
    console.error('API Kas POST Error:', error);
    return NextResponse.json({ error: 'Gagal mencatat transaksi kas' }, { status: 500 });
  }
}
