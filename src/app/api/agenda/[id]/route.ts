export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const agendaId = parseInt(id, 10);

    if (isNaN(agendaId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const agenda = await prisma.agenda.findUnique({
      where: { id: agendaId },
      include: {
        kehadiran: {
          include: {
            anggota: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!agenda) {
      return NextResponse.json({ error: 'Agenda tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: agenda
    });

  } catch (error) {
    console.error('API Agenda [id] GET Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const agendaId = parseInt(id, 10);

    if (isNaN(agendaId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const body = await req.json();

    const updateData: any = {};
    if (body.namaAcara !== undefined) updateData.namaAcara = body.namaAcara;
    if (body.tempat !== undefined) updateData.tempat = body.tempat;
    if (body.waktu !== undefined) updateData.waktu = new Date(body.waktu);
    if (body.deskripsi !== undefined) updateData.deskripsi = body.deskripsi;
    if (body.fotoUrl !== undefined) updateData.fotoUrl = body.fotoUrl;

    const updatedAgenda = await prisma.agenda.update({
      where: { id: agendaId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Agenda berhasil diperbarui',
      data: updatedAgenda
    });

  } catch (error) {
    console.error('API Agenda [id] PUT Error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui agenda' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const agendaId = parseInt(id, 10);

    if (isNaN(agendaId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    await prisma.agenda.delete({
      where: { id: agendaId }
    });

    return NextResponse.json({
      success: true,
      message: 'Agenda berhasil dihapus'
    });

  } catch (error) {
    console.error('API Agenda [id] DELETE Error:', error);
    return NextResponse.json({ error: 'Gagal menghapus agenda' }, { status: 500 });
  }
}
