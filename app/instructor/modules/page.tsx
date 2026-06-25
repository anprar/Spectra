'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Link2,
  CheckCircle2, 
  Edit,
  Trash2,
  Plus,
  Search,
  Loader2,
  X,
  Sparkles,
  ArrowUp,
  ArrowDown,
  FilePlus2
} from 'lucide-react';

interface Lesson {
  id?: string;
  title: string;
  contentType: string; // text, pdf, video, link
  contentBody: string | null;
  externalUrl: string | null;
  isRequired: boolean;
  sortOrder: number;
}

interface Module {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: string; // draft, published
  createdAt: string;
  lessons: Lesson[];
  createdBy: {
    fullName: string;
    email: string;
  };
}

export default function InstructorModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Module Modal States
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [modTitle, setModTitle] = useState('');
  const [modSummary, setModSummary] = useState('');
  const [modStatus, setModStatus] = useState('draft');
  const [modLessons, setModLessons] = useState<Lesson[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Lesson Inner Form States (inside Module Edit)
  const [activeLessonIndex, setActiveLessonIndex] = useState<number | null>(null); // null means adding a new lesson
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [lesTitle, setLesTitle] = useState('');
  const [lesContentType, setLesContentType] = useState('text');
  const [lesContentBody, setLesContentBody] = useState('');
  const [lesExternalUrl, setLesExternalUrl] = useState('');
  const [lesIsRequired, setLesIsRequired] = useState(true);

  const fetchModules = async () => {
    try {
      const res = await fetch('/api/instructor/modules');
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules);
      }
    } catch (e) {
      console.error('Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const openCreateModal = () => {
    setEditingModule(null);
    setModTitle('');
    setModSummary('');
    setModStatus('draft');
    setModLessons([]);
    setFormError('');
    setModuleModalOpen(true);
  };

  const openEditModal = (mod: Module) => {
    setEditingModule(mod);
    setModTitle(mod.title);
    setModSummary(mod.summary);
    setModStatus(mod.status);
    setModLessons(mod.lessons || []);
    setFormError('');
    setModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitLoading(true);

    const payload = {
      title: modTitle,
      summary: modSummary,
      status: modStatus,
      lessons: modLessons
    };

    try {
      const url = editingModule 
        ? `/api/instructor/modules/${editingModule.id}`
        : '/api/instructor/modules';
      const method = editingModule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan modul.');
      }

      await fetchModules();
      setModuleModalOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteModule = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus modul "${title}"?\nSemua materi pelajaran di dalamnya akan ikut terhapus.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/instructor/modules/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus modul.');
      }

      await fetchModules();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Lesson CRUD handlers inside module modal
  const handleOpenLessonForm = (index: number | null) => {
    setActiveLessonIndex(index);
    if (index !== null) {
      // Edit mode
      const les = modLessons[index];
      setLesTitle(les.title);
      setLesContentType(les.contentType);
      setLesContentBody(les.contentBody || '');
      setLesExternalUrl(les.externalUrl || '');
      setLesIsRequired(les.isRequired);
    } else {
      // Add mode
      setLesTitle('');
      setLesContentType('text');
      setLesContentBody('');
      setLesExternalUrl('');
      setLesIsRequired(true);
    }
    setLessonFormOpen(true);
  };

  const handleSaveLesson = () => {
    if (!lesTitle) {
      alert('Judul pelajaran wajib diisi.');
      return;
    }

    const newLesson: Lesson = {
      title: lesTitle,
      contentType: lesContentType,
      contentBody: lesContentType === 'text' ? lesContentBody : null,
      externalUrl: lesContentType !== 'text' ? lesExternalUrl : null,
      isRequired: lesIsRequired,
      sortOrder: activeLessonIndex !== null ? modLessons[activeLessonIndex].sortOrder : modLessons.length + 1
    };

    if (activeLessonIndex !== null) {
      // Preserve ID if it exists (for update)
      const original = modLessons[activeLessonIndex];
      newLesson.id = original.id;
      
      const updated = [...modLessons];
      updated[activeLessonIndex] = newLesson;
      setModLessons(updated);
    } else {
      setModLessons([...modLessons, newLesson]);
    }
    setLessonFormOpen(false);
  };

  const handleDeleteLesson = (index: number) => {
    if (!confirm('Hapus pelajaran ini dari modul?')) return;
    const updated = modLessons.filter((_, i) => i !== index);
    setModLessons(updated);
  };

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === modLessons.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...modLessons];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setModLessons(updated);
  };

  const filteredModules = modules.filter((mod) =>
    mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mod.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans text-slate-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <span>Kelola Modul Pembelajaran</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Buat materi kurikulum, susunan pelajaran (LMS), dan penugasan materi prasyarat kandidat secara interaktif.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none self-start sm:self-auto"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
          <div className="relative px-5 py-2.5 bg-[#030712] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center space-x-2">
            <Plus className="w-4 h-4 text-white" />
            <span className="font-sans text-xs font-semibold text-white tracking-wide">
              Tambah Modul Belajar
            </span>
          </div>
        </button>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex items-start gap-4 shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 to-cyan-500"></div>
        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 mt-1 flex-shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse-subtle" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white">Tata Tertib Pengelolaan Kurikulum & LMS</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Penyusunan modul pelatihan wajib dilakukan secara objektif. Anda dapat merancang kurikulum, merinci isi pelajaran (baik berupa teks/markdown, berkas PDF, maupun tautan video), dan mengatur status wajib untuk membuka gembok ujian kompetensi kandidat.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Cari modul pembelajaran..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#0b0f19] border border-slate-800/80 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600"
        />
      </div>

      {/* Modules List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Memuat kurikulum pembelajaran...</p>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="bg-[#0b0f19]/30 border border-slate-800/50 rounded-xl p-12 text-center max-w-2xl mx-auto space-y-4 shadow-xl">
          <BookOpen className="w-12 h-12 text-slate-700 mx-auto" />
          <h3 className="font-sans font-semibold text-base text-white">Tidak Ada Modul</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery 
              ? `Hasil pencarian untuk "${searchQuery}" tidak ditemukan. Silakan gunakan kata kunci lain.` 
              : 'Belum ada modul pelatihan terdaftar. Silakan klik tombol "Tambah Modul Belajar" untuk memulai.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredModules.map((mod) => (
            <div key={mod.id} className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors group">
              <div className="space-y-4">
                
                {/* Status and Title */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className={`inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                      mod.status === 'published' 
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {mod.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <h3 className="text-base md:text-lg font-bold text-white tracking-tight mt-1.5 leading-snug">
                      {mod.title}
                    </h3>
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs font-mono font-bold flex-shrink-0">
                    {mod.lessons.length} Pelajaran
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-400 leading-relaxed">
                  {mod.summary}
                </p>

                {/* Lessons Bullet Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Materi Pokok:</span>
                  {mod.lessons.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">Belum ada pelajaran ditambahkan.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {mod.lessons.map((lesson, idx) => {
                        let Icon = FileText;
                        if (lesson.contentType === 'video') Icon = Video;
                        if (lesson.contentType === 'link') Icon = Link2;

                        return (
                          <div key={lesson.id || idx} className="flex items-center justify-between text-xs bg-[#030712] border border-slate-900 rounded-lg p-2 font-sans">
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

              {/* Card Footer Actions */}
              <div className="mt-6 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-[10px] text-slate-500 font-mono">
                  <span>Oleh: {mod.createdBy.fullName}</span>
                </div>
                <div className="flex items-center space-x-2.5 self-end">
                  <button
                    onClick={() => openEditModal(mod)}
                    className="p-2 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                    title="Edit Modul & Pelajaran"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(mod.id, mod.title)}
                    className="p-2 bg-red-950/10 border border-red-900/20 hover:border-red-600/40 text-red-400 hover:text-red-300 rounded-lg transition-colors flex items-center justify-center"
                    title="Hapus Modul"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Main Module Modal (Create / Edit) */}
      {moduleModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden relative shadow-2xl my-8">
            {/* Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 to-cyan-500"></div>

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-[#00d8f6]">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-sans font-bold text-base text-white">
                  {editingModule ? 'Edit Modul Pembelajaran Wajib' : 'Buat Modul Pembelajaran Baru'}
                </h3>
              </div>
              <button
                onClick={() => setModuleModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveModule} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-lg text-red-300 text-xs font-sans">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Nama Modul <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Orientasi Budaya & Etos Kerja Perusahaan"
                    value={modTitle}
                    onChange={(e) => setModTitle(e.target.value)}
                    disabled={submitLoading}
                    className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Status Modul
                  </label>
                  <select
                    value={modStatus}
                    onChange={(e) => setModStatus(e.target.value)}
                    disabled={submitLoading}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors"
                  >
                    <option value="draft">Draft (Pemeliharaan)</option>
                    <option value="published">Published (Aktif di Kandidat)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">
                  Ringkasan Modul <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  placeholder="Jelaskan secara ringkas materi kurikulum yang dibahas di dalam modul ini..."
                  value={modSummary}
                  onChange={(e) => setModSummary(e.target.value)}
                  disabled={submitLoading}
                  rows={3}
                  className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600 resize-none"
                />
              </div>

              {/* Lesson Manager Sub-Section */}
              <div className="space-y-3 pt-4 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#00d8f6] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Daftar Pelajaran ({modLessons.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenLessonForm(null)}
                    disabled={submitLoading}
                    className="px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/30 border border-blue-500/25 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Pelajaran</span>
                  </button>
                </div>

                {modLessons.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-600 text-xs font-sans">
                    Belum ada pelajaran terdaftar. Klik "Tambah Pelajaran" untuk merancang konten modul.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {modLessons.map((les, index) => {
                      let Icon = FileText;
                      if (les.contentType === 'video') Icon = Video;
                      if (les.contentType === 'link') Icon = Link2;

                      return (
                        <div 
                          key={index} 
                          className="flex items-center justify-between bg-slate-950/40 border border-slate-850 rounded-xl p-3 gap-4"
                        >
                          {/* Content summary */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 flex-shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 truncate leading-tight">
                                {index + 1}. {les.title}
                              </p>
                              <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5 tracking-wider">
                                Type: {les.contentType} {les.isRequired && '• Wajib'}
                              </p>
                            </div>
                          </div>

                          {/* Reordering & Actions */}
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => moveLesson(index, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-slate-900 text-slate-500 hover:text-white rounded disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                              title="Pindahkan ke atas"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveLesson(index, 'down')}
                              disabled={index === modLessons.length - 1}
                              className="p-1 hover:bg-slate-900 text-slate-500 hover:text-white rounded disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                              title="Pindahkan ke bawah"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-[1px] h-4 bg-slate-850 mx-1"></span>
                            <button
                              type="button"
                              onClick={() => handleOpenLessonForm(index)}
                              className="p-1 hover:bg-slate-900 text-blue-400 hover:text-blue-300 rounded transition-colors"
                              title="Edit Konten"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLesson(index)}
                              className="p-1 hover:bg-slate-900 text-red-400 hover:text-red-300 rounded transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Main Actions */}
              <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setModuleModalOpen(false)}
                  disabled={submitLoading}
                  className="px-4 py-2 rounded-lg font-sans text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none disabled:opacity-50"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <div className="relative px-5 py-2.5 bg-[#0b0f19] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center space-x-2">
                    {submitLoading ? (
                      <>
                         <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                         <span className="font-sans text-xs font-semibold text-white tracking-wide">
                           Menyimpan...
                         </span>
                      </>
                    ) : (
                      <span className="font-sans text-xs font-semibold text-white tracking-wide">
                        Simpan Modul
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Sub-Modal Lesson Form (Nested Add / Edit Lesson) */}
      {lessonFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-400">
                <FilePlus2 className="w-5 h-5" />
                <h4 className="font-sans font-bold text-base text-white">
                  {activeLessonIndex !== null ? 'Edit Konten Pelajaran' : 'Tambah Pelajaran Baru'}
                </h4>
              </div>
              <button
                onClick={() => setLessonFormOpen(false)}
                className="text-slate-500 hover:text-white transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Judul Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.1. Pengenalan Visi Misi"
                    value={lesTitle}
                    onChange={(e) => setLesTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Tipe Konten
                  </label>
                  <select
                    value={lesContentType}
                    onChange={(e) => setLesContentType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors"
                  >
                    <option value="text">Teks (Markdown)</option>
                    <option value="video">Video (YouTube/Drive)</option>
                    <option value="pdf">Berkas PDF (Tautan)</option>
                    <option value="link">Tautan Eksternal</option>
                  </select>
                </div>
              </div>

              {lesContentType === 'text' ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-400">
                      Isi Materi Pembelajaran (Teks Markdown)
                    </label>
                    <span className="text-[9px] font-mono text-slate-500">Mendukung visualisasi rich text</span>
                  </div>
                  <textarea
                    placeholder="Tulis artikel kurikulum dalam format teks atau markdown..."
                    value={lesContentBody}
                    onChange={(e) => setLesContentBody(e.target.value)}
                    rows={6}
                    className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-750 resize-none scrollbar-thin"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Alamat URL Sumber Aset <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={
                      lesContentType === 'video' 
                        ? 'e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ' 
                        : lesContentType === 'pdf' 
                        ? 'e.g. https://drive.google.com/file/d/.../view' 
                        : 'e.g. https://spectra.com/resources'
                    }
                    value={lesExternalUrl}
                    onChange={(e) => setLesExternalUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-650"
                  />
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Sematkan tautan langsung ke media eksternal agar kandidat dapat membacanya langsung saat bimbingan belajar.
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-3 bg-slate-950/30 border border-slate-850 rounded-lg p-3">
                <input
                  type="checkbox"
                  id="lesIsRequired"
                  checked={lesIsRequired}
                  onChange={(e) => setLesIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-0"
                />
                <label htmlFor="lesIsRequired" className="text-xs font-medium text-slate-300 cursor-pointer select-none">
                  Kandidat wajib menyelesaikan pelajaran ini (Prasyarat Ujian)
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setLessonFormOpen(false)}
                  className="px-4 py-2 rounded-lg font-sans text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveLesson}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold rounded-lg transition-colors"
                >
                  Simpan Pelajaran
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
