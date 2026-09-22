export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const kehadiranList = await prisma.kehadiranAgenda.findMany({
      where: { anggotaId: id },
      include: {
        agenda: {
          select: {
            id: true,
            namaAcara: true,
            tempat: true,
            waktu: true,
          }
        }
      },
      orderBy: {
        agenda: {
          waktu: 'desc'
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: kehadiranList
    });

  } catch (error) {
    console.error('API Kehadiran Anggota GET Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
