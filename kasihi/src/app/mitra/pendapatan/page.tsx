"use client";

import { useEffect, useState } from "react";
import {
  Wallet, ArrowDownToLine, ArrowUpRight, TrendingUp, Calendar,
  CheckCircle2, Clock, Loader2, X, AlertCircle, Building2,
  CreditCard, HelpCircle, ChevronRight, RefreshCw
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/utils/toast";
import { getBalanceSummaryAction, getMitraEarningsDetailAction, requestWithdrawalAction, getWithdrawalHistoryAction } from "./actions";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function MitraPendapatanPage() {
  const [loading, setLoading] = useState(true);
  const [mitra, setMitra] = useState<any>(null);
  const [summary, setSummary] = useState({ available_balance: 0, pending_balance: 0, total_earned: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"pendapatan" | "penarikan" | "alur">("pendapatan");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: mitraData } = await supabase
        .from("mitras")
        .select("id, bank_name, bank_account_number, bank_account_name")
        .eq("user_id", user.id)
        .single();

      if (!mitraData) return;
      setMitra(mitraData);

      const [summaryRes, ordersRes, withdrawRes] = await Promise.all([
        getBalanceSummaryAction(mitraData.id),
        getMitraEarningsDetailAction(mitraData.id, 20, 0),
        getWithdrawalHistoryAction(mitraData.id, 20, 0),
      ]);

      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data as any);
      if (ordersRes.success && ordersRes.data) setOrders((ordersRes.data as any).orders || []);
      if (withdrawRes.success && withdrawRes.data) setWithdrawals((withdrawRes.data as any).withdrawals || []);
    } catch (err) {
      toast.error("Gagal memuat data pendapatan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount.replace(/\D/g, ""));
    if (!amount || amount < 50000) {
      toast.error("Minimum penarikan Rp 50.000");
      return;
    }
    if (amount > summary.available_balance) {
      toast.error("Saldo tidak mencukupi.");
      return;
    }
    if (!mitra?.bank_name || !mitra?.bank_account_number) {
      toast.error("Lengkapi data rekening bank Anda di menu Profil terlebih dahulu.");
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await requestWithdrawalAction(mitra.id, {
        amount,
        bank_name: mitra.bank_name,
        bank_account_number: mitra.bank_account_number,
        bank_account_name: mitra.bank_account_name,
      });

      if (res.success) {
        toast.success("🎉 Permintaan tarik dana berhasil dikirim! Admin akan memproses dalam 1×24 jam.");
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        fetchData();
      } else {
        toast.error(res.error || "Gagal mengajukan penarikan.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      verified: { label: "Terverifikasi", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
      pending: { label: "Menunggu", cls: "bg-orange-50 text-orange-600 border-orange-100" },
      cancelled: { label: "Dibatalkan", cls: "bg-red-50 text-red-500 border-red-100" },
    };
    return map[status] || { label: status, cls: "bg-gray-50 text-gray-500 border-gray-200" };
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-20 text-brand-evergreen">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="font-semibold animate-pulse">Memuat data keuangan...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-[#1A2332] text-[22px]">Saldo & Pendapatan</h1>
          <p className="text-[#6B7B8D] text-[13px]">Kelola saldo aktif dan riwayat penarikan dana Anda.</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-brand-evergreen hover:border-brand-evergreen transition-all bg-white shadow-sm">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Main Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#1A2332] rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden shadow-2xl shadow-brand-navy/30"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-evergreen/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-brand-alpine/15 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex items-center gap-2 text-white/60">
            <Wallet size={18} />
            <span className="font-semibold text-sm uppercase tracking-widest">Saldo Tersedia</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-black text-white text-5xl tracking-tight drop-shadow-lg">
              {formatRp(summary.available_balance)}
            </span>
          </div>
          {summary.pending_balance > 0 && (
            <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <Clock size={14} className="text-brand-alpine" />
              <span className="text-white text-xs font-bold">{formatRp(summary.pending_balance)} sedang diproses</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowWithdrawModal(true)}
          className="relative z-10 flex items-center justify-center gap-3 bg-brand-evergreen text-white py-4 px-8 rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/30 group active:scale-95 w-full md:w-auto"
        >
          <ArrowDownToLine size={20} className="group-hover:translate-y-1 transition-transform" />
          Tarik Dana
        </button>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Pendapatan", value: summary.total_earned, color: "text-brand-evergreen" },
          { label: "Saldo Dapat Ditarik", value: summary.available_balance, color: "text-blue-600" },
          { label: "Dalam Proses", value: summary.pending_balance, color: "text-brand-alpine" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col gap-2"
          >
            <span className="text-gray-400 text-xs font-black uppercase tracking-widest">{stat.label}</span>
            <span className={`text-2xl font-black ${stat.color}`}>{formatRp(stat.value)}</span>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: "pendapatan", label: "Riwayat Pendapatan" },
          { id: "penarikan", label: "Riwayat Penarikan" },
          { id: "alur", label: "💡 Cara Kerja" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-6 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-brand-evergreen text-brand-evergreen"
                : "border-transparent text-gray-500 hover:text-brand-navy"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "pendapatan" && (
          <motion.div key="pendapatan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <Wallet size={40} className="mb-3 opacity-30" />
                <p className="font-medium">Belum ada riwayat pendapatan.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {orders.map((order) => {
                  const paymentData = order.payments;
                  const payment = paymentData ? (Array.isArray(paymentData) ? paymentData[0] : paymentData) : null;
                  const badge = getPaymentStatusBadge(payment?.status || "pending");
                  return (
                    <div key={order.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-brand-evergreen flex items-center justify-center shrink-0">
                          <ArrowUpRight size={22} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-brand-navy text-[14px]">
                            Layanan: {order.service_packages?.name || "-"}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            Pasien: {order.patient_name} •{" "}
                            {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="font-black text-brand-evergreen text-lg">
                          {formatRp(Number(payment?.amount || order.service_packages?.base_price || 0))}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "penarikan" && (
          <motion.div key="penarikan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
            {withdrawals.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <ArrowDownToLine size={40} className="mb-3 opacity-30" />
                <p className="font-medium">Belum ada riwayat penarikan.</p>
                <button onClick={() => setShowWithdrawModal(true)} className="mt-4 text-brand-evergreen font-bold text-sm bg-emerald-50 px-5 py-2 rounded-full hover:bg-emerald-100 transition-colors">
                  Tarik Dana Sekarang
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {withdrawals.map((w: any) => {
                  const badge = w.status === "approved"
                    ? { label: "Berhasil", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" }
                    : w.status === "pending"
                    ? { label: "Menunggu", cls: "bg-orange-50 text-orange-600 border-orange-100" }
                    : { label: "Ditolak", cls: "bg-red-50 text-red-500 border-red-100" };
                  return (
                    <div key={w.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-orange-50 text-brand-alpine flex items-center justify-center shrink-0">
                          <ArrowDownToLine size={20} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-brand-navy text-[14px]">Penarikan ke {w.bank_name}</span>
                          <span className="text-xs text-gray-400 font-medium">
                            {w.bank_account_number} •{" "}
                            {new Date(w.created_at || w.requested_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="font-black text-[#1A2332] text-lg">- {formatRp(Number(w.amount))}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "alur" && (
          <motion.div key="alur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
            {/* Payment Flow — User */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
              <h3 className="font-black text-brand-navy text-lg flex items-center gap-2">
                <CreditCard className="text-brand-alpine" /> Alur Pembayaran User (via Midtrans)
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { step: "1", label: "User melakukan booking layanan", desc: "User memilih paket dan jadwal, lalu klik Pesan Sekarang." },
                  { step: "2", label: "User diarahkan ke halaman pembayaran", desc: "Sistem membuat Snap Token Midtrans dan membuka popup pembayaran." },
                  { step: "3", label: "User memilih metode pembayaran", desc: "Mendukung Transfer Bank, GoPay, OVO, QRIS, Kartu Kredit, dll." },
                  { step: "4", label: "Midtrans memproses pembayaran", desc: "Midtrans mengirim notifikasi webhook ke server setelah pembayaran berhasil." },
                  { step: "5", label: "Order otomatis aktif", desc: "Status order berubah ke 'Menunggu Mitra'. Mitra mendapat notifikasi pesanan baru." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center shrink-0 font-black text-sm shadow-md">
                      {item.step}
                    </div>
                    <div className="flex flex-col gap-0.5 pt-1">
                      <span className="font-bold text-brand-navy text-sm">{item.label}</span>
                      <span className="text-xs text-gray-500">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Withdrawal Flow — Mitra */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
              <h3 className="font-black text-brand-navy text-lg flex items-center gap-2">
                <Wallet className="text-brand-evergreen" /> Alur Tarik Dana Mitra
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { step: "1", label: "Order selesai & pembayaran diverifikasi", desc: "Saldo Anda bertambah secara otomatis setelah order selesai dan pembayaran terverifikasi Midtrans." },
                  { step: "2", label: "Klik tombol Tarik Dana", desc: "Masukkan jumlah yang ingin ditarik. Minimum penarikan Rp 50.000." },
                  { step: "3", label: "Permintaan dikirim ke Admin", desc: "Admin menerima notifikasi dan akan memverifikasi permintaan penarikan Anda." },
                  { step: "4", label: "Admin mentransfer dana", desc: "Admin mentransfer ke rekening bank yang terdaftar di profil Anda (BCA/Mandiri/BRI/BNI)." },
                  { step: "5", label: "Dana masuk ke rekening", desc: "Proses 1×24 jam di hari kerja. Anda akan mendapat konfirmasi setelah berhasil." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-brand-evergreen text-white flex items-center justify-center shrink-0 font-black text-sm shadow-md">
                      {item.step}
                    </div>
                    <div className="flex flex-col gap-0.5 pt-1">
                      <span className="font-bold text-brand-navy text-sm">{item.label}</span>
                      <span className="text-xs text-gray-500">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100">
              <HelpCircle size={22} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="font-bold text-blue-700 text-sm">Butuh Bantuan?</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Jika ada kendala terkait pembayaran atau penarikan dana, segera hubungi Admin melalui WhatsApp atau menu Bantuan. Jangan lupa pastikan data rekening bank di Profil sudah benar sebelum menarik dana.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isWithdrawing && setShowWithdrawModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-md relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="bg-[#1A2332] p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-evergreen flex items-center justify-center">
                    <ArrowDownToLine size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg">Tarik Dana</h3>
                    <p className="text-white/50 text-xs">Saldo tersedia: {formatRp(summary.available_balance)}</p>
                  </div>
                </div>
                <button onClick={() => !isWithdrawing && setShowWithdrawModal(false)} className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* Bank Info */}
                {mitra?.bank_name ? (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 text-blue-600 shadow-sm">
                      <Building2 size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-brand-navy">{mitra.bank_name} — {mitra.bank_account_number}</span>
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{mitra.bank_account_name}</span>
                    </div>
                    <CheckCircle2 size={20} className="text-brand-evergreen ml-auto shrink-0" />
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 font-medium">Anda belum mengisi data rekening bank. Silakan lengkapi di menu <strong>Profil</strong> terlebih dahulu.</p>
                  </div>
                )}

                {/* Amount Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-black text-gray-700">Jumlah Penarikan</label>
                  <div className="flex items-center rounded-2xl border-2 border-gray-200 focus-within:border-brand-evergreen transition-all overflow-hidden">
                    <span className="px-4 py-3.5 bg-gray-50 border-r border-gray-200 font-bold text-gray-500 text-sm">Rp</span>
                    <input
                      type="text"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, "."))}
                      placeholder="0"
                      className="flex-1 px-4 py-3.5 outline-none font-black text-brand-navy text-lg bg-white"
                      disabled={!mitra?.bank_name}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[100000, 250000, 500000, 1000000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setWithdrawAmount(amount.toLocaleString("id-ID"))}
                        disabled={amount > summary.available_balance}
                        className="px-3 py-1.5 bg-emerald-50 text-brand-evergreen text-xs font-bold rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {formatRp(amount)}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">Minimum penarikan Rp 50.000 • Proses 1×24 jam kerja</p>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !mitra?.bank_name}
                  className="w-full bg-brand-evergreen text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWithdrawing ? (
                    <><Loader2 size={20} className="animate-spin" /> Memproses...</>
                  ) : (
                    <><ArrowDownToLine size={20} /> Ajukan Penarikan</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
