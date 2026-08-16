import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import UserActionButtons from "./UserActionButtons";
import { User, CheckCircle2, ShieldAlert, Clock, Mail, Phone, Calendar } from "lucide-react";

export const revalidate = 0;

export default async function OwnerPenggunaPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; filter?: string }>;
}) {
  const adminClient = createAdminClient();
  const supabase = await createClient();

  // Get current owner ID for logging
  const { data: { user: owner } } = await supabase.auth.getUser();
  const ownerId = owner?.id || '';

  // Get search params
  const resolvedParams = await searchParams;
  const query = resolvedParams.query || "";
  const filter = resolvedParams.filter || "all";

  // Fetch users with role='user'
  const { data: users, error: usersError } = await adminClient
    .from("users")
    .select("id, full_name, email, phone, is_active, created_at")
    .eq("role", "user")
    .order("created_at", { ascending: false });

  if (usersError) {
    console.error("Gagal mengambil data pelanggan:", usersError);
  }

  // Fetch orders to calculate total orders per user
  const { data: orders } = await adminClient
    .from("orders")
    .select("id, user_id, status");

  // Calculate order stats in memory
  const orderStats = (orders || []).reduce((acc: any, order: any) => {
    if (!acc[order.user_id]) {
      acc[order.user_id] = { total: 0, completed: 0 };
    }
    acc[order.user_id].total += 1;
    if (order.status === "completed") {
      acc[order.user_id].completed += 1;
    }
    return acc;
  }, {});

  // Apply search query and filter
  const filteredUsers = (users || []).filter((u: any) => {
    const nameMatch = u.full_name?.toLowerCase().includes(query.toLowerCase());
    const emailMatch = u.email?.toLowerCase().includes(query.toLowerCase());
    const phoneMatch = u.phone?.includes(query);
    const queryMatch = nameMatch || emailMatch || phoneMatch;

    if (filter === "active") {
      return queryMatch && u.is_active;
    } else if (filter === "suspended") {
      return queryMatch && !u.is_active;
    }

    return queryMatch;
  });

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-brand-navy tracking-tight">Daftar Pelanggan</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau seluruh akun pelanggan platform Kasihi dan kelola status pemblokiran akses mereka.
        </p>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <form className="flex items-center gap-2 w-full md:max-w-md">
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Cari pelanggan berdasarkan nama, email, atau telp..."
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-evergreen/20 focus:border-brand-evergreen transition-all"
          />
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <button type="submit" className="px-5 py-3 rounded-2xl bg-brand-navy text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer">
            Cari
          </button>
        </form>

        {/* Filter Quick Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/50 self-start md:self-auto">
          {[
            { label: "Semua", value: "all" },
            { label: "Aktif", value: "active" },
            { label: "Ditangguhkan", value: "suspended" }
          ].map((item) => {
            const isActive = filter === item.value;
            return (
              <a
                key={item.value}
                href={`?filter=${item.value}${query ? `&query=${query}` : ""}`}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-white text-brand-navy shadow-sm"
                    : "text-slate-500 hover:text-brand-navy"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Nama Pelanggan</th>
                <th className="px-6 py-4">Kontak</th>
                <th className="px-6 py-4">Tanggal Terdaftar</th>
                <th className="px-6 py-4">Riwayat Pesanan</th>
                <th className="px-6 py-4">Status Akun</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u: any) => {
                  const stats = orderStats[u.id] || { total: 0, completed: 0 };
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                            <User size={18} />
                          </div>
                          <span className="font-bold text-slate-800">{u.full_name || 'Tanpa Nama'}</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Mail size={12} className="text-slate-400" /> {u.email || '-'}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <Phone size={12} className="text-slate-400" /> {u.phone || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Date Joined */}
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(u.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Orders summary */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-xs font-bold">
                          <span className="flex flex-col">
                            <span className="text-brand-navy">{stats.total}</span>
                            <span className="text-[10px] text-slate-400 font-normal mt-0.5">Total Order</span>
                          </span>
                          <span className="flex flex-col">
                            <span className="text-emerald-500">{stats.completed}</span>
                            <span className="text-[10px] text-slate-400 font-normal mt-0.5">Selesai</span>
                          </span>
                        </div>
                      </td>

                      {/* Account status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          u.is_active 
                            ? 'bg-emerald-500/10 text-emerald-600' 
                            : 'bg-rose-500/10 text-rose-600 animate-pulse'
                        }`}>
                          {u.is_active ? <CheckCircle2 size={10} /> : <ShieldAlert size={10} />}
                          {u.is_active ? 'Aktif' : 'Ditangguhkan'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <UserActionButtons
                            userId={u.id}
                            isActive={u.is_active}
                            ownerId={ownerId}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs font-semibold">
                    Tidak ada data pelanggan ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
