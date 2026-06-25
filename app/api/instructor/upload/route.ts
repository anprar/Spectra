import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from '@/lib/auth';

// POST: Upload a file (specifically PDF)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada berkas yang diunggah.' }, { status: 400 });
    }

    // Validate file type (must be PDF)
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!file.type.includes('pdf') && fileExtension !== '.pdf') {
      return NextResponse.json({ error: 'Hanya berkas PDF yang diperbolehkan.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directory exists in public
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique file name to avoid collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${uniqueSuffix}-${safeFileName}`;
    const filePath = path.join(uploadDir, filename);

    // Save the file to the local directory
    await fs.writeFile(filePath, buffer);

    // Public URL to access the file
    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: file.name
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Gagal mengunggah berkas.' }, { status: 500 });
  }
}
