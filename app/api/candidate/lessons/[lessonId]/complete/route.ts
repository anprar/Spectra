import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const session = await getSession();
    if (!session || session.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // 1. Verify the lesson exists
    const lesson = await db.trainingLesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Materi pelajaran tidak ditemukan.' }, { status: 404 });
    }

    // 2. Record/Upsert the training progress
    const progress = await db.trainingProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.userId,
          lessonId: lessonId,
        },
      },
      update: {
        status: 'completed',
        completedAt: new Date(),
      },
      create: {
        userId: session.userId,
        moduleId: lesson.moduleId,
        lessonId: lessonId,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'lesson_completed',
        entityType: 'TrainingLesson',
        entityId: lessonId,
        metadataJson: JSON.stringify({ moduleId: lesson.moduleId }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Materi berhasil ditandai selesai.',
      progress,
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
