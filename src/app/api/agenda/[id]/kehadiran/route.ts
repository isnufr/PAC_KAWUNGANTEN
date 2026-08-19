export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const agendaId = parseInt(id, 10);

    if (isNaN(agendaId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const body = await req.json();
    const anggotaIds = body.anggotaIds as number[];

    if (!Array.isArray(anggotaIds)) {
      return NextResponse.json({ error: 'Data anggotaIds tidak valid' }, { status: 400 });
    }

    // Gunakan transaction untuk memastikan integritas data
    await prisma.$transaction(async (tx) => {
      // 1. Hapus semua kehadiran sebelumnya untuk agenda ini
      await tx.kehadiranAgenda.deleteMany({
        where: { agendaId }
      });

      // 2. Tambahkan kehadiran yang baru
      if (anggotaIds.length > 0) {
        const dataToInsert = anggotaIds.map((anggotaId) => ({
          agendaId,
          anggotaId
        }));

        await tx.kehadiranAgenda.createMany({
          data: dataToInsert,
          skipDuplicates: true
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Data kehadiran berhasil disimpan'
    }, { status: 200 });

  } catch (error) {
    console.error('API Agenda Kehadiran POST Error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan kehadiran' }, { status: 500 });
  }
}
