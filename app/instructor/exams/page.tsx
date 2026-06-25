'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Award, 
  Clock, 
  BookOpen, 
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Search,
  Loader2,
  Trash2,
  Edit,
  Sparkles,
  Settings,
  UserCheck,
  HelpCircle
} from 'lucide-react';

interface QuestionBank {
  id: string;
  name: string;
}

interface Candidate {
  id: string;
  fullName: string;
  email: string;
}

interface Module {
  id: string;
  title: string;
}

interface ExamRule {
  id?: string;
  bankId: string;
  bank?: { name: string };
  category: string;
  difficulty: string; // Easy, Medium, Hard, Any
  pickCount: number;
}

interface ExamAssignment {
  id: string;
  candidateId: string;
  candidate: {
    fullName: string;
    email: string;
  };
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  questionCount: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  passScore: number;
  availableFrom: string;
  availableUntil: string;
  resultReleaseMode: string; // hidden, score_only, full_review
  status: string; // draft, published, archived
  trainingModuleId: string | null;
  trainingModule: { title: string } | null;
  rules: ExamRule[];
  assignments: ExamAssignment[];
  createdBy: {
    fullName: string;
  };
}

export default function InstructorExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Exam Modal States
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questionCount, setQuestionCount] = useState(10);
  const [passScore, setPassScore] = useState(75);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [resultReleaseMode, setResultReleaseMode] = useState('score_only');
  const [status, setStatus] = useState('draft');
  const [trainingModuleId, setTrainingModuleId] = useState('');
  const [examRules, setExamRules] = useState<ExamRule[]>([]);
  const [assignedCandidates, setAssignedCandidates] = useState<string[]>([]);

  // Load all required data on mount
  const loadAllData = async () => {
    try {
      // 1. Fetch Exams
      const examsRes = await fetch('/api/instructor/exams');
      if (examsRes.ok) {
        const data = await examsRes.json();
        setExams(data.exams);
      }

      // 2. Fetch Modules for prerequisite dropdown
      const modulesRes = await fetch('/api/instructor/modules');
      if (modulesRes.ok) {
        const data = await modulesRes.json();
        setModules(data.modules.filter((m: any) => m.status === 'published' || m.id));
      }

      // 3. Fetch Candidates for assignment checkboxes
      const candidatesRes = await fetch('/api/instructor/candidates');
      if (candidatesRes.ok) {
        const data = await candidatesRes.json();
        setCandidates(data.candidates);
      }

      // 4. Fetch Question Banks for rule builder
      const banksRes = await fetch('/api/instructor/banks');
      if (banksRes.ok) {
        const data = await banksRes.json();
        setBanks(data.banks);
      }

    } catch (e) {
      console.error('Failed to load data in exam page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const openCreateModal = () => {
    setEditingExam(null);
    setTitle('');
    setDescription('');
    setDurationMinutes(60);
    setQuestionCount(10);
    setPassScore(75);
    
    // Default dates (starts now, ends tomorrow)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    // Format to YYYY-MM-DDTHH:MM
    const formatLocalDateTime = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setAvailableFrom(formatLocalDateTime(now));
    setAvailableUntil(formatLocalDateTime(tomorrow));
    
    setShuffleQuestions(true);
    setShuffleOptions(true);
    setResultReleaseMode('score_only');
    setStatus('draft');
    setTrainingModuleId('');
    setExamRules([]);
    setAssignedCandidates([]);
    setFormError('');
    setExamModalOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setTitle(exam.title);
    setDescription(exam.description || '');
    setDurationMinutes(exam.durationMinutes);
    setQuestionCount(exam.questionCount);
    setPassScore(exam.passScore);
    
    // Format dates to YYYY-MM-DDTHH:MM
    const formatToInput = (isoStr: string) => {
      const d = new Date(isoStr);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setAvailableFrom(formatToInput(exam.availableFrom));
    setAvailableUntil(formatToInput(exam.availableUntil));
    
    setShuffleQuestions(exam.shuffleQuestions);
    setShuffleOptions(exam.shuffleOptions);
    setResultReleaseMode(exam.resultReleaseMode);
    setStatus(exam.status);
    setTrainingModuleId(exam.trainingModuleId || '');
    setExamRules(exam.rules || []);
    setAssignedCandidates(exam.assignments.map(a => a.candidateId));
    setFormError('');
    setExamModalOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitLoading(true);

    // Basic validation: rule counts sum
    const totalRulePicks = examRules.reduce((sum, r) => sum + parseInt(r.pickCount.toString() || '0'), 0);
    if (totalRulePicks > 0 && totalRulePicks !== parseInt(questionCount.toString())) {
      if (!confirm(`Peringatan: Jumlah penarikan soal dari aturan (${totalRulePicks}) tidak sama dengan target Jumlah Soal Ujian (${questionCount}). Ujian tetap dapat dibuat, namun disarankan untuk disamakan.\n\nApakah Anda ingin melanjutkan?`)) {
        setSubmitLoading(false);
        return;
      }
    }

    const payload = {
      title,
      description,
      trainingModuleId: trainingModuleId || null,
      durationMinutes,
      questionCount,
      passScore,
      availableFrom: new Date(availableFrom).toISOString(),
      availableUntil: new Date(availableUntil).toISOString(),
      shuffleQuestions,
      shuffleOptions,
      resultReleaseMode,
      status,
      rules: examRules,
      candidateIds: assignedCandidates
    };

    try {
      const url = editingExam ? `/api/instructor/exams/${editingExam.id}` : '/api/instructor/exams';
      const method = editingExam ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan ujian.');
      }

      await loadAllData();
      setExamModalOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteExam = async (id: string, examTitle: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ujian "${examTitle}"?\nSemua riwayat pengerjaan kandidat untuk ujian ini akan terhapus permanen.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/instructor/exams/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus ujian.');
      }

      await loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Rule management handlers
  const handleAddRule = () => {
    if (banks.length === 0) {
      alert('Belum ada bank soal tersedia. Silakan buat bank soal terlebih dahulu.');
      return;
    }
    const newRule: ExamRule = {
      bankId: banks[0].id,
      category: 'Umum',
      difficulty: 'Any',
      pickCount: 5
    };
    setExamRules([...examRules, newRule]);
  };

  const handleUpdateRule = (index: number, field: keyof ExamRule, value: any) => {
    const updated = [...examRules];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setExamRules(updated);
  };

  const handleRemoveRule = (index: number) => {
    setExamRules(examRules.filter((_, i) => i !== index));
  };

  const handleToggleCandidate = (cid: string) => {
    if (assignedCandidates.includes(cid)) {
      setAssignedCandidates(assignedCandidates.filter(id => id !== cid));
    } else {
      setAssignedCandidates([...assignedCandidates, cid]);
    }
  };

  const handleSelectAllCandidates = () => {
    if (assignedCandidates.length === candidates.length) {
      setAssignedCandidates([]);
    } else {
      setAssignedCandidates(candidates.map(c => c.id));
    }
  };

  // Helper to determine active schedule state
  const getScheduleState = (from: string, until: string) => {
    const now = new Date();
    const fromDate = new Date(from);
    const untilDate = new Date(until);

    if (now < fromDate) {
      return {
        text: 'Upcoming (Belum Mulai)',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      };
    }
    if (now > untilDate) {
      return {
        text: 'Expired (Selesai)',
        color: 'text-slate-500 bg-slate-800/60 border-slate-700/50'
      };
    }
    return {
      text: 'Active (Sedang Berjalan)',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20 font-bold'
    };
  };

  const filteredExams = exams.filter(ex => 
    ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 font-sans text-slate-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
            <Award className="w-8 h-8 text-pink-500" />
            <span>Kelola Jadwal & Ujian</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Konfigurasi rilis sesi ujian aktif, durasi waktu, passing grade, penarikan soal acak, dan alokasi peserta ujian secara interaktif.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none self-start sm:self-auto"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-pink-600 to-violet-600 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
          <div className="relative px-5 py-2.5 bg-[#030712] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center space-x-2">
            <Plus className="w-4 h-4 text-white" />
            <span className="font-sans text-xs font-semibold text-white tracking-wide">
              Tambah Jadwal Ujian
            </span>
          </div>
        </button>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex items-start gap-4 shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-600 to-violet-600"></div>
        <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-lg border border-pink-500/20 mt-1 flex-shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse-subtle" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white">Tata Tertib Penjadwalan & Sesi Ujian</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sebagai instruktur atau administrator, Anda memiliki wewenang penuh untuk merancang tes seleksi. Tentukan jadwal aktif server agar kandidat hanya dapat menempuh ujian dalam rentang waktu tersebut, pasangkan materi prasyarat, dan rumuskan kriteria kelulusan.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Cari jadwal ujian..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#0b0f19] border border-slate-800/80 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600"
        />
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Memuat jadwal ujian...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-[#0b0f19]/30 border border-slate-800/50 rounded-xl p-12 text-center max-w-2xl mx-auto space-y-4 shadow-xl">
          <Award className="w-12 h-12 text-slate-700 mx-auto" />
          <h3 className="font-sans font-semibold text-base text-white">Tidak Ada Jadwal Ujian</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery 
              ? `Hasil pencarian untuk "${searchQuery}" tidak ditemukan. Silakan coba pencarian lain.` 
              : 'Belum ada sesi ujian kompetensi terdaftar. Klik "Tambah Jadwal Ujian" untuk merumuskan evaluasi perdana Anda.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredExams.map((exam) => {
            const state = getScheduleState(exam.availableFrom, exam.availableUntil);
            return (
              <div key={exam.id} className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors group">
                <div className="space-y-5">
                  
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded border ${state.color}`}>
                        {state.text}
                      </span>
                      <h3 className="text-base font-bold text-white tracking-tight mt-1 leading-snug">
                        {exam.title}
                      </h3>
                    </div>
                    <div className="flex-shrink-0 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center min-w-[70px]">
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Passing</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">{exam.passScore}%</span>
                    </div>
                  </div>

                  {/* Description */}
                  {exam.description && (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {exam.description}
                    </p>
                  )}

                  {/* Parameters Grid */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-[#030712] border border-slate-850 p-2 rounded-lg text-xs">
                      <span className="text-[10px] text-slate-500 font-mono block">Durasi</span>
                      <span className="font-mono font-semibold text-white mt-1 block flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-pink-400" />
                        {exam.durationMinutes} mnt
                      </span>
                    </div>
                    <div className="bg-[#030712] border border-slate-850 p-2 rounded-lg text-xs">
                      <span className="text-[10px] text-slate-500 font-mono block">Jumlah Soal</span>
                      <span className="font-mono font-semibold text-white mt-1 block">{exam.questionCount} soal</span>
                    </div>
                    <div className="bg-[#030712] border border-slate-850 p-2 rounded-lg text-xs">
                      <span className="text-[10px] text-slate-500 font-mono block">Prasyarat</span>
                      <span className="font-mono font-semibold text-blue-400 mt-1 block truncate max-w-[90px]" title={exam.trainingModule?.title || 'Tidak ada'}>
                        {exam.trainingModule ? 'Modul Aktif' : 'Tanpa Modul'}
                      </span>
                    </div>
                  </div>

                  {/* Schedule dates */}
                  <div className="bg-[#030712] border border-slate-850 rounded-lg p-3 space-y-2 text-xs font-sans">
                    <div className="flex items-center text-slate-400 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      <span>Jadwal Akses Server (Waktu Lokal):</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-300 bg-slate-950/40 p-2 rounded border border-slate-900">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Mulai</span>
                        <span>{new Date(exam.availableFrom).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Selesai</span>
                        <span>{new Date(exam.availableUntil).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Question Rules Summary */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Aturan Penarikan Soal:</span>
                    {exam.rules.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">Penarikan manual atau acak bebas.</p>
                    ) : (
                      <div className="bg-slate-950/20 border border-slate-850 rounded-lg p-2 space-y-1 max-h-24 overflow-y-auto">
                        {exam.rules.map((rule, ri) => (
                          <div key={rule.id || ri} className="text-[10px] flex justify-between text-slate-300 font-mono">
                            <span className="truncate max-w-[120px]">{rule.bank?.name || 'Bank Soal'} ({rule.category})</span>
                            <span className="text-slate-400">{rule.difficulty} • {rule.pickCount} Soal</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assigned Candidates */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#00d8f6]" />
                      <span>Kandidat Terdaftar ({exam.assignments.length} Peserta):</span>
                    </span>
                    {exam.assignments.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">Belum ada kandidat ditugaskan.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                        {exam.assignments.map((assign) => (
                          <span key={assign.id} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                            {assign.candidate.fullName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Card Actions Footer */}
                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-4">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Oleh: {exam.createdBy.fullName}
                  </span>
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => openEditModal(exam)}
                      className="p-2 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                      title="Edit Konfigurasi Ujian"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id, exam.title)}
                      className="p-2 bg-red-950/10 border border-red-900/20 hover:border-red-600/40 text-red-400 hover:text-red-300 rounded-lg transition-colors flex items-center justify-center"
                      title="Hapus Ujian"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive Exam Configuration Modal (Add / Edit) */}
      {examModalOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/75 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden relative shadow-2xl text-left align-middle my-8">
            {/* Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-600 to-violet-600"></div>

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-pink-400">
                <Settings className="w-5 h-5" />
                <h3 className="font-sans font-bold text-base text-white">
                  {editingExam ? 'Edit Konfigurasi Ujian Kompetensi' : 'Buat Jadwal Ujian Baru'}
                </h3>
              </div>
              <button
                onClick={() => setExamModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveExam} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-lg text-red-300 text-xs font-sans">
                  {formError}
                </div>
              )}

              {/* Grid 1: Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Judul Ujian <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Evaluasi Teknis Budaya & Integritas Kerja"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={submitLoading}
                    className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Status Rilis
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={submitLoading}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors"
                  >
                    <option value="draft">Draft (Disembunyikan)</option>
                    <option value="published">Published (Aktif Sesuai Jadwal)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">
                  Deskripsi Ujian
                </label>
                <textarea
                  placeholder="Tulis instruksi pengerjaan atau tata tertib khusus untuk ujian ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitLoading}
                  rows={2}
                  className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600 resize-none"
                />
              </div>

              {/* Grid 2: Timing & Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Durasi (Menit) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    disabled={submitLoading}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-slate-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <span>Jumlah Soal</span>
                    <span className="text-red-500">*</span>
                    <span title="Batas jumlah soal acak yang ditarik untuk dikerjakan kandidat" className="text-slate-500 cursor-help"><HelpCircle className="w-3 h-3" /></span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value) || 0)}
                    disabled={submitLoading}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-slate-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Passing Grade (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={passScore}
                    onChange={(e) => setPassScore(parseFloat(e.target.value) || 0)}
                    disabled={submitLoading}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-slate-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Prasyarat Materi
                  </label>
                  <select
                    value={trainingModuleId}
                    onChange={(e) => setTrainingModuleId(e.target.value)}
                    disabled={submitLoading}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors"
                  >
                    <option value="">Tanpa Prasyarat Modul</option>
                    {modules.map(mod => (
                      <option key={mod.id} value={mod.id}>{mod.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid 3: DateTime Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Waktu Akses Mulai (Waktu Lokal)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    disabled={submitLoading}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-slate-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Waktu Akses Selesai (Waktu Lokal)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                    disabled={submitLoading}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-slate-600 transition-colors"
                  />
                </div>
              </div>

              {/* Toggle Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/20 border border-slate-850 p-3.5 rounded-xl">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="shuffleQuestions"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    disabled={submitLoading}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-850 text-pink-500 focus:ring-0"
                  />
                  <label htmlFor="shuffleQuestions" className="text-[11px] font-semibold text-slate-300 cursor-pointer select-none">
                    Acak Urutan Soal
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="shuffleOptions"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    disabled={submitLoading}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-850 text-pink-500 focus:ring-0"
                  />
                  <label htmlFor="shuffleOptions" className="text-[11px] font-semibold text-slate-300 cursor-pointer select-none">
                    Acak Opsi Pilihan
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={resultReleaseMode}
                    onChange={(e) => setResultReleaseMode(e.target.value)}
                    disabled={submitLoading}
                    className="bg-transparent text-[11px] font-semibold text-slate-300 focus:outline-none w-full"
                  >
                    <option value="score_only" className="bg-[#0b0f19]">Rilis Nilai Saja</option>
                    <option value="full_review" className="bg-[#0b0f19]">Rilis Nilai & Pembahasan</option>
                    <option value="hidden" className="bg-[#0b0f19]">Sembunyikan Hasil</option>
                  </select>
                </div>
              </div>

              {/* Rule Builder Sub-section */}
              <div className="space-y-3 pt-4 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-4 h-4" />
                    <span>Aturan Tarik Soal Acak ({examRules.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRule}
                    disabled={submitLoading}
                    className="px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/25 border border-pink-500/20 text-pink-400 hover:text-pink-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Aturan</span>
                  </button>
                </div>

                {examRules.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-xl p-5 text-center text-slate-600 text-xs font-sans">
                    Belum ada aturan penarikan soal. Ujian akan menarik secara acak merata jika tidak ditentukan.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {examRules.map((rule, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl items-center">
                        
                        {/* 1. Bank Select */}
                        <div className="sm:col-span-4 space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase block font-mono">Bank Soal</span>
                          <select
                            value={rule.bankId}
                            onChange={(e) => handleUpdateRule(idx, 'bankId', e.target.value)}
                            disabled={submitLoading}
                            className="w-full bg-[#111827] border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                          >
                            {banks.map(b => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Category Input */}
                        <div className="sm:col-span-3 space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase block font-mono">Kategori</span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Kode Etik"
                            value={rule.category}
                            onChange={(e) => handleUpdateRule(idx, 'category', e.target.value)}
                            disabled={submitLoading}
                            className="w-full bg-[#111827] border border-slate-800 rounded px-2 py-0.5 text-[11px] text-white focus:outline-none placeholder-slate-700"
                          />
                        </div>

                        {/* 3. Difficulty Select */}
                        <div className="sm:col-span-2 space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase block font-mono">Kesulitan</span>
                          <select
                            value={rule.difficulty}
                            onChange={(e) => handleUpdateRule(idx, 'difficulty', e.target.value)}
                            disabled={submitLoading}
                            className="w-full bg-[#111827] border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                          >
                            <option value="Any">Any</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>

                        {/* 4. Pick Count */}
                        <div className="sm:col-span-2 space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase block font-mono">Jumlah</span>
                          <input
                            type="number"
                            required
                            min={1}
                            value={rule.pickCount}
                            onChange={(e) => handleUpdateRule(idx, 'pickCount', parseInt(e.target.value) || 0)}
                            disabled={submitLoading}
                            className="w-full bg-[#111827] border border-slate-800 rounded px-2 py-0.5 text-[11px] text-white font-mono focus:outline-none"
                          />
                        </div>

                        {/* 5. Remove */}
                        <div className="sm:col-span-1 text-center pt-3 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(idx)}
                            className="p-1.5 hover:bg-slate-900 text-red-400 hover:text-red-300 rounded transition-colors"
                            title="Hapus Aturan"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Candidate Assignment Sub-section */}
              <div className="space-y-2 pt-4 border-t border-slate-800/60">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Daftar Alokasi Kandidat ({assignedCandidates.length} terpilih)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllCandidates}
                    className="text-[10px] font-semibold text-[#00d8f6] hover:underline bg-transparent border-none outline-none focus:outline-none"
                  >
                    {assignedCandidates.length === candidates.length ? 'Batalkan Semua' : 'Pilih Semua'}
                  </button>
                </div>

                {candidates.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center text-slate-600 text-xs">
                    Belum ada akun kandidat terdaftar di sistem.
                  </div>
                ) : (
                  <div className="bg-[#030712]/50 border border-slate-850 rounded-xl p-3.5 max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {candidates.map(c => {
                      const isChecked = assignedCandidates.includes(c.id);
                      return (
                        <div 
                          key={c.id}
                          onClick={() => handleToggleCandidate(c.id)}
                          className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                            isChecked 
                              ? 'bg-pink-950/10 border-pink-500/30 text-white' 
                              : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-pink-500 focus:ring-0 pointer-events-none"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold truncate leading-none">{c.fullName}</p>
                            <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">{c.email}</p>
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
                  onClick={() => setExamModalOpen(false)}
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
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-600 to-violet-600 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
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
                        Simpan Jadwal Ujian
                      </span>
                    )}
                  </div>
                </button>
              </div>

            </form>
          </div>
          </div>
        </div>
      )}

    </div>
  );
}
