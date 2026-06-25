import React from 'react';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Link2,
  CheckCircle2, 
  Edit,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InstructorModulesPage() {
  const session = await getSession();

  if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
    redirect('/login');
  }

  // Fetch all training modules with their lessons count and creator info
  const modules = await db.trainingModule.findMany({
    include: {
      lessons: {
        orderBy: { sortOrder: 'asc' }
      },
      createdBy: {
        select: {
          fullName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8 font-sans text-slate-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <span>Modul Pembelajaran Wajib</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pantau materi kurikulum, susunan pelajaran (LMS), dan kesiapan modul training prasyarat untuk kandidat.
          </p>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex items-start gap-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 to-cyan-500"></div>
        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 mt-1">
          <Sparkles className="w-5 h-5 animate-pulse-subtle" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white">Tata Tertib Pengelolaan Kurikulum</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Kurikulum dan penugasan modul prasyarat didesain terpusat untuk menjamin standarisasi evaluasi rekrutmen. Instruktur dapat memantau konten modul di bawah ini. Untuk menambahkan modul pembelajaran baru atau merubah prasyarat ujian, silakan berkoordinasi dengan Administrator Sistem.
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.length === 0 ? (
          <div className="col-span-2 bg-[#0b0f19] border border-slate-800/80 rounded-xl p-12 text-center text-slate-500 italic">
            Belum ada modul pembelajaran yang diterbitkan dalam sistem.
          </div>
        ) : (
          modules.map((mod) => (
            <div key={mod.id} className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className={`inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                      mod.status === 'published' 
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {mod.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <h3 className="text-base md:text-lg font-bold text-white tracking-tight mt-1.5 leading-tight">
                      {mod.title}
                    </h3>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs font-mono font-bold">
                    {mod.lessons.length} Pelajaran
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-400 leading-relaxed">
                  {mod.summary}
                </p>

                {/* Lessons list bullet overview */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Daftar Materi:</span>
                  {mod.lessons.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">Belum ada materi pelajaran ditambahkan.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {mod.lessons.map((lesson, idx) => {
                        let Icon = FileText;
                        if (lesson.contentType === 'video') Icon = Video;
                        if (lesson.contentType === 'link') Icon = Link2;

                        return (
                          <div key={lesson.id} className="flex items-center justify-between text-xs bg-[#030712] border border-slate-900 rounded-lg p-2 font-sans">
                            <div className="flex items-center space-x-2 min-w-0 pr-4">
                              <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              <span className="text-slate-300 truncate font-medium">{idx + 1}. {lesson.title}</span>
                            </div>
                            {lesson.isRequired && (
                              <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-1 rounded border border-red-500/20 flex-shrink-0">
                                Wajib
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Creator Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Dibuat oleh: {mod.createdBy.fullName}</span>
                <span>{new Date(mod.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
