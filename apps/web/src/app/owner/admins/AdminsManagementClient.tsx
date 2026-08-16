"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Phone, 
  Shield, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Clock, 
  Lock,
  Save,
  Loader2,
  ListFilter
} from "lucide-react";
import { updateAdminProfileAction } from "../actions";

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  created_at: string;
  resource_type: string;
  resource_id: string;
  users: {
    full_name: string | null;
    email: string;
  } | {
    full_name: string | null;
    email: string;
  }[] | null;
}

interface AdminsManagementClientProps {
  admins: AdminUser[];
  logs: ActivityLog[];
}

export default function AdminsManagementClient({
  admins,
  logs
}: AdminsManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state for editing admins
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    is_active: true
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter logs state
  const [selectedAdminId, setSelectedAdminId] = useState<string>("all");

  const startEdit = (admin: AdminUser) => {
    setEditingAdminId(admin.id);
    setEditForm({
      full_name: admin.full_name || "",
      phone: admin.phone || "",
      is_active: admin.is_active
    });
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent, adminId: string) => {
    e.preventDefault();
    setMessage(null);

    if (!editForm.full_name.trim()) {
      setMessage({ type: "error", text: "Nama lengkap tidak boleh kosong." });
      return;
    }

    startTransition(async () => {
      const res = await updateAdminProfileAction(adminId, {
        full_name: editForm.full_name,
        phone: editForm.phone,
        is_active: editForm.is_active
      });

      if (res.success) {
        setMessage({ type: "success", text: "Profil admin berhasil diperbarui." });
        setEditingAdminId(null);
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Gagal memperbarui profil." });
      }
    });
  };

  // Helper for action display names
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      register_mitra: "Mendaftar Mitra Baru",
      approve_mitra: "Menyetujui Verifikasi Mitra",
      reject_mitra: "Menolak Verifikasi Mitra",
      suspend_mitra: "Menonaktifkan Akun Mitra",
      unsuspend_mitra: "Mengaktifkan Kembali Mitra",
      suspend_user: "Menonaktifkan Akun Pengguna",
      unsuspend_user: "Mengaktifkan Kembali Pengguna",
      approve_withdrawal: "Menyetujui Penarikan Dana",
      reject_withdrawal: "Menolak Penarikan Dana",
      assign_mitra: "Menetapkan Mitra ke Pesanan",
      update_order_status: "Memperbarui Status Pesanan",
      system_setting_update: "Mengubah Pengaturan Sistem",
      verify_payment: "Memverifikasi Pembayaran"
    };
    return labels[action] || action.replace(/_/g, " ");
  };

  // Helper for action badge colors
  const getActionBadgeColor = (action: string) => {
    if (action.includes("approve") || action.includes("unsuspend") || action.includes("verify")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    }
    if (action.includes("reject") || action.includes("suspend")) {
      return "bg-rose-50 text-rose-700 border-rose-200/50";
    }
    return "bg-slate-50 text-slate-700 border-slate-200/50";
  };

  // Calculate stats
  const getAdminStats = (adminId: string) => {
    return logs.filter(log => log.admin_id === adminId).length;
  };

  // Filter logs list
  const filteredLogs = logs.filter(log => {
    if (selectedAdminId === "all") return true;
    return log.admin_id === selectedAdminId;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Overview Cards comparing Admin 1 and Admin 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {admins.map((admin, idx) => {
          const totalActivity = getAdminStats(admin.id);
          const isAdmin1 = admin.email === "admin@penjagahati.com";
          const adminTitle = isAdmin1 ? "Admin 1 (Ops & CS)" : "Admin 2 (Keuangan & Administrasi)";

          return (
            <div 
              key={admin.id} 
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden"
            >
              {/* Decorative side accent */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${isAdmin1 ? "bg-blue-500" : "bg-emerald-500"}`} />

              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {adminTitle}
                  </span>
                  <h3 className="text-xl font-black text-brand-navy truncate max-w-[220px]">
                    {admin.full_name || "Belum diatur"}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium italic">{admin.email}</span>
                </div>
                
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  admin.is_active 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/30" 
                    : "bg-rose-50 text-rose-700 border border-rose-200/30"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {admin.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              {/* Quick info row */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktivitas Tercatat</span>
                  <span className="text-2xl font-black text-brand-navy mt-1 flex items-baseline gap-1.5">
                    {totalActivity}
                    <span className="text-[10px] text-slate-400 font-medium">tindakan</span>
                  </span>
                </div>

                <div className="flex flex-col justify-end items-end">
                  <button
                    onClick={() => startEdit(admin)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:border-brand-navy hover:bg-slate-50 text-xs font-bold text-slate-600 hover:text-brand-navy transition-all duration-300"
                  >
                    Edit Profil
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Form Panel (if editing) */}
      {editingAdminId && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-brand-navy text-lg">
                Edit Profil Admin: {admins.find(a => a.id === editingAdminId)?.email}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Perbarui nama, nomor telepon, dan status otorisasi sistem.</p>
            </div>
            <button
              onClick={() => setEditingAdminId(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Batal
            </button>
          </div>

          <form onSubmit={(e) => handleSave(e, editingAdminId)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="Nama Lengkap Admin"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-evergreen/20 focus:border-brand-evergreen transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor Telepon</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone size={16} />
                </div>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="0812xxxxxxxx"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-evergreen/20 focus:border-brand-evergreen transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 justify-end">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Akun Aktif</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>
            </div>

            {message && (
              <div className={`md:col-span-3 p-4 rounded-2xl text-xs font-bold ${
                message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}>
                {message.text}
              </div>
            )}

            <div className="md:col-span-3 flex justify-end gap-3 mt-2 border-t border-slate-50 pt-4">
              <button
                type="button"
                onClick={() => setEditingAdminId(null)}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-evergreen text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all duration-300"
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activity Log Audit Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <Activity size={18} />
              </div>
              <h3 className="font-black text-brand-navy text-lg">Log Audit Aktivitas Staf</h3>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Rincian seluruh tindakan administratif yang direkam oleh sistem.</p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-2xl shadow-sm text-xs font-bold text-slate-600">
            <ListFilter size={14} className="text-slate-400" />
            <span>Filter Admin:</span>
            <select
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              className="bg-transparent border-none text-brand-navy font-black focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Admin</option>
              {admins.map(a => (
                <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Waktu</th>
                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Admin</th>
                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tindakan</th>
                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Sumber Daya</th>
                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">ID Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.map((log) => {
                    const logTime = new Date(log.created_at).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    
                    const userObj = Array.isArray(log.users) ? log.users[0] : log.users;
                    const adminName = userObj?.full_name || userObj?.email || "Sistem";
                    const isAdmin1 = userObj?.email === "admin@penjagahati.com";

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 text-xs text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
                          <Clock size={12} className="text-slate-300" />
                          {logTime}
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-brand-navy">{adminName}</span>
                            <span className="text-[9px] text-slate-400 italic">
                              {isAdmin1 ? "Admin 1 (Ops)" : "Admin 2 (Keuangan)"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md ${getActionBadgeColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="py-4 text-xs font-bold text-brand-navy capitalize whitespace-nowrap">
                          {log.resource_type}
                        </td>
                        <td className="py-4 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                          {log.resource_id?.substring(0, 8) || "-"}...
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs flex flex-col items-center gap-2">
              <Shield size={24} className="text-slate-200" />
              Belum ada riwayat aktivitas yang terekam untuk pilihan admin ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
