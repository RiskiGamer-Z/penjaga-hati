"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  Search, 
  X,
  FileText,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Percent
} from "lucide-react";
import { approveWithdrawal, rejectWithdrawal } from "../actions";
import { toast } from "@/utils/toast";

interface KeuanganClientProps {
  withdrawals: any[];
  payments: any[];
  commPercent: number;
  ownerId: string;
}

export default function KeuanganClient({
  withdrawals,
  payments,
  commPercent,
  ownerId,
}: KeuanganClientProps) {
  const [activeTab, setActiveTab] = useState<"withdrawals" | "payments">("withdrawals");
  const [withdrawalFilter, setWithdrawalFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  
  // Rejection modal state
  const [rejectingWithdrawalId, setRejectingWithdrawalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  // 1. Calculate financial statistics
  const verifiedPayments = payments.filter((p) => p.status === "verified");
  const totalRevenue = verifiedPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalCommissions = totalRevenue * (commPercent / 100);

  const completedWithdrawals = withdrawals.filter((w) => w.status === "completed");
  const totalPaidWithdrawals = completedWithdrawals.reduce((acc, w) => acc + Number(w.amount), 0);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const totalPendingWithdrawals = pendingWithdrawals.reduce((acc, w) => acc + Number(w.amount), 0);

  const netProfit = totalCommissions - totalPaidWithdrawals;

  // 2. Filter withdrawals
  const filteredWithdrawals = withdrawals.filter((w) => {
    const user = w.mitras?.users;
    const matchesSearch =
      user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.bank_account_number?.includes(searchTerm);

    if (withdrawalFilter === "pending") {
      return matchesSearch && w.status === "pending";
    } else if (withdrawalFilter === "completed") {
      return matchesSearch && w.status === "completed";
    } else if (withdrawalFilter === "rejected") {
      return matchesSearch && w.status === "rejected";
    }
    return matchesSearch;
  });

  // 3. Filter payments
  const filteredPayments = payments.filter((p) => {
    return (
      p.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Action handlers
  const handleApprove = async (id: string) => {
    const confirmApprove = await toast.confirm("Konfirmasi Penarikan", "Apakah Anda yakin ingin menyetujui dan menandai penarikan dana ini sebagai Selesai/Terbayar?");
    if (!confirmApprove) return;

    setLoadingActionId(id);
    try {
      const res = await approveWithdrawal(id, ownerId);
      if (res.success) {
        toast.success(
          "Penarikan Disetujui",
          "Dana berhasil ditandai sebagai selesai ditransfer."
        );
      } else {
        toast.error("Gagal Menyetujui", res.error || "Gagal memperbarui status penarikan.");
      }
    } catch (err: any) {
      toast.error("Terjadi Kesalahan", err.message || "Gagal menghubungi server.");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectingWithdrawalId(id);
    setRejectionReason("");
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Alasan Ditolak", "Silakan masukkan alasan penolakan.");
      return;
    }

    if (!rejectingWithdrawalId) return;

    setLoadingActionId(rejectingWithdrawalId);
    const targetId = rejectingWithdrawalId;
    setRejectingWithdrawalId(null);

    try {
      const res = await rejectWithdrawal(targetId, rejectionReason, ownerId);
      if (res.success) {
        toast.success(
          "Penarikan Ditolak",
          "Permintaan penarikan berhasil ditolak dengan alasan tercatat."
        );
      } else {
        toast.error("Gagal Menolak", res.error || "Gagal memperbarui status penarikan.");
      }
    } catch (err: any) {
      toast.error("Terjadi Kesalahan", err.message || "Gagal menghubungi server.");
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Omzet (Revenue)",
            value: formatCurrency(totalRevenue),
            desc: "Semua pembayaran terverifikasi",
            icon: TrendingUp,
            color: "bg-emerald-600",
          },
          {
            title: `Komisi Platform (${commPercent}%)`,
            value: formatCurrency(totalCommissions),
            desc: "Pendapatan kotor platform",
            icon: Percent,
            color: "bg-teal-600",
          },
          {
            title: "Profit Bersih Platform",
            value: formatCurrency(netProfit),
            desc: "Komisi dikurangi penarikan mitra",
            icon: CreditCard,
            color: netProfit >= 0 ? "bg-emerald-700" : "bg-red-600",
          },
          {
            title: "Total Menunggu Payout",
            value: formatCurrency(totalPendingWithdrawals),
            desc: `${pendingWithdrawals.length} pengajuan penarikan aktif`,
            icon: Clock,
            color: "bg-amber-600",
          },
        ].map((card, idx) => (
          <div 
            key={idx}
            className={`relative overflow-hidden rounded-3xl p-6 ${card.color} text-white shadow-xl flex flex-col justify-between h-44 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300`}
          >
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

      {/* Tabs Control */}
      <div className="flex border-b border-slate-200 gap-4 shrink-0">
        <button
          onClick={() => { setActiveTab("withdrawals"); setSearchTerm(""); }}
          className={`pb-4 text-sm font-bold border-b-2 px-2 transition-all cursor-pointer ${
            activeTab === "withdrawals"
              ? "border-brand-evergreen text-brand-navy"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Kelola Penarikan Mitra ({withdrawals.length})
        </button>
        <button
          onClick={() => { setActiveTab("payments"); setSearchTerm(""); }}
          className={`pb-4 text-sm font-bold border-b-2 px-2 transition-all cursor-pointer ${
            activeTab === "payments"
              ? "border-brand-evergreen text-brand-navy"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Histori Transaksi Masuk ({payments.length})
        </button>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 w-full md:max-w-md bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 focus-within:border-brand-evergreen focus-within:ring-2 focus-within:ring-brand-evergreen/10 transition-all">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={
              activeTab === "withdrawals"
                ? "Cari nama mitra, bank, atau rekening..."
                : "Cari pelanggan, metode pembayaran, status..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-xs text-brand-navy placeholder:text-slate-400 w-full"
          />
        </div>

        {/* Filter Quick Switcher (Only for Withdrawals) */}
        {activeTab === "withdrawals" && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/50 self-start md:self-auto">
            {[
              { label: "Semua", value: "all" },
              { label: "Menunggu Persetujuan", value: "pending" },
              { label: "Selesai (Terbayar)", value: "completed" },
              { label: "Ditolak", value: "rejected" }
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setWithdrawalFilter(item.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  withdrawalFilter === item.value
                    ? "bg-white text-brand-navy shadow-sm"
                    : "text-slate-500 hover:text-brand-navy"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Listings */}
      {activeTab === "withdrawals" ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Nama Mitra</th>
                  <th className="px-6 py-4">Rekening Tujuan</th>
                  <th className="px-6 py-4">Nominal Penarikan</th>
                  <th className="px-6 py-4">Tanggal Pengajuan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredWithdrawals.length > 0 ? (
                  filteredWithdrawals.map((w) => {
                    const user = w.mitras?.users;
                    const isPending = w.status === "pending";
                    const isProcessing = loadingActionId === w.id;

                    return (
                      <tr key={w.id} className="hover:bg-slate-50/30 transition-colors">
                        {/* Name & Contact */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[13px]">
                              {user?.full_name || "Tanpa Nama"}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {user?.phone || user?.email || "-"}
                            </span>
                          </div>
                        </td>

                        {/* Bank Details */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 text-xs uppercase">
                              {w.bank_name}
                            </span>
                            <span className="font-bold text-slate-800 mt-0.5">
                              {w.bank_account_number}
                            </span>
                            <span className="text-[10px] text-slate-400 italic">
                              a.n. {w.bank_account_name}
                            </span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4">
                          <span className="font-black text-brand-navy text-[13px]">
                            {formatCurrency(Number(w.amount))}
                          </span>
                        </td>

                        {/* Date Requested */}
                        <td className="px-6 py-4 font-semibold text-slate-500">
                          {new Date(w.requested_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            {w.status === "pending" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200/50">
                                <Clock size={10} /> Menunggu
                              </span>
                            )}
                            {w.status === "completed" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-brand-evergreen border border-emerald-200/50">
                                <CheckCircle2 size={10} /> Terbayar
                              </span>
                            )}
                            {w.status === "rejected" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200/50">
                                <XCircle size={10} /> Ditolak
                              </span>
                            )}
                            {w.rejection_reason && (
                              <span className="text-[9px] text-slate-400 italic block mt-1 max-w-xs truncate" title={w.rejection_reason}>
                                Ket: "{w.rejection_reason}"
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          {isPending ? (
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => handleApprove(w.id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-xl bg-brand-evergreen hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-500/10 cursor-pointer"
                              >
                                Setujui Transfer
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(w.id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-600 border border-rose-200/50 font-bold text-xs cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Done</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-xs font-semibold">
                      Tidak ada pengajuan penarikan dana ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Payments Tab content */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">ID Transaksi</th>
                  <th className="px-6 py-4">Pembayar</th>
                  <th className="px-6 py-4">Metode & Waktu</th>
                  <th className="px-6 py-4">Nominal</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => {
                    const isVerified = p.status === "verified";
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-brand-evergreen">
                          #{p.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800 text-[13px]">
                            {p.users?.full_name || "Tanpa Nama"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 text-xs uppercase">
                              {p.method || "Transfer Bank"}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(p.created_at).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-brand-navy text-[13px]">
                          {formatCurrency(Number(p.amount))}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isVerified
                              ? "bg-emerald-50 text-brand-evergreen border border-emerald-200/50"
                              : p.status === "pending"
                              ? "bg-amber-50 text-amber-600 border border-amber-200/50"
                              : "bg-rose-50 text-rose-600 border border-rose-200/50"
                          }`}>
                            {isVerified ? <CheckCircle2 size={10} /> : p.status === "pending" ? <Clock size={10} /> : <XCircle size={10} />}
                            {isVerified ? "Lunas" : p.status === "pending" ? "Menunggu" : "Gagal"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 text-xs font-semibold">
                      Tidak ada catatan transaksi pembayaran masuk.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingWithdrawalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-rose-500 font-bold">
                <AlertTriangle size={20} />
                <h3 className="text-base font-black text-brand-navy">Tolak Penarikan Dana</h3>
              </div>
              <button
                onClick={() => setRejectingWithdrawalId(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              Silakan tuliskan alasan mengapa Anda menolak permintaan penarikan dana ini. Alasan ini akan terlihat oleh mitra pendamping terkait.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Alasan Penolakan
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Nomor rekening tidak cocok, saldo tidak mencukupi, dll."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-brand-evergreen/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRejectingWithdrawalId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 shadow-md shadow-rose-500/10 transition-all cursor-pointer"
              >
                Tolak Penarikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
