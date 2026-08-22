export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logAktivitas } from '@/lib/logger';

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    const currentKas = await prisma.kasOrganisasi.findUnique({
      where: { id },
      select: { tipe: true, nominal: true, keterangan: true }
    });

    await prisma.kasOrganisasi.delete({
      where: { id }
    });

    if (currentKas) {
      await logAktivitas(req, 'DELETE_KAS', `Menghapus transaksi ${currentKas.tipe}: Rp ${currentKas.nominal.toLocaleString('id-ID')} (${currentKas.keterangan || '-'})`);
    } else {
      await logAktivitas(req, 'DELETE_KAS', `Menghapus transaksi kas (ID: ${id})`);
    }

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil dihapus'
    });

  } catch (error) {
    console.error('API Kas DELETE Error:', error);
    return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 });
  }
}
