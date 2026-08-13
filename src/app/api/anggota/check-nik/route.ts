import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nik = searchParams.get('nik');
    const excludeId = searchParams.get('excludeId');

    if (!nik) {
      return NextResponse.json({ exists: false });
    }

    const whereClause: any = { nik };
    if (excludeId) {
      whereClause.id = { not: parseInt(excludeId) };
    }

    const existing = await prisma.anggota.findFirst({
      where: whereClause
    });

    return NextResponse.json({ exists: !!existing });
  } catch (error) {
    console.error('API Check NIK Error:', error);
    return NextResponse.json({ exists: false, error: 'Server error' });
  }
}
