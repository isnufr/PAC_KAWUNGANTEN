export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const logs = await prisma.logAktivitas.findMany({
      orderBy: { waktu: 'desc' },
      take: 100
    });

    return NextResponse.json({
      success: true,
      data: logs
    });

  } catch (error) {
    console.error('API Log Aktivitas GET Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
