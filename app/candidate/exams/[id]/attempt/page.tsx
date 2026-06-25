'use strict';
'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle,
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Send,
  Cloud
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface Option {
  key: string;
  text: string;
}

interface Question {
  id: string;
  questionId: string;
  displayOrder: number;
  questionTextSnapshot: string;
  optionASnapshot: string;
  optionBSnapshot: string;
  optionCSnapshot: string;
  optionDSnapshot: string;
  optionESnapshot: string | null;
  selectedOption: string | null;
}

interface AttemptMetadata {
  id: string;
  examId: string;
  examTitle: string;
  endsAt: string;
  status: string;
}

export default function ExamAttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: examId } = use(params);

  // Core States
  const [attempt, setAttempt] = useState<AttemptMetadata | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Timer States
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [isUrgent, setIsUrgent] = useState(false);

  // Security States
  const [isMultiTabBlocked, setIsMultiTabBlocked] = useState(false);

  // 1. Double-Tab Detection via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel('spectra_exam_session');
    
    // Broadcast a handshake on mount
    channel.postMessage({ type: 'HANDSHAKE_REQUEST', examId });

    channel.onmessage = (event) => {
      if (event.data.examId === examId) {
        if (event.data.type === 'HANDSHAKE_REQUEST') {
          // Reply that we are already active
          channel.postMessage({ type: 'HANDSHAKE_RESPONSE', examId });
        } else if (event.data.type === 'HANDSHAKE_RESPONSE') {
          // We received a reply from another tab, block this new tab!
          setIsMultiTabBlocked(true);
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [examId]);

  // 2. Fetch or Initialize Attempt
  useEffect(() => {
    if (isMultiTabBlocked) return;

    const initializeExam = async () => {
      try {
        // Step A: Call start endpoint (returns active attempt ID or initializes a new one)
        const startRes = await fetch(`/api/candidate/exams/${examId}/start`, {
          method: 'POST',
        });
        const startData = await startRes.json();

        if (!startRes.ok) {
          throw new Error(startData.error || 'Gagal menginisialisasi ujian.');
        }

        const attemptId = startData.attemptId;

        // Step B: Fetch attempt questions and timer
        const attemptRes = await fetch(`/api/candidate/attempts/${attemptId}`);
        const attemptData = await attemptRes.json();

        if (!attemptRes.ok) {
          if (attemptData.status === 'expired') {
            // Already expired, redirect to result
            router.push(`/candidate/attempts/${attemptId}/result`);
            return;
          }
          throw new Error(attemptData.error || 'Gagal memuat lembar soal.');
        }

        setAttempt(attemptData.attempt);
        setQuestions(attemptData.questions);
        
        // Calculate remaining time in seconds
        const endsAt = new Date(attemptData.attempt.endsAt).getTime();
        const initialSeconds = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
        setTimeLeft(initialSeconds);
        setIsUrgent(initialSeconds < 300); // Less than 5 minutes (300s) is urgent

      } catch (err: any) {
        setError(err.message || 'Koneksi gagal saat memuat halaman ujian.');
      } finally {
        setLoading(false);
      }
    };

    initializeExam();
  }, [examId, router, isMultiTabBlocked]);

  // 3. Server-Authoritative Timer Countdown Loop
  useEffect(() => {
    if (!attempt || timeLeft <= 0 || isMultiTabBlocked) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const nextSecs = prev - 1;
        
        // Check urgency
        if (nextSecs < 300 && !isUrgent) {
          setIsUrgent(true);
        }

        // Trigger Auto-Submit when timer hits zero
        if (nextSecs <= 0) {
          clearInterval(interval);
          triggerAutoSubmit();
        }

        return nextSecs;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt, timeLeft, isUrgent, isMultiTabBlocked]);

  // 4. Trigger Server-Side Grading & Submission (Manual / Auto)
  const submitExamAttempt = async (isAuto = false) => {
    if (!attempt || submitLoading) return;
    setSubmitLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/candidate/attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSubmitted: isAuto }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to result screen
        router.push(`/candidate/attempts/${attempt.id}/result`);
        router.refresh();
      } else {
        setError(data.error || 'Gagal mengirimkan ujian. Silakan coba kembali.');
        setSubmitLoading(false);
      }
    } catch (e) {
      setError('Terjadi kesalahan jaringan saat mengirimkan lembar ujian.');
      setSubmitLoading(false);
    }
  };

  const triggerAutoSubmit = () => {
    submitExamAttempt(true);
  };

  // 5. Interactive Micro-Save (Auto-save on option click)
  const handleOptionSelect = async (questionId: string, optionKey: string) => {
    if (!attempt || submitLoading) return;

    // A. Optimistic UI Update in state
    const updatedQuestions = questions.map((q) => {
      if (q.questionId === questionId) {
        return { ...q, selectedOption: optionKey };
      }
      return q;
    });
    setQuestions(updatedQuestions);
    setSaving(true);

    try {
      // B. Background API request
      const res = await fetch(`/api/candidate/attempts/${attempt.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, selectedOption: optionKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.expired) {
          // If server reports time expired, immediately lock inputs and trigger submit
          triggerAutoSubmit();
        } else {
          console.error(data.error);
        }
      }
    } catch (e) {
      console.error('Autosave network error');
    } finally {
      setSaving(false);
    }
  };

  // Formatter for timer (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Loader
  if (loading) {
    return (
      <main className="min-h-screen bg-[#030712] text-slate-200 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#00d8f6] animate-spin" />
        <p className="text-xs text-slate-500 font-mono mt-3">Mempersiapkan lembar soal ujian...</p>
      </main>
    );
  }

  // Render Multi-tab Blocking Overlay
  if (isMultiTabBlocked) {
    return (
      <main className="min-h-screen bg-[#030712] text-slate-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#0b0f19] border border-red-500/30 rounded-2xl p-8 max-w-md space-y-5 shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500"></div>
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="font-sans font-bold text-lg text-white">Sesi Ganda Terdeteksi</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sesi pengerjaan ujian aktif terdeteksi di jendela browser lain. SPECTRA membatasi pengerjaan hanya pada satu jendela aktif guna menjaga integritas ujian.
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            Harap kembali ke jendela pengerjaan awal Anda.
          </p>
        </div>
      </main>
    );
  }

  if (error && !attempt) {
    return (
      <main className="min-h-screen bg-[#030712] text-slate-200 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-6 max-w-md space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="font-sans font-semibold text-base text-white">Terjadi Kesalahan</h3>
          <p className="text-xs text-slate-400">{error}</p>
          <Link href="/candidate" className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs hover:bg-slate-800 transition-all inline-block text-white">
            Kembali ke Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!attempt) return null;

  const currentQuestion = questions[currentIdx];
  
  // Format options snapshot for iteration
  const activeOptions: Option[] = [
    { key: 'A', text: currentQuestion.optionASnapshot },
    { key: 'B', text: currentQuestion.optionBSnapshot },
    { key: 'C', text: currentQuestion.optionCSnapshot },
    { key: 'D', text: currentQuestion.optionDSnapshot },
  ];
  if (currentQuestion.optionESnapshot) {
    activeOptions.push({ key: 'E', text: currentQuestion.optionESnapshot });
  }

  const answeredCount = questions.filter((q) => q.selectedOption !== null).length;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 flex flex-col justify-between font-sans">
      
      {/* 1. STICKY TIMER HEADER BAR (Dynamic States) */}
      <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors duration-500 flex items-center justify-between py-3.5 px-6 md:px-12 ${
        isUrgent 
          ? 'bg-red-950/40 border-red-500/30' 
          : 'bg-[#0b0f19]/80 border-slate-800'
      }`}>
        <div className="flex items-center space-x-3">
          <img src="/spectra_logo.png" alt="SPECTRA Logo" className="w-5 h-5 object-contain opacity-85" />
          <span className={`font-sans text-[10px] font-bold uppercase tracking-wider ${isUrgent ? 'text-red-400' : 'text-slate-400'}`}>
            {isUrgent ? 'WAKTU HAMPIR HABIS' : `Kandidat: ${attempt.examTitle.slice(0, 20)}...`}
          </span>
          <span className={isUrgent ? 'text-red-900/40' : 'text-slate-700'}>|</span>
          <span className="font-sans text-xs text-slate-400 hidden sm:inline">
            Progres: {answeredCount} dari {questions.length} Soal Dijawab
          </span>
        </div>

        {/* Actions & Timer Box */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
          {/* Timer Box */}
          <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg border transition-all ${
            isUrgent 
              ? 'bg-red-500/10 border-red-500/40 animate-pulse text-red-400' 
              : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-cyan-400'}`} />
            <span className="font-mono text-sm font-bold tracking-widest tabular-nums">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN EXAM ENGINE WORKSPACE */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Question Grid Navigator (1/4 width) */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg h-fit space-y-4 lg:sticky lg:top-24">
          <h4 className="font-sans font-semibold text-xs text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Navigasi Soal
          </h4>
          <div className="grid grid-cols-5 gap-2.5">
            {questions.map((q, index) => {
              const isCurrent = index === currentIdx;
              const isAnswered = q.selectedOption !== null;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(index)}
                  disabled={submitLoading}
                  className={`h-9 font-mono text-xs font-bold rounded-lg border flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-violet-600 to-cyan-500 border-transparent text-white shadow-lg'
                      : isAnswered
                        ? 'bg-emerald-50/10 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Question Stem & Shuffled Options (3/4 width) */}
        <div className="lg:col-span-3 space-y-6 flex flex-col justify-between min-h-[400px]">
          
          {/* Question stem */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 shadow-md space-y-6 relative overflow-hidden">
            {/* Display index */}
            <div className="flex items-center space-x-2 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
              <span>Pertanyaan</span>
              <span className="font-bold text-[#00d8f6]">#{currentIdx + 1} dari {questions.length}</span>
            </div>

            <h3 className="font-sans text-sm md:text-base font-medium text-white leading-relaxed whitespace-pre-line">
              {currentQuestion.questionTextSnapshot}
            </h3>

            {/* Options */}
            <div className="space-y-3.5 pt-2">
              {activeOptions.map((opt) => {
                const isChecked = currentQuestion.selectedOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleOptionSelect(currentQuestion.questionId, opt.key)}
                    disabled={submitLoading}
                    className={`w-full text-left px-5 py-3 rounded-xl border flex items-start space-x-3.5 transition-all focus:outline-none ${
                      isChecked
                        ? 'bg-violet-50 dark:bg-violet-950/20 border-violet-500 dark:border-[#00d8f6]/50 text-violet-700 dark:text-[#00d8f6] font-medium'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className={`font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${
                      isChecked
                        ? 'bg-violet-600 dark:bg-[#00d8f6] border-violet-600 dark:border-[#00d8f6] text-white dark:text-[#030712] font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="text-xs md:text-sm leading-relaxed pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800/40">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0 || submitLoading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-300 rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={submitLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 rounded-lg flex items-center space-x-1.5 transition-colors"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={submitLoading}
                className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none disabled:opacity-50 shadow-lg"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
                <div className="relative px-5 py-2 bg-[#0b0f19] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center justify-center space-x-2">
                  <Send className="w-3.5 h-3.5 text-white" />
                  <span className="font-sans text-xs font-semibold text-white tracking-wide">
                    Selesaikan Ujian
                  </span>
                </div>
              </button>
            )}
          </div>

        </div>
      </main>

      {/* 3. FOOTER MICRO-STATUS INDICATOR */}
      <footer className="h-10 border-t border-slate-950 bg-[#060a13] px-6 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>SPECTRA Assessment Engine</span>
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <Cloud className="w-3.5 h-3.5" />
          <span className="text-slate-500">{saving ? 'Sedang menyimpan...' : 'Jawaban tersimpan di Cloud'}</span>
        </div>
      </footer>

      {/* 4. MANUAL SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl">
            {/* Top color strip */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 to-cyan-500"></div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-[#00d8f6]/10 text-[#00d8f6] rounded-full flex items-center justify-center mx-auto border border-[#00d8f6]/20">
                  <Send className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-bold text-base text-white">Kumpulkan Lembar Jawaban?</h3>
                
                <div className="bg-[#030712] border border-slate-800 rounded-lg p-3 text-xs text-slate-400 space-y-1 text-left font-sans">
                  <p className="flex justify-between">
                    <span>Total Pertanyaan:</span>
                    <span className="font-mono text-white font-bold">{questions.length} Soal</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Soal Dijawab:</span>
                    <span className="font-mono text-emerald-400 font-bold">{answeredCount} Soal</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Belum Dijawab:</span>
                    <span className={`font-mono font-bold ${questions.length - answeredCount > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {questions.length - answeredCount} Soal
                    </span>
                  </p>
                </div>
                
                <p className="text-xs text-slate-500 leading-normal font-sans pt-2">
                  Setelah menekan tombol kirim, lembar pengerjaan Anda akan dikunci dan dinilai secara otomatis. Anda tidak dapat mengubah jawaban kembali.
                </p>
              </div>

              {error && (
                <div className="p-2.5 bg-red-950/40 border border-red-500/20 rounded text-red-300 text-[11px]">
                  {error}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/60 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitLoading}
                  className="px-4 py-2 rounded-lg font-sans text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => submitExamAttempt(false)}
                  disabled={submitLoading}
                  className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none disabled:opacity-50"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <div className="relative px-5 py-2.5 bg-[#0b0f19] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center space-x-2">
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                        <span className="font-sans text-xs font-medium text-white tracking-wide">
                          Mengirim...
                        </span>
                      </>
                    ) : (
                      <span className="font-sans text-xs font-medium text-white tracking-wide">
                        Kumpulkan Sekarang
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
