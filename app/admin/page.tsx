import React from 'react';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Users,
  Shield,
  GraduationCap,
  Award,
  Activity,
  UserCheck,
  TrendingUp
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  // 1. Fetch system statistics
  const totalUsers = await db.user.count();
  const totalAdmins = await db.user.count({ where: { role: 'admin' } });
  const totalInstructors = await db.user.count({ where: { role: 'instructor' } });
  const totalCandidates = await db.user.count({ where: { role: 'candidate' } });

  const totalExams = await db.exam.count();
  const totalAttempts = await db.examAttempt.count({ where: { status: 'submitted' } });
  const passedAttempts = await db.examAttempt.count({ where: { status: 'submitted', passed: true } });
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

  // 2. Fetch recent audit logs (last 8 logs)
  const recentLogs = await db.auditLog.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          role: true
        }
      }
    }
  });

  // Action label formatter
  const getActionLabel = (action: string) => {
    const maps: Record<string, { text: string; color: string }> = {
      'login': { text: 'Login Pengguna', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
      'create_user': { text: 'Tambah Pengguna', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
      'update_user': { text: 'Update Pengguna', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
      'delete_user': { text: 'Hapus Pengguna', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
      'reset_password': { text: 'Reset Password', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
      'exam_started': { text: 'Ujian Dimulai', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
      'exam_submitted': { text: 'Jawaban Dikirim', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
      'change_schedule': { text: 'Jadwal Diubah', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' }
    };
    return maps[action] || { text: action, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
  };

  return (
    <div className="space-y-8 font-sans text-slate-200">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Pusat Kontrol Administratif
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Pantau kesehatan platform, audit log aktivitas, kelola pengguna, dan awasi laporan evaluasi talent secara global.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Total Users Widget */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Total Pengguna</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 font-mono">{totalUsers}</h3>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 flex items-center">
            <span className="text-blue-400 font-semibold mr-1">{totalCandidates}</span> Kandidat &bull; <span className="text-[#00d8f6] font-semibold ml-1 mr-1">{totalInstructors}</span> Instruktur
          </p>
        </div>

        {/* Total Admins Widget */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Administrator</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 font-mono">{totalAdmins}</h3>
            </div>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3">
            Hak akses penuh sistem kontrol
          </p>
        </div>

        {/* Total Exams Widget */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Ujian Terjadwal</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 font-mono">{totalExams}</h3>
            </div>
            <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-lg border border-pink-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3">
            <span className="text-pink-400 font-semibold mr-1">{totalAttempts}</span> kali ujian diselesaikan
          </p>
        </div>

        {/* Pass Rate Widget */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Rasio Kelulusan</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 font-mono">{passRate}%</h3>
            </div>
            <div className="p-2.5 bg-[#00d8f6]/10 text-[#00d8f6] rounded-lg border border-[#00d8f6]/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 flex items-center">
            <span className="text-[#00d8f6] font-semibold mr-1">{passedAttempts}</span> kandidat lulus kompetensi
          </p>
        </div>
      </div>

      {/* Audit Logs section */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-sans font-semibold text-base text-white flex items-center space-x-2">
            <Activity className="w-4.5 h-4.5 text-[#00d8f6]" />
            <span>Audit Log Aktivitas Keamanan & Sistem</span>
          </h2>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Update</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Detail Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                    Belum ada rekaman aktivitas sistem.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => {
                  const label = getActionLabel(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(log.createdAt).toLocaleString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          day: '2-digit',
                          month: 'short'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${label.color} font-sans`}>
                          {label.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{log.user?.fullName || 'Sistem Otomatis'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.user?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate" title={log.metadataJson || ''}>
                        {log.metadataJson || '-'}
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
