import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// 1. GET: List all exams
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const exams = await db.exam.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        trainingModule: {
          select: { id: true, title: true }
        },
        rules: {
          include: {
            bank: { select: { id: true, name: true } }
          }
        },
        assignments: {
          select: {
            id: true,
            candidateId: true,
            candidate: { select: { id: true, fullName: true, email: true } }
          }
        },
        createdBy: {
          select: { fullName: true }
        }
      }
    });

    return NextResponse.json({ success: true, exams });
  } catch (error) {
    console.error('Fetch exams error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// 2. POST: Create a new exam session
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

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

    // Process everything within a database transaction
    const newExam = await db.$transaction(async (tx) => {
      // 1. Create main exam config
      const exam = await tx.exam.create({
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
          createdById: session.userId,
        }
      });

      // 2. Create question selection rules if provided
      if (rules && Array.isArray(rules)) {
        let rulesTotalPick = 0;
        for (const rule of rules) {
          if (!rule.bankId || !rule.category || !rule.pickCount) continue;
          rulesTotalPick += parseInt(rule.pickCount);

          await tx.examQuestionRule.create({
            data: {
              examId: exam.id,
              bankId: rule.bankId,
              category: rule.category,
              difficulty: rule.difficulty || 'Any',
              pickCount: parseInt(rule.pickCount)
            }
          });
        }
        
        // Optional: warn/validate if rules pickCount doesn't match total questions
        if (rulesTotalPick > 0 && rulesTotalPick !== parseInt(questionCount)) {
          // We can let it pass, but typically it should match. Let's just log or enforce.
        }
      }

      // 3. Assign candidates if provided
      if (candidateIds && Array.isArray(candidateIds)) {
        for (const candidateId of candidateIds) {
          await tx.examAssignment.create({
            data: {
              examId: exam.id,
              candidateId,
              assignedById: session.userId,
              status: 'assigned',
              attemptLimit: 1 // default limit
            }
          });
        }
      }

      return exam;
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'create_exam',
        entityType: 'Exam',
        entityId: newExam.id,
        metadataJson: JSON.stringify({ title }),
      },
    });

    return NextResponse.json({ success: true, exam: newExam });
  } catch (error) {
    console.error('Create exam error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
