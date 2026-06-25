import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// 1. PUT: Update an exam, sync rules and candidate assignments
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      title,
      description,
      trainingModuleId,
      durationMinutes,
      questionCount,
      passScore,
      availableFrom,
      availableUntil,
      shuffleQuestions,
      shuffleOptions,
      resultReleaseMode,
      status,
      rules,
      candidateIds
    } = body;

    if (!title || !durationMinutes || !questionCount || passScore === undefined || !availableFrom || !availableUntil) {
      return NextResponse.json({ error: 'Data wajib diisi belum lengkap.' }, { status: 400 });
    }

    const fromDate = new Date(availableFrom);
    const untilDate = new Date(availableUntil);

    if (fromDate >= untilDate) {
      return NextResponse.json({ error: 'Tanggal selesai harus setelah tanggal mulai.' }, { status: 400 });
    }

    // Check if exam exists
    const existingExam = await db.exam.findUnique({
      where: { id },
      include: {
        rules: true,
        assignments: true
      }
    });

    if (!existingExam) {
      return NextResponse.json({ error: 'Ujian tidak ditemukan.' }, { status: 404 });
    }

    // Process all updates in a single database transaction
    const updatedExam = await db.$transaction(async (tx) => {
      // A. Update basic exam info
      const exam = await tx.exam.update({
        where: { id },
        data: {
          title,
          description: description || '',
          trainingModuleId: trainingModuleId || null,
          durationMinutes: parseInt(durationMinutes),
          questionCount: parseInt(questionCount),
          passScore: parseFloat(passScore),
          availableFrom: fromDate,
          availableUntil: untilDate,
          shuffleQuestions: shuffleQuestions !== undefined ? shuffleQuestions : true,
          shuffleOptions: shuffleOptions !== undefined ? shuffleOptions : true,
          resultReleaseMode: resultReleaseMode || 'score_only',
          status: status || 'draft',
        }
      });

      // B. Sync question rules (Delete all and recreate)
      await tx.examQuestionRule.deleteMany({
        where: { examId: id }
      });

      if (rules && Array.isArray(rules)) {
        for (const rule of rules) {
          if (!rule.bankId || !rule.category || !rule.pickCount) continue;
          await tx.examQuestionRule.create({
            data: {
              examId: id,
              bankId: rule.bankId,
              category: rule.category,
              difficulty: rule.difficulty || 'Any',
              pickCount: parseInt(rule.pickCount)
            }
          });
        }
      }

      // C. Sync candidate assignments
      const existingCandidateIds = existingExam.assignments.map(a => a.candidateId);
      const incomingCandidateIds = candidateIds && Array.isArray(candidateIds) ? candidateIds : [];

      // 1. Identify and delete removed candidates
      const removedCandidateIds = existingCandidateIds.filter(cid => !incomingCandidateIds.includes(cid));
      if (removedCandidateIds.length > 0) {
        await tx.examAssignment.deleteMany({
          where: {
            examId: id,
            candidateId: { in: removedCandidateIds }
          }
        });
      }

      // 2. Identify and create new candidates
      const addedCandidateIds = incomingCandidateIds.filter(cid => !existingCandidateIds.includes(cid));
      for (const candidateId of addedCandidateIds) {
        await tx.examAssignment.create({
          data: {
            examId: id,
            candidateId,
            assignedById: session.userId,
            status: 'assigned',
            attemptLimit: 1
          }
        });
      }

      return exam;
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'update_exam',
        entityType: 'Exam',
        entityId: id,
        metadataJson: JSON.stringify({ title }),
      },
    });

    return NextResponse.json({ success: true, exam: updatedExam });
  } catch (error) {
    console.error('Update exam error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// 2. DELETE: Delete an exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = params;

    const existingExam = await db.exam.findUnique({
      where: { id }
    });

    if (!existingExam) {
      return NextResponse.json({ error: 'Ujian tidak ditemukan.' }, { status: 404 });
    }

    await db.exam.delete({
      where: { id }
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'delete_exam',
        entityType: 'Exam',
        entityId: id,
        metadataJson: JSON.stringify({ title: existingExam.title }),
      },
    });

    return NextResponse.json({ success: true, message: 'Sesi ujian berhasil dihapus.' });
  } catch (error) {
    console.error('Delete exam error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
