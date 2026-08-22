import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logAktivitas } from '@/lib/logger';

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

    await logAktivitas(req, 'UPDATE_ANGGOTA', `Mengubah profil data anggota: ${updatedAnggota.nama} (ID: ${id})`);

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
      
      const currentAnggota = await prisma.anggota.findUnique({
        where: { id },
        select: { nama: true, fotoKtpUrl: true, passFotoUrl: true }
      });

      await prisma.anggota.delete({
        where: { id }
      });

      if (currentAnggota && (currentAnggota as any).nama) {
        await logAktivitas(req, 'DELETE_ANGGOTA', `Menghapus data anggota: ${(currentAnggota as any).nama} (ID: ${id})`);
      } else {
        await logAktivitas(req, 'DELETE_ANGGOTA', `Menghapus data anggota (ID: ${id})`);
      }
  
      // Hapus file fisik setelah data dihapus
      const deleteOldFile = async (oldUrl: string | null) => {
        if (!oldUrl) return;
        try {
          const { unlink } = await import('fs/promises');
          const { join } = await import('path');
          const oldFileName = oldUrl.split('/').pop();
          if (oldFileName) {
            const baseDir = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads');
            const oldFilePath = join(baseDir, oldFileName);
            await unlink(oldFilePath);
          }
        } catch (err) {
          console.error('Gagal menghapus file saat hapus anggota:', err);
        }
      };

      if (currentAnggota) {
        await deleteOldFile(currentAnggota.fotoKtpUrl);
        await deleteOldFile(currentAnggota.passFotoUrl);
      }

      return NextResponse.json({
        success: true,
        message: 'Data anggota berhasil dihapus'
      });
  
    } catch (error) {
      console.error('API Anggota DELETE Error:', error);
      return NextResponse.json({ error: 'Gagal menghapus data anggota' }, { status: 500 });
    }
}
