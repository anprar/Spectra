import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// 1. GET: Fetch active exam questions and options for the candidate
// SECURITY: Do NOT return correctOptionSnapshot or isCorrect fields to prevent client-side cheating!
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    const session = await getSession();
    if (!session || session.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Fetch attempt details
    const attempt = await db.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
      },
    });

    if (!attempt || attempt.candidateId !== session.userId) {
      return NextResponse.json({ error: 'Sesi ujian tidak ditemukan.' }, { status: 404 });
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'Ujian telah diserahkan atau waktu telah berakhir.', status: attempt.status }, { status: 400 });
    }

    // Check server authoritative timer expiration on page load
    const now = new Date();
    if (now > attempt.endsAt) {
      // Auto submit/expire
      await db.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'expired',
          autoSubmitted: true,
          submittedAt: attempt.endsAt,
        },
      });
      return NextResponse.json({ error: 'Waktu ujian telah berakhir.', status: 'expired' }, { status: 400 });
    }

    // Fetch snapshot questions, explicitly selecting only safe candidate-facing columns
    const questions = await db.attemptQuestion.findMany({
      where: { attemptId },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        questionId: true,
        displayOrder: true,
        questionType: true,
        questionTextSnapshot: true,
        optionASnapshot: true,
        optionBSnapshot: true,
        optionCSnapshot: true,
        optionDSnapshot: true,
        optionESnapshot: true,
        selectedOption: true,
        essayAnswer: true,
        answeredAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        examId: attempt.examId,
        examTitle: attempt.exam.title,
        endsAt: attempt.endsAt,
        status: attempt.status,
      },
      questions,
    });
  } catch (error) {
    console.error('Fetch attempt questions error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// 2. POST: Interactive Micro-Save (autosave on option change)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    const session = await getSession();
    if (!session || session.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { questionId, selectedOption, essayAnswer } = await request.json();

    if (!questionId) {
      return NextResponse.json({ error: 'Format data penyimpanan jawaban tidak valid.' }, { status: 400 });
    }

    if (selectedOption !== undefined && selectedOption !== null) {
      if (!['A', 'B', 'C', 'D', 'E'].includes(selectedOption)) {
        return NextResponse.json({ error: 'Format pilihan jawaban tidak valid.' }, { status: 400 });
      }
    }

    // Fetch attempt to verify timer and candidate ownership
    const attempt = await db.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.candidateId !== session.userId) {
      return NextResponse.json({ error: 'Sesi ujian tidak ditemukan.' }, { status: 404 });
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'Ujian sudah diserahkan atau waktu pengerjaan habis.', expired: true }, { status: 400 });
    }

    // Server authoritative timer verification
    const now = new Date();
    if (now > attempt.endsAt) {
      // Lock attempt in DB
      await db.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'expired',
          autoSubmitted: true,
          submittedAt: attempt.endsAt,
        },
      });
      return NextResponse.json({ error: 'Waktu habis. Jawaban tidak dapat disimpan.', expired: true }, { status: 400 });
    }

    // Save candidate's selection / essay answer
    const updateData: any = {
      answeredAt: new Date(),
    };
    if (selectedOption !== undefined) {
      updateData.selectedOption = selectedOption;
    }
    if (essayAnswer !== undefined) {
      updateData.essayAnswer = essayAnswer;
    }

    const updatedQuestion = await db.attemptQuestion.updateMany({
      where: {
        attemptId: attemptId,
        questionId: questionId,
      },
      data: updateData,
    });

    // Send heartbeat update to database
    await db.examAttempt.update({
      where: { id: attemptId },
      data: { lastHeartbeatAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Jawaban berhasil disimpan (micro-save).',
    });
  } catch (error) {
    console.error('Micro-save error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat menyimpan jawaban.' }, { status: 500 });
  }
}
