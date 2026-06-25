import React from 'react';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertTriangle,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CandidateResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: attemptId } = await params;
  const session = await getSession();

  if (!session || session.role !== 'candidate') {
    redirect('/login');
  }

  // 1. Fetch Attempt and associated Exam & questions details
  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          trainingModule: true,
        },
      },
      questions: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  if (!attempt || attempt.candidateId !== session.userId) {
    redirect('/candidate');
  }

  const exam = attempt.exam;
  const questions = attempt.questions;

  // Determine Release Mode
  // Options: hidden, score_only, full_review
  const releaseMode = exam.resultReleaseMode;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-6 md:p-12 max-w-4xl mx-auto w-full space-y-8 font-sans">
      
      {/* Back to Dashboard */}
      <Link 
        href="/candidate" 
        className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Dashboard</span>
      </Link>

      {/* Main Result Banner */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-8 shadow-xl relative overflow-hidden text-center space-y-6">
        {/* Glowing border accent */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${
          releaseMode === 'hidden'
            ? 'bg-gradient-to-r from-blue-600 to-cyan-500'
            : attempt.passed
              ? 'bg-emerald-500'
              : 'bg-red-500'
        }`}></div>

        <div className="space-y-2">
          <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900 border border-slate-850 px-3 py-1 rounded-full">
            Hasil Penilaian Ujian
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight pt-2">
            {exam.title}
          </h1>
        </div>

        {/* POLICY 1: HIDDEN RESULT */}
        {releaseMode === 'hidden' ? (
          <div className="max-w-md mx-auto py-6 space-y-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-semibold text-base text-white">Lembar Ujian Diterima</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jawaban Anda telah berhasil dikirimkan dan disimpan secara aman di server kami. Nilai evaluasi Anda bersifat rahasia dan akan ditinjau langsung oleh tim rekrutmen. Hasil akhir seleksi akan diumumkan melalui email atau portal resmi.
            </p>
          </div>
        ) : (
          /* POLICY 2 & 3: SCORE DISCOVERY */
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 py-4">
              
              {/* Score Circular Indicator */}
              <div className="relative w-28 h-28 flex flex-col items-center justify-center bg-[#030712] rounded-full border-2 border-slate-800 shadow-inner">
                <span className="text-[9px] font-mono text-slate-500 uppercase">Skor Ujian</span>
                <span className="text-3xl font-bold font-mono text-white mt-0.5">{attempt.score}</span>
                <span className="text-[10px] text-slate-500 font-mono">dari {attempt.maxScore} Soal</span>
              </div>

              {/* Stats Block */}
              <div className="text-left space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Persentase Nilai</span>
                  <p className="text-xl font-bold font-mono text-white">{attempt.percentage}%</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Status Kelulusan</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    {attempt.passed ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.75 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Lulus (Passing Grade: {exam.passScore}%)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-red-500/10 text-red-400 px-2.5 py-0.75 rounded-full border border-red-500/20 uppercase tracking-wider">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Gagal (Passing Grade: {exam.passScore}%)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-6">
              {attempt.passed 
                ? 'Selamat! Nilai kompetensi Anda memenuhi batas kualifikasi kelulusan minimum yang ditetapkan untuk ujian ini.' 
                : 'Maaf, nilai kompetensi Anda belum mencapai batas kelulusan minimum. Tim rekrutmen akan meninjau pengerjaan Anda untuk evaluasi lebih lanjut.'
              }
            </p>
          </div>
        )}
      </div>

      {/* POLICY 3: FULL REVIEW (Detailed Question Review) */}
      {releaseMode === 'full_review' && (
        <div className="space-y-6">
          <h2 className="font-sans font-bold text-base text-white border-b border-slate-800 pb-3">
            Tinjauan Butir Pertanyaan
          </h2>

          <div className="space-y-4">
            {questions.map((q) => {
              const isUnanswered = q.selectedOption === null;
              const isCorrect = q.selectedOption !== null && q.selectedOption === q.correctOptionSnapshot;

              return (
                <div 
                  key={q.id}
                  className={`bg-[#0b0f19] border rounded-xl p-6 shadow-md space-y-4 transition-colors ${
                    isUnanswered
                      ? 'border-slate-800'
                      : isCorrect
                        ? 'border-emerald-500/20 hover:border-emerald-500/30'
                        : 'border-red-500/20 hover:border-red-500/30'
                  }`}
                >
                  {/* Header metadata */}
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      Soal Nomor {q.displayOrder}
                    </span>

                    {isUnanswered ? (
                      <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-semibold bg-slate-900 text-slate-500 px-2 py-0.5 rounded border border-slate-800 uppercase">
                        Tidak Dijawab
                      </span>
                    ) : isCorrect ? (
                      <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Benar (+1.0 Poin)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 uppercase tracking-wider">
                        <XCircle className="w-3 h-3" />
                        <span>Salah (+0.0 Poin)</span>
                      </span>
                    )}
                  </div>

                  {/* Question Stem */}
                  <h3 className="font-sans text-xs md:text-sm text-white leading-relaxed whitespace-pre-line">
                    {q.questionTextSnapshot}
                  </h3>

                  {/* Shuffled Shapshot Options rendering */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 pt-2">
                    {[
                      { key: 'A', text: q.optionASnapshot },
                      { key: 'B', text: q.optionBSnapshot },
                      { key: 'C', text: q.optionCSnapshot },
                      { key: 'D', text: q.optionDSnapshot },
                      ...(q.optionESnapshot ? [{ key: 'E', text: q.optionESnapshot }] : []),
                    ].map((opt) => {
                      const isSelected = q.selectedOption === opt.key;
                      const isCorrectKey = q.correctOptionSnapshot === opt.key;

                      let optStyles = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200';
                      let keyStyles = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';

                      if (isCorrectKey) {
                        optStyles = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/40 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-medium';
                        keyStyles = 'bg-emerald-500 border-emerald-500 text-white';
                      } else if (isSelected && !isCorrectKey) {
                        optStyles = 'bg-red-50 dark:bg-red-950/20 border-red-500/40 dark:border-red-500/40 text-red-800 dark:text-red-300';
                        keyStyles = 'bg-red-500 border-red-500 text-white';
                      }

                      return (
                        <div 
                          key={opt.key}
                          className={`px-4 py-2.5 rounded-lg border text-xs font-sans flex items-start space-x-2 transition-colors ${optStyles}`}
                        >
                          <span className={`font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${keyStyles}`}>
                            {opt.key}
                          </span>
                          <span className="leading-relaxed">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Block */}
                  {q.explanationSnapshot && (
                    <div className="mt-4 p-3.5 bg-amber-50 dark:bg-slate-950/80 rounded-lg border border-amber-200 dark:border-slate-800/40 text-xs text-slate-700 dark:text-slate-400 font-sans leading-relaxed flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-300 block mb-0.5">Pembahasan:</span>
                        <p>{q.explanationSnapshot}</p>
                      </div>
                    </div>
                  )}


                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
