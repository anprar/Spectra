import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Fetch the exam assignment for this candidate to verify access
    const assignment = await db.examAssignment.findUnique({
      where: {
        examId_candidateId: {
          examId: id,
          candidateId: session.userId,
        },
      },
      include: {
        exam: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Penugasan ujian tidak ditemukan.' }, { status: 404 });
    }

    const exam = assignment.exam;

    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        questionCount: exam.questionCount,
        passScore: exam.passScore,
        availableFrom: exam.availableFrom,
        availableUntil: exam.availableUntil,
      },
    });
  } catch (error) {
    console.error('Fetch candidate exam error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
