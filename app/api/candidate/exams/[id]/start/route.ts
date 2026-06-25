import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const session = await getSession();
    if (!session || session.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // 1. Fetch Exam and Assignment details
    const assignment = await db.examAssignment.findUnique({
      where: {
        examId_candidateId: {
          examId,
          candidateId: session.userId,
        },
      },
      include: {
        exam: {
          include: {
            rules: true,
            attempts: {
              where: { candidateId: session.userId },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Penugasan ujian tidak ditemukan.' }, { status: 404 });
    }

    const exam = assignment.exam;

    // 2. Check if there is already an active attempt (Allow Resuming!)
    const activeAttempt = exam.attempts.find((att) => att.status === 'in_progress');
    if (activeAttempt) {
      // Verify if the active attempt is actually expired
      const now = new Date();
      if (now > activeAttempt.endsAt) {
        // Automatically close/expire this attempt
        await db.examAttempt.update({
          where: { id: activeAttempt.id },
          data: {
            status: 'expired',
            autoSubmitted: true,
            submittedAt: activeAttempt.endsAt,
          },
        });
      } else {
        // Return active attempt for resuming
        return NextResponse.json({
          success: true,
          message: 'Melanjutkan sesi ujian aktif.',
          attemptId: activeAttempt.id,
        });
      }
    }

    // 3. Check attempt limit
    const completedAttempts = exam.attempts.filter(
      (att) => att.status === 'submitted' || att.status === 'graded' || att.status === 'expired'
    );
    if (completedAttempts.length >= assignment.attemptLimit) {
      return NextResponse.json({ error: 'Anda telah mencapai batas maksimal pengerjaan ujian ini.' }, { status: 400 });
    }

    // 4. Verify scheduling window
    const now = new Date();
    if (now < exam.availableFrom) {
      return NextResponse.json({ error: 'Ujian belum dibuka.' }, { status: 400 });
    }
    if (now > exam.availableUntil) {
      return NextResponse.json({ error: 'Batas waktu akses jadwal ujian telah terlewati.' }, { status: 400 });
    }

    // 5. Verify Training Prerequisite Gate (Calculate progress in-API)
    if (exam.trainingModuleId) {
      const totalLessons = await db.trainingLesson.count({
        where: { moduleId: exam.trainingModuleId },
      });
      if (totalLessons > 0) {
        const completedLessons = await db.trainingProgress.count({
          where: {
            userId: session.userId,
            moduleId: exam.trainingModuleId,
            status: 'completed',
          },
        });
        if (completedLessons < totalLessons) {
          return NextResponse.json({ error: 'Akses terkunci. Anda wajib menyelesaikan seluruh materi pembelajaran prasyarat terlebih dahulu.' }, { status: 403 });
        }
      }
    }

    // 6. Generate and Pull Random Questions based on rules
    const questionsToSnapshot: any[] = [];

    if (exam.rules.length === 0) {
      // Fallback: Pull questions randomly from any active questions in the system
      const allActiveQuestions = await db.question.findMany({
        where: { status: 'active' },
        include: {
          options: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
      const shuffled = allActiveQuestions.sort(() => 0.5 - Math.random());
      const picked = shuffled.slice(0, exam.questionCount);
      questionsToSnapshot.push(...picked);
    } else {
      for (const rule of exam.rules) {
        // Find active questions in the specified bank, category, and difficulty
        const questionsInRule = await db.question.findMany({
          where: {
            bankId: rule.bankId,
            category: (rule.category && rule.category !== 'Any') ? rule.category : undefined,
            difficulty: rule.difficulty !== 'Any' ? rule.difficulty : undefined,
            status: 'active',
          },
          include: {
            options: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        });

        // Shuffle and pick
        const shuffled = questionsInRule.sort(() => 0.5 - Math.random());
        const picked = shuffled.slice(0, rule.pickCount);
        questionsToSnapshot.push(...picked);
      }
    }

    // Shuffle final questions if exam config demands it
    let finalQuestions = questionsToSnapshot;
    if (exam.shuffleQuestions) {
      finalQuestions = questionsToSnapshot.sort(() => 0.5 - Math.random());
    }

    // Slice to maximum exam question count just in case
    finalQuestions = finalQuestions.slice(0, exam.questionCount);

    if (finalQuestions.length < exam.questionCount) {
      return NextResponse.json({ 
        error: `Jumlah soal aktif di bank soal (${finalQuestions.length}) kurang dari jumlah soal yang dikonfigurasikan untuk ujian ini (${exam.questionCount}). Harap hubungi pemateri.` 
      }, { status: 500 });
    }

    // 7. Create Attempt and Snapshot Questions (Transaction)
    const duration = exam.durationMinutes;
    const extraTime = assignment.extraTimeMinutes;
    const endsAt = new Date(Date.now() + (duration + extraTime) * 60 * 1000);

    const newAttempt = await db.$transaction(async (tx) => {
      // Create attempt record
      const att = await tx.examAttempt.create({
        data: {
          examId: exam.id,
          candidateId: session.userId,
          assignmentId: assignment.id,
          status: 'in_progress',
          startedAt: new Date(),
          endsAt: endsAt,
        },
      });

      // Create snapshot questions
      for (let index = 0; index < finalQuestions.length; index++) {
        const q = finalQuestions[index];
        
        // Shuffle options if exam config demands it
        let opts = [...q.options];
        if (exam.shuffleOptions) {
          opts = opts.sort(() => 0.5 - Math.random());
        }

        // Map options to snapshots (safely fallback if less than 5)
        const optA = opts[0]?.optionText || '';
        const optB = opts[1]?.optionText || '';
        const optC = opts[2]?.optionText || '';
        const optD = opts[3]?.optionText || '';
        const optE = opts[4]?.optionText || null;

        // Find the correct original option key (A, B, C, D, E) and map to the new shuffled key
        const correctOriginalOption = q.options.find((o: any) => o.isCorrect);
        const correctOriginalKey = correctOriginalOption ? correctOriginalOption.optionKey : 'A';
        
        // The correct key in the snapshot is the shuffled option index that represents the correct answer
        const correctShuffledIndex = opts.findIndex((o: any) => o.optionKey === correctOriginalKey);
        const correctSnapshotKey = ['A', 'B', 'C', 'D', 'E'][correctShuffledIndex >= 0 ? correctShuffledIndex : 0];

        await tx.attemptQuestion.create({
          data: {
            attemptId: att.id,
            questionId: q.id,
            displayOrder: index + 1,
            questionTextSnapshot: q.questionText,
            explanationSnapshot: q.explanationText,
            optionASnapshot: optA,
            optionBSnapshot: optB,
            optionCSnapshot: optC,
            optionDSnapshot: optD,
            optionESnapshot: optE,
            correctOptionSnapshot: correctSnapshotKey,
            selectedOption: null, // initially unanswered
            isCorrect: false,
            pointValue: 1.0,
          },
        });
      }

      // Update assignment status to in_progress
      await tx.examAssignment.update({
        where: { id: assignment.id },
        data: { status: 'in_progress' },
      });

      return att;
    });

    // 8. Write Audit Log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'exam_started',
        entityType: 'ExamAttempt',
        entityId: newAttempt.id,
        metadataJson: JSON.stringify({ examId: exam.id }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sesi ujian berhasil dimulai.',
      attemptId: newAttempt.id,
    });

  } catch (error: any) {
    console.error('Start attempt error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memulai ujian.' }, { status: 500 });
  }
}
