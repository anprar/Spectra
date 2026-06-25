'use strict';
'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Database, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  FileText,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

interface Option {
  id: string;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  category: string;
  difficulty: string;
  questionText: string;
  explanationText: string | null;
  options: Option[];
}

interface QuestionBank {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  questions: Question[];
}

export default function BankDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'import' | 'manual'>('list');

  // Excel Import States
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Manual Question Form States
  const [manualQText, setManualQText] = useState('');
  const [manualQCategory, setManualQCategory] = useState('');
  const [manualQDifficulty, setManualQDifficulty] = useState('Medium');
  const [manualQExplanation, setManualQExplanation] = useState('');
  const [manualOptions, setManualOptions] = useState([
    { key: 'A', text: '', isCorrect: true },
    { key: 'B', text: '', isCorrect: false },
    { key: 'C', text: '', isCorrect: false },
    { key: 'D', text: '', isCorrect: false },
    { key: 'E', text: '', isCorrect: false }, // Optional, but we provide it by default
  ]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');

  const fetchBankDetails = async () => {
    try {
      const res = await fetch(`/api/instructor/banks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBank(data.bank);
      } else {
        router.push('/instructor/banks');
      }
    } catch (e) {
      console.error('Failed to fetch bank details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, [id]);

  // Handle Excel Import File Upload
  const handleExcelImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) return;

    setImportLoading(true);
    setImportSuccess(null);
    setImportError(null);
    setValidationErrors([]);

    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('bankId', id);

    try {
      const res = await fetch('/api/instructor/questions/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setImportSuccess(data.message);
        setExcelFile(null);
        // Clear file input
        const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        await fetchBankDetails(); // Reload questions list
      } else {
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors);
        } else {
          setImportError(data.error || 'Gagal mengimpor soal.');
        }
      }
    } catch (err: any) {
      setImportError('Gagal terhubung ke server untuk proses impor.');
    } finally {
      setImportLoading(false);
    }
  };

  // Handle Manual Question Creation
  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    setManualLoading(true);

    // Validate
    if (!manualQText.trim()) {
      setManualError('Pertanyaan wajib diisi.');
      setManualLoading(false);
      return;
    }

    const filledOptions = manualOptions.filter((o) => o.text.trim() !== '');
    if (filledOptions.length < 2) {
      setManualError('Harap isi minimal 2 opsi jawaban.');
      setManualLoading(false);
      return;
    }

    const hasCorrect = filledOptions.some((o) => o.isCorrect);
    if (!hasCorrect) {
      setManualError('Harap pilih salah satu opsi sebagai kunci jawaban yang benar.');
      setManualLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/instructor/banks/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: manualQText,
          explanationText: manualQExplanation,
          category: manualQCategory.trim() || 'Umum',
          difficulty: manualQDifficulty || 'Medium',
          options: filledOptions.map((o) => ({
            optionKey: o.key,
            optionText: o.text,
            isCorrect: o.isCorrect,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan soal.');
      }

      // Reset form
      setManualQText('');
      setManualQExplanation('');
      setManualQCategory('');
      setManualQDifficulty('Medium');
      setManualOptions([
        { key: 'A', text: '', isCorrect: true },
        { key: 'B', text: '', isCorrect: false },
        { key: 'C', text: '', isCorrect: false },
        { key: 'D', text: '', isCorrect: false },
        { key: 'E', text: '', isCorrect: false },
      ]);

      await fetchBankDetails(); // Reload list
      setActiveTab('list'); // Switch to list tab
    } catch (err: any) {
      setManualError(err.message);
    } finally {
      setManualLoading(false);
    }
  };

  // Handle manual option change
  const handleOptionChange = (key: string, text: string) => {
    setManualOptions(
      manualOptions.map((o) => (o.key === key ? { ...o, text } : o))
    );
  };

  // Handle manual option correct change (radio-button style)
  const handleOptionCorrectChange = (key: string) => {
    setManualOptions(
      manualOptions.map((o) => ({ ...o, isCorrect: o.key === key }))
    );
  };

  // Handle Question Deletion
  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan.')) return;

    try {
      const res = await fetch(`/api/instructor/questions/${qId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchBankDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus soal.');
      }
    } catch (e) {
      alert('Koneksi gagal saat mencoba menghapus soal.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-3">
        <Loader2 className="w-8 h-8 text-[#00d8f6] animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Memuat detail bank soal...</p>
      </div>
    );
  }

  if (!bank) return null;

  return (
    <div className="space-y-8 font-sans text-slate-200">
      {/* Back Button & Title */}
      <div className="space-y-4">
        <Link 
          href="/instructor/banks" 
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-[#00d8f6] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Bank Soal</span>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-[#00d8f6]">
                <Database className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {bank.name}
              </h1>
            </div>
            <p className="text-sm text-slate-400 max-w-3xl">
              {bank.description || 'Tidak ada deskripsi.'}
            </p>
          </div>
          <div className="flex items-center space-x-1 font-mono text-[10px] font-semibold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400 h-fit self-start">
            <FileText className="w-3.5 h-3.5 mr-1" />
            <span>{bank.questions.length} Pertanyaan Total</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-800 flex space-x-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === 'list'
              ? 'text-[#00d8f6] font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Daftar Pertanyaan
          {activeTab === 'list' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00d8f6]"></span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('import')}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center space-x-1.5 ${
            activeTab === 'import'
              ? 'text-[#00d8f6] font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Impor Excel</span>
          {activeTab === 'import' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00d8f6]"></span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center space-x-1.5 ${
            activeTab === 'manual'
              ? 'text-[#00d8f6] font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Soal Manual</span>
          {activeTab === 'manual' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00d8f6]"></span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        
        {/* TAB 1: QUESTIONS LIST */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {bank.questions.length === 0 ? (
              <div className="bg-[#0b0f19]/30 border border-slate-800/50 rounded-xl p-16 text-center max-w-2xl mx-auto space-y-4">
                <HelpCircle className="w-12 h-12 text-slate-700 mx-auto" />
                <h3 className="font-sans font-semibold text-base text-white">Bank Soal Kosong</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Belum ada pertanyaan di dalam bank soal ini. Anda dapat mengunggah lembar Excel berisi puluhan soal sekaligus melalui tab **"Impor Excel"** atau menambahkannya satu per satu melalui tab **"Tambah Soal Manual"**.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bank.questions.map((q, idx) => (
                  <div 
                    key={q.id} 
                    className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 shadow-md hover:border-slate-800 transition-colors relative group"
                  >
                    {/* Header: Question tags & actions */}
                    <div className="flex items-start justify-between border-b border-slate-800/60 pb-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          #{bank.questions.length - idx}
                        </span>
                        <span className="font-mono text-[9px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {q.category}
                        </span>
                        <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border ${
                          q.difficulty === 'Easy' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : q.difficulty === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-900 transition-all focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus Pertanyaan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Question Stem */}
                    <h4 className="font-sans text-sm font-semibold text-white leading-relaxed whitespace-pre-line mb-4">
                      {q.questionText}
                    </h4>

                    {/* Options list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                      {q.options.map((opt) => (
                        <div 
                          key={opt.id}
                          className={`px-4 py-2.5 rounded-lg border text-xs font-sans flex items-start space-x-2 transition-colors ${
                            opt.isCorrect 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/40 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-medium'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className={`font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            opt.isCorrect 
                              ? 'bg-emerald-500 text-white font-bold' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {opt.optionKey}
                          </span>
                          <span className="leading-relaxed">{opt.optionText}</span>
                        </div>
                      ))}
                    </div>

                    {/* Explanation if exists */}
                    {q.explanationText && (
                      <div className="mt-4 p-3.5 bg-amber-50 dark:bg-slate-950/80 rounded-lg border border-amber-200 dark:border-slate-800/40 text-xs text-slate-700 dark:text-slate-400 font-sans leading-relaxed flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-300 block mb-0.5">Pembahasan Soal:</span>
                          <p>{q.explanationText}</p>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXCEL IMPORT */}
        {activeTab === 'import' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Upload Area (2/3 width) */}
            <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 shadow-md space-y-6">
              <div>
                <h3 className="font-sans font-semibold text-base text-white">Unggah Lembar Excel Bank Soal</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Impor puluhan soal sekaligus dari lembar Excel (.xlsx atau .xls). Ikuti templat standar agar sistem dapat memproses dengan sempurna.
                </p>
              </div>

              {/* Instructions Callout */}
              <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-2.5">
                <h4 className="text-xs font-semibold text-white flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#00d8f6]" />
                  <span>Petunjuk Penting Format Impor</span>
                </h4>
                <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-1">
                  <li>Kolom wajib: **Pertanyaan**, **Pilihan A**, **Pilihan B**, **Pilihan C**, **Pilihan D**, **Kunci Jawaban**, **Kategori**, dan **Tingkat Kesulitan**.</li>
                  <li>Kolom **Pilihan E** dan **Pembahasan** bersifat opsional.</li>
                  <li>Kunci jawaban harus berupa huruf kapital tunggal: **A, B, C, D, atau E**.</li>
                  <li>Tingkat Kesulitan harus bernilai: **Easy, Medium, atau Hard** (jika kosong, default ke Medium).</li>
                  <li>Pastikan tidak ada baris kosong di tengah-tengah data Anda.</li>
                </ul>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleExcelImport} className="space-y-4">
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center bg-[#111827]/10 flex flex-col items-center justify-center space-y-3 hover:border-slate-700 transition-colors">
                  <Upload className="w-8 h-8 text-slate-600 animate-pulse-subtle" />
                  <div className="text-xs text-slate-400">
                    <label className="cursor-pointer font-semibold text-[#00d8f6] hover:text-[#00d8f6]/80 underline">
                      Pilih berkas Excel
                      <input 
                        id="excel-file-input"
                        type="file" 
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setExcelFile(e.target.files[0]);
                          }
                        }}
                        disabled={importLoading}
                        className="hidden" 
                      />
                    </label>
                    <span className="mx-1">atau seret file ke sini</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">Ekstensi file yang didukung: .xlsx, .xls</p>
                  
                  {excelFile && (
                    <div className="inline-flex items-center space-x-2 bg-[#030712] border border-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-mono text-slate-300">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>{excelFile.name} ({Math.round(excelFile.size / 1024)} KB)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/60">
                  <button
                    type="submit"
                    disabled={!excelFile || importLoading}
                    className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none disabled:opacity-50"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <div className="relative px-5 py-2.5 bg-[#0b0f19] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center space-x-2">
                      {importLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                          <span className="font-sans text-xs font-medium text-white tracking-wide">
                            Memproses Impor...
                          </span>
                        </>
                      ) : (
                        <span className="font-sans text-xs font-medium text-white tracking-wide">
                          Unggah & Impor Soal
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </form>

              {/* Feedback Success / General Error */}
              {importSuccess && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">Sukses Impor Soal</span>
                    <p>{importSuccess}</p>
                  </div>
                </div>
              )}

              {importError && (
                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">Impor Gagal</span>
                    <p>{importError}</p>
                  </div>
                </div>
              )}

              {/* Validation Errors Rendered Line-by-Line */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl space-y-3">
                  <div className="flex items-start space-x-3 text-red-300 text-xs">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block mb-0.5">Gagal Validasi Data Excel</span>
                      <p>Kami menemukan {validationErrors.length} kesalahan validasi data. Seluruh transaksi di-rollback demi integritas database. Silakan perbaiki baris berikut dan unggah kembali:</p>
                    </div>
                  </div>

                  <div className="bg-[#030712] border border-red-900/30 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {validationErrors.map((err, index) => (
                      <div key={index} className="font-mono text-[10px] text-red-400 leading-normal flex items-start space-x-1.5">
                        <span className="text-red-600 flex-shrink-0">•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Template Card (1/3 width) */}
            <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 shadow-md h-fit space-y-4">
              <h4 className="font-sans font-semibold text-sm text-white">Download Template Excel</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gunakan file templat Excel yang telah diformat secara khusus oleh SPECTRA untuk mempermudah penyusunan soal ujian Anda.
              </p>
              <a 
                href="/template_soal.xlsx"
                download
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-sans text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4 text-[#00d8f6]" />
                <span>Unduh Templat (.xlsx)</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 3: MANUAL QUESTION ADDITION */}
        {activeTab === 'manual' && (
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 shadow-md max-w-3xl mx-auto">
            <div>
              <h3 className="font-sans font-semibold text-base text-white">Tambah Soal Secara Manual</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tulis satu butir pertanyaan dan tentukan opsi jawaban beserta kunci jawabannya secara langsung.
              </p>
            </div>

            <form onSubmit={handleManualCreate} className="space-y-6 mt-6 border-t border-slate-800/60 pt-6">
              {manualError && (
                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-lg text-red-300 text-xs">
                  {manualError}
                </div>
              )}

              {/* Question Text */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 font-sans">
                  Pertanyaan / Stem Soal <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  placeholder="Tulis pertanyaan pilihan ganda Anda di sini..."
                  value={manualQText}
                  onChange={(e) => setManualQText(e.target.value)}
                  disabled={manualLoading}
                  rows={4}
                  className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600 resize-none"
                />
              </div>

              {/* Category & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 font-sans">
                    Kategori Soal <span className="text-[10px] text-slate-500 font-normal">(Opsional, default: Umum)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kode Etik, Logika, Pemrograman"
                    value={manualQCategory}
                    onChange={(e) => setManualQCategory(e.target.value)}
                    disabled={manualLoading}
                    className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 font-sans">
                    Tingkat Kesulitan <span className="text-[10px] text-slate-500 font-normal">(Opsional, default: Medium)</span>
                  </label>
                  <select
                    value={manualQDifficulty}
                    onChange={(e) => setManualQDifficulty(e.target.value)}
                    disabled={manualLoading}
                    className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors"
                  >
                    <option value="Easy">Easy (Mudah)</option>
                    <option value="Medium">Medium (Sedang)</option>
                    <option value="Hard">Hard (Sulit)</option>
                  </select>
                </div>
              </div>

              {/* Options Inputs */}
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-400 font-sans">
                  Opsi Jawaban & Kunci Jawaban <span className="text-red-500">*</span>
                </label>
                
                <div className="space-y-3 pl-2">
                  {manualOptions.map((opt) => (
                    <div key={opt.key} className="flex items-center space-x-3">
                      {/* Correct key radio button */}
                      <label 
                        className="flex-shrink-0 cursor-pointer"
                        title="Tandai sebagai opsi yang benar"
                      >
                        <input
                          type="radio"
                          name="manual-correct-option"
                          checked={opt.isCorrect}
                          onChange={() => handleOptionCorrectChange(opt.key)}
                          disabled={manualLoading}
                          className="hidden"
                        />
                        <span className={`font-mono text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                          opt.isCorrect
                            ? 'bg-emerald-500 border-emerald-500 text-white font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}>
                          {opt.key}
                        </span>
                      </label>
                      
                      {/* Option Text Input */}
                      <input
                        type="text"
                        placeholder={`Teks pilihan jawaban ${opt.key} ${opt.key === 'E' ? '(Opsional)' : '(Wajib)'}`}
                        required={opt.key !== 'E'}
                        value={opt.text}
                        onChange={(e) => handleOptionChange(opt.key, e.target.value)}
                        disabled={manualLoading}
                        className="flex-1 px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic pl-12 font-sans">
                  * Klik lingkaran huruf (A-E) di sebelah kiri untuk menentukan kunci jawaban yang benar.
                </p>
              </div>

              {/* Explanation */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 font-sans">
                  Pembahasan / Penjelasan Jawaban (Opsional)
                </label>
                <textarea
                  placeholder="Tulis alasan kunci jawaban di atas benar atau teori pendukungnya..."
                  value={manualQExplanation}
                  onChange={(e) => setManualQExplanation(e.target.value)}
                  disabled={manualLoading}
                  rows={3}
                  className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  disabled={manualLoading}
                  className="px-4 py-2 rounded-lg font-sans text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none disabled:opacity-50"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <div className="relative px-5 py-2.5 bg-[#0b0f19] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center space-x-2">
                    {manualLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                        <span className="font-sans text-xs font-medium text-white tracking-wide">
                          Menyimpan...
                        </span>
                      </>
                    ) : (
                      <span className="font-sans text-xs font-medium text-white tracking-wide">
                        Simpan Pertanyaan
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
