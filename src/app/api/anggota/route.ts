export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logAktivitas } from '@/lib/logger';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const bagian = searchParams.get('bagian');
    const jabatan = searchParams.get('jabatan');
    const kecamatan = searchParams.get('kecamatan');
    const desa = searchParams.get('desa');
    const dusun = searchParams.get('dusun');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    const filter = searchParams.get('filter');

    if (search) {
      whereClause.OR = [
        { nama: { contains: search } },
        { nik: { contains: search } }
      ];
    }
    if (bagian) whereClause.bagian = bagian;
    if (jabatan) whereClause.jabatan = jabatan;
    if (kecamatan) whereClause.kecamatan = kecamatan;
    if (desa) whereClause.desa = desa;
    if (dusun) whereClause.dusun = dusun;

    if (filter === 'verifikasi') {
        const groupByNik = await prisma.anggota.groupBy({
          by: ['nik'],
          having: { nik: { _count: { gt: 1 } } }
        });
        const nikGandaList = groupByNik.filter(g => g.nik && g.nik.trim() !== '').map(g => g.nik);

        whereClause.OR = [
          { passFotoUrl: null },
          { fotoKtpUrl: null },
          { passFotoUrl: '' },
          { fotoKtpUrl: '' },
          { nik: '' },
          { nik: { in: nikGandaList as string[] } }
        ];
    }

    const [data, total] = await Promise.all([
      prisma.anggota.findMany({
        where: whereClause,
        orderBy: { id: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { kehadiran: true }
          }
        }
      }),
      prisma.anggota.count({ where: whereClause })
    ]);

    // Recalculate umur dynamically based on tanggalLahir for all members
    const enrichedData = data.map((item: any) => {
        if (item.tanggalLahir) {
            const birthDate = new Date(item.tanggalLahir);
            if (!isNaN(birthDate.getTime())) {
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                item.umur = age >= 0 ? age.toString() : '0';
            }
        }
        return item;
    });

    return NextResponse.json({
      success: true,
      data: enrichedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('API Anggota GET Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validasi NIK unik
    const existing = await prisma.anggota.findUnique({
      where: { nik: body.nik }
    });

    if (existing) {
      return NextResponse.json({ error: 'NIK sudah terdaftar di sistem' }, { status: 400 });
    }

    const newAnggota = await prisma.anggota.create({
      data: body
    });

    await logAktivitas(req, 'CREATE_ANGGOTA', `Menambahkan data anggota baru: ${newAnggota.nama} (NIK: ${newAnggota.nik})`);

    return NextResponse.json({
      success: true,
      message: 'Anggota berhasil ditambahkan',
      data: newAnggota
    }, { status: 201 });

  } catch (error) {
    console.error('API Anggota POST Error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan anggota' }, { status: 500 });
  }
}
