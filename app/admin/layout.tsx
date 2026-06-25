'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  Users,
  Award,
  LogOut,
  Menu,
  X,
  Shield,
  UserCheck
} from 'lucide-react';

interface Session {
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // Fetch session on load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.session.role !== 'admin') {
            router.push('/login');
          } else {
            setSession(data.session);
          }
        } else {
          router.push('/login');
        }
      } catch (e) {
        router.push('/login');
      }
    }
    checkSession();
  }, [router]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (e) {
      alert('Gagal keluar dari portal. Silakan coba kembali.');
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Kelola Pengguna',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Hasil Ujian',
      href: '/admin/results',
      icon: Award,
    },
  ];

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 h-screen sticky top-0 bg-[#0b0f19] border-r border-slate-800/80 flex-shrink-0">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <Link href="/admin" className="flex items-center space-x-2">
            <img src="/spectra_logo.png" alt="SPECTRA Logo" className="w-6 h-6 object-contain" />
            <span className="font-mono text-base font-bold bg-gradient-to-r from-[#7c3aed] to-[#00d8f6] bg-clip-text text-transparent tracking-tighter">
              SPECTRA
            </span>
            <span className="text-[8px] bg-purple-500/10 text-purple-400 font-mono font-bold uppercase tracking-wider px-1 py-0.5 rounded border border-purple-500/20 flex items-center space-x-0.5 ml-1">
              <Shield className="w-2 h-2" />
              <span>Adm</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const isActive = item.href === '/admin'
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

        {/* Admin Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-[#090d16]/50">
          {session && (
            <div className="flex items-center space-x-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#00d8f6] flex items-center justify-center text-white text-xs font-bold font-sans">
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
        <Link href="/admin" className="flex items-center space-x-2">
          <img src="/spectra_logo.png" alt="SPECTRA Logo" className="w-6 h-6 object-contain" />
          <span className="font-mono text-lg font-bold bg-gradient-to-r from-[#7c3aed] to-[#00d8f6] bg-clip-text text-transparent tracking-tighter">
            SPECTRA
          </span>
          <span className="text-[8px] bg-purple-500/10 text-purple-400 font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-purple-500/20">
            Adm
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
        <div className="md:hidden fixed inset-0 z-20 flex flex-col bg-[#030712] pt-16">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-sans text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-[#00d8f6]'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-[#090d16]/50">
            {session && (
              <div className="flex items-center space-x-3 mb-4 px-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#00d8f6] flex items-center justify-center text-white text-sm font-bold font-sans">
                  {session.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate font-sans">{session.fullName}</p>
                  <p className="text-xs text-slate-500 truncate font-mono">{session.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-sans text-base font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar Portal</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>

    </div>
  );
}
