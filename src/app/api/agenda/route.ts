export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const data = await prisma.agenda.findMany({
      orderBy: { waktu: 'desc' },
      include: {
        _count: {
          select: { kehadiran: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('API Agenda GET Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newAgenda = await prisma.agenda.create({
      data: {
        namaAcara: body.namaAcara,
        tempat: body.tempat,
        waktu: new Date(body.waktu),
        deskripsi: body.deskripsi || null,
        fotoUrl: body.fotoUrl || null,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Agenda berhasil dibuat',
      data: newAgenda
    }, { status: 201 });

  } catch (error: any) {
    console.error('API Agenda POST Error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal membuat agenda' }, { status: 500 });
  }
}
