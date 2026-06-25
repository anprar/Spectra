'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat login.');
      }

      // Login successful, redirect based on user role
      const role = data.user.role;
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'instructor') {
        router.push('/instructor');
      } else {
        router.push('/candidate');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Koneksi gagal atau server bermasalah.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/5 dark:bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/5 dark:bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo & Heading */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center mb-3">
            <img src="/spectra_logo.png" alt="SPECTRA Logo" className="w-16 h-16 mb-3 object-contain" />
            <span className="font-mono text-3xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#00d8f6] bg-clip-text text-transparent tracking-tighter">
              SPECTRA
            </span>
          </div>
          <p className="text-xs font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            Assessment & Training Portal
          </p>
          <h2 className="text-slate-600 dark:text-slate-400 font-sans text-sm mt-2">
            Ukur Kompetensi, Pilih Talenta Terbaik
          </h2>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle top border accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#7c3aed] via-[#00d8f6] to-[#7c3aed]"></div>

          <h1 className="font-sans text-xl font-bold text-slate-900 dark:text-white mb-6 text-center tracking-tight">
            Masuk ke Portal Anda
          </h1>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center space-x-2 animate-pulse-subtle">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-sans text-sm focus:outline-none focus:border-slate-450 dark:focus:border-slate-655 transition-colors placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-sans text-sm focus:outline-none focus:border-slate-450 dark:focus:border-slate-655 transition-colors placeholder-slate-400 dark:placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 relative group overflow-hidden rounded-lg p-[1px] focus:outline-none disabled:opacity-50"
            >
              {/* Glowing gradient background border */}
              <span className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#00d8f6] rounded-lg opacity-85 group-hover:opacity-100 transition-opacity duration-300"></span>
              {/* Button inner */}
              <div className="relative px-6 py-2.5 bg-white dark:bg-[#0b0f19] rounded-[7px] transition-colors duration-300 group-hover:bg-transparent flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-slate-800 dark:text-white animate-spin" />
                    <span className="font-sans text-sm font-medium text-slate-800 dark:text-white tracking-wide">
                      Memproses...
                    </span>
                  </>
                ) : (
                  <span className="font-sans text-sm font-medium text-slate-800 dark:text-white group-hover:text-white transition-colors tracking-wide">
                    Masuk Sekarang
                  </span>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Guest credentials helper card */}
        <div className="mt-6 bg-slate-200/40 dark:bg-[#0b0f19]/40 border border-slate-300/40 dark:border-slate-800/40 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-650 dark:text-slate-400 font-sans">
            Gunakan akun bawaan untuk uji coba:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-[9px] sm:text-[10px] font-mono">
            <div className="bg-white dark:bg-[#111827]/40 p-2 rounded border border-slate-200 dark:border-slate-800/30 text-slate-700 dark:text-slate-350 flex flex-col items-center justify-between text-center overflow-hidden">
              <span className="block text-purple-600 dark:text-[#a78bfa] font-semibold">Admin</span>
              <span className="block break-all my-0.5 select-all">admin@spectra.com</span>
              <span className="block text-[8px] text-slate-500 dark:text-slate-500">pw: Admin123</span>
            </div>
            <div className="bg-white dark:bg-[#111827]/40 p-2 rounded border border-slate-200 dark:border-slate-800/30 text-slate-700 dark:text-slate-350 flex flex-col items-center justify-between text-center overflow-hidden">
              <span className="block text-blue-600 dark:text-blue-400 font-semibold">Instructor</span>
              <span className="block break-all my-0.5 select-all">instructor@spectra.com</span>
              <span className="block text-[8px] text-slate-500 dark:text-slate-500">pw: Instructor123</span>
            </div>
            <div className="bg-white dark:bg-[#111827]/40 p-2 rounded border border-slate-200 dark:border-slate-800/30 text-slate-700 dark:text-slate-350 flex flex-col items-center justify-between text-center overflow-hidden">
              <span className="block text-cyan-600 dark:text-[#00d8f6] font-semibold">Candidate</span>
              <span className="block break-all my-0.5 select-all">candidate@spectra.com</span>
              <span className="block text-[8px] text-slate-500 dark:text-slate-500">pw: Candidate123</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
