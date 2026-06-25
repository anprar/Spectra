'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
  X,
  Loader2,
  Save,
  MessageSquare
} from 'lucide-react';

interface AttemptQuestion {
  id: string;
  attemptId: string;
  questionId: string;
  displayOrder: number;
  questionType: string; // multiple_choice, essay
  questionTextSnapshot: string;
  explanationSnapshot: string | null;
  optionASnapshot: string;
  optionBSnapshot: string;
  optionCSnapshot: string;
  optionDSnapshot: string;
  optionESnapshot: string | null;
  correctOptionSnapshot: string;
  selectedOption: string | null;
  essayAnswer: string | null;
  isCorrect: boolean;
  pointValue: number;
  manualScore: number | null;
  isManuallyGraded: boolean;
  essayFeedback: string | null;
}

interface Attempt {
  id: string;
  examId: string;
  candidateId: string;
  status: string; // in_progress, submitted, expired, graded
  startedAt: string;
  submittedAt: string | null;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  autoSubmitted: boolean;
  createdAt: string;
  candidate: {
    fullName: string;
    email: string;
  };
  exam: {
    title: string;
    passScore: number;
  };
  questions: AttemptQuestion[];
}

export default function AdminAttemptReviewPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const router = useRouter();
  const { attemptId } = use(params);

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Grading State: map of questionId -> { manualScore, essayFeedback }
  const [grades, setGrades] = useState<Record<string, { manualScore: string; essayFeedback: string }>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAttemptDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/results/${attemptId}`);
      if (res.ok) {
        const data = await res.json();
        setAttempt(data.attempt);
        
        // Pre-fill grades state
        const initialGrades: Record<string, { manualScore: string; essayFeedback: string }> = {};
        data.attempt.questions.forEach((q: AttemptQuestion) => {
          if (q.questionType === 'essay') {
            initialGrades[q.questionId] = {
              manualScore: q.manualScore !== null ? q.manualScore.toString() : '0.0',
              essayFeedback: q.essayFeedback || '',
            };
          }
        });
        setGrades(initialGrades);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Gagal mengambil rincian lembar jawaban.');
      }
    } catch (e) {
      setError('Koneksi internet bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttemptDetails();
  }, [attemptId]);

  // Toast auto-dismiss
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Calculate actual exam duration
  const formatDuration = (startStr: string, endStr: string | null) => {
    if (!endStr) return '-';
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins} menit ${diffSecs} detik`;
  };

  // Handle manual grade field change
  const handleGradeChange = (questionId: string, field: 'manualScore' | 'essayFeedback', value: string) => {
    setGrades((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  // Submit manual essay grades to API
  const handleGradingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attempt) return;
    setSubmitLoading(true);
    setError(null);

    const payloadGrades = Object.entries(grades).map(([questionId, data]) => ({
      questionId,
      manualScore: parseFloat(data.manualScore || '0.0'),
      essayFeedback: data.essayFeedback.trim() || undefined,
    }));

    try {
      const res = await fetch(`/api/admin/results/${attempt.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: payloadGrades }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Penilaian soal essay berhasil disimpan & skor akumulasi terupdate.');
        fetchAttemptDetails(); // Refresh details
      } else {
        setError(data.error || 'Gagal menyimpan penilaian essay.');
      }
    } catch (err) {
      setError('Koneksi server bermasalah.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">Memuat lembar peninjauan...</p>
        </div>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="space-y-4 font-sans text-center max-w-md mx-auto py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Kesalahan Terjadi</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <Link
          href="/admin/results"
          className="inline-block px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-semibold"
        >
          Kembali ke Laporan
        </Link>
      </div>
    );
  }

  if (!attempt) return null;

  // Breakdown detail counts:
  const totalQuestions = attempt.questions.length;
  
  // A question is answered if it has a selectedOption (for MC) or a non-empty essayAnswer (for Essay)
  const answeredCount = attempt.questions.filter((q) => 
    q.questionType === 'essay' 
      ? (q.essayAnswer !== null && q.essayAnswer !== undefined && q.essayAnswer.trim() !== '') 
      : (q.selectedOption !== null)
  ).length;

  const unansweredCount = totalQuestions - answeredCount;
  
  const correctCount = attempt.questions.filter(q => q.questionType !== 'essay' && q.isCorrect).length;
  const wrongCount = attempt.questions.filter(q => q.questionType !== 'essay' && q.selectedOption !== null && !q.isCorrect).length;

  const hasEssay = attempt.questions.some((q) => q.questionType === 'essay');
  const hasUngradedEssay = attempt.status === 'submitted' && attempt.questions.some((q) => q.questionType === 'essay' && !q.isManuallyGraded);

  return (
    <div className="space-y-8 font-sans text-slate-700 dark:text-slate-200 max-w-4xl mx-auto pb-12">
      
      {/* Toast Success Notifications */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl flex items-center space-x-3 shadow-2xl backdrop-blur-md animate-fade-in">
          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Back Button */}
      <Link
        href="/admin/results"
        className="inline-flex items-center space-x-2 text-xs text-slate-500 hover:text-violet-600 dark:hover:text-[#00d8f6] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Laporan Hasil Ujian</span>
      </Link>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-red-700 dark:text-red-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 to-cyan-500"></div>

        <div className="space-y-3 flex-1">
          <div className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 px-2.5 py-1 rounded-full">
            <BookOpen className="w-3.5 h-3.5 text-violet-500 dark:text-[#00d8f6]" />
            <span>Lembar Peninjauan Jawaban</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-950 dark:text-white tracking-tight leading-tight">
            {attempt.exam.title}
          </h1>
          <div className="flex flex-col space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <p>Kandidat: <span className="font-semibold text-slate-950 dark:text-white">{attempt.candidate.fullName}</span> ({attempt.candidate.email})</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">
              <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Durasi: {formatDuration(attempt.startedAt, attempt.submittedAt)}</span>
              <span>&bull;</span>
              <span>Penyerahan: {attempt.autoSubmitted ? 'Otomatis' : 'Manual'}</span>
            </div>
          </div>
        </div>

        {/* Score Ring Display */}
        <div className="bg-slate-50 dark:bg-[#030712] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-center min-w-[150px] self-stretch md:self-auto flex flex-col justify-center items-center">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hasil Evaluasi</span>
          
          {attempt.status === 'submitted' ? (
            <>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-3 mb-1">MENUNGGU KOREKSI</span>
              <span className="text-[9px] font-mono text-slate-550 uppercase block tracking-wider">Skor Pilihan Ganda: {attempt.score}/{attempt.maxScore}</span>
            </>
          ) : (
            <>
              <span className={`text-3xl font-bold font-mono mt-1.5 ${attempt.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {attempt.percentage}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                {attempt.score} / {attempt.maxScore} Poin
              </span>
            </>
          )}

          <span className={`mt-3 inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.75 rounded-full border ${
            attempt.status === 'submitted'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
              : attempt.passed 
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                : 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20'
          }`}>
            {attempt.status === 'submitted' ? 'Belum Dinilai' : attempt.passed ? 'Lulus Kompetensi' : 'Tidak Lulus'}
          </span>
        </div>
      </div>

      {/* Summary Micro-Stats */}
      <div className="grid grid-cols-4 gap-4 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-center shadow">
        <div>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Total Soal</span>
          <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1 block">{totalQuestions}</span>
        </div>
        <div className="border-l border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Dijawab</span>
          <span className="text-base font-bold font-mono text-violet-600 dark:text-cyan-400 mt-1 block">{answeredCount}</span>
        </div>
        <div className="border-l border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Belum Dijawab</span>
          <span className="text-base font-bold font-mono text-slate-500 dark:text-slate-400 mt-1 block">{unansweredCount}</span>
        </div>
        <div className="border-l border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Status Penilaian</span>
          <span className={`text-[11px] font-sans font-semibold mt-1.5 block ${hasUngradedEssay ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {hasUngradedEssay ? 'Koreksi Essay Diperlukan' : 'Penilaian Selesai'}
          </span>
        </div>
      </div>

      {/* Questions Review List */}
      <form onSubmit={handleGradingSubmit} className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">
            Rincian Analisis Per Soal
          </h2>
          
          {hasUngradedEssay && (
            <button
              type="submit"
              disabled={submitLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-lg text-xs font-semibold shadow transition-all disabled:opacity-50"
            >
              {submitLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4.5 h-4.5" />}
              <span>Simpan & Terapkan Penilaian</span>
            </button>
          )}
        </div>

        <div className="space-y-6">
          {attempt.questions.map((q, index) => {
            const isEssay = q.questionType === 'essay';
            const isUnanswered = isEssay 
              ? (q.essayAnswer === null || q.essayAnswer === undefined || q.essayAnswer.trim() === '')
              : (q.selectedOption === null);

            // Construct options array dynamically (for MC)
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
              <div key={q.id} className={`bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-md space-y-4 relative ${
                isUnanswered 
                  ? 'border-l-4 border-l-slate-400 dark:border-l-slate-700' 
                  : isEssay
                    ? q.isManuallyGraded 
                      ? 'border-l-4 border-l-purple-500' 
                      : 'border-l-4 border-l-amber-500'
                    : q.isCorrect 
                      ? 'border-l-4 border-l-emerald-500' 
                      : 'border-l-4 border-l-red-500'
              }`}>
                {/* Question Number and Status */}
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                      Soal Nomor {index + 1}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isEssay 
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    }`}>
                      {isEssay ? 'ESSAY' : 'PILIHAN GANDA'}
                    </span>
                  </div>
                  
                  {isUnanswered ? (
                    <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 px-2 py-0.5 rounded">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>TIDAK DIJAWAB</span>
                    </span>
                  ) : isEssay ? (
                    q.isManuallyGraded ? (
                      <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                        <span>SUDAH DINILAI (+{q.manualScore} Poin)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>MENUNGGU KOREKSI</span>
                      </span>
                    )
                  ) : q.isCorrect ? (
                    <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>BENAR (+1.0 Poin)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-semibold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      <span>SALAH (+0.0 Poin)</span>
                    </span>
                  )}
                </div>

                {/* Question Stem Text */}
                <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                  {q.questionTextSnapshot}
                </p>

                {/* RENDER TYPE 1: MULTIPLE CHOICE */}
                {!isEssay && (
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {options.map((opt) => {
                      const isSelected = q.selectedOption === opt.key;
                      const isCorrectAnswer = q.correctOptionSnapshot === opt.key;

                      let optionStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-200';
                      let statusIcon = null;

                      if (isSelected) {
                        if (q.isCorrect) {
                          optionStyle = 'bg-emerald-50 dark:bg-emerald-950/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold';
                          statusIcon = <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
                        } else {
                          optionStyle = 'bg-red-50 dark:bg-red-950/15 border-red-500 text-red-800 dark:text-red-350 font-semibold';
                          statusIcon = <X className="w-4 h-4 text-red-500 flex-shrink-0" />;
                        }
                      } else if (isCorrectAnswer) {
                        optionStyle = 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500/50 border-dashed text-emerald-800 dark:text-emerald-300';
                        statusIcon = <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 opacity-70" />;
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`flex items-center justify-between p-3.5 rounded-lg border text-xs transition-colors duration-200 ${optionStyle}`}
                        >
                          <div className="flex items-start space-x-3 pr-4">
                            <span className="font-mono font-bold bg-slate-100 dark:bg-[#030712] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px]">
                              {opt.key}
                            </span>
                            <span className="leading-relaxed">{opt.text}</span>
                          </div>
                          {statusIcon}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* RENDER TYPE 2: ESSAY ANSWER & GRADING CONTROLS */}
                {isEssay && (
                  <div className="space-y-4 pt-2">
                    <div className="bg-slate-50 dark:bg-[#030712] border border-slate-250 dark:border-slate-800/80 rounded-xl p-4">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 font-bold">Jawaban Kandidat:</span>
                      {isUnanswered ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">Kandidat mengosongkan / tidak mengisi soal essay ini.</p>
                      ) : (
                        <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">{q.essayAnswer}</p>
                      )}
                    </div>

                    {/* Grading Form / View */}
                    {attempt.status === 'submitted' ? (
                      <div className="bg-slate-100/50 dark:bg-[#0a0f1d] border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1 md:col-span-1">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Skor Poin (Maks. {q.pointValue})</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max={q.pointValue.toString()}
                            required
                            disabled={submitLoading}
                            value={grades[q.questionId]?.manualScore || '0.0'}
                            onChange={(e) => handleGradeChange(q.questionId, 'manualScore', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-[#030712] border border-slate-250 dark:border-slate-800 focus:border-violet-500 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Umpan Balik / Catatan Koreksi (Opsional)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="text"
                              placeholder="e.g. Pembahasan sudah tepat / Butuh elaborasi teori..."
                              disabled={submitLoading}
                              value={grades[q.questionId]?.essayFeedback || ''}
                              onChange={(e) => handleGradeChange(q.questionId, 'essayFeedback', e.target.value)}
                              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#030712] border border-slate-250 dark:border-slate-800 focus:border-violet-500 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      q.isManuallyGraded && (
                        <div className="bg-[#a78bfa]/5 dark:bg-purple-950/10 border border-purple-500/20 rounded-xl p-4 text-xs space-y-2">
                          <div className="flex justify-between font-semibold font-sans">
                            <span className="text-purple-600 dark:text-[#a78bfa]">Skor Penilaian Instruktur:</span>
                            <span className="font-mono text-slate-900 dark:text-white">{q.manualScore} / {q.pointValue} Poin</span>
                          </div>
                          {q.essayFeedback && (
                            <div className="text-slate-600 dark:text-slate-400 leading-normal font-sans pt-1 border-t border-purple-500/10 flex items-start space-x-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                              <span>Catatan: {q.essayFeedback}</span>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Explanation section (MC only) */}
                {!isEssay && q.explanationSnapshot && (
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-[#030712] border border-amber-250 dark:border-slate-800 rounded-lg text-xs space-y-1.5">
                    <span className="font-mono text-[10px] font-bold text-violet-600 dark:text-[#00d8f6] uppercase tracking-wider flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Pembahasan Soal</span>
                    </span>
                    <p className="text-slate-700 dark:text-slate-400 leading-relaxed font-sans whitespace-pre-wrap">
                      {q.explanationSnapshot}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Save Bar for Essay Grading */}
        {hasUngradedEssay && (
          <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg sticky bottom-4">
            <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>Harap simpan penilaian Anda sebelum meninggalkan halaman ini.</span>
            </div>
            <button
              type="submit"
              disabled={submitLoading}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-xl text-xs font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {submitLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
              <span>Simpan & Selesaikan Koreksi</span>
            </button>
          </div>
        )}
      </form>

    </div>
  );
}
