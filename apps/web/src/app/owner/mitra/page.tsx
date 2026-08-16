import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import MitraActionButtons from "./MitraActionButtons";
import { Star, ShieldAlert, ShieldCheck, CheckCircle2, UserCircle2, Clock } from "lucide-react";

export const revalidate = 0;

export default async function OwnerMitraPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; filter?: string }>;
}) {
  const adminClient = createAdminClient();
  const supabase = await createClient();

  // Get current owner ID for logs
  const { data: { user: owner } } = await supabase.auth.getUser();
  const ownerId = owner?.id || '';

  // Get parameters
  const resolvedParams = await searchParams;
  const query = resolvedParams.query || "";
  const filter = resolvedParams.filter || "all";

  // Fetch all mitras
  const { data: mitras, error } = await adminClient
    .from("mitras")
    .select("id, is_verified, bio, experience, specialization, rating, total_orders_completed, users (id, full_name, email, phone, is_active)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil data mitra:", error);
  }

  // Filter and search mitras in memory
  const filteredMitras = (mitras || []).filter((m: any) => {
    const user = m.users;
    if (!user) return false;

    // Search query match
    const nameMatch = user.full_name?.toLowerCase().includes(query.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(query.toLowerCase());
    const queryMatch = nameMatch || emailMatch;

    // Filter match
    if (filter === "pending") {
      return queryMatch && !m.is_verified;
    } else if (filter === "verified") {
      return queryMatch && m.is_verified && user.is_active;
    } else if (filter === "suspended") {
      return queryMatch && !user.is_active;
    }

    return queryMatch;
  });

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-brand-navy tracking-tight">Kelola Mitra Pendamping</h1>
        <p className="text-slate-500 text-sm mt-1">
          Setujui berkas pendaftaran mitra pendamping baru atau tangguhkan akun yang melanggar ketentuan layanan.
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
            placeholder="Cari mitra berdasarkan nama atau email..."
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
            { label: "Menunggu Verifikasi", value: "pending" },
            { label: "Aktif", value: "verified" },
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

      {/* Mitra List Grid/Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Nama & Kontak</th>
                <th className="px-6 py-4">Keahlian & Pengalaman</th>
                <th className="px-6 py-4">Status & Rating</th>
                <th className="px-6 py-4">Biografi Singkat</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMitras.length > 0 ? (
                filteredMitras.map((m: any) => {
                  const user = m.users;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Name & Contact */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <UserCircle2 size={24} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-800 text-sm truncate">{user.full_name}</span>
                            <span className="text-xs text-slate-400 truncate mt-0.5">{user.email || 'Tidak ada email'}</span>
                            <span className="text-xs text-slate-400 truncate mt-0.5">{user.phone || 'Tidak ada telp'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Specialization & Experience */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700 text-xs">{m.specialization || 'Umum'}</span>
                          <span className="text-xs text-slate-400 mt-1">{m.experience || 0} tahun pengalaman</span>
                        </div>
                      </td>

                      {/* Status & Rating */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          {/* Badges */}
                          <div className="flex items-center gap-1.5">
                            {/* Verification Badge */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              m.is_verified 
                                ? 'bg-emerald-500/10 text-emerald-600' 
                                : 'bg-amber-500/10 text-amber-600 animate-pulse'
                            }`}>
                              {m.is_verified ? <ShieldCheck size={10} /> : <Clock size={10} />}
                              {m.is_verified ? 'Terverifikasi' : 'Menunggu'}
                            </span>

                            {/* Active Status Badge */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              user.is_active 
                                ? 'bg-brand-navy/10 text-brand-navy' 
                                : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {user.is_active ? <CheckCircle2 size={10} /> : <ShieldAlert size={10} />}
                              {user.is_active ? 'Aktif' : 'Suspended'}
                            </span>
                          </div>

                          {/* Rating and Orders */}
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star size={12} fill="currentColor" /> {m.rating || "0.0"}
                            </span>
                            <span>•</span>
                            <span>{m.total_orders_completed || 0} Selesai</span>
                          </div>
                        </div>
                      </td>

                      {/* Bio */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed" title={m.bio}>
                          {m.bio || 'Tidak ada deskripsi biografi.'}
                        </p>
                      </td>

                      {/* Action buttons client mount */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <MitraActionButtons
                            mitraId={m.id}
                            userId={user.id}
                            isVerified={m.is_verified}
                            isActive={user.is_active}
                            ownerId={ownerId}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-xs font-semibold">
                    Tidak ada data mitra pendamping ditemukan.
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
