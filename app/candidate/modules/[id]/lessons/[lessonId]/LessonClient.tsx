'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  FileText, 
  Video, 
  Link2,
  Check
} from 'lucide-react';

interface LessonData {
  id: string;
  title: string;
  contentType: string;
  contentBody: string | null;
  filePath: string | null;
  externalUrl: string | null;
  sortOrder: number;
}

interface LessonClientProps {
  moduleId: string;
  moduleTitle: string;
  lesson: LessonData;
  initialCompleted: boolean;
  prevLessonId: string | null;
  nextLessonId: string | null;
}

export default function LessonClient({
  moduleId,
  moduleTitle,
  lesson,
  initialCompleted,
  prevLessonId,
  nextLessonId,
}: LessonClientProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  // Handle Mark as Complete
  const handleMarkComplete = async () => {
    if (completed) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/candidate/lessons/${lesson.id}/complete`, {
        method: 'POST',
      });

      if (res.ok) {
        setCompleted(true);
        router.refresh(); // Refresh layout statistics
      } else {
        alert('Gagal menandai selesai. Silakan coba kembali.');
      }
    } catch (e) {
      alert('Koneksi bermasalah saat memproses penyelesaian materi.');
    } finally {
      setLoading(false);
    }
  };

  // Custom lightweight markdown renderer
  const renderContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-bold text-white mt-6 mb-3 border-b border-slate-800/80 pb-2">
            {trimmed.slice(3)}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-semibold text-[#00d8f6] mt-4 mb-2">
            {trimmed.slice(4)}
          </h3>
        );
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="list-disc ml-5 text-xs text-slate-300 mb-1.5 leading-relaxed">
            {trimmed.slice(2)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={idx} className="list-decimal ml-5 text-xs text-slate-300 mb-1.5 leading-relaxed">
            {trimmed.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-3"></div>;
      }
      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed mb-3">
          {line}
        </p>
      );
    });
  };

  let TypeIcon = FileText;
  if (lesson.contentType === 'video') TypeIcon = Video;
  if (lesson.contentType === 'link') TypeIcon = Link2;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-6 md:p-12 max-w-3xl mx-auto w-full flex flex-col justify-between font-sans">
      
      {/* Top Header Section */}
      <div className="space-y-6">
        <Link 
          href={`/candidate/modules/${moduleId}`} 
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-[#00d8f6] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Pelajaran ({moduleTitle})</span>
        </Link>

        {/* Title Block */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg flex items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center space-x-2 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
              <TypeIcon className="w-3.5 h-3.5" />
              <span>Materi {lesson.contentType}</span>
            </div>
            <h1 className="text-base md:text-lg font-bold text-white truncate leading-tight">
              {lesson.title}
            </h1>
          </div>
          {completed && (
            <span className="inline-flex items-center space-x-1 font-mono text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider flex-shrink-0">
              <Check className="w-3 h-3" />
              <span>Selesai</span>
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl min-h-[300px]">
          {lesson.contentBody ? (
            <div className="prose prose-invert max-w-none">
              {renderContent(lesson.contentBody)}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-xs text-slate-500 italic">
              Tidak ada teks pembelajaran tertulis.
            </div>
          )}

          {/* External links / videos integrations */}
          {lesson.contentType === 'link' && lesson.externalUrl && (
            <div className="mt-8 p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white block mb-0.5">Tautan Referensi Eksternal</span>
                <p className="text-slate-500 max-w-[400px] truncate">{lesson.externalUrl}</p>
              </div>
              <a 
                href={lesson.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#00d8f6]/10 hover:bg-[#00d8f6]/20 border border-[#00d8f6]/30 text-[#00d8f6] font-semibold rounded-lg transition-colors"
              >
                Buka Tautan &rarr;
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation & Mark Complete Block */}
      <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Prev/Next buttons */}
        <div className="flex items-center space-x-3 order-2 sm:order-1">
          {prevLessonId ? (
            <Link
              href={`/candidate/modules/${moduleId}/lessons/${prevLessonId}`}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-855 text-xs font-semibold text-slate-300 rounded-lg flex items-center space-x-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </Link>
          ) : (
            <div className="px-4 py-2 bg-transparent border border-transparent text-xs text-slate-700 select-none flex items-center space-x-1">
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </div>
          )}

          {nextLessonId ? (
            <Link
              href={`/candidate/modules/${moduleId}/lessons/${nextLessonId}`}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-855 text-xs font-semibold text-slate-300 rounded-lg flex items-center space-x-1 transition-colors"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/candidate"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-855 text-xs font-semibold text-emerald-400 rounded-lg flex items-center space-x-1 transition-colors animate-pulse-subtle"
            >
              <span>Kembali ke Ujian</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Mark as Complete button */}
        <div className="order-1 sm:order-2">
          {completed ? (
            <div className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold flex items-center space-x-2 w-full sm:w-fit justify-center">
              <Check className="w-4 h-4" />
              <span>Materi Telah Selesai Pelajari</span>
            </div>
          ) : (
            <button
              onClick={handleMarkComplete}
              disabled={loading}
              className="w-full sm:w-fit relative group overflow-hidden rounded-lg p-[1px] focus:outline-none disabled:opacity-50"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
              <div className="relative px-6 py-2.5 bg-[#030712] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span className="font-sans text-xs font-medium text-white tracking-wide">
                      Memproses...
                    </span>
                  </>
                ) : (
                  <span className="font-sans text-xs font-semibold text-white tracking-wide">
                    Tandai Selesai & Lanjutkan
                  </span>
                )}
              </div>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
