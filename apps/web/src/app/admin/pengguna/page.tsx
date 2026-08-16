"use client";

import { Search, User, Calendar, ShieldCheck, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getPenggunaAction } from "./actions";

export default function AdminPenggunaPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getPenggunaAction();
      setUsers(data);
    } catch (error) {
      console.error("Gagal mengambil data pengguna:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const getNewThisWeek = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return users.filter(u => new Date(u.created_at) >= oneWeekAgo).length;
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden gap-6 p-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif font-bold text-brand-navy text-2xl">Manajemen Pengguna</h1>
          <p className="text-gray-500 text-sm">Kelola akun pelanggan dan pantau aktivitas mereka</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center rounded py-2 px-3 gap-2 bg-white border border-slate-300 focus-within:border-brand-navy focus-within:ring-1 focus-within:ring-brand-navy transition-all w-full sm:w-auto">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-sm text-brand-navy placeholder:text-gray-400 w-full sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* User Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between hover:shadow transition-shadow">
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Total Pengguna</span>
            <span className="text-2xl font-bold text-brand-navy">{users.length}</span>
          </div>
          <div className="w-10 h-10 rounded flex items-center justify-center bg-slate-50 border border-slate-200 text-brand-navy">
            <User size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between hover:shadow transition-shadow">
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Baru Minggu Ini</span>
            <span className="text-2xl font-bold text-brand-navy">{getNewThisWeek()}</span>
          </div>
          <div className="w-10 h-10 rounded flex items-center justify-center bg-blue-50 border border-blue-200 text-blue-600">
            <Calendar size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between hover:shadow transition-shadow">
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Akun Aktif</span>
            <span className="text-2xl font-bold text-brand-navy">100%</span>
          </div>
          <div className="w-10 h-10 rounded flex items-center justify-center bg-green-50 border border-green-200 text-green-600">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="flex flex-col flex-1 overflow-hidden rounded bg-white border border-slate-200 shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse relative min-w-[800px]">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px]">Nama Pengguna</th>
                <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px]">Email</th>
                <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px]">Tgl Bergabung</th>
                <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px]">Total Pesanan</th>
                <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 overflow-y-auto">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-evergreen mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Memuat data pengguna...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <User size={32} className="text-gray-300" />
                      <p className="text-sm font-medium text-brand-navy">Tidak ada data pengguna</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-brand-navy font-bold text-xs uppercase shadow-sm">
                          {getInitials(user.full_name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-brand-navy text-sm">{user.full_name || 'Tanpa Nama'}</span>
                          <span className="text-gray-500 text-[11px]">{user.phone || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm font-mono">{user.email || '-'}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {user.total_orders} Pesanan
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium bg-green-100 border border-green-200 text-green-800">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
