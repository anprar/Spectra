import React from 'react';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { 
  Award, 
  Clock, 
  BookOpen, 
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InstructorExamsPage() {
  const session = await getSession();

  if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
    redirect('/login');
  }

  // Fetch all exams with their training module, assignments, and creator info
  const exams = await db.exam.findMany({
    include: {
      trainingModule: {
        select: {
          title: true
        }
      },
      assignments: {
        include: {
          candidate: {
            select: {
              fullName: true,
              email: true
            }
          }
        }
      },
      createdBy: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Helper to determine active schedule state
  const getScheduleState = (from: Date, until: Date) => {
    const now = new Date();
    if (now < from) {
      return {
        text: 'Upcoming (Belum Mulai)',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      };
    }
    if (now > until) {
      return {
        text: 'Expired (Selesai)',
        color: 'text-slate-500 bg-slate-800/60 border-slate-700/50'
      };
    }
    return {
      text: 'Active (Sedang Berjalan)',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20 font-bold'
    };
  };

  return (
    <div className="space-y-8 font-sans text-slate-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
            <Award className="w-8 h-8 text-pink-500" />
            <span>Jadwal & Ujian Kompetensi</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pantau rilis sesi ujian aktif, durasi waktu, kriteria passing grade, dan penugasan ujian bertimer kandidat.
          </p>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex items-start gap-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-600 to-violet-600"></div>
        <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-lg border border-pink-500/20 mt-1">
          <Sparkles className="w-5 h-5 animate-pulse-subtle" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white">Tata Tertib Penjadwalan & Sesi Ujian</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pengaturan jadwal mulai-selesai dan alokasi kandidat diatur secara sentral oleh Administrator demi menjaga kepatuhan integritas seleksi rekrutmen. Instruktur dapat melakukan audit penugasan dan melihat daftar kandidat terdaftar di bawah ini. Untuk menerbitkan sesi ujian susulan atau merubah durasi ujian, silakan ajukan permintaan ke Administrator.
          </p>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exams.length === 0 ? (
          <div className="col-span-2 bg-[#0b0f19] border border-slate-800/80 rounded-xl p-12 text-center text-slate-500 italic">
            Belum ada sesi ujian kompetensi yang dikonfigurasi dalam sistem.
          </div>
        ) : (
          exams.map((exam) => {
            const state = getScheduleState(exam.availableFrom, exam.availableUntil);
            return (
              <div key={exam.id} className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="space-y-5">
                  
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded border ${state.color}`}>
                        {state.text}
                      </span>
                      <h3 className="text-base font-bold text-white tracking-tight mt-1 leading-snug">
                        {exam.title}
                      </h3>
                    </div>
                    <div className="flex-shrink-0 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center min-w-[70px]">
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Passing</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">{exam.passScore}%</span>
                    </div>
                  </div>

                  {/* Desc */}
                  {exam.description && (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {exam.description}
                    </p>
                  )}

                  {/* Exam parameters list */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-[#030712] border border-slate-850 p-2 rounded-lg text-xs">
                      <span className="text-[10px] text-slate-500 font-mono block">Durasi</span>
                      <span className="font-mono font-semibold text-white mt-1 block flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-pink-400" />
                        {exam.durationMinutes} mnt
                      </span>
                    </div>
                    <div className="bg-[#030712] border border-slate-850 p-2 rounded-lg text-xs">
                      <span className="text-[10px] text-slate-500 font-mono block">Jumlah Soal</span>
                      <span className="font-mono font-semibold text-white mt-1 block">{exam.questionCount} soal</span>
                    </div>
                    <div className="bg-[#030712] border border-slate-850 p-2 rounded-lg text-xs">
                      <span className="text-[10px] text-slate-500 font-mono block">Prasyarat</span>
                      <span className="font-mono font-semibold text-blue-400 mt-1 block truncate max-w-[80px]" title={exam.trainingModule?.title || 'Tidak ada'}>
                        {exam.trainingModule ? 'Modul Aktif' : 'Tanpa Modul'}
                      </span>
                    </div>
                  </div>

                  {/* Schedule dates */}
                  <div className="bg-[#030712] border border-slate-850 rounded-lg p-3 space-y-2 text-xs font-sans">
                    <div className="flex items-center text-slate-400 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      <span>Jadwal Akses Server (Waktu Lokal):</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-300 bg-slate-950/40 p-2 rounded border border-slate-900">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Mulai</span>
                        <span>{new Date(exam.availableFrom).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Selesai</span>
                        <span>{new Date(exam.availableUntil).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Candidates list */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#00d8f6]" />
                      <span>Kandidat Terdaftar ({exam.assignments.length} Peserta):</span>
                    </span>
                    {exam.assignments.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">Belum ada kandidat yang ditugaskan ke ujian ini.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {exam.assignments.map((assign) => (
                          <span key={assign.id} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                            {assign.candidate.fullName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer metadata */}
                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Dikonfigurasi oleh: {exam.createdBy.fullName}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
