import React from 'react';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  AlertCircle,
  HelpCircle,
  Check,
  X
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAttemptReviewPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  // 1. Fetch complete attempt details from database
  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      candidate: {
        select: {
          fullName: true,
          email: true
        }
      },
      exam: {
        select: {
          title: true,
          passScore: true,
          passScore: true
        }
      },
      questions: {
        orderBy: { displayOrder: 'asc' }
      }
    }
  });

  if (!attempt || attempt.status !== 'submitted') {
    redirect('/admin/results');
  }

  // Calculate actual exam duration
  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return '-';
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins} menit ${diffSecs} detik`;
  };

  const correctCount = attempt.questions.filter(q => q.isCorrect).length;
  const unansweredCount = attempt.questions.filter(q => q.selectedOption === null).length;

  return (
    <div className="space-y-8 font-sans text-slate-200 max-w-4xl mx-auto">
      
      {/* Back Button */}
      <Link
        href="/admin/results"
        className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-[#00d8f6] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Laporan Hasil Ujian</span>
      </Link>

      {/* Hero Header Card */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 to-cyan-500"></div>

        <div className="space-y-3">
          <div className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded-full">
            <BookOpen className="w-3.5 h-3.5 text-[#00d8f6]" />
            <span>Lembar Peninjauan Jawaban</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
            {attempt.exam.title}
          </h1>
          <div className="flex flex-col space-y-1 text-xs text-slate-400">
            <p>Kandidat: <span className="font-semibold text-white">{attempt.candidate.fullName}</span> ({attempt.candidate.email})</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-500 mt-1">
              <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Durasi: {formatDuration(attempt.startedAt, attempt.submittedAt)}</span>
              <span>&bull;</span>
              <span>Penyerahan: {attempt.autoSubmitted ? 'Otomatis oleh Sistem (Time-out)' : 'Manual oleh Kandidat'}</span>
            </div>
          </div>
        </div>

        {/* Score Ring Display */}
        <div className="bg-[#030712] border border-slate-800 p-5 rounded-2xl text-center min-w-[150px] self-stretch md:self-auto flex flex-col justify-center items-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Hasil Evaluasi</span>
          <span className={`text-3xl font-bold font-mono mt-1.5 ${attempt.passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {attempt.percentage}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            {correctCount} / {attempt.questions.length} Benar
          </span>
          <span className={`mt-3 inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.75 rounded-full border ${
            attempt.passed 
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
              : 'text-red-400 bg-red-500/10 border-red-500/20'
          }`}>
            {attempt.passed ? 'Lulus Kompetensi' : 'Tidak Lulus'}
          </span>
        </div>
      </div>

      {/* Summary Micro-Stats */}
      <div className="grid grid-cols-3 gap-4 bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 text-center">
        <div>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Jawaban Benar</span>
          <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">{correctCount}</span>
        </div>
        <div className="border-x border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Jawaban Salah</span>
          <span className="text-base font-bold font-mono text-red-400 mt-1 block">{attempt.questions.length - correctCount - unansweredCount}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Tidak Dijawab</span>
          <span className="text-base font-bold font-mono text-slate-400 mt-1 block">{unansweredCount}</span>
        </div>
      </div>

      {/* Questions Review List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
          Rincian Analisis Per Soal
        </h2>

        {attempt.questions.map((q, index) => {
          // Construct options array dynamically
          const options = [
            { key: 'A', text: q.optionASnapshot },
            { key: 'B', text: q.optionBSnapshot },
            { key: 'C', text: q.optionCSnapshot },
            { key: 'D', text: q.optionDSnapshot }
          ];
          if (q.optionESnapshot) {
            options.push({ key: 'E', text: q.optionESnapshot });
          }

          return (
            <div key={q.id} className={`bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 shadow-md space-y-4 relative ${
              q.selectedOption === null 
                ? 'border-l-4 border-l-slate-700' 
                : q.isCorrect 
                  ? 'border-l-4 border-l-emerald-500' 
                  : 'border-l-4 border-l-red-500'
            }`}>
              {/* Question Number and Status */}
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Soal Nomor {index + 1}
                </span>
                
                {q.selectedOption === null ? (
                  <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-800/60 border border-slate-700/50 px-2 py-0.5 rounded">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>TIDAK DIJAWAB</span>
                  </span>
                ) : q.isCorrect ? (
                  <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>BENAR</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    <span>SALAH</span>
                  </span>
                )}
              </div>

              {/* Question Stem Text */}
              <p className="text-xs md:text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                {q.questionTextSnapshot}
              </p>

              {/* Options List */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                {options.map((opt) => {
                  const isSelected = q.selectedOption === opt.key;
                  const isCorrectAnswer = q.correctOptionSnapshot === opt.key;

                  let optionStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300';
                  let statusIcon = null;

                  if (isSelected) {
                    if (q.isCorrect) {
                      // Correct selection
                      optionStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold';
                      statusIcon = <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
                    } else {
                      // Incorrect selection
                      optionStyle = 'bg-red-500/10 border-red-500 text-red-750 dark:text-red-300 font-semibold';
                      statusIcon = <X className="w-4 h-4 text-red-400 flex-shrink-0" />;
                    }
                  } else if (isCorrectAnswer) {
                    // Correct answer not selected
                    optionStyle = 'bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/50 border-dashed text-emerald-700 dark:text-emerald-300';
                    statusIcon = <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 opacity-70" />;
                  }

                  return (
                    <div
                      key={opt.key}
                      className={`flex items-center justify-between p-3.5 rounded-lg border text-xs transition-colors duration-200 ${optionStyle}`}
                    >
                      <div className="flex items-start space-x-3 pr-4">
                        <span className="font-mono font-bold bg-slate-200 dark:bg-[#030712] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px]">
                          {opt.key}
                        </span>
                        <span className="leading-relaxed">{opt.text}</span>
                      </div>
                      {statusIcon}
                    </div>
                  );
                })}
              </div>

              {/* Explanation section */}
              {q.explanationSnapshot && (
                <div className="mt-4 p-4 bg-slate-100 dark:bg-[#030712] border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1.5">
                  <span className="font-mono text-[10px] font-bold text-[#00d8f6] uppercase tracking-wider flex items-center">
                    <HelpCircle className="w-3.5 h-3.5 mr-1" />
                    <span>Pembahasan Soal</span>
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans whitespace-pre-wrap">
                    {q.explanationSnapshot}
                  </p>
                </div>
              )}


            </div>
          );
        })}
      </div>

    </div>
  );
}
