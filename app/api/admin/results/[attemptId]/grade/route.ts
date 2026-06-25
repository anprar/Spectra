import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const session = await getSession();

    // Allow both admins and instructors to grade essays
    if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
      return NextResponse.json({ error: 'Unauthorized. Akses ditolak.' }, { status: 401 });
    }

    const { grades } = await request.json();

    if (!grades || !Array.isArray(grades)) {
      return NextResponse.json({ error: 'Format data penilaian tidak valid.' }, { status: 400 });
    }

    // 1. Fetch attempt and questions in a transaction
    const result = await db.$transaction(async (tx) => {
      const attempt = await tx.examAttempt.findUnique({
        where: { id: attemptId },
        include: {
          exam: true,
          questions: true,
        },
      });

      if (!attempt) {
        throw new Error('Sesi ujian tidak ditemukan.');
      }

      // Check each grade and update AttemptQuestion
      for (const grade of grades) {
        const { questionId, manualScore, essayFeedback } = grade;
        
        // Find corresponding snapshot question
        const q = attempt.questions.find((x) => x.questionId === questionId);
        if (!q) continue;

        if (q.questionType !== 'essay') {
          throw new Error('Hanya soal bertipe essay yang dapat dinilai secara manual.');
        }

        // Validate score
        const scoreVal = parseFloat(manualScore);
        if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > q.pointValue) {
          throw new Error(`Skor manual untuk soal #${q.displayOrder} tidak valid (harus antara 0 dan ${q.pointValue}).`);
        }

        await tx.attemptQuestion.update({
          where: { id: q.id },
          data: {
            manualScore: scoreVal,
            isCorrect: scoreVal >= (q.pointValue / 2), // Mark as correct if candidate gets 50% or more of points
            isManuallyGraded: true,
            essayFeedback: essayFeedback || null,
          },
        });
      }

      // Refetch questions to compute updated final score
      const updatedQuestions = await tx.attemptQuestion.findMany({
        where: { attemptId },
      });

      let totalScore = 0;
      for (const q of updatedQuestions) {
        if (q.questionType === 'essay') {
          totalScore += q.manualScore || 0;
        } else {
          // Multiple choice
          if (q.isCorrect) {
            totalScore += q.pointValue;
          }
        }
      }

      const maxScore = updatedQuestions.reduce((sum, q) => sum + q.pointValue, 0);
      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0;
      const passed = percentage >= attempt.exam.passScore;

      // Check if all essay questions have been graded
      const hasUngradedEssay = updatedQuestions.some(
        (q) => q.questionType === 'essay' && !q.isManuallyGraded
      );

      // If all are graded, status becomes 'graded'. Otherwise, remains 'submitted'.
      const finalStatus = hasUngradedEssay ? 'submitted' : 'graded';

      const updatedAttempt = await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: finalStatus,
          score: totalScore,
          maxScore: maxScore,
          percentage: percentage,
          passed: passed,
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'essay_graded',
          entityType: 'ExamAttempt',
          entityId: attemptId,
          metadataJson: JSON.stringify({
            grader: session.email,
            graderRole: session.role,
            totalScore,
            percentage,
            passed,
            finalStatus,
          }),
        },
      });

      return updatedAttempt;
    });

    return NextResponse.json({
      success: true,
      message: 'Penilaian essay berhasil disimpan.',
      attempt: result,
    });
  } catch (error: any) {
    console.error('Grade essay error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server saat menilai essay.' }, { status: 500 });
  }
}
