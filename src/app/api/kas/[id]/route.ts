import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    
    const updatedKas = await prisma.kasOrganisasi.update({
      where: { id },
      data: body
    });

    return NextResponse.json({
      success: true,
      message: 'Data kas berhasil diperbarui',
      data: updatedKas
    });

  } catch (error) {
    console.error('API Kas PUT Error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data kas' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id);
      
      await prisma.kasOrganisasi.delete({
        where: { id }
      });
  
      return NextResponse.json({
        success: true,
        message: 'Data kas berhasil dihapus'
      });
  
    } catch (error) {
      console.error('API Kas DELETE Error:', error);
      return NextResponse.json({ error: 'Gagal menghapus data kas' }, { status: 500 });
    }
}
