import { Star, Clock, CheckCircle2, Wallet, UserCircle, MapPin, Check, X, FileText, MessageSquare, Quote } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";

export default async function MitraDashboardPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Dapatkan user yang sedang login
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login');
  }

  // 2. Ambil data mitra
  const { data: mitra } = await supabase
    .from('mitras')
    .select('*, users!inner(full_name)')
    .eq('user_id', user.id)
    .single();

  if (!mitra) {
    // Jika user login tapi tidak ada di tabel mitra, mungkin belum daftar atau role salah
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <UserCircle size={64} className="text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-brand-navy">Profil Mitra Tidak Ditemukan</h1>
        <p className="text-gray-500 mt-2">Pastikan Anda telah terdaftar sebagai mitra Kasihi.</p>
        <Link href="/" className="mt-6 text-brand-evergreen font-bold">Kembali ke Beranda</Link>
      </div>
    );
  }

  // 3. Ambil statistik pesanan untuk mitra ini dengan adminClient untuk bypass RLS
  const { data: orders } = await adminClient
    .from('orders')
    .select(`
      id,
      order_number,
      patient_name,
      patient_age,
      patient_condition,
      status,
      created_at,
      hospitals:hospital_id (name, address),
      service_packages:package_id (name, duration_hours, base_price)
    `)
    .eq('mitra_id', mitra.id)
    .order('created_at', { ascending: false });

  // 4. Ambil ulasan dari pelanggan untuk mitra ini dengan adminClient
  const { data: dbReviews } = await adminClient
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      users:user_id (full_name)
    `)
    .eq('mitra_id', mitra.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const reviews = dbReviews || [];

  const safeOrders = orders || [];
  const activeOrdersCount = safeOrders.filter(o => o.status === 'in_progress').length;
  const completedOrdersCount = safeOrders.filter(o => o.status === 'completed').length;
  
  // Hitung pendapatan
  const totalEarnings = safeOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => {
      const pkg: any = Array.isArray(o.service_packages) ? o.service_packages[0] : o.service_packages;
      return sum + (pkg?.base_price || 0);
    }, 0);

  const formattedEarnings = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(totalEarnings);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col flex-1 gap-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-[#1A2332] text-[22px]">Halo, {mitra.users?.full_name}!</h1>
          <p className="text-[#6B7B8D] text-[13px]">{today}</p>
        </div>
        <div className="flex items-center rounded-xl py-2 px-3.5 gap-2 bg-[#EFF8F4] border border-emerald-100 self-start md:self-auto shadow-sm">
          <Star size={16} className="text-brand-alpine fill-brand-alpine" />
          <span className="font-bold text-brand-evergreen text-[13px]">
            {mitra.average_rating > 0 ? `${Number(mitra.average_rating).toFixed(1)} (${mitra.total_reviews || 0} Ulasan)` : 'Belum ada ulasan'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E8F0F0] flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
             <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Clock size={18} />
             </div>
             <span className="font-medium text-[#6B7B8D] text-xs">Pesanan Aktif</span>
          </div>
          <span className="font-black text-[#1A2332] text-3xl">{activeOrdersCount}</span>
          <span className="text-[#9CA3AF] text-xs">Sedang berjalan</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8F0F0] flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full -mr-8 -mt-8" />
          <div className="flex items-center gap-2 relative z-10">
             <div className="p-2 rounded-lg bg-orange-50 text-brand-alpine">
                <Clock size={18} />
             </div>
             <span className="font-medium text-[#6B7B8D] text-xs">Total Selesai</span>
          </div>
          <span className="font-black text-brand-alpine text-3xl relative z-10">{completedOrdersCount}</span>
          <span className="text-[#9CA3AF] text-xs relative z-10">Pesanan tuntas</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8F0F0] flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
             <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
                <CheckCircle2 size={18} />
             </div>
             <span className="font-medium text-[#6B7B8D] text-xs">Total Pesanan</span>
          </div>
          <span className="font-black text-[#1A2332] text-3xl">{safeOrders.length}</span>
          <span className="text-[#9CA3AF] text-xs">Selama bergabung</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8F0F0] flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
             <div className="p-2 rounded-lg bg-emerald-50 text-brand-evergreen">
                <Wallet size={18} />
             </div>
             <span className="font-medium text-[#6B7B8D] text-xs">Pendapatan</span>
          </div>
          <span className="font-black text-brand-evergreen text-xl md:text-2xl">{formattedEarnings}</span>
          <span className="text-emerald-600 font-medium text-xs">Total estimasi</span>
        </div>
      </div>

      {/* Bottom Section: Tasks & Reviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Daftar Tugas List (Col Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8F0F0] shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between py-5 px-6 border-b border-[#E8F0F0] bg-gray-50/50">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-[#1A2332] text-lg">Tugas Pendampingan</h2>
              {activeOrdersCount > 0 && (
                <div className="rounded-full py-1 px-3 bg-blue-100 border border-blue-200">
                  <span className="font-bold text-blue-600 text-[11px]">{activeOrdersCount} Aktif</span>
                </div>
              )}
            </div>
            <Link href="/mitra/pesanan" className="text-sm font-semibold text-brand-evergreen hover:underline">
               Lihat Semua
            </Link>
          </div>

          <div className="divide-y divide-[#E8F0F0]">
            {safeOrders.length > 0 ? safeOrders.slice(0, 5).map((order) => {
              const hospital: any = Array.isArray(order.hospitals) ? order.hospitals[0] : order.hospitals;
              const pkg: any = Array.isArray(order.service_packages) ? order.service_packages[0] : order.service_packages;
              return (
                <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-brand-evergreen text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`rounded-md py-1 px-2.5 text-[10px] font-bold uppercase tracking-wider border ${
                        order.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        order.status === 'completed' ? 'bg-emerald-50 text-brand-evergreen border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <UserCircle size={16} className="text-gray-400" />
                       <span className="font-semibold text-[#1A2332] text-sm">Pasien: {order.patient_name} ({order.patient_age} thn)</span>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-1">
                       <div className="flex items-center gap-2 text-[#6B7B8D] text-[13px]">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{hospital?.name || 'Lokasi tidak tersedia'}</span>
                       </div>
                       <div className="flex items-center gap-2 text-[#6B7B8D] text-[13px]">
                          <Clock size={14} className="text-gray-400" />
                          <span>{new Date(order.created_at).toLocaleDateString('id-ID')} • {pkg?.name} ({pkg?.duration_hours} Jam)</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <Link href={`/mitra/pesanan/${order.id}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl py-2.5 px-6 bg-brand-evergreen text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                      <FileText size={16} /> Detail Tugas
                    </Link>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Clock size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium">Belum ada tugas pendampingan yang ditetapkan untuk Anda.</p>
                <p className="text-gray-400 text-sm mt-1">Admin akan menghubungi Anda jika ada pesanan baru yang sesuai.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ulasan Pelanggan (Col Span 1) */}
        <div className="bg-white rounded-2xl border border-[#E8F0F0] shadow-sm flex flex-col overflow-hidden self-start w-full">
          <div className="flex items-center justify-between py-5 px-6 border-b border-[#E8F0F0] bg-gray-50/50">
            <h2 className="font-bold text-[#1A2332] text-lg">Ulasan Pelanggan</h2>
            {mitra.average_rating > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Star size={13} fill="#F59E0B" className="text-amber-500" />
                <span className="font-bold text-amber-700 text-xs">{Number(mitra.average_rating).toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="divide-y divide-[#E8F0F0] max-h-[480px] overflow-y-auto custom-scrollbar">
            {reviews.length > 0 ? (
              reviews.map((r: any) => (
                <div key={r.id} className="p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-[#1A2332] text-xs truncate max-w-[120px]">{r.users?.full_name || "Pengguna Anonim"}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{new Date(r.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={11}
                        className={s <= r.rating ? "text-amber-500 fill-amber-500" : "text-gray-200"}
                      />
                    ))}
                  </div>

                  <div className="relative pl-3.5 border-l-2 border-emerald-100">
                    <Quote className="text-emerald-100/60 absolute -top-1 -left-1 transform -scale-x-100" size={16} />
                    <p className="text-xs text-gray-600 leading-relaxed italic relative z-10">
                      "{r.comment}"
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <MessageSquare size={36} className="text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm font-semibold">Belum Ada Ulasan</p>
                <p className="text-gray-400 text-xs mt-1">Ulasan dari pelanggan akan muncul setelah pendampingan tuntas.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
