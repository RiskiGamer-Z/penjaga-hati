import { createAdminClient } from "@/utils/supabase/admin";
import Link from "next/link";
import { 
  TrendingUp, 
  Users as UsersIcon, 
  ShoppingBag, 
  Briefcase, 
  CreditCard, 
  ArrowUpRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Percent
} from "lucide-react";
import DashboardChartsClient from "./DashboardChartsClient";

export const revalidate = 0; // Disable caching to fetch real-time dashboard data

export default async function OwnerDashboardPage() {
  const adminClient = createAdminClient();

  // 1. Fetch System Settings (Commission Percentage)
  const { data: settingData } = await adminClient
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "commission_percentage")
    .single();
  const commPercent = settingData ? parseFloat(settingData.setting_value) : 15;

  // 2. Fetch Payments (Verified) for Revenue Stats
  const { data: payments } = await adminClient
    .from("payments")
    .select("amount, status, created_at");

  const verifiedPayments = payments?.filter(p => p.status === 'verified') || [];
  const totalRevenue = verifiedPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalCommissions = totalRevenue * (commPercent / 100);

  // --- AGGREGATION LOGIC FOR CHARTS ---
  const today = new Date();
  
  // A. Daily Data (Last 7 Days)
  const dailyData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const dayLabel = d.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
    
    const amount = verifiedPayments
      .filter(p => {
        const pDate = new Date(p.created_at);
        return pDate.getDate() === d.getDate() &&
               pDate.getMonth() === d.getMonth() &&
               pDate.getFullYear() === d.getFullYear();
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return { label: dayLabel, amount };
  });

  // B. Weekly Data (Last 4 Weeks)
  const weeklyData = Array.from({ length: 4 }).map((_, i) => {
    const daysAgoStart = (3 - i) * 7 + 6;
    const daysAgoEnd = (3 - i) * 7;
    
    const start = new Date();
    start.setDate(today.getDate() - daysAgoStart);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date();
    end.setDate(today.getDate() - daysAgoEnd);
    end.setHours(23, 59, 59, 999);

    const label = i === 3 ? "Minggu Ini" : `${3 - i} Mgg Lalu`;
    
    const amount = verifiedPayments
      .filter(p => {
        const pDate = new Date(p.created_at);
        return pDate >= start && pDate <= end;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return { label, amount };
  });

  // C. Monthly Data (Last 6 Months)
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(today.getMonth() - (5 - i));
    const label = d.toLocaleDateString("id-ID", { month: 'short', year: '2-digit' });
    
    const amount = verifiedPayments
      .filter(p => {
        const pDate = new Date(p.created_at);
        return pDate.getMonth() === d.getMonth() && pDate.getFullYear() === d.getFullYear();
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return { label, amount };
  });

  // 3. Fetch Mitra Withdrawals
  const { data: withdrawals } = await adminClient
    .from("mitra_withdrawals")
    .select("amount, status");

  const completedWithdrawals = withdrawals?.filter(w => w.status === 'completed') || [];
  const totalWithdrawalsAmount = completedWithdrawals.reduce((acc, w) => acc + Number(w.amount), 0);

  const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending') || [];
  const totalPendingWithdrawalsAmount = pendingWithdrawals.reduce((acc, w) => acc + Number(w.amount), 0);

  // Net Profit
  const netProfit = totalCommissions - totalWithdrawalsAmount;

  // 4. Fetch Users (Customers vs Mitras)
  const { count: totalUsers } = await adminClient
    .from("users")
    .select("*", { count: 'exact', head: true })
    .eq("role", "user");

  const { count: activeMitras } = await adminClient
    .from("mitras")
    .select("*", { count: 'exact', head: true })
    .eq("is_verified", true);

  const { count: pendingMitras } = await adminClient
    .from("mitras")
    .select("*", { count: 'exact', head: true })
    .eq("is_verified", false);

  // 5. Fetch Orders & Status Breakdown
  const { data: orders } = await adminClient
    .from("orders")
    .select("id, status, total_amount, created_at, patient_name, users (full_name)");

  const totalOrders = orders?.length || 0;
  const completedOrders = orders?.filter(o => o.status === 'completed')?.length || 0;
  const activeOrders = orders?.filter(o => ['accepted', 'in_transit', 'arrived', 'in_progress'].includes(o.status))?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending_payment' || o.status === 'waiting_mitra')?.length || 0;
  const cancelledOrders = orders?.filter(o => o.status === 'cancelled')?.length || 0;

  // Order success rate
  const successRate = totalOrders > 0 ? Math.round(((completedOrders) / (totalOrders - pendingOrders)) * 100) : 100;

  // 6. Fetch Recent Payments for audit trail
  const { data: recentPayments } = await adminClient
    .from("payments")
    .select("id, amount, status, created_at, method:payment_method, users (full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const statsCards = [
    {
      title: "Total Omzet (Revenue)",
      value: formatCurrency(totalRevenue),
      desc: "Semua pembayaran terverifikasi",
      icon: TrendingUp,
      color: "bg-emerald-600",
      textColor: "text-white"
    },
    {
      title: `Komisi Platform (${commPercent}%)`,
      value: formatCurrency(totalCommissions),
      desc: "Pendapatan kotor platform",
      icon: Percent,
      color: "bg-teal-600",
      textColor: "text-white"
    },
    {
      title: "Profit Bersih Platform",
      value: formatCurrency(netProfit),
      desc: "Komisi dikurangi penarikan mitra",
      icon: CreditCard,
      color: netProfit >= 0 ? "bg-emerald-700" : "bg-red-600",
      textColor: "text-white"
    },
    {
      title: "Menunggu Penarikan",
      value: formatCurrency(totalPendingWithdrawalsAmount),
      desc: `${pendingWithdrawals.length} pengajuan penarikan dana`,
      icon: Clock,
      color: "bg-amber-600",
      textColor: "text-white"
    }
  ];

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-navy tracking-tight">Ikhtisar Bisnis</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau performa keuangan, mitra pendamping, dan transaksi secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/owner/keuangan"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-evergreen text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            Kelola Keuangan <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, idx) => (
          <div 
            key={idx}
            className={`relative overflow-hidden rounded-3xl p-6 ${card.color} text-white shadow-xl flex flex-col justify-between h-44 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300`}
          >
            {/* Background pattern */}
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">{card.title}</span>
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <card.icon size={20} />
              </div>
            </div>
            
            <div className="flex flex-col mt-4">
              <span className="text-2xl lg:text-3xl font-black tracking-tight">{card.value}</span>
              <span className="text-[11px] opacity-70 mt-1 font-medium">{card.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Pengguna", value: totalUsers || 0, icon: UsersIcon, sub: "Pelanggan aktif" },
          { label: "Mitra Aktif", value: activeMitras || 0, icon: Briefcase, sub: `${pendingMitras || 0} butuh verifikasi`, link: "/owner/mitra" },
          { label: "Total Pesanan", value: totalOrders, icon: ShoppingBag, sub: `${activeOrders} aktif berjalan`, link: "/owner/pesanan" },
          { label: "Rasio Sukses", value: `${successRate}%`, icon: ShieldCheck, sub: `${completedOrders} pesanan selesai` }
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[110px] hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <span className="text-2xl font-black text-brand-navy mt-1">{item.value}</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <item.icon size={16} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
              <span className="text-[10px] text-slate-500 font-medium truncate">{item.sub}</span>
              {item.link && (
                <Link href={item.link} className="text-[10px] font-bold text-brand-evergreen hover:underline flex items-center gap-0.5">
                  Detail →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid: Chart/Breakdowns & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Orders & Operations */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Transaction Trend Graph */}
          <DashboardChartsClient 
            dailyData={dailyData} 
            weeklyData={weeklyData} 
            monthlyData={monthlyData} 
          />

          {/* Order Status distribution */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6">
            <div>
              <h3 className="font-black text-brand-navy text-lg">Distribusi Status Pesanan</h3>
              <p className="text-slate-500 text-xs mt-0.5">Ringkasan kondisi seluruh transaksi yang berjalan dalam platform.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { status: "Menunggu Pembayaran / Mitra", count: pendingOrders, color: "bg-amber-500", icon: Clock },
                { status: "Pesanan Aktif (Berjalan)", count: activeOrders, color: "bg-emerald-500", icon: ShieldCheck },
                { status: "Selesai Sempurna", count: completedOrders, color: "bg-brand-navy", icon: CheckCircle2 },
                { status: "Dibatalkan", count: cancelledOrders, color: "bg-rose-500", icon: XCircle }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate block w-full">{item.status}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-brand-navy">{item.count}</span>
                    <span className="text-xs text-slate-500">pesanan</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Overview Graph helper */}
            <div className="mt-2 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Persentase Operasional</span>
              <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                {totalOrders > 0 ? (
                  <>
                    <div style={{ width: `${(pendingOrders / totalOrders) * 100}%` }} className="bg-amber-500 h-full" title="Pending" />
                    <div style={{ width: `${(activeOrders / totalOrders) * 100}%` }} className="bg-emerald-500 h-full" title="Aktif" />
                    <div style={{ width: `${(completedOrders / totalOrders) * 100}%` }} className="bg-brand-navy h-full" title="Selesai" />
                    <div style={{ width: `${(cancelledOrders / totalOrders) * 100}%` }} className="bg-rose-500 h-full" title="Batal" />
                  </>
                ) : (
                  <div className="w-full bg-slate-200 h-full" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <div className="w-2.5 h-2.5 rounded bg-amber-500" /> Pending ({totalOrders > 0 ? Math.round((pendingOrders/totalOrders)*100) : 0}%)
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <div className="w-2.5 h-2.5 rounded bg-emerald-500" /> Aktif ({totalOrders > 0 ? Math.round((activeOrders/totalOrders)*100) : 0}%)
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <div className="w-2.5 h-2.5 rounded bg-brand-navy" /> Selesai ({totalOrders > 0 ? Math.round((completedOrders/totalOrders)*100) : 0}%)
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <div className="w-2.5 h-2.5 rounded bg-rose-500" /> Batal ({totalOrders > 0 ? Math.round((cancelledOrders/totalOrders)*100) : 0}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Payments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-brand-navy text-lg">Histori Pembayaran</h3>
              <p className="text-slate-500 text-xs mt-0.5">Transaksi masuk terbaru dari pelanggan.</p>
            </div>
            <Link href="/owner/keuangan" className="text-xs font-bold text-brand-evergreen hover:underline">
              Semua →
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {recentPayments && recentPayments.length > 0 ? (
              recentPayments.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                      p.status === 'verified' 
                        ? 'bg-emerald-500/10 text-emerald-600' 
                        : p.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {p.method?.substring(0,2)?.toUpperCase() || 'TR'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs text-brand-navy truncate">
                        {(p.users as any)?.full_name || 'Pelanggan'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(p.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-xs text-brand-navy">{formatCurrency(Number(p.amount))}</span>
                    <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 ${
                      p.status === 'verified' 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                        : p.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    }`}>
                      {p.status === 'verified' ? 'Terverifikasi' : p.status === 'pending' ? 'Pending' : 'Ditolak'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">Belum ada transaksi terekam.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
