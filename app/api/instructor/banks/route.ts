import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// 1. GET: List all question banks for this instructor (or all if admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const banks = await db.questionBank.findMany({
      where: session.role === 'admin' ? {} : { ownerId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return NextResponse.json({ success: true, banks });
  } catch (error) {
    console.error('Fetch banks error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// 2. POST: Create a new question bank
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { name, description, visibility } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Nama Bank Soal wajib diisi.' }, { status: 400 });
    }

    const newBank = await db.questionBank.create({
      data: {
        name,
        description: description || '',
        visibility: visibility || 'private',
        ownerId: session.userId,
      },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'create_question_bank',
        entityType: 'QuestionBank',
        entityId: newBank.id,
        metadataJson: JSON.stringify({ name }),
      },
    });

    return NextResponse.json({ success: true, bank: newBank });
  } catch (error) {
    console.error('Create bank error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
