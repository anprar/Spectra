import React from 'react';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Home,
  Clock
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

  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q) => 
    q.questionType === 'essay'
      ? (q.essayAnswer !== null && q.essayAnswer !== undefined && q.essayAnswer.trim() !== '')
      : (q.selectedOption !== null)
  ).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-200 p-6 md:p-12 max-w-4xl mx-auto w-full space-y-8 font-sans">
      
      <ScrollToTopButton />

      {/* Back to Dashboard */}
      <Link 
        href="/candidate" 
        className="inline-flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Dashboard</span>
      </Link>

      {/* Main Result Banner */}
      <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 shadow-xl relative overflow-hidden text-center space-y-6">
        {/* Glowing border accent */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${
          releaseMode === 'hidden'
            ? 'bg-gradient-to-r from-blue-600 to-cyan-500'
            : attempt.status === 'submitted'
              ? 'bg-amber-500'
              : attempt.passed
                ? 'bg-emerald-500'
                : 'bg-red-500'
        }`}></div>

        <div className="space-y-2">
          <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 px-3 py-1 rounded-full">
            Hasil Penilaian Ujian
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight pt-2">
            {exam.title}
          </h1>
        </div>

        {/* POLICY 1: HIDDEN RESULT */}
        {releaseMode === 'hidden' ? (
          <div className="max-w-md mx-auto py-6 space-y-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-semibold text-base text-slate-900 dark:text-white">Lembar Ujian Diterima</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
              Jawaban Anda telah berhasil dikirimkan dan disimpan secara aman di server kami. Nilai evaluasi Anda bersifat rahasia dan akan ditinjau langsung oleh tim rekrutmen. Hasil akhir seleksi akan diumumkan melalui email atau portal resmi.
            </p>
          </div>
        ) : attempt.status === 'submitted' ? (
          /* POLICY 2 & 3: SUBMITTED (PENDING ESSAY GRADING) */
          <div className="max-w-xl mx-auto space-y-4 py-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-amber-800 dark:text-amber-300 text-xs flex flex-col items-center text-center space-y-3">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
              <span className="font-semibold text-sm block">Status: Menunggu Penilaian Essay</span>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                Jawaban pilihan ganda Anda telah dinilai, namun nilai akhir akan muncul setelah koreksi manual soal essay selesai dilakukan oleh Instruktur/Admin.
              </p>
            </div>
          </div>
        ) : (
          /* POLICY 2 & 3: SCORE DISCOVERY */
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 py-4">
              
              {/* Score Circular Indicator */}
              <div className="relative w-28 h-28 flex flex-col items-center justify-center bg-slate-100 dark:bg-[#030712] rounded-full border-2 border-slate-200 dark:border-slate-800 shadow-inner">
                <span className="text-[9px] font-mono text-slate-500 uppercase">Skor Ujian</span>
                <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">{attempt.score}</span>
                <span className="text-[10px] text-slate-500 font-mono">dari {attempt.maxScore} Soal</span>
              </div>

              {/* Stats Block */}
              <div className="text-left space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Persentase Nilai</span>
                  <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">{attempt.percentage}%</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Status Kelulusan</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    {attempt.passed ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.75 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-550" />
                        <span>Lulus (Passing Grade: {exam.passScore}%)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-red-500/10 text-red-650 dark:text-red-400 px-2.5 py-0.75 rounded-full border border-red-500/20 uppercase tracking-wider">
                        <XCircle className="w-3.5 h-3.5 text-red-550" />
                        <span>Gagal (Passing Grade: {exam.passScore}%)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-800/60 pt-6">
              {attempt.passed 
                ? 'Selamat! Nilai kompetensi Anda memenuhi batas kualifikasi kelulusan minimum yang ditetapkan untuk ujian ini.' 
                : 'Maaf, nilai kompetensi Anda belum mencapai batas kelulusan minimum. Tim rekrutmen akan meninjau pengerjaan Anda untuk evaluasi lebih lanjut.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Micro-Stats */}
      {releaseMode !== 'hidden' && (
        <div className="grid grid-cols-3 gap-4 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 text-center shadow-lg">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block font-bold">Total Soal</span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1.5 block">{totalQuestions}</span>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block font-bold">Dijawab</span>
            <span className="text-xl font-bold font-mono text-violet-600 dark:text-cyan-400 mt-1.5 block">{answeredCount}</span>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block font-bold">Belum Dijawab</span>
            <span className="text-xl font-bold font-mono text-slate-400 dark:text-slate-500 mt-1.5 block">{unansweredCount}</span>
          </div>
        </div>
      )}

      {/* POLICY 3: FULL REVIEW (Detailed Question Review) */}
      {releaseMode === 'full_review' && (
        <div className="space-y-6">
          <h2 className="font-sans font-bold text-base text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-850 pb-3">
            Tinjauan Butir Pertanyaan
          </h2>

          <div className="space-y-4">
            {questions.map((q) => {
              const isEssay = q.questionType === 'essay';
              const isUnanswered = isEssay
                ? (q.essayAnswer === null || q.essayAnswer === undefined || q.essayAnswer.trim() === '')
                : (q.selectedOption === null);
              const isCorrect = !isEssay && q.selectedOption !== null && q.selectedOption === q.correctOptionSnapshot;

              let borderStyle = 'border-slate-200 dark:border-slate-800/80';
              if (!isUnanswered) {
                if (isEssay) {
                  borderStyle = q.isManuallyGraded
                    ? 'border-purple-550/20 dark:border-purple-500/20'
                    : 'border-amber-550/20 dark:border-amber-500/20';
                } else {
                  borderStyle = isCorrect
                    ? 'border-emerald-555/20 dark:border-emerald-500/20'
                    : 'border-red-555/20 dark:border-red-500/20';
                }
              }

              return (
                <div 
                  key={q.id}
                  className={`bg-white dark:bg-[#0b0f19] border rounded-xl p-6 shadow-md space-y-4 transition-colors ${borderStyle}`}
                >
                  {/* Header metadata */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                      Soal Nomor {q.displayOrder}
                    </span>

                    {isUnanswered ? (
                      <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-semibold bg-slate-100 dark:bg-slate-900 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 uppercase">
                        Tidak Dijawab
                      </span>
                    ) : isEssay ? (
                      q.isManuallyGraded ? (
                        <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold bg-purple-500/10 text-purple-650 dark:text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3 text-purple-550" />
                          <span>Sudah Dinilai (+{q.manualScore} / {q.pointValue} Poin)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider animate-pulse">
                          <Clock className="w-3 h-3 text-amber-550" />
                          <span>Menunggu penilaian dari instruktur</span>
                        </span>
                      )
                    ) : isCorrect ? (
                      <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 text-emerald-550" />
                        <span>Benar (+{q.pointValue} Poin)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold bg-red-500/10 text-red-650 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 uppercase tracking-wider">
                        <XCircle className="w-3 h-3 text-red-550" />
                        <span>Salah (+0.0 Poin)</span>
                      </span>
                    )}
                  </div>

                  {/* Question Stem */}
                  <h3 className="font-sans text-xs md:text-sm text-slate-800 dark:text-white leading-relaxed whitespace-pre-line">
                    {q.questionTextSnapshot}
                  </h3>

                  {/* RENDER TYPE 1: MULTIPLE CHOICE OPTIONS */}
                  {!isEssay ? (
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

                        let optStyles = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200';
                        let keyStyles = 'bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';

                        if (isCorrectKey) {
                          optStyles = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/40 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-medium';
                          keyStyles = 'bg-emerald-500 border-emerald-500 text-white';
                        } else if (isSelected && !isCorrectKey) {
                          optStyles = 'bg-red-50 dark:bg-red-950/20 border-red-500/40 dark:border-red-500/40 text-red-800 dark:text-red-350';
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
                  ) : (
                    /* RENDER TYPE 2: ESSAY ANSWER & FEEDBACK */
                    <div className="space-y-3 pt-2 pl-2">
                      <div className="bg-slate-50 dark:bg-[#030712] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 font-bold">Jawaban Anda:</span>
                        {isUnanswered ? (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">Anda tidak mengisi jawaban untuk soal essay ini.</p>
                        ) : (
                          <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">{q.essayAnswer}</p>
                        )}
                      </div>
                      
                      {q.isManuallyGraded && q.essayFeedback && (
                        <div className="bg-purple-500/5 dark:bg-purple-950/10 border border-purple-500/20 rounded-xl p-4 text-xs space-y-1">
                          <span className="font-semibold text-purple-600 dark:text-purple-400 block">Catatan / Feedback Instruktur:</span>
                          <p className="text-slate-650 dark:text-slate-400 leading-relaxed font-sans">{q.essayFeedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation Block */}
                  {!isEssay && q.explanationSnapshot && (
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

      {/* Close / Back to Dashboard Button at bottom */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-8">
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
