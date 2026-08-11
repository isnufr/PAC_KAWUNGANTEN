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
      select: { id: true, nama: true, tanggalLahir: true, passFotoUrl: true, fotoKtpUrl: true }
    });
    
    const currentMonth = new Date().getMonth() + 1;
    // Kelompok Usia
    let genZ = 0; // 13-28 (1996 - 2011)
    let milenial = 0; // 29-43 (1981 - 1995)
    let genX = 0; // 44-59 (1965 - 1980)
    let babyBoomer = 0; // >59 (< 1965)
    
    const currentYear = new Date().getFullYear();

    const ulangTahunList = allAnggota.filter(a => {
      if (!a.tanggalLahir) return false;
      
      const parts = a.tanggalLahir.includes('/') ? a.tanggalLahir.split('/') : a.tanggalLahir.split('-');
      if (parts.length >= 3) {
        // Assume format could be DD-MM-YYYY or YYYY-MM-DD
        let y = parseInt(parts[2], 10);
        let m = parseInt(parts[1], 10);
        if (parts[0].length === 4) {
           y = parseInt(parts[0], 10);
        }
        
        // Age calculation
        if (y) {
           const age = currentYear - y;
           if (age >= 13 && age <= 28) genZ++;
           else if (age >= 29 && age <= 43) milenial++;
           else if (age >= 44 && age <= 59) genX++;
           else if (age > 59) babyBoomer++;
        }

        return m === currentMonth;
      }
      return false;
    }).map(a => ({ id: a.id, nama: a.nama, tanggalLahir: a.tanggalLahir, passFotoUrl: a.passFotoUrl, fotoKtpUrl: a.fotoKtpUrl }));

    // KUOTA KEPENGURUSAN
    const wilayahList = await prisma.wilayah.findMany();

    // Top 5 Desa
    const allDesaCounts = await prisma.anggota.groupBy({
      by: ['desa'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    const topDesa = allDesaCounts.filter(d => d.desa && d.desa.trim() !== '').map(d => ({
      desa: d.desa,
      count: d._count.id
    }));
    
    // Ranting by Desa
    const rantingCounts = await prisma.anggota.groupBy({
      by: ['desa'],
      where: { bagian: 'RANTING' },
      _count: { id: true }
    });

    // Anak Ranting by Dusun
    const anakRantingCounts = await prisma.anggota.groupBy({
      by: ['desa', 'dusun'],
      where: { bagian: 'ANAK RANTING' },
      _count: { id: true }
    });

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
        usia: {
          genZ,
          milenial,
          genX,
          babyBoomer
        },
        topDesa,
        ulangTahun: ulangTahunList,
        kuota: {
          wilayah: wilayahList,
          rantingCounts,
          anakRantingCounts
        }
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
