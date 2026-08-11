import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

    // Dapatkan ekstensi file dari nama aslinya
    const extension = file.name.split('.').pop() || 'jpg';

    // Format nama file: [TYPE]_[ID]_[NAMA_DEPAN]_[TIMESTAMP].[ext]
    // Contoh: KTP_1_Budi_1690000000.jpg
    const timestamp = Date.now();
    const fileName = `${type.toUpperCase()}_${id}_${namaDepan}_${timestamp}.${extension}`;
    
    // Pastikan folder public/uploads ada
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Abaikan jika folder sudah ada
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    // Update Prisma
    if (type.toUpperCase() === 'KTP') {
      await prisma.anggota.update({
        where: { id },
        data: { fotoKtpUrl: fileUrl }
      });
    } else if (type.toUpperCase() === 'PASSFOTO') {
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
