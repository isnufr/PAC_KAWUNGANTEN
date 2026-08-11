import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: Request, { params }: { params: { file: string[] } }) {
  try {
    const filename = params.file.join('/');
    
    // Check in public/uploads (where the upload API saves them)
    const filePath = join(process.cwd(), 'public', 'uploads', filename);

    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    
    // Determine content type
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'gif') contentType = 'image/gif';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'pdf') contentType = 'application/pdf';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
