'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Edit2,
  Key,
  Trash2,
  Loader2,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentUserSession, setCurrentUserSession] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active User State for Modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form States
  const [addForm, setAddForm] = useState({ fullName: '', email: '', password: '', role: 'candidate', isActive: true });
  const [editForm, setEditForm] = useState({ fullName: '', email: '', role: 'candidate', isActive: true });
  const [resetPasswordText, setResetPasswordText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?query=${encodeURIComponent(searchQuery)}&role=${roleFilter}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Gagal mengambil data pengguna.');
      }
    } catch (e) {
      setError('Koneksi internet bermasalah.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch current session info
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUserSession(data.session?.userId || null);
        }
      } catch (e) {}
    }
    fetchSession();
  }, []);

  // Fetch users when query/filter changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, roleFilter]);

  // Toast auto-dismiss
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Handle Add User
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Pengguna ${addForm.fullName} berhasil ditambahkan.`);
        setIsAddModalOpen(false);
        setAddForm({ fullName: '', email: '', password: '', role: 'candidate', isActive: true });
        fetchUsers();
      } else {
        setError(data.error || 'Gagal menambahkan pengguna.');
      }
    } catch (err) {
      setError('Koneksi bermasalah.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Profil pengguna berhasil diperbarui.');
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        setError(data.error || 'Gagal memperbarui profil.');
      }
    } catch (err) {
      setError('Koneksi bermasalah.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reset Password Modal
  const openResetModal = (user: User) => {
    setSelectedUser(user);
    setResetPasswordText('');
    setIsResetModalOpen(true);
  };

  // Handle Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPasswordText })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Password untuk ${selectedUser.fullName} berhasil di-reset.`);
        setIsResetModalOpen(false);
      } else {
        setError(data.error || 'Gagal meriset password.');
      }
    } catch (err) {
      setError('Koneksi bermasalah.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Handle Delete User
  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Pengguna berhasil dihapus.');
        setIsDeleteModalOpen(false);
        fetchUsers();
      } else {
        setError(data.error || 'Gagal menghapus pengguna.');
      }
    } catch (err) {
      setError('Koneksi bermasalah.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'instructor': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'candidate': return 'text-[#00d8f6] bg-[#00d8f6]/10 border-[#00d8f6]/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-200">
      
      {/* Toast Banner Notifications */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl flex items-center space-x-3 shadow-2xl backdrop-blur-md animate-fade-in">
          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4 text-red-300 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Tata Kelola Pengguna
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tambah admin baru, instruktur pembuat modul, atau daftarkan kandidat rekrutmen secara instan.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-violet-900/20 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 shadow-md">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau alamat email pengguna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#030712] border border-slate-800 focus:border-[#00d8f6] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#030712] border border-slate-800 focus:border-[#00d8f6] rounded-lg text-xs text-slate-300 focus:outline-none transition-colors"
          >
            <option value="">Semua Peran (Role)</option>
            <option value="admin">Administrator</option>
            <option value="instructor">Instruktur (Staff)</option>
            <option value="candidate">Kandidat (Peserta)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Alamat Email</th>
                <th className="py-3 px-4 text-center">Peran</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#00d8f6]" />
                      <span>Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                    Tidak ditemukan pengguna yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white font-sans">
                      {user.fullName}
                      {user.id === currentUserSession && (
                        <span className="ml-2 text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.25 rounded border border-blue-500/25">Anda</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {user.email}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded border capitalize font-sans ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        user.isActive 
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                          : 'text-slate-500 bg-slate-800 border border-slate-700/50'
                      }`}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center space-x-2.5">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-slate-400 hover:text-[#00d8f6] bg-[#030712] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
                          title="Edit Profil"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openResetModal(user)}
                          className="p-1.5 text-slate-400 hover:text-purple-400 bg-[#030712] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          disabled={user.id === currentUserSession}
                          className="p-1.5 text-slate-500 hover:text-red-400 bg-[#030712] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. MODAL ADD USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 to-cyan-500"></div>
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/20">
              <h3 className="font-sans font-bold text-sm text-white">Tambah Pengguna Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={addForm.fullName}
                  onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2 bg-[#030712] border border-slate-800 focus:border-[#00d8f6] rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="budi@domain.com"
                  className="w-full px-3.5 py-2 bg-[#030712] border border-slate-800 focus:border-[#00d8f6] rounded-lg text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password Awal</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Min. 6 karakter"
                  className="w-full px-3.5 py-2 bg-[#030712] border border-slate-800 focus:border-[#00d8f6] rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peran (Role)</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#030712] border border-slate-800 focus:border-[#00d8f6] rounded-lg text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="candidate">Candidate</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Akun</label>
                  <div className="flex items-center h-9">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addForm.isActive}
                        onChange={(e) => setAddForm({ ...addForm, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00d8f6]"></div>
                      <span className="ml-2 text-xs text-slate-300 font-mono font-bold uppercase tracking-wider">
                        {addForm.isActive ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL EDIT USER */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 to-cyan-500"></div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/20">
              <h3 className="font-sans font-bold text-sm text-white">Edit Profil Pengguna</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#030712] border border-slate-800 focus:border-[#00d8f6] rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#030712] border border-slate-800 focus:border-[#00d8f6] rounded-lg text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peran (Role)</label>
                  <select
                    value={editForm.role}
                    disabled={selectedUser.id === currentUserSession}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#030712] border border-slate-800 focus:border-[#00d8f6] rounded-lg text-xs text-slate-300 focus:outline-none disabled:opacity-50"
                  >
                    <option value="candidate">Candidate</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Akun</label>
                  <div className="flex items-center h-9">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        disabled={selectedUser.id === currentUserSession}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00d8f6] peer-disabled:opacity-50"></div>
                      <span className="ml-2 text-xs text-slate-300 font-mono font-bold uppercase tracking-wider">
                        {editForm.isActive ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {selectedUser.id === currentUserSession && (
                <p className="text-[10px] text-slate-500 italic">
                  *Anda tidak dapat merubah peran atau keaktifan akun admin Anda sendiri demi keamanan login.
                </p>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Perbarui Profil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL RESET PASSWORD */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 to-cyan-500"></div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/20">
              <h3 className="font-sans font-bold text-sm text-white">Reset Password Pengguna</h3>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-[#030712] border border-slate-800 rounded-lg text-xs text-slate-400">
                <span>Merubah kredensial masuk untuk </span>
                <span className="font-semibold text-white">{selectedUser.fullName}</span>
                <span className="font-mono text-slate-500 block text-[11px] mt-0.5">({selectedUser.email})</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password Baru</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetPasswordText}
                  onChange={(e) => setResetPasswordText(e.target.value)}
                  placeholder="Masukkan password baru (Min. 6 karakter)"
                  className="w-full px-3.5 py-2 bg-[#030712] border border-slate-800 focus:border-[#00d8f6] rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Terapkan Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL DELETE USER */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl w-full max-w-sm overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500"></div>

            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-sans font-bold text-sm text-white">Hapus Pengguna Secara Permanen?</h3>
                <p className="text-xs text-slate-400 leading-relaxed px-2">
                  Apakah Anda yakin ingin menghapus akun <span className="font-semibold text-slate-200">{selectedUser.fullName}</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
                {selectedUser.role === 'candidate' && (
                  <p className="text-[10px] text-red-400 font-medium">
                    *Seluruh riwayat pengerjaan ujian & progres modul belajar kandidat ini akan ikut terhapus dari sistem.
                  </p>
                )}
                {selectedUser.role === 'instructor' && (
                  <p className="text-[10px] text-slate-500 italic leading-snug">
                    *Penghapusan akan ditolak sistem jika instruktur masih memiliki ketergantungan modul belajar atau bank soal aktif.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex justify-center space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Hapus Permanen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
