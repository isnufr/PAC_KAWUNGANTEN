export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logAktivitas } from '@/lib/logger';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

    const body = await req.json();

    const updateData: any = {};
    if (body.tanggalSurat !== undefined) updateData.tanggalSurat = new Date(body.tanggalSurat);
    if (body.tujuan !== undefined) updateData.tujuan = body.tujuan;
    if (body.perihal !== undefined) updateData.perihal = body.perihal;
    if (body.jenisSurat !== undefined) updateData.jenisSurat = body.jenisSurat;
    if (body.isiRingkas !== undefined) updateData.isiRingkas = body.isiRingkas;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.suratKeluar.update({
      where: { id },
      data: updateData,
    });

    await logAktivitas(req, 'UPDATE_SURAT_KELUAR', `Mengupdate surat keluar ID ${id}: ${updated.nomorSurat}`);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('API Surat Keluar PUT Error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal mengupdate surat keluar' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

    const surat = await prisma.suratKeluar.findUnique({ where: { id } });
    if (!surat) return NextResponse.json({ error: 'Surat tidak ditemukan' }, { status: 404 });

    await prisma.suratKeluar.delete({ where: { id } });

    await logAktivitas(req, 'DELETE_SURAT_KELUAR', `Menghapus surat keluar: ${surat.nomorSurat} ke ${surat.tujuan}`);

    return NextResponse.json({ success: true, message: 'Surat keluar berhasil dihapus' });
  } catch (error: any) {
    console.error('API Surat Keluar DELETE Error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal menghapus surat keluar' }, { status: 500 });
  }
}
