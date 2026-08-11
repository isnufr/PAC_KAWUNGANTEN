import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    
    // Jika password diupdate, hash ulang
    if (body.password) {
        body.password = await bcrypt.hash(body.password, 10);
    } else {
        delete body.password; // Jangan update password jika kosong
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: body,
      select: {
        id: true,
        username: true,
        role: true,
        level_akses: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui',
      data: updatedUser
    });

  } catch (error) {
    console.error('API Users PUT Error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data pengguna' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id);
      
      await prisma.user.delete({
        where: { id }
      });
  
      return NextResponse.json({
        success: true,
        message: 'Pengguna berhasil dihapus'
      });
  
    } catch (error) {
      console.error('API Users DELETE Error:', error);
      return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 });
    }
}
