import React from 'react';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Lock, 
  Play, 
  Clock, 
  LogOut,
  Sparkles,
  HelpCircle,
  Hourglass,
  Check,
  Calendar
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CandidateDashboardPage() {
  const session = await getSession();

  if (!session || session.role !== 'candidate') {
    redirect('/login');
  }

  // 1. Fetch Candidate's Exam Assignments (joined with Exams and Training Modules)
  const assignments = await db.examAssignment.findMany({
    where: { candidateId: session.userId },
    include: {
      exam: {
        include: {
          trainingModule: {
            include: {
              lessons: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
          attempts: {
            where: { candidateId: session.userId },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  // 2. Map and calculate progress & scheduling states for each assignment
  const processedAssignments = await Promise.all(
    assignments.map(async (assign) => {
      const exam = assign.exam;
      const trainingModule = exam.trainingModule;
      
      let progressPercent = 0;
      let totalLessons = 0;
      let completedLessons = 0;
      let isGateUnlocked = true;

      // Calculate training progress if a module is linked
      if (trainingModule) {
        totalLessons = trainingModule.lessons.length;
        if (totalLessons > 0) {
          const progressRecords = await db.trainingProgress.findMany({
            where: {
              userId: session.userId,
              lessonId: { in: trainingModule.lessons.map((l) => l.id) },
              status: 'completed',
            },
          });
          completedLessons = progressRecords.length;
          progressPercent = Math.round((completedLessons / totalLessons) * 100);
          
          // Completion Gate: Locked if training progress is less than 100%
          isGateUnlocked = progressPercent === 100;
        }
      }

      // Determine Exam Attempt status
      const latestAttempt = exam.attempts[0];
      const isAttemptSubmitted = latestAttempt && (latestAttempt.status === 'submitted' || latestAttempt.status === 'graded');
      const isAttemptInProgress = latestAttempt && latestAttempt.status === 'in_progress';

      // Determine Scheduling Lifecycle State
      const now = new Date();
      let scheduleState: 'upcoming' | 'active' | 'expired' | 'completed' = 'active';

      if (isAttemptSubmitted) {
        scheduleState = 'completed';
      } else if (now < exam.availableFrom) {
        scheduleState = 'upcoming';
      } else if (now > exam.availableUntil) {
        scheduleState = 'expired';
      } else {
        scheduleState = 'active';
      }

      return {
        assignmentId: assign.id,
        examId: exam.id,
        examTitle: exam.title,
        examDesc: exam.description,
        durationMinutes: exam.durationMinutes,
        questionCount: exam.questionCount,
        passScore: exam.passScore,
        availableFrom: exam.availableFrom,
        availableUntil: exam.availableUntil,
        extraTimeMinutes: assign.extraTimeMinutes,
        
        // Training Gate
        hasPrerequisite: !!trainingModule,
        moduleTitle: trainingModule?.title || null,
        moduleSlug: trainingModule?.slug || null,
        moduleId: trainingModule?.id || null,
        progressPercent,
        totalLessons,
        completedLessons,
        isGateUnlocked,

        // Attempts
        latestAttempt,
        isAttemptSubmitted,
        isAttemptInProgress,
        scheduleState,
      };
    })
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 bg-[#0b0f19] border-b border-slate-800/80 px-6 md:px-12 flex items-center justify-between z-30 sticky top-0 backdrop-blur-md bg-[#0b0f19]/95">
        <div className="flex items-center space-x-2.5">
          <img src="/spectra_logo.png" alt="SPECTRA Logo" className="w-7 h-7 object-contain" />
          <span className="font-mono text-2xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#00d8f6] bg-clip-text text-transparent tracking-tighter">
            SPECTRA
          </span>
          <span className="text-[9px] bg-[#00d8f6]/10 text-[#00d8f6] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#00d8f6]/20">
            Candidate Portal
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-white font-sans">{session.fullName}</span>
            <span className="text-[10px] text-slate-500 font-mono">{session.email}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#00d8f6] flex items-center justify-center text-white text-xs font-bold font-sans">
            {session.fullName.charAt(0)}
          </div>
          <ThemeToggle />
          <form action="/api/auth/logout" method="POST" className="flex items-center">
            <button
              type="submit"
              className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors focus:outline-none"
              title="Keluar Portal"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full space-y-10">
        
        {/* Welcome Hero */}
        <div className="bg-gradient-to-r from-[#0b0f19] to-[#090d16] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-bold text-[#00d8f6] uppercase tracking-wider bg-[#00d8f6]/10 px-2.5 py-1 rounded-full border border-[#00d8f6]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rekrutmen Berbasis Kompetensi</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Halo, {session.fullName}! Siap Mengukur Kompetensi Anda?
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              SPECTRA membantu Anda mempersiapkan pengetahuan sebelum memulai evaluasi kerja nyata. Harap selesaikan seluruh materi pelatihan wajib sebelum membuka akses ujian kompetensi Anda.
            </p>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Section 1: Assigned Training Modules (1/3 width) */}
          <div className="space-y-4">
            <h2 className="font-sans font-bold text-lg text-white flex items-center space-x-2.5">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>Modul Pembelajaran Wajib</span>
            </h2>

            {processedAssignments.filter(a => a.hasPrerequisite).length === 0 ? (
              <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-8 text-center text-slate-500 text-xs">
                Tidak ada modul pelatihan wajib yang ditugaskan kepada Anda.
              </div>
            ) : (
              <div className="space-y-4">
                {processedAssignments
                  .filter(a => a.hasPrerequisite)
                  .map((assign) => (
                    <div 
                      key={assign.moduleId} 
                      className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4 hover:border-slate-800 transition-colors"
                    >
                      <div>
                        <span className="font-mono text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider">
                          Prasyarat Ujian
                        </span>
                        <h3 className="font-sans font-semibold text-sm text-white mt-2 leading-tight">
                          {assign.moduleTitle}
                        </h3>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <span>Progres Pembelajaran</span>
                          <span className={assign.progressPercent === 100 ? "text-emerald-400 font-bold" : "text-slate-300"}>
                            {assign.progressPercent}% ({assign.completedLessons}/{assign.totalLessons} Pelajaran)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/40">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              assign.progressPercent === 100 
                                ? 'bg-emerald-500' 
                                : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                            }`}
                            style={{ width: `${assign.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/candidate/modules/${assign.moduleId}`}
                        className={`w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-sans text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 transition-colors`}
                      >
                        {assign.progressPercent === 100 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Materi Selesai (Pelajari Ulang)</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 text-blue-400 fill-blue-400" />
                            <span>Lanjutkan Belajar</span>
                          </>
                        )}
                      </Link>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Section 2: Assigned Exams (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-sans font-bold text-lg text-white flex items-center space-x-2.5">
              <Award className="w-5 h-5 text-pink-500" />
              <span>Jadwal Ujian Kompetensi Anda</span>
            </h2>

            {processedAssignments.length === 0 ? (
              <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-16 text-center text-slate-500 text-xs">
                Belum ada jadwal ujian kompetensi yang ditugaskan untuk akun Anda.
              </div>
            ) : (
              <div className="space-y-4">
                {processedAssignments.map((assign) => (
                  <div 
                    key={assign.assignmentId} 
                    className={`bg-[#0b0f19] border rounded-xl p-6 shadow-lg relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 transition-colors ${
                      assign.scheduleState === 'active' && assign.isGateUnlocked
                        ? 'border-slate-800 hover:border-slate-700'
                        : 'border-slate-800/60 opacity-70'
                    }`}
                  >
                    {/* Top indicator strip depending on state */}
                    {assign.scheduleState === 'active' && assign.isGateUnlocked && (
                      <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-gradient-to-b from-[#7c3aed] to-[#00d8f6]"></div>
                    )}

                    <div className="space-y-3 flex-1">
                      {/* Status Badges & Meta */}
                      <div className="flex flex-wrap gap-2 items-center">
                        {/* 1. Gate Lock Status */}
                        {!assign.isGateUnlocked ? (
                          <span className="inline-flex items-center space-x-1 font-mono text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 uppercase tracking-wider">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Terkunci (Selesaikan Materi)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 font-mono text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                            <Check className="w-2.5 h-2.5" />
                            <span>Prasyarat Terpenuhi</span>
                          </span>
                        )}

                        {/* 2. Schedule Lifecycle Status */}
                        {assign.scheduleState === 'upcoming' && (
                          <span className="inline-flex items-center space-x-1 font-mono text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Belum Mulai</span>
                          </span>
                        )}
                        {assign.scheduleState === 'active' && assign.isGateUnlocked && (
                          <span className="inline-flex items-center space-x-1 font-mono text-[9px] font-bold text-[#00d8f6] bg-[#00d8f6]/10 px-2 py-0.5 rounded-full border border-[#00d8f6]/20 uppercase tracking-wider animate-pulse">
                            <span className="w-1.5 h-1.5 bg-[#00d8f6] rounded-full"></span>
                            <span>Siap Dikerjakan</span>
                          </span>
                        )}
                        {assign.scheduleState === 'expired' && (
                          <span className="inline-flex items-center space-x-1 font-mono text-[9px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 uppercase tracking-wider">
                            <span>Kadaluarsa</span>
                          </span>
                        )}
                        {assign.scheduleState === 'completed' && (
                          <span className="inline-flex items-center space-x-1 font-mono text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                            <span>Sudah Dikerjakan</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-sans font-semibold text-base text-white">
                          {assign.examTitle}
                        </h3>
                        <p className="font-sans text-xs text-slate-400 mt-1 line-clamp-2 max-w-xl">
                          {assign.examDesc || 'Tidak ada deskripsi ujian.'}
                        </p>
                      </div>

                      {/* Exam parameters */}
                      <div className="flex space-x-4 text-[10px] font-mono text-slate-500 pt-1">
                        <span className="flex items-center"><Hourglass className="w-3.5 h-3.5 mr-1" /> {assign.durationMinutes} Menit</span>
                        <span className="flex items-center"><HelpCircle className="w-3.5 h-3.5 mr-1" /> {assign.questionCount} Soal Pilihan Ganda</span>
                      </div>

                      {/* Access Schedule dates */}
                      <div className="bg-slate-950/40 border border-slate-900/50 rounded-lg p-2.5 space-y-1 text-[10px] font-sans mt-2.5 max-w-sm">
                        <div className="flex items-center text-slate-400 font-semibold">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                          <span>Jadwal Akses Ujian:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 font-mono text-[9px] text-slate-300 bg-slate-950/20 p-2 rounded border border-slate-900/50">
                          <div>
                            <span className="text-slate-500 block text-[8px] uppercase">Mulai</span>
                            <span>{new Date(assign.availableFrom).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[8px] uppercase">Selesai</span>
                            <span>{new Date(assign.availableUntil).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="sm:self-center flex-shrink-0">
                      {/* State 1: Training Locked */}
                      {!assign.isGateUnlocked && (
                        <div className="text-center p-3 bg-slate-950 rounded-lg border border-slate-900 max-w-[150px] mx-auto">
                          <p className="text-[10px] text-slate-500 font-sans leading-tight">Selesaikan modul materi pembelajaran untuk membuka kunci</p>
                        </div>
                      )}

                      {/* State 2: Active & Unlocked & Not started */}
                      {assign.isGateUnlocked && assign.scheduleState === 'active' && !assign.latestAttempt && (
                        <Link
                          href={`/candidate/exams/${assign.examId}/readiness`}
                          className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none block w-full sm:w-fit"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
                          <div className="relative px-5 py-2.5 bg-[#0b0f19] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center justify-center space-x-2">
                            <span className="font-sans text-xs font-semibold text-white tracking-wide">
                              Mulai Ujian
                            </span>
                          </div>
                        </Link>
                      )}

                      {/* State 3: Active & Unlocked & Attempt In-Progress (Resumable!) */}
                      {assign.isGateUnlocked && assign.scheduleState === 'active' && assign.isAttemptInProgress && (
                        <Link
                          href={`/candidate/exams/${assign.examId}/attempt`}
                          className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white font-sans text-xs font-semibold tracking-wide flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                          <span>Lanjutkan Ujian</span>
                        </Link>
                      )}

                      {/* State 4: Upcoming Schedule */}
                      {assign.isGateUnlocked && assign.scheduleState === 'upcoming' && (
                        <div className="text-center p-3 bg-slate-950 rounded-lg border border-slate-900 max-w-[150px] mx-auto text-slate-500 font-mono text-[9px]">
                          <span>Dibuka pada:</span>
                          <span className="block text-slate-400 font-bold mt-0.5">
                            {new Date(assign.availableFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}

                      {/* State 5: Expired Schedule */}
                      {assign.isGateUnlocked && assign.scheduleState === 'expired' && (
                        <button 
                          disabled
                          className="px-4 py-2 bg-slate-950 border border-slate-900 text-slate-600 font-sans text-xs font-semibold rounded-lg cursor-not-allowed w-full"
                        >
                          Batas Waktu Terlewat
                        </button>
                      )}

                      {/* State 6: Attempt Completed */}
                      {assign.scheduleState === 'completed' && (
                        <Link
                          href={`/candidate/attempts/${assign.latestAttempt.id}/result`}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-400 hover:text-emerald-300 font-sans text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Lihat Hasil</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
