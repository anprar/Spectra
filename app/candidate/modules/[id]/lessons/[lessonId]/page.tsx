import React from 'react';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LessonClient from './LessonClient';

export const dynamic = 'force-dynamic';

export default async function CandidateLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: moduleId, lessonId } = await params;
  const session = await getSession();

  if (!session || session.role !== 'candidate') {
    redirect('/login');
  }

  // 1. Fetch the lesson
  const lesson = await db.trainingLesson.findUnique({
    where: { id: lessonId },
  });

  if (!lesson || lesson.moduleId !== moduleId) {
    redirect(`/candidate/modules/${moduleId}`);
  }

  // 2. Fetch all lessons in this module to compute previous & next lessons
  const allLessons = await db.trainingLesson.findMany({
    where: { moduleId },
    orderBy: { sortOrder: 'asc' },
  });

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLessonId = currentIndex > 0 ? allLessons[currentIndex - 1].id : null;
  const nextLessonId = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null;

  // 3. Fetch training module details
  const trainingModule = await db.trainingModule.findUnique({
    where: { id: moduleId },
  });

  if (!trainingModule) {
    redirect('/candidate');
  }

  // 4. Check if this lesson is already completed by the candidate
  const progress = await db.trainingProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: session.userId,
        lessonId: lessonId,
      },
    },
  });

  const isCompleted = progress ? progress.status === 'completed' : false;

  return (
    <LessonClient
      moduleId={moduleId}
      moduleTitle={trainingModule.title}
      lesson={{
        id: lesson.id,
        title: lesson.title,
        contentType: lesson.contentType,
        contentBody: lesson.contentBody,
        filePath: lesson.filePath,
        externalUrl: lesson.externalUrl,
        sortOrder: lesson.sortOrder,
      }}
      initialCompleted={isCompleted}
      prevLessonId={prevLessonId}
      nextLessonId={nextLessonId}
    />
  );
}
