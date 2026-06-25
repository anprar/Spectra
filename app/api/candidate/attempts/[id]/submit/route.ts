import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

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

    const { autoSubmitted } = await request.json().catch(() => ({ autoSubmitted: false }));

    // 1. Fetch attempt, associated exam, and questions within a transaction
    const result = await db.$transaction(async (tx) => {
      const attempt = await tx.examAttempt.findUnique({
        where: { id: attemptId },
        include: {
          exam: true,
          questions: true,
        },
      });

      if (!attempt || attempt.candidateId !== session.userId) {
        throw new Error('Sesi ujian tidak ditemukan.');
      }

      if (attempt.status !== 'in_progress') {
        // If already submitted, return the existing attempt details
        return attempt;
      }

      const exam = attempt.exam;
      const questions = attempt.questions;

      // 2. Perform Automatic Grading
      let score = 0;
      const maxScore = questions.reduce((sum, q) => sum + q.pointValue, 0); // sum of pointValues (usually questions.length)
      const hasEssay = questions.some((q) => q.questionType === 'essay');
      
      for (const q of questions) {
        const isEssay = q.questionType === 'essay';
        const isCorrect = !isEssay && q.selectedOption !== null && q.selectedOption === q.correctOptionSnapshot;
        if (isCorrect) {
          score += q.pointValue;
        }

        // Update each snapshot question with grading results
        await tx.attemptQuestion.update({
          where: { id: q.id },
          data: {
            isCorrect: isCorrect,
          },
        });
      }

      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0; // rounded to 2 decimals
      const passed = percentage >= exam.passScore;

      // 3. Update Attempt status to graded / submitted
      const updatedAttempt = await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: hasEssay ? 'submitted' : 'graded',
          score: score,
          maxScore: maxScore,
          percentage: percentage,
          passed: passed,
          autoSubmitted: autoSubmitted,
          submittedAt: new Date(),
        },
      });

      // 4. Update Exam Assignment status to completed
      await tx.examAssignment.update({
        where: { id: attempt.assignmentId },
        data: { status: 'completed' },
      });

      // 5. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'exam_submitted',
          entityType: 'ExamAttempt',
          entityId: attemptId,
          metadataJson: JSON.stringify({ score, percentage, passed, autoSubmitted }),
        },
      });

      return updatedAttempt;
    });

    return NextResponse.json({
      success: true,
      message: 'Ujian berhasil diserahkan dan dinilai otomatis.',
      attempt: {
        id: result.id,
        score: result.score,
        maxScore: result.maxScore,
        percentage: result.percentage,
        passed: result.passed,
        autoSubmitted: result.autoSubmitted,
      },
    });

  } catch (error: any) {
    console.error('Submit attempt error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server saat menyerahkan ujian.' }, { status: 500 });
  }
}
