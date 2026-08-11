export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    await prisma.kasOrganisasi.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil dihapus'
    });

  } catch (error) {
    console.error('API Kas DELETE Error:', error);
    return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 });
  }
}
