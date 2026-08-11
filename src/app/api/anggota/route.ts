import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const bagian = searchParams.get('bagian');
    const jabatan = searchParams.get('jabatan');
    const desa = searchParams.get('desa');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { nama: { contains: search } },
        { nik: { contains: search } }
      ];
    }
    if (bagian) whereClause.bagian = bagian;
    if (jabatan) whereClause.jabatan = jabatan;
    if (desa) whereClause.desa = desa;

    const [data, total] = await Promise.all([
      prisma.anggota.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.anggota.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data,
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
