import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // 1. Find the question and its associated bank
    const question = await db.question.findUnique({
      where: { id },
      include: {
        bank: true,
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Pertanyaan tidak ditemukan.' }, { status: 404 });
    }

    // 2. Check ownership
    if (question.bank.ownerId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    // 3. Delete question (cascade will handle options)
    await db.question.delete({
      where: { id },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'delete_question',
        entityType: 'Question',
        entityId: id,
        metadataJson: JSON.stringify({ category: question.category }),
      },
    });

    return NextResponse.json({ success: true, message: 'Pertanyaan berhasil dihapus.' });
  } catch (error) {
    console.error('Delete question error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
