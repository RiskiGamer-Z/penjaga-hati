"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CreditCard, FileText, Users, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getAdminSidebarStatsAction } from "@/app/admin/pesanan/actions";

interface NotifStats {
  pendingOrders: number;
  pendingPayments: number;
  pendingMitra: number;
}

export default function AdminNotificationBell() {
  const [stats, setStats] = useState<NotifStats>({
    pendingOrders: 0,
    pendingPayments: 0,
    pendingMitra: 0,
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchStats = async () => {
    const res = await getAdminSidebarStatsAction();
    if (res.success && res.data) {
      setStats({
        pendingOrders: res.data.pendingOrders,
        pendingPayments: res.data.pendingPayments,
        pendingMitra: res.data.pendingMitra,
      });
    }
  };

  useEffect(() => {
    fetchStats();

    // Realtime: refresh saat ada perubahan pada orders / payments / mitras
    const supabase = createClient();
    const channel = supabase
      .channel("admin-notif-bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "mitras" }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Klik di luar untuk menutup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalCount = stats.pendingOrders + stats.pendingPayments + stats.pendingMitra;

  const items = [
    {
      show: stats.pendingPayments > 0,
      href: "/admin/verifikasi",
      icon: CreditCard,
      color: "text-red-500 bg-red-50",
      label: "Pembayaran menunggu verifikasi",
      count: stats.pendingPayments,
    },
    {
      show: stats.pendingOrders > 0,
      href: "/admin/pesanan",
      icon: FileText,
      color: "text-amber-600 bg-amber-50",
      label: "Pesanan baru masuk",
      count: stats.pendingOrders,
    },
    {
      show: stats.pendingMitra > 0,
      href: "/admin/mitra",
      icon: Users,
      color: "text-blue-600 bg-blue-50",
      label: "Mitra menunggu verifikasi",
      count: stats.pendingMitra,
    },
  ].filter((i) => i.show);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center justify-center rounded bg-white border border-slate-200 w-9 h-9 shrink-0 hover:bg-slate-50 transition-colors shadow-sm relative"
        aria-label="Notifikasi"
      >
        <Bell size={16} className="text-gray-600" />
        {totalCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <span className="font-serif font-bold text-brand-navy text-sm">Notifikasi</span>
            {totalCount > 0 && (
              <span className="text-[11px] font-medium text-red-600 bg-red-50 rounded-full px-2 py-0.5">
                {totalCount} baru
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-brand-navy">Semua beres!</p>
                <p className="text-xs text-gray-400 mt-0.5">Tidak ada tindakan yang menunggu.</p>
              </div>
            ) : (
              items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${item.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium text-brand-navy truncate">{item.label}</span>
                      <span className="text-[11px] text-gray-400">Klik untuk menindaklanjuti</span>
                    </div>
                    <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand-navy text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {item.count}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
