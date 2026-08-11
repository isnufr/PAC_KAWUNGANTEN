import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { nik: string } }) {
  try {
    const nik = params.nik;
    const body = await req.json();
    
    // Validasi NIK unik jika ada perubahan NIK
    if (body.nik && body.nik !== nik) {
        const existing = await prisma.anggota.findUnique({
            where: { nik: body.nik }
        });
        
        if (existing) {
            return NextResponse.json({ error: 'NIK baru sudah terdaftar di sistem' }, { status: 400 });
        }
    }

    const updatedAnggota = await prisma.anggota.update({
      where: { nik },
      data: body
    });

    return NextResponse.json({
      success: true,
      message: 'Data anggota berhasil diperbarui',
      data: updatedAnggota
    });

  } catch (error) {
    console.error('API Anggota PUT Error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data anggota' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { nik: string } }) {
    try {
      const nik = params.nik;
      
      await prisma.anggota.delete({
        where: { nik }
      });
  
      return NextResponse.json({
        success: true,
        message: 'Data anggota berhasil dihapus'
      });
  
    } catch (error) {
      console.error('API Anggota DELETE Error:', error);
      return NextResponse.json({ error: 'Gagal menghapus data anggota' }, { status: 500 });
    }
}
