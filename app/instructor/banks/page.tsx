'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Database, 
  Plus, 
  Search, 
  Lock, 
  Globe, 
  FileText, 
  Loader2, 
  FolderPlus,
  X 
} from 'lucide-react';

interface QuestionBank {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  createdAt: string;
  _count: {
    questions: number;
  };
}

export default function QuestionBanksPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankDesc, setNewBankDesc] = useState('');
  const [newBankVisibility, setNewBankVisibility] = useState('private');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/instructor/banks');
      if (res.ok) {
        const data = await res.json();
        setBanks(data.banks);
      }
    } catch (e) {
      console.error('Failed to fetch banks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitLoading(true);

    try {
      const res = await fetch('/api/instructor/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBankName,
          description: newBankDesc,
          visibility: newBankVisibility,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat bank soal.');
      }

      // Refresh list and close modal
      await fetchBanks();
      setNewBankName('');
      setNewBankDesc('');
      setNewBankVisibility('private');
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (bank.description && bank.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Manajemen Bank Soal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Buat pengelompokan soal evaluasi dan kelola pertanyaan pilihan ganda secara terpusat.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none self-start sm:self-auto"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
          <div className="relative px-5 py-2.5 bg-[#030712] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center space-x-2">
            <Plus className="w-4 h-4 text-white" />
            <span className="font-sans text-xs font-medium text-white tracking-wide">
              Tambah Bank Soal
            </span>
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Cari bank soal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#0b0f19] border border-slate-800/80 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600"
        />
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-[#00d8f6] animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Memuat daftar bank soal...</p>
        </div>
      ) : filteredBanks.length === 0 ? (
        <div className="bg-[#0b0f19]/30 border border-slate-800/50 rounded-xl p-12 text-center max-w-2xl mx-auto space-y-4">
          <Database className="w-12 h-12 text-slate-700 mx-auto" />
          <h3 className="font-sans font-semibold text-base text-white">Tidak Ada Bank Soal</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery 
              ? `Hasil pencarian untuk "${searchQuery}" tidak ditemukan. Silakan coba kata kunci lain.` 
              : 'Anda belum memiliki Bank Soal. Silakan klik tombol "Tambah Bank Soal" untuk membuat yang pertama.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanks.map((bank) => (
            <Link 
              key={bank.id} 
              href={`/instructor/banks/${bank.id}`}
              className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between group relative"
            >
              {/* Subtle visual hover border glow */}
              <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-[#00d8f6]/10 pointer-events-none transition-colors"></div>

              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/60 text-slate-400 group-hover:text-[#00d8f6] group-hover:border-[#00d8f6]/30 transition-colors">
                    <Database className="w-5 h-5" />
                  </div>
                  <span className="flex items-center space-x-1 font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                    {bank.visibility === 'public' ? (
                      <>
                        <Globe className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-2.5 h-2.5 text-slate-500" />
                        <span>Private</span>
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <h3 className="font-sans font-semibold text-base text-white group-hover:text-[#00d8f6] transition-colors leading-tight">
                    {bank.name}
                  </h3>
                  <p className="font-sans text-xs text-slate-500 mt-1 line-clamp-2">
                    {bank.description || 'Tidak ada deskripsi.'}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800/60 pt-4 mt-5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{bank._count.questions} Pertanyaan</span>
                </div>
                <span className="text-slate-500 group-hover:text-white transition-colors">
                  Detail &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl">
            {/* Top glowing line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 to-cyan-500"></div>

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#00d8f6]">
                <FolderPlus className="w-5 h-5" />
                <h3 className="font-sans font-semibold text-base text-white">Buat Bank Soal Baru</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateBank} className="p-6 space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-950/40 border border-red-500/20 rounded text-red-300 text-[11px] font-sans">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 font-sans">
                  Nama Bank Soal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank Soal Logika Pemrograman"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  disabled={submitLoading}
                  className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 font-sans">
                  Deskripsi Singkat
                </label>
                <textarea
                  placeholder="Tulis tujuan, jenis materi soal, atau instruksi penggunaan bank soal ini..."
                  value={newBankDesc}
                  onChange={(e) => setNewBankDesc(e.target.value)}
                  disabled={submitLoading}
                  rows={3}
                  className="w-full px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors placeholder-slate-600 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 font-sans">
                  Visibilitas Bank Soal
                </label>
                <select
                  value={newBankVisibility}
                  onChange={(e) => setNewBankVisibility(e.target.value)}
                  disabled={submitLoading}
                  className="w-full px-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-slate-600 transition-colors"
                >
                  <option value="private">Private (Hanya saya yang dapat melihat)</option>
                  <option value="public">Public (Dapat digunakan pemateri lain)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <div className="relative px-4 py-2 bg-[#0b0f19] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center space-x-2">
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                        <span className="font-sans text-xs font-medium text-white tracking-wide">
                          Menyimpan...
                        </span>
                      </>
                    ) : (
                      <span className="font-sans text-xs font-medium text-white tracking-wide">
                        Simpan Bank Soal
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
