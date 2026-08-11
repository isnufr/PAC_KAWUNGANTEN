import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const totalAnggota = await prisma.anggota.count();
    
    const totalPac = await prisma.anggota.count({
      where: { bagian: 'PAC' }
    });

    const totalRanting = await prisma.anggota.count({
      where: { bagian: 'RANTING' }
    });

    const totalAnakRanting = await prisma.anggota.count({
      where: { bagian: 'ANAK RANTING' }
    });

    const totalSatgas = await prisma.anggota.count({
      where: { bagian: 'SATGAS' }
    });

    // Gender stats
    const pria = await prisma.anggota.count({ where: { jenis_kelamin: 'LAKI-LAKI' } });
    const wanita = await prisma.anggota.count({ where: { jenis_kelamin: 'PEREMPUAN' } });

    // Status Data
    const dataLengkap = await prisma.anggota.count({ where: { status_data: 'LENGKAP' } });
    const dataBelumLengkap = await prisma.anggota.count({ where: { status_data: 'BELUM LENGKAP' } });

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
        statusData: {
          LENGKAP: dataLengkap,
          BELUM_LENGKAP: dataBelumLengkap
        }
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
