'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  LayoutDashboard, 
  Database, 
  BookOpen, 
  Award, 
  LogOut, 
  Menu, 
  X,
  User,
  ShieldAlert
} from 'lucide-react';

interface UserSession {
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch session details on mount
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/login'); // Or a lightweight session check
        // We can just verify session by parsing a client cookie or fetching profile
        const profileRes = await fetch('/api/auth/me'); // We will create this API route shortly!
        if (profileRes.ok) {
          const data = await profileRes.json();
          setSession(data.user);
        } else {
          // Fallback if session fetch fails or not authenticated
          router.push('/login');
        }
      } catch (e) {
        console.error('Failed to load session');
      }
    };
    fetchSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (e) {
      console.error('Logout failed');
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
    { name: 'Bank Soal', href: '/instructor/banks', icon: Database },
    { name: 'Modul Training', href: '/instructor/modules', icon: BookOpen },
    { name: 'Jadwal & Ujian', href: '/instructor/exams', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 h-screen sticky top-0 bg-[#0b0f19] border-r border-slate-800/80 flex-shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <Link href="/instructor" className="flex items-center space-x-2">
            <img src="/spectra_logo.png" alt="SPECTRA Logo" className="w-6 h-6 object-contain" />
            <span className="font-mono text-base font-bold bg-gradient-to-r from-[#7c3aed] to-[#00d8f6] bg-clip-text text-transparent tracking-tighter">
              SPECTRA
            </span>
            <span className="text-[8px] bg-blue-500/10 text-blue-400 font-mono font-bold uppercase tracking-wider px-1 py-0.5 rounded border border-blue-500/20 ml-1.5">
              Inst
            </span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const isActive = item.href === '/instructor'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg font-sans text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/10 to-cyan-500/10 text-[#00d8f6] border-l-2 border-[#00d8f6]'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Instructor Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-[#090d16]/50">
          {session?.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center space-x-2.5 px-3.5 py-2 rounded-lg font-sans text-xs font-semibold text-amber-400 hover:bg-amber-950/30 hover:text-amber-300 transition-colors border border-dashed border-amber-500/30 mb-4"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Kembali ke Admin</span>
            </Link>
          )}
          {session && (
            <div className="flex items-center space-x-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#00d8f6] flex items-center justify-center text-white text-xs font-bold">
                {session.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate font-sans">{session.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate font-mono">{session.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg font-sans text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Keluar Portal</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Header */}
      <header className="md:hidden h-16 bg-[#0b0f19] border-b border-slate-800/80 px-4 flex items-center justify-between z-30">
        <Link href="/instructor" className="flex items-center space-x-2">
          <img src="/spectra_logo.png" alt="SPECTRA Logo" className="w-6 h-6 object-contain" />
          <span className="font-mono text-lg font-bold bg-gradient-to-r from-[#7c3aed] to-[#00d8f6] bg-clip-text text-transparent tracking-tighter">
            SPECTRA
          </span>
          <span className="text-[8px] bg-blue-500/10 text-blue-400 font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-blue-500/20">
            Inst
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-400 hover:text-white focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-[#030712]/95 z-20 flex flex-col border-t border-slate-800">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-sans text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/15 to-cyan-500/15 text-[#00d8f6]'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            {session?.role === 'admin' && (
              <Link
                key="back-to-admin"
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg font-sans text-base font-medium text-amber-400 hover:bg-amber-950/25 hover:text-amber-300 transition-colors border border-dashed border-amber-500/25"
              >
                <ShieldAlert className="w-5 h-5" />
                <span>Kembali ke Admin</span>
              </Link>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-sans text-base font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar Portal</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        {children}
      </main>
    </div>
  );
}
