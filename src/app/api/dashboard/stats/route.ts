export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const totalAnggota = await prisma.anggota.count();
    
    const totalPac = await prisma.anggota.count({ where: { bagian: 'PAC' } });
    const totalRanting = await prisma.anggota.count({ where: { bagian: 'RANTING' } });
    const totalAnakRanting = await prisma.anggota.count({ where: { bagian: 'ANAK RANTING' } });
    const totalSatgas = await prisma.anggota.count({ where: { bagian: 'SATGAS' } });

    // Gender stats
    const pria = await prisma.anggota.count({ where: { jenisKelamin: 'LAKI-LAKI' } });
    const wanita = await prisma.anggota.count({ where: { jenisKelamin: 'PEREMPUAN' } });

    // Data Tidak Lengkap
    const dataTidakLengkapCount = await prisma.anggota.count({
      where: {
        OR: [
          { passFotoUrl: null },
          { fotoKtpUrl: null },
          { passFotoUrl: '' },
          { fotoKtpUrl: '' },
          { nik: '' }
        ]
      }
    });

    // NIK Ganda (Find duplicate NIKs)
    const groupByNik = await prisma.anggota.groupBy({
      by: ['nik'],
      having: { nik: { _count: { gt: 1 } } }
    });
    const nikGandaList = groupByNik.filter(g => g.nik && g.nik.trim() !== '').map(g => g.nik);
    const nikGandaCount = await prisma.anggota.count({
      where: { nik: { in: nikGandaList as string[] } }
    });

    // Ulang Tahun Bulan Ini
    // Format is assumed DD/MM/YYYY or YYYY-MM-DD
    const allAnggota = await prisma.anggota.findMany({
      select: { id: true, nama: true, tanggalLahir: true }
    });
    
    const currentMonth = new Date().getMonth() + 1;
    const ulangTahunList = allAnggota.filter(a => {
      if (!a.tanggalLahir) return false;
      // Handle DD/MM/YYYY or YYYY-MM-DD
      const parts = a.tanggalLahir.includes('/') ? a.tanggalLahir.split('/') : a.tanggalLahir.split('-');
      if (parts.length >= 2) {
        // If it's DD/MM/YYYY, month is parts[1]
        // If it's YYYY-MM-DD, month is parts[1]
        const m = parseInt(parts[1], 10);
        return m === currentMonth;
      }
      return false;
    }).map(a => ({ id: a.id, nama: a.nama, tanggalLahir: a.tanggalLahir }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          total: totalAnggota,
          pac: totalPac,
          ranting: totalRanting,
          anakRanting: totalAnakRanting,
          satgas: totalSatgas
        },
        gender: {
          LAKI_LAKI: pria,
          PEREMPUAN: wanita
        },
        verification: {
          tidakLengkap: dataTidakLengkapCount,
          nikGanda: nikGandaCount
        },
        ulangTahun: ulangTahunList
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
