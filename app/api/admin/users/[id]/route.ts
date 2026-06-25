import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// 1. PUT: Update user profile details
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
    const { email, fullName, role, isActive } = body;

    if (!email || !fullName || !role) {
      return NextResponse.json({ error: 'Nama, Email, dan Peran wajib diisi.' }, { status: 400 });
    }

    // Fetch the target user to be updated
    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Security check: Admin cannot deactivate or change their own role
    if (targetUser.id === session.userId) {
      if (role !== 'admin') {
        return NextResponse.json({ error: 'Anda tidak dapat merubah peran admin Anda sendiri.' }, { status: 400 });
      }
      if (isActive === false) {
        return NextResponse.json({ error: 'Anda tidak dapat menonaktifkan akun admin Anda sendiri.' }, { status: 400 });
      }
    }

    // Check email uniqueness among OTHER users
    const emailConflict = await db.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        NOT: { id }
      }
    });

    if (emailConflict) {
      return NextResponse.json({ error: 'Email sudah digunakan oleh pengguna lain.' }, { status: 400 });
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        role,
        isActive: isActive !== undefined ? !!isActive : targetUser.isActive
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'update_user',
        entityType: 'User',
        entityId: id,
        metadataJson: JSON.stringify({
          changedFields: {
            email: targetUser.email !== updatedUser.email ? updatedUser.email : undefined,
            role: targetUser.role !== updatedUser.role ? updatedUser.role : undefined,
            isActive: targetUser.isActive !== updatedUser.isActive ? updatedUser.isActive : undefined
          }
        })
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// 2. DELETE: Remove user with safety guards
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Akses ditolak.' }, { status: 403 });
    }

    const { id } = await params;

    // Safety 1: Cannot delete self
    if (id === session.userId) {
      return NextResponse.json({ error: 'Anda tidak dapat menghapus akun admin Anda sendiri yang sedang aktif.' }, { status: 400 });
    }

    const userToDelete = await db.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Safety 2: Cannot delete instructors with active course modules or question banks
    if (userToDelete.role === 'instructor') {
      const moduleCount = await db.trainingModule.count({ where: { createdById: id } });
      const bankCount = await db.questionBank.count({ where: { ownerId: id } });

      if (moduleCount > 0 || bankCount > 0) {
        return NextResponse.json({
          error: `Gagal menghapus. Instruktur ini masih mengelola ${moduleCount} modul pelatihan dan ${bankCount} bank soal. Silakan rekap/hapus aset tersebut terlebih dahulu.`
        }, { status: 400 });
      }
    }

    // Delete user (cascade deletes candidate attempts automatically via DB schema relations)
    await db.user.delete({ where: { id } });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'delete_user',
        entityType: 'User',
        entityId: id,
        metadataJson: JSON.stringify({ email: userToDelete.email, role: userToDelete.role })
      }
    });

    return NextResponse.json({ message: 'Pengguna berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// 3. PATCH: Toggle user block/unblock status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Akses ditolak.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { isActive } = body;

    if (isActive === undefined) {
      return NextResponse.json({ error: 'Status keaktifan (isActive) wajib ditentukan.' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    if (targetUser.id === session.userId && isActive === false) {
      return NextResponse.json({ error: 'Anda tidak dapat menonaktifkan akun admin Anda sendiri.' }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { isActive: !!isActive },
      select: { id: true, email: true, fullName: true, role: true, isActive: true }
    });

    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: isActive ? 'unblock_user' : 'block_user',
        entityType: 'User',
        entityId: id,
        metadataJson: JSON.stringify({ email: targetUser.email, role: targetUser.role })
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
