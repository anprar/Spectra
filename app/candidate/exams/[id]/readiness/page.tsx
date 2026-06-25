'use strict';
'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Award, 
  Clock, 
  HelpCircle, 
  CheckSquare, 
  AlertOctagon, 
  Loader2, 
  Play,
  ShieldCheck
} from 'lucide-react';

interface ExamMetadata {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  questionCount: number;
  passScore: number;
  availableFrom: string;
  availableUntil: string;
}

export default function ExamReadinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [exam, setExam] = useState<ExamMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [error, setError] = useState('');
  const [scheduleState, setScheduleState] = useState<'upcoming' | 'active' | 'expired'>('active');

  // Client-side dynamic schedule state validator
  useEffect(() => {
    if (!exam) return;

    const checkSchedule = () => {
      const now = new Date();
      const from = new Date(exam.availableFrom);
      const until = new Date(exam.availableUntil);

      if (now < from) {
        setScheduleState('upcoming');
      } else if (now > until) {
        setScheduleState('expired');
      } else {
        setScheduleState('active');
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 2000);
    return () => clearInterval(interval);
  }, [exam]);

  useEffect(() => {
    const fetchExamMetadata = async () => {
      try {
        const res = await fetch(`/api/candidate/exams/${id}`);
        if (res.ok) {
          const data = await res.json();
          setExam(data.exam);
        } else {
          router.push('/candidate');
        }
      } catch (e) {
        console.error('Failed to load exam details');
      } finally {
        setLoading(false);
      }
    };
    fetchExamMetadata();
  }, [id, router]);

  const handleStartExam = async () => {
    if (!accepted || startLoading) return;
    setStartLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/candidate/exams/${id}/start`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to the exam attempt room!
        router.push(`/candidate/exams/${id}/attempt`);
        router.refresh();
      } else {
        setError(data.error || 'Gagal memulai ujian.');
        setStartLoading(false);
      }
    } catch (e) {
      setError('Terjadi kesalahan koneksi saat memulai ujian.');
      setStartLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#030712] text-slate-200 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#00d8f6] animate-spin" />
        <p className="text-xs text-slate-500 font-mono mt-3">Mempersiapkan detail ujian...</p>
      </main>
    );
  }

  if (!exam) return null;

  return (
    <main className="min-h-screen bg-[#030712] text-slate-200 p-6 md:p-12 flex flex-col justify-center items-center relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl z-10 space-y-6">
        {/* Back Link */}
        <Link 
          href="/candidate" 
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-[#00d8f6] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard</span>
        </Link>

        {/* Exam Title Card */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          {/* Glowing accent border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#7c3aed] via-[#00d8f6] to-[#7c3aed]"></div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-pink-500">
              <Award className="w-6 h-6" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
                Ujian Bertimer Otoritatif
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
              Kesiapan Ujian: {exam.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              {exam.description || 'Tidak ada deskripsi tambahan untuk ujian ini.'}
            </p>
          </div>

          {/* Parameters grid */}
          <div className="grid grid-cols-3 gap-4 text-center mt-6 p-4 bg-[#030712] rounded-xl border border-slate-800/60">
            <div>
              <p className="text-[10px] text-slate-500 font-sans">Durasi Waktu</p>
              <p className="text-sm font-mono font-bold text-white mt-1 flex items-center justify-center">
                <Clock className="w-4 h-4 text-pink-500 mr-1 flex-shrink-0" />
                <span>{exam.durationMinutes} Menit</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-sans">Jumlah Soal</p>
              <p className="text-sm font-mono font-bold text-white mt-1 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-[#00d8f6] mr-1 flex-shrink-0" />
                <span>{exam.questionCount} Soal</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-sans">Passing Grade</p>
              <p className="text-sm font-mono font-bold text-emerald-400 mt-1 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1 flex-shrink-0" />
                <span>{exam.passScore}%</span>
              </p>
            </div>
          </div>
        </div>

        {/* Rules Card */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
          <h2 className="font-sans font-bold text-base text-white flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-amber-500" />
            <span>Tata Tertib & Kebijakan Integritas Ujian</span>
          </h2>

          <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed pl-2">
            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 font-mono text-[10px] flex items-center justify-center flex-shrink-0">1</span>
              <p><strong className="text-white">Timer Tidak Dapat Dipause:</strong> Begitu tombol "Mulai" ditekan, timer berjalan absolut di server. Menutup browser, menyegarkan halaman, atau mati listrik <span className="font-semibold text-[#00d8f6]">tidak akan menghentikan waktu</span>.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 font-mono text-[10px] flex items-center justify-center flex-shrink-0">2</span>
              <p><strong className="text-white">Proteksi Sesi Jendela Ganda:</strong> Dilarang keras membuka halaman ujian di dua tab browser secara bersamaan. Sesi pengerjaan Anda akan terkunci secara otomatis jika pelanggaran terdeteksi.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 font-mono text-[10px] flex items-center justify-center flex-shrink-0">3</span>
              <p><strong className="text-white">Penyimpanan Otomatis (Autosave):</strong> Setiap jawaban pilihan ganda Anda akan langsung terkirim dan disimpan di cloud server seketika setelah diklik. Anda tidak perlu khawatir kehilangan data jika jaringan tidak stabil.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 font-mono text-[10px] flex items-center justify-center flex-shrink-0">4</span>
              <p><strong className="text-white">Auto-Submit Waktu Habis:</strong> Ketika waktu pengerjaan server mencapai <code className="bg-slate-900 px-1.5 py-0.5 rounded text-[#00d8f6] font-mono text-[11px]">00:00</code>, sistem secara otomatis mengunci seluruh form jawaban dan mengirimkan pengerjaan Anda apa adanya.</p>
            </div>
          </div>

          {/* Schedule warning messages */}
          {scheduleState === 'upcoming' && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-500/20 rounded-lg text-amber-300 text-xs font-sans">
              <strong>Ujian Belum Dibuka:</strong> Sesi penjadwalan ujian belum dimulai. Ujian baru akan dibuka pada: <span className="font-mono font-bold text-white">{new Date(exam.availableFrom).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>.
            </div>
          )}

          {scheduleState === 'expired' && (
            <div className="p-3.5 bg-red-950/40 border border-red-500/20 rounded-lg text-red-300 text-xs font-sans">
              <strong>Ujian Sudah Selesai:</strong> Batas akhir jadwal akses ujian telah terlewati (Selesai pada: <span className="font-mono font-bold text-white">{new Date(exam.availableUntil).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>). Anda tidak dapat lagi memulai pengerjaan.
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300 text-xs animate-pulse-subtle">
              {error}
            </div>
          )}

          {/* Acceptance and Button */}
          <div className="border-t border-slate-800/60 pt-6 space-y-4">
            <label className={`flex items-start space-x-3 text-xs leading-normal select-none ${scheduleState === 'active' ? 'cursor-pointer text-slate-300' : 'cursor-not-allowed text-slate-600'}`}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                disabled={startLoading || scheduleState !== 'active'}
                className="mt-0.5 rounded border-slate-800 bg-slate-900 text-pink-500 focus:ring-pink-500/50 disabled:opacity-30"
              />
              <span>Saya menyatakan paham dengan tata tertib ujian di atas dan menyatakan siap menempuh ujian secara jujur dan objektif.</span>
            </label>

            <button
              onClick={handleStartExam}
              disabled={!accepted || startLoading || scheduleState !== 'active'}
              className="w-full relative group overflow-hidden rounded-lg p-[1px] focus:outline-none disabled:opacity-40"
            >
              {/* Talent spectrum gradient border */}
              {scheduleState === 'active' ? (
                <span className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#00d8f6] rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
              ) : (
                <span className="absolute inset-0 bg-slate-800 rounded-lg"></span>
              )}
              
              <div className="relative px-6 py-3 bg-[#0b0f19] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center justify-center space-x-2">
                {startLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span className="font-sans text-sm font-semibold text-white tracking-wide">
                      Mempersiapkan Lembar Ujian...
                    </span>
                  </>
                ) : scheduleState === 'upcoming' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-sans text-sm font-semibold text-slate-500 tracking-wide">
                      Menunggu Jadwal Dibuka
                    </span>
                  </>
                ) : scheduleState === 'expired' ? (
                  <>
                    <AlertOctagon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-sans text-sm font-semibold text-slate-500 tracking-wide">
                      Jadwal Akses Berakhir
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                    <span className="font-sans text-sm font-semibold text-white tracking-wide">
                      Mulai Ujian Sekarang
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
