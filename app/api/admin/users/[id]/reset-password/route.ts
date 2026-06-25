import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Akses ditolak.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password || password.trim().length < 6) {
      return NextResponse.json({ error: 'Password baru wajib diisi dan minimal terdiri dari 6 karakter.' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password
    await db.user.update({
      where: { id },
      data: { passwordHash }
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'reset_password',
        entityType: 'User',
        entityId: id,
        metadataJson: JSON.stringify({ email: targetUser.email, role: targetUser.role })
      }
    });

    return NextResponse.json({ message: 'Password pengguna berhasil di-reset.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
