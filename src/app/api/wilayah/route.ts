import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const wilayah = await prisma.wilayah.findMany({
      orderBy: [
        { kecamatan: 'asc' },
        { desa: 'asc' },
        { dusun: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: wilayah
    });

  } catch (error) {
    console.error('API Wilayah GET Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
