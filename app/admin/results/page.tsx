'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Download
} from 'lucide-react';

interface Attempt {
  id: string;
  examId: string;
  candidateId: string;
  status: string;
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
}

export default function ResultsOverviewPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [passedFilter, setPassedFilter] = useState(''); // '', 'true', 'false'
  const [error, setError] = useState<string | null>(null);

  // Fetch attempts
  const fetchAttempts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/results?query=${encodeURIComponent(searchQuery)}&passed=${passedFilter}`);
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Gagal mengambil laporan hasil ujian.');
      }
    } catch (e) {
      setError('Koneksi internet bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attempts on filter change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAttempts();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, passedFilter]);

  return (
    <div className="space-y-8 font-sans text-slate-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <Award className="w-8 h-8 text-violet-500 dark:text-[#00d8f6]" />
            <span>Rekap Hasil Evaluasi Ujian</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau lembar hasil ujian kompetensi, persentase nilai kelulusan, dan audit jawaban kandidat secara detail.
          </p>
        </div>
        
        {/* CSV Export Button (Using the instructor's secure CSV exporter API!) */}
        <a
          href="/api/instructor/reports/export"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white dark:bg-[#0b0f19] hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-[#00d8f6] rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
          title="Unduh Seluruh Hasil Ujian sebagai CSV yang aman dari Formula Injection"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Hasil Laporan (CSV)</span>
        </a>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-red-700 dark:text-red-300 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-md">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari nama kandidat, email, atau judul ujian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#030712] border border-slate-200 dark:border-slate-800 focus:border-violet-400 dark:focus:border-[#00d8f6] rounded-lg text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={passedFilter}
            onChange={(e) => setPassedFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#030712] border border-slate-200 dark:border-slate-800 focus:border-violet-400 dark:focus:border-[#00d8f6] rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none transition-colors"
          >
            <option value="">Semua Status Kelulusan</option>
            <option value="true">Lulus Evaluasi</option>
            <option value="false">Tidak Lulus</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40">
                <th className="py-3 px-4">Kandidat</th>
                <th className="py-3 px-4">Ujian & Kriteria</th>
                <th className="py-3 px-4 text-center">Skor Poin</th>
                <th className="py-3 px-4 text-center">Persentase</th>
                <th className="py-3 px-4 text-center">Status Kelulusan</th>
                <th className="py-3 px-4 text-center">Tanggal Pengerjaan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#00d8f6]" />
                      <span>Memuat hasil evaluasi...</span>
                    </div>
                  </td>
                </tr>
              ) : attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                    Belum ada riwayat lembar ujian kandidat yang diajukan.
                  </td>
                </tr>
              ) : (
                attempts.map((attempt) => {
                  const isSubmitted = attempt.status === 'submitted';
                  return (
                    <tr key={attempt.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-white">{attempt.candidate.fullName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{attempt.candidate.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-white max-w-xs truncate">{attempt.exam.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Prasyarat Passing: {attempt.exam.passScore}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {isSubmitted ? `${attempt.score} / ${attempt.maxScore}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                        {isSubmitted ? `${attempt.percentage}%` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {!isSubmitted ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" />
                            <span>Sedang Berjalan</span>
                          </span>
                        ) : attempt.passed ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>LULUS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span>TIDAK LULUS</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                        {new Date(attempt.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isSubmitted ? (
                          <Link
                            href={`/admin/results/${attempt.id}`}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#030712] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition-colors"
                          >
                            <span>Detail</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-slate-600 font-mono text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
