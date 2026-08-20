import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'KTP' or 'PASSFOTO'
    const idStr = formData.get('id') as string;
    const nama = formData.get('nama') as string;

    if (!file || !type || !idStr || !nama) {
      return NextResponse.json({ success: false, error: 'Data tidak lengkap (file, type, id, nama)' }, { status: 400 });
    }

    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dapatkan nama depan
    const namaDepan = nama.split(' ')[0].replace(/[^a-zA-Z0-9]/g, ''); // bersihkan karakter khusus

    // Kompresi ukuran file gambar menggunakan sharp tanpa merubah rasio
    // Mengonversi ke format jpeg dengan kualitas 85% untuk menjaga kejernihan dan 
    // memastikan ukurannya di bawah 2MB, serta didukung oleh semua HP
    const compressedBuffer = await sharp(buffer)
      .jpeg({ quality: 85, force: true })
      .toBuffer();

    // Dapatkan ekstensi file (selalu gunakan jpg karena sudah dikonversi)
    const extension = 'jpg';

    // Format nama file: [TYPE]_[ID]_[NAMA_DEPAN]_[TIMESTAMP].[ext]
    // Contoh: KTP_1_Budi_1690000000.jpg
    const timestamp = Date.now();
    const fileName = `${type.toUpperCase()}_${id}_${namaDepan}_${timestamp}.${extension}`;
    
    // Pastikan folder public/uploads ada
    const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Abaikan jika folder sudah ada
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, compressedBuffer);

    const fileUrl = `/api/uploads/${fileName}`;

    // Dapatkan data anggota saat ini untuk menghapus file lama jika ada
    const currentAnggota = await prisma.anggota.findUnique({
      where: { id },
      select: { fotoKtpUrl: true, passFotoUrl: true }
    });

    const deleteOldFile = async (oldUrl: string | null) => {
      if (!oldUrl) return;
      try {
        const oldFileName = oldUrl.split('/').pop();
        if (oldFileName) {
          const baseDir = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads');
          const oldFilePath = join(baseDir, oldFileName);
          await unlink(oldFilePath);
        }
      } catch (err) {
        console.error('Gagal menghapus file lama:', err);
      }
    };

    // Update Prisma
    if (type.toUpperCase() === 'KTP') {
      await deleteOldFile(currentAnggota?.fotoKtpUrl || null);
      await prisma.anggota.update({
        where: { id },
        data: { fotoKtpUrl: fileUrl }
      });
    } else if (type.toUpperCase() === 'PASSFOTO') {
      await deleteOldFile(currentAnggota?.passFotoUrl || null);
      await prisma.anggota.update({
        where: { id },
        data: { passFotoUrl: fileUrl }
      });
    }

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengunggah file' }, { status: 500 });
  }
}
