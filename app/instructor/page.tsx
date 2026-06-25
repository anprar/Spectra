import React from 'react';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { 
  BookOpen, 
  Database, 
  Award, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  Clock 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InstructorDashboardPage() {
  const session = await getSession();

  if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
    redirect('/login');
  }

  // 1. Fetch statistics from SQLite database
  const totalModules = await db.trainingModule.count();
  
  const totalBanks = await db.questionBank.count({
    where: session.role === 'admin' ? {} : { ownerId: session.userId },
  });
  
  const totalExams = await db.exam.count();
  
  const totalCandidates = await db.user.count({
    where: { role: 'candidate' },
  });

  // 2. Fetch recent candidate attempts (join attempt, candidate, and exam)
  const recentAttempts = await db.examAttempt.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      candidate: true,
      exam: true,
    },
  });

  // 3. Fetch recent audit logs
  const recentLogs = await db.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
    },
  });

  return (
    <div className="space-y-8 font-sans text-slate-200">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Selamat Datang, {session.fullName}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Kelola materi pembelajaran, bank soal, dan evaluasi hasil uji kompetensi kandidat.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Modules Stat */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Modul Training</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 font-mono">{totalModules}</h3>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 flex items-center">
            <span className="text-blue-400 font-semibold mr-1">Aktif</span> di portal kandidat
          </p>
        </div>

        {/* Banks Stat */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Bank Soal</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 font-mono">{totalBanks}</h3>
            </div>
            <div className="p-2.5 bg-[#00d8f6]/10 text-[#00d8f6] rounded-lg border border-[#00d8f6]/20">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 flex items-center">
            <span className="text-[#00d8f6] font-semibold mr-1">Milik Anda</span> (siap impor Excel)
          </p>
        </div>

        {/* Exams Stat */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Ujian Aktif</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 font-mono">{totalExams}</h3>
            </div>
            <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-lg border border-pink-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 flex items-center">
            <span className="text-pink-400 font-semibold mr-1">Bertimer</span> otomatis di server
          </p>
        </div>

        {/* Candidates Stat */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Total Kandidat</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 font-mono">{totalCandidates}</h3>
            </div>
            <div className="p-2.5 bg-[#7c3aed]/10 text-[#7c3aed] rounded-lg border border-[#7c3aed]/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 flex items-center">
            <span className="text-[#7c3aed] font-semibold mr-1">Terdaftar</span> dalam sistem rekrutmen
          </p>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Attempts (2/3 width) */}
        <div className="xl:col-span-2 bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-sans font-semibold text-base text-white flex items-center space-x-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#00d8f6]" />
              <span>Aktivitas Ujian Kandidat Terkini</span>
            </h2>
            <div className="flex items-center space-x-3">
              <a
                href="/api/instructor/reports/export"
                className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#030712] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-[#00d8f6] transition-colors"
                title="Ekspor Seluruh Hasil ke Berkas CSV"
              >
                <span>Ekspor CSV</span>
              </a>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Real-time</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-mono uppercase">
                  <th className="py-3 px-2">Kandidat</th>
                  <th className="py-3 px-2">Ujian</th>
                  <th className="py-3 px-2 text-center">Nilai</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      Belum ada riwayat ujian pengerjaan kandidat.
                    </td>
                  </tr>
                ) : (
                  recentAttempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-medium text-white">{attempt.candidate.fullName}</div>

                        <div className="text-[10px] text-slate-500">{attempt.candidate.email}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-xs font-medium text-slate-300 max-w-[200px] truncate">
                          {attempt.exam.title}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-xs">
                        <span className="text-white font-bold">{attempt.score}</span>
                        <span className="text-slate-500">/{attempt.maxScore}</span>
                        <span className="block text-[9px] text-slate-400">({attempt.percentage}%)</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {attempt.status === 'in_progress' ? (
                          <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-semibold bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20">
                            <Clock className="w-2.5 h-2.5 animate-spin" />
                            <span>Mengerjakan</span>
                          </span>
                        ) : attempt.passed ? (
                          <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Lulus</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-semibold bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                            <XCircle className="w-2.5 h-2.5" />
                            <span>Gagal</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right text-xs text-slate-400 font-mono">
                        {attempt.submittedAt 
                          ? new Date(attempt.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                          : new Date(attempt.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Logs (1/3 width) */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 shadow-lg space-y-4">
          <h2 className="font-sans font-semibold text-base text-white">
            Log Aktivitas Portal
          </h2>
          <div className="space-y-4 relative pl-3 border-l border-slate-800">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Belum ada aktivitas tercatat.</p>
            ) : (
              recentLogs.map((log) => {
                // Formatting actions to human readable text
                let actionText = log.action;
                if (log.action === 'login') actionText = 'Pengguna berhasil masuk portal';
                if (log.action === 'logout') actionText = 'Pengguna keluar dari portal';
                if (log.action === 'import_questions') actionText = 'Mengimpor soal dari berkas Excel';
                if (log.action === 'exam_started') actionText = 'Kandidat memulai sesi ujian';
                if (log.action === 'exam_submitted') actionText = 'Kandidat mengumpulkan berkas ujian';

                return (
                  <div key={log.id} className="relative space-y-1">
                    {/* Circle marker on timeline */}
                    <span className="absolute left-[-17.5px] top-[4px] w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></span>
                    <p className="text-xs font-sans text-slate-300 font-medium">
                      {actionText}
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>{log.user ? log.user.fullName : 'Sistem'}</span>
                      <span>
                        {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
