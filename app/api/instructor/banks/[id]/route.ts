import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// 1. GET: Fetch a specific question bank, its questions, and their options
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const bank = await db.questionBank.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: 'desc' },
          include: {
            options: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!bank) {
      return NextResponse.json({ error: 'Bank Soal tidak ditemukan.' }, { status: 404 });
    }

    // Verify ownership
    if (bank.ownerId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, bank });
  } catch (error) {
    console.error('Fetch bank details error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// 2. POST: Add a single question manually to the bank
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const bank = await db.questionBank.findUnique({ where: { id } });
    if (!bank) {
      return NextResponse.json({ error: 'Bank Soal tidak ditemukan.' }, { status: 404 });
    }

    if (bank.ownerId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { questionText, explanationText, category, difficulty, questionType, options } = await request.json();

    if (!questionText) {
      return NextResponse.json({ error: 'Pertanyaan wajib diisi.' }, { status: 400 });
    }

    const typeToSave = questionType === 'essay' ? 'essay' : 'multiple_choice';

    if (typeToSave === 'multiple_choice') {
      if (!options || !Array.isArray(options) || options.length < 2) {
        return NextResponse.json({ error: 'Data soal tidak lengkap. Minimal diisi pertanyaan dan 2 opsi jawaban.' }, { status: 400 });
      }
      
      const correctOptions = options.filter((o: any) => o.isCorrect);
      if (correctOptions.length !== 1) {
        return NextResponse.json({ error: 'Harus ada tepat satu kunci jawaban yang benar.' }, { status: 400 });
      }
    }

    const categoryToSave = (category && category.trim()) ? category.trim() : 'Umum';
    const difficultyToSave = (difficulty && difficulty.trim()) ? difficulty.trim() : 'Medium';

    // Create question & options inside transaction
    const newQuestion = await db.$transaction(async (tx) => {
      const q = await tx.question.create({
        data: {
          bankId: id,
          category: categoryToSave,
          difficulty: difficultyToSave,
          questionText,
          questionType: typeToSave,
          explanationText: explanationText || '',
          status: 'active',
        },
      });

      if (typeToSave === 'multiple_choice' && options) {
        for (let i = 0; i < options.length; i++) {
          const opt = options[i];
          await tx.questionOption.create({
            data: {
              questionId: q.id,
              optionKey: opt.optionKey.toUpperCase(),
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              sortOrder: i + 1,
            },
          });
        }
      }

      return q;
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'create_question_manual',
        entityType: 'Question',
        entityId: newQuestion.id,
        metadataJson: JSON.stringify({ category: categoryToSave, difficulty: difficultyToSave }),
      },
    });

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error) {
    console.error('Create manual question error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
