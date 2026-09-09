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
    if (body.nomorSurat !== undefined) updateData.nomorSurat = body.nomorSurat;
    if (body.tanggalSurat !== undefined) updateData.tanggalSurat = new Date(body.tanggalSurat);
    if (body.tanggalTerima !== undefined) updateData.tanggalTerima = new Date(body.tanggalTerima);
    if (body.pengirim !== undefined) updateData.pengirim = body.pengirim;
    if (body.perihal !== undefined) updateData.perihal = body.perihal;
    if (body.isiRingkas !== undefined) updateData.isiRingkas = body.isiRingkas;
    if (body.lampiranUrl !== undefined) updateData.lampiranUrl = body.lampiranUrl;
    if (body.disposisi !== undefined) updateData.disposisi = body.disposisi;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.suratMasuk.update({
      where: { id },
      data: updateData,
    });

    await logAktivitas(req, 'UPDATE_SURAT_MASUK', `Mengupdate surat masuk ID ${id}: ${updated.nomorAgenda}`);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('API Surat Masuk PUT Error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal mengupdate surat masuk' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

    const surat = await prisma.suratMasuk.findUnique({ where: { id } });
    if (!surat) return NextResponse.json({ error: 'Surat tidak ditemukan' }, { status: 404 });

    await prisma.suratMasuk.delete({ where: { id } });

    await logAktivitas(req, 'DELETE_SURAT_MASUK', `Menghapus surat masuk: ${surat.nomorAgenda} dari ${surat.pengirim}`);

    return NextResponse.json({ success: true, message: 'Surat masuk berhasil dihapus' });
  } catch (error: any) {
    console.error('API Surat Masuk DELETE Error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal menghapus surat masuk' }, { status: 500 });
  }
}
