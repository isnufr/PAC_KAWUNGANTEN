import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

const prisma = new PrismaClient();

function getTipeFile(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'document';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
  return 'other';
}

// GET - Ambil semua lampiran untuk agenda tertentu
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const agendaId = parseInt(params.id, 10);
    if (isNaN(agendaId)) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    const lampiran = await prisma.lampiranAgenda.findMany({
      where: { agendaId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: lampiran });
  } catch (error) {
    console.error('Error fetching lampiran:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data lampiran' }, { status: 500 });
  }
}

// POST - Upload lampiran baru (mendukung multiple files)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const agendaId = parseInt(params.id, 10);
    if (isNaN(agendaId)) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    // Pastikan agenda ada
    const agenda = await prisma.agenda.findUnique({ where: { id: agendaId } });
    if (!agenda) {
      return NextResponse.json({ success: false, error: 'Agenda tidak ditemukan' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // Batas ukuran per file: 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          success: false, 
          error: `File "${file.name}" terlalu besar (maks 10MB)` 
        }, { status: 400 });
      }
    }

    // Pastikan folder uploads/agenda ada
    const uploadDir = join(
      process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads'),
      'agenda'
    );
    await mkdir(uploadDir, { recursive: true });

    const savedFiles = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      let buffer = Buffer.from(bytes);
      const tipeFile = getTipeFile(file.name);
      const timestamp = Date.now();
      
      let fileName: string;
      let finalSize: number;

      if (tipeFile === 'image') {
        // Kompresi gambar menggunakan sharp
        buffer = await sharp(buffer)
          .jpeg({ quality: 85, force: true })
          .toBuffer();
        fileName = `AGENDA_${agendaId}_${timestamp}_${Math.random().toString(36).substring(2, 6)}.jpg`;
        finalSize = buffer.length;
      } else {
        // File non-gambar, simpan apa adanya
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);
        fileName = `AGENDA_${agendaId}_${timestamp}_${cleanName}`;
        // Pastikan ada ekstensi
        if (!fileName.includes('.')) {
          fileName += `.${ext}`;
        }
        finalSize = buffer.length;
      }

      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      const fileUrl = `/api/uploads/agenda/${fileName}`;

      const lampiran = await prisma.lampiranAgenda.create({
        data: {
          agendaId,
          namaFile: file.name,
          fileUrl,
          tipeFile,
          ukuran: finalSize
        }
      });

      savedFiles.push(lampiran);
    }

    return NextResponse.json({ success: true, data: savedFiles });
  } catch (error) {
    console.error('Error uploading lampiran:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengunggah file' }, { status: 500 });
  }
}

// DELETE - Hapus lampiran berdasarkan lampiranId (dikirim via body)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const lampiranId = body.lampiranId;

    if (!lampiranId) {
      return NextResponse.json({ success: false, error: 'lampiranId diperlukan' }, { status: 400 });
    }

    const lampiran = await prisma.lampiranAgenda.findUnique({
      where: { id: lampiranId }
    });

    if (!lampiran) {
      return NextResponse.json({ success: false, error: 'Lampiran tidak ditemukan' }, { status: 404 });
    }

    // Hapus file dari disk
    try {
      const fileName = lampiran.fileUrl.split('/').pop();
      if (fileName) {
        const baseDir = join(
          process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads'),
          'agenda'
        );
        const filePath = join(baseDir, fileName);
        await unlink(filePath);
      }
    } catch (err) {
      console.error('Gagal menghapus file dari disk:', err);
    }

    // Hapus record dari database
    await prisma.lampiranAgenda.delete({
      where: { id: lampiranId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lampiran:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus lampiran' }, { status: 500 });
  }
}
