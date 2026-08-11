import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    
    if (isNaN(id)) {
        return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    // Validasi NIK unik jika ada perubahan NIK
    if (body.nik) {
        const existing = await prisma.anggota.findUnique({
            where: { nik: body.nik }
        });
        
        if (existing && existing.id !== id) {
            return NextResponse.json({ error: 'NIK baru sudah terdaftar pada anggota lain di sistem' }, { status: 400 });
        }
    }

    const updatedAnggota = await prisma.anggota.update({
      where: { id },
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id);

      if (isNaN(id)) {
          return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
      }
      
      await prisma.anggota.delete({
        where: { id }
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
