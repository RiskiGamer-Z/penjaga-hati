"use client";

import { Search, Bell, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { getAdminDashboardDataAction } from "@/app/admin/pesanan/actions";
import { toast } from "@/utils/toast";

function CountdownCell({ status, actualCompletionTime }: { status: string; actualCompletionTime: string | null }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (status !== 'service_done' || !actualCompletionTime) {
      setTimeLeft("—");
      return;
    }

    const updateTimer = () => {
      const completionTime = new Date(actualCompletionTime).getTime();
      const expirationTime = completionTime + 5 * 60 * 60 * 1000; // +5 hours
      const now = Date.now();
      const diff = expirationTime - now;

      if (diff <= 0) {
        setTimeLeft("Waktu Habis (Auto)");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}j ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [status, actualCompletionTime]);

  if (status === 'service_done') {
    return (
      <span className="font-mono text-red-500 font-bold text-xs bg-red-50 border border-red-100 rounded-md px-2.5 py-1">
        ⏳ {timeLeft}
      </span>
    );
  }

  return <span className="text-gray-400 text-xs">—</span>;
}

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  // Dashboard Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    newOrders: 0,
    activeMitras: 0,
    pendingVerification: 0
  });

  // Recent Orders
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Pulse States for Real-time Feedback
  const [pulse, setPulse] = useState({
    totalRevenue: false,
    newOrders: false,
    activeMitras: false,
    pendingVerification: false
  });

  const triggerPulse = (key: keyof typeof pulse) => {
    setPulse(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setPulse(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const fetchDashboardData = async () => {
    const res = await getAdminDashboardDataAction();
    if (res.success && res.data) {
      setStats(res.data.stats);
      setRecentOrders(res.data.recentOrders);
    } else {
      console.error("Dashboard load error:", res.error);
      toast.error("Gagal Memuat Dashboard", res.error || "Terjadi kesalahan pada server.");
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };
    initFetch();
  }, []);


  // Real-time Subscription
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboardData();
        triggerPulse('newOrders');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchDashboardData();
        triggerPulse('totalRevenue');
        triggerPulse('pendingVerification');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload: any) => {
        if (payload.new?.role === 'mitra' || payload.old?.role === 'mitra') {
          fetchDashboardData();
          triggerPulse('activeMitras');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <div className="flex items-center w-fit rounded py-1 px-2.5 bg-gray-100 text-gray-700 text-xs font-medium">Pending Payment</div>;
      case 'waiting_mitra':
        return <div className="flex items-center w-fit rounded py-1 px-2.5 bg-amber-100 text-amber-800 text-xs font-medium">Waiting Mitra</div>;
      case 'in_progress':
        return <div className="flex items-center w-fit rounded py-1 px-2.5 bg-blue-100 text-blue-800 text-xs font-medium">In Progress</div>;
      case 'service_done':
        return <div className="flex items-center w-fit rounded py-1 px-2.5 bg-purple-100 text-purple-800 text-xs font-medium">Confirm Done</div>;
      case 'completed':
        return <div className="flex items-center w-fit rounded py-1 px-2.5 bg-green-100 text-green-800 text-xs font-medium">Completed</div>;
      case 'cancelled':
        return <div className="flex items-center w-fit rounded py-1 px-2.5 bg-red-100 text-red-800 text-xs font-medium">Cancelled</div>;
      default:
        return <div className="flex items-center w-fit rounded py-1 px-2.5 bg-gray-100 text-gray-700 text-xs font-medium">{status.replace(/_/g, ' ')}</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-brand-evergreen" />
        <p className="mt-4 text-gray-500 font-medium">Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto gap-7 p-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif font-bold text-brand-navy text-2xl">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded py-2 px-3 bg-white border border-slate-200 shadow-sm w-full sm:w-auto">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-sm text-brand-navy placeholder:text-gray-400 w-full sm:w-40 ml-2"
            />
          </div>
          <button className="flex items-center justify-center rounded bg-white border border-slate-200 w-9 h-9 shrink-0 hover:bg-slate-50 transition-colors shadow-sm relative">
            <Bell size={16} className="text-gray-600" />
            {stats.pendingVerification > 0 && (
              <div className="absolute top-1.5 right-1.5 rounded-full bg-red-600 border-2 border-white w-2.5 h-2.5" />
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pendapatan */}
        <div className={`flex flex-col rounded p-4 bg-white border shadow-sm transition-all duration-200 ${pulse.totalRevenue ? "border-brand-evergreen" : "border-slate-200"}`}>
          <span className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-2">Total Pendapatan</span>
          <span className="font-bold text-brand-navy text-2xl truncate">{formatCurrency(stats.totalRevenue)}</span>
        </div>

        {/* Pesanan Baru */}
        <div className={`flex flex-col rounded p-4 bg-white border shadow-sm transition-all duration-200 ${pulse.newOrders ? "border-brand-evergreen" : "border-slate-200"}`}>
          <span className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-2">Pesanan Baru</span>
          <span className="font-bold text-brand-navy text-2xl">{stats.newOrders}</span>
        </div>

        {/* Mitra Aktif */}
        <div className={`flex flex-col rounded p-4 bg-white border shadow-sm transition-all duration-200 ${pulse.activeMitras ? "border-brand-evergreen" : "border-slate-200"}`}>
          <span className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-2">Total Mitra</span>
          <span className="font-bold text-brand-navy text-2xl">{stats.activeMitras}</span>
        </div>

        {/* Perlu Verifikasi */}
        <div className={`flex flex-col rounded p-4 bg-white border shadow-sm transition-all duration-200 ${pulse.pendingVerification ? "border-amber-500" : "border-slate-200"}`}>
          <span className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-2">Perlu Verifikasi (Bayar)</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand-navy text-2xl">{stats.pendingVerification}</span>
            {stats.pendingVerification > 0 && <span className="text-amber-600 text-xs font-medium">Pending</span>}
          </div>
        </div>
      </div>

      {/* Table: Pesanan Terbaru */}
      <div className="flex flex-col rounded overflow-hidden bg-white border border-slate-200 shadow-sm mt-4">
        <div className="flex items-center justify-between py-3 px-4 border-b border-slate-200">
          <h2 className="font-serif font-bold text-brand-navy text-lg">Pesanan Terbaru</h2>
          <Link href="/admin/pesanan" className="font-medium text-blue-600 hover:text-blue-800 text-sm transition-colors">
            Lihat Semua →
          </Link>
        </div>

        {/* Table Scroll Wrapper */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 items-center py-2 px-4 bg-slate-50 border-b border-slate-200 gap-4">
              <div className="col-span-2 uppercase tracking-wider font-semibold text-gray-500 text-[11px]">ID Pesanan</div>
              <div className="col-span-2 uppercase tracking-wider font-semibold text-gray-500 text-[11px]">Pemesan</div>
              <div className="col-span-2 uppercase tracking-wider font-semibold text-gray-500 text-[11px]">Pasien</div>
              <div className="col-span-2 uppercase tracking-wider font-semibold text-gray-500 text-[11px]">Status</div>
              <div className="col-span-2 uppercase tracking-wider font-semibold text-gray-500 text-[11px]">Hitung Mundur</div>
              <div className="col-span-2 uppercase tracking-wider font-semibold text-gray-500 text-[11px]">Aksi</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-200">
              {recentOrders.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">Belum ada pesanan terbaru.</div>
              ) : (
                recentOrders.map((order) => (
                   <div key={order.id} className="grid grid-cols-12 items-center py-2 px-4 hover:bg-slate-50 transition-colors gap-4 h-12">
                    <div className="col-span-2 font-mono text-brand-navy text-xs">#{order.id.slice(0, 8).toUpperCase()}</div>
                    <div className="col-span-2 flex flex-col justify-center">
                      <span className="font-medium text-brand-navy text-xs truncate">{order.users?.full_name || 'Tanpa Nama'}</span>
                    </div>
                    <div className="col-span-2 text-gray-600 text-xs truncate">{order.patient_name}</div>
                    <div className="col-span-2">
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="col-span-2">
                      <CountdownCell status={order.status} actualCompletionTime={order.actual_completion_time} />
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <Link href={`/admin/pesanan/${order.id}`} className="rounded border border-slate-300 text-brand-navy font-medium text-xs px-3 py-1 bg-white hover:bg-slate-100 transition-colors">
                        Kelola
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
