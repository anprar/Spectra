import React from 'react';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  PlayCircle, 
  FileText, 
  Video, 
  Link2, 
  ArrowRight,
  Home
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CandidateModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session || session.role !== 'candidate') {
    redirect('/login');
  }

  // 1. Fetch training module and its lessons
  const trainingModule = await db.trainingModule.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!trainingModule) {
    redirect('/candidate');
  }

  // 2. Fetch candidate's progress records
  const progressRecords = await db.trainingProgress.findMany({
    where: {
      userId: session.userId,
      moduleId: id,
      status: 'completed',
    },
  });

  const completedLessonIds = new Set(progressRecords.map((r) => r.lessonId));

  // 3. Calculate percentage
  const totalLessons = trainingModule.lessons.length;
  const completedCount = completedLessonIds.size;
  const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-200 p-6 md:p-12 max-w-4xl mx-auto w-full space-y-8 font-sans">
      {/* Back Button */}
      <Link 
        href="/candidate" 
        className="inline-flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-[#00d8f6] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Dashboard</span>
      </Link>

      {/* Header Info */}
      <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Glowing visual lines */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 to-cyan-500"></div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-blue-400">
            <BookOpen className="w-5 h-5" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">Modul Pembelajaran</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
            {trainingModule.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
            {trainingModule.summary}
          </p>
        </div>

        {/* Big Progress Circle Indicator */}
        <div className="bg-[#030712] border border-slate-800 p-4 rounded-xl text-center min-w-[120px] self-stretch md:self-auto flex flex-col justify-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Progres Anda</span>
          <span className={`text-2xl font-bold font-mono mt-1 ${percentage === 100 ? 'text-emerald-400' : 'text-white'}`}>
            {percentage}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            {completedCount}/{totalLessons} Selesai
          </span>
        </div>
      </div>

      {/* Lessons Timeline List */}
      <div className="space-y-4">
        <h2 className="font-sans font-bold text-base text-white border-b border-slate-800 pb-3">
          Daftar Materi Pelajaran
        </h2>

        <div className="relative pl-4 space-y-6 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[1px] before:bg-slate-800">
          {trainingModule.lessons.map((lesson, index) => {
            const isCompleted = completedLessonIds.has(lesson.id);
            
            // Icon based on type
            let TypeIcon = FileText;
            if (lesson.contentType === 'video') TypeIcon = Video;
            if (lesson.contentType === 'link') TypeIcon = Link2;

            return (
              <div key={lesson.id} className="relative flex items-start gap-4 group">
                
                {/* Timeline status circle */}
                <span className={`absolute left-[-23px] top-[4px] w-6 h-6 rounded-full flex items-center justify-center border z-10 transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-[#030712] border-slate-800 text-slate-500 group-hover:border-slate-600'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="font-mono text-[9px] font-bold">{index + 1}</span>
                  )}
                </span>

                {/* Lesson Card */}
                <div className="flex-1 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-md flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center space-x-2 text-slate-500">
                      <TypeIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-[10px] uppercase tracking-wider">{lesson.contentType}</span>
                      {lesson.isRequired && (
                        <span className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.25 rounded border border-red-500/20 font-sans font-semibold">
                          Wajib
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-sans font-semibold text-sm text-slate-800 dark:text-white truncate max-w-lg leading-tight group-hover:text-violet-600 dark:group-hover:text-[#00d8f6] transition-colors">
                      {lesson.title}
                    </h3>
                  </div>

                  {/* Action Link */}
                  <Link
                    href={`/candidate/modules/${id}/lessons/${lesson.id}`}
                    className="flex-shrink-0 p-2.5 bg-slate-100 dark:bg-[#030712] hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg flex items-center justify-center transition-all"
                    title="Buka Materi"
                  >
                    <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Close / Back to Dashboard Button */}
      <div className="flex items-center justify-center pt-4 pb-8">
        <Link
          href="/candidate"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-sans text-sm font-semibold transition-colors shadow-lg hover:shadow-xl"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}
