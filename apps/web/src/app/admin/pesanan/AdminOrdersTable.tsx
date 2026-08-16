"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Eye, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  User, 
  Phone, 
  Hospital as HospitalIcon, 
  Package as PackageIcon, 
  CreditCard,
  X,
  ArrowUpRight
} from "lucide-react";
import AdminOrderActionButtons from "./AdminOrderActionButtons";
import { toast } from "@/utils/toast";
import { verifyPaymentAction, rejectPaymentAction } from "@/app/admin/verifikasi/actions";
import { markOrderAsViewedAction } from "./actions";

interface AdminOrdersTableProps {
  initialOrders: any[];
  availableMitras: any[];
}

export default function AdminOrdersTable({
  initialOrders,
  availableMitras,
}: AdminOrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Status badge utility
  const getStatusBadge = (status: string, paymentsData?: any) => {
    const payment = paymentsData ? (Array.isArray(paymentsData) ? paymentsData[0] : paymentsData) : null;
    const hasUploadedProof = payment && payment.proof_of_transfer_url && payment.status === 'pending';

    if (status === "pending_payment" && hasUploadedProof) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-amber-500 text-white border border-amber-600">
          <Clock size={12} /> Menunggu Verifikasi
        </span>
      );
    }

    switch (status) {
      case "pending_payment":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <Clock size={12} /> Menunggu Pembayaran
          </span>
        );
      case "waiting_mitra":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={12} /> Butuh Mitra
          </span>
        );
      case "accepted":
      case "in_transit":
      case "arrived":
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 size={12} /> Berlangsung
          </span>
        );
      case "service_done":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
            <CheckCircle2 size={12} /> Konfirmasi Selesai
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 size={12} /> Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-red-100 text-red-800 border border-red-200">
            <XCircle size={12} /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
            {status.replace(/_/g, " ")}
          </span>
        );
    }
  };

  // Payment status badge utility
  const getPaymentBadge = (paymentsData: any) => {
    if (!paymentsData) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
          Belum Ada
        </span>
      );
    }
    const payment = Array.isArray(paymentsData) ? paymentsData[0] : paymentsData;
    if (!payment) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
          Belum Ada
        </span>
      );
    }

    switch (payment.status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
            Menunggu
          </span>
        );
      case "verified":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-green-100 text-green-800 border border-green-200">
            Lunas
          </span>
        );
      case "failed":
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-red-100 text-red-800 border border-red-200">
            Gagal/Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-gray-100 text-gray-700">
            {payment.status}
          </span>
        );
    }
  };

  // Format IDR Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Stats calculation
  const stats = initialOrders.reduce(
    (acc, o) => {
      if (["accepted", "in_transit", "arrived", "in_progress", "service_done"].includes(o.status)) acc.active += 1;
      else if (o.status === "completed") acc.completed += 1;
      else if (["pending_payment", "waiting_mitra"].includes(o.status)) acc.pending += 1;
      else if (o.status === "cancelled") acc.cancelled += 1;
      return acc;
    },
    { active: 0, completed: 0, pending: 0, cancelled: 0 }
  );

  // Filters application
  const filteredOrders = initialOrders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.hospitals?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "pending") {
      return matchesSearch && ["pending_payment", "waiting_mitra"].includes(o.status);
    } else if (statusFilter === "active") {
      return matchesSearch && ["accepted", "in_transit", "arrived", "in_progress", "service_done"].includes(o.status);
    } else if (statusFilter === "completed") {
      return matchesSearch && o.status === "completed";
    } else if (statusFilter === "cancelled") {
      return matchesSearch && o.status === "cancelled";
    }

    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Summary for Orders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Menunggu / Butuh Mitra", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
          { label: "Sedang Berlangsung", value: stats.active, icon: Calendar, color: "text-blue-600 bg-blue-50 border-blue-200" },
          { label: "Selesai Sempurna", value: stats.completed, icon: CheckCircle2, color: "text-green-600 bg-green-50 border-green-200" },
          { label: "Dibatalkan", value: stats.cancelled, icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between hover:shadow transition-shadow">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{item.label}</span>
              <span className="text-2xl font-bold text-brand-navy mt-1">{item.value}</span>
            </div>
            <div className={`w-10 h-10 rounded flex items-center justify-center border ${item.color}`}>
              <item.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="bg-white rounded p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 w-full md:max-w-md bg-white border border-slate-300 rounded px-3 py-2 focus-within:border-brand-navy focus-within:ring-1 focus-within:ring-brand-navy transition-all">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari ID Pesanan, Pelanggan, Pasien, atau RS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm text-brand-navy placeholder:text-slate-400 w-full"
          />
        </div>

        {/* Filter Quick Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200 overflow-x-auto max-w-full self-start md:self-auto shrink-0 scrollbar-none">
          {[
            { label: "Semua", value: "all" },
            { label: "Pending", value: "pending" },
            { label: "Berlangsung", value: "active" },
            { label: "Selesai", value: "completed" },
            { label: "Batal", value: "cancelled" }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${
                statusFilter === item.value
                  ? "bg-white text-brand-navy shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-brand-navy border border-transparent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">ID Pesanan</th>
                <th className="px-4 py-3">Pelanggan & Pasien</th>
                <th className="px-4 py-3">Pendamping (Mitra)</th>
                <th className="px-4 py-3">Rumah Sakit & Paket</th>
                <th className="px-4 py-3">Status & Bayar</th>
                <th className="px-4 py-3">Total Biaya</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const user = order.users;
                  const mitra = order.mitras;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                      {/* ID */}
                      <td className="px-4 py-3 font-mono text-brand-navy text-xs hover:underline">
                        <Link href={`/admin/pesanan/${order.id}`}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>

                      {/* Customer & Patient */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 text-[13px]">
                              {user?.full_name || "Tanpa Nama"}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Hub: {user?.phone || user?.email}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 bg-slate-100 rounded px-1.5 py-0.5 border border-slate-200 w-fit mt-1">
                            Pasien: <strong className="font-medium">{order.patient_name}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Mitra */}
                      <td className="px-4 py-3">
                        {mitra ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 text-xs">
                              {mitra.users?.full_name}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5">
                              {mitra.users?.phone || "Tidak ada telp"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Belum ditugaskan</span>
                        )}
                      </td>

                      {/* RS & Package */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-xs">
                            {order.hospitals?.name || "Luar RS"}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            {order.service_packages?.name || "Paket Pendampingan"}
                          </span>
                        </div>
                      </td>

                      {/* Badges */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          {getStatusBadge(order.status, order.payments)}
                          {getPaymentBadge(order.payments)}
                        </div>
                      </td>

                      {/* Total Biaya */}
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatCurrency(Number(order.total_amount || (Array.isArray(order.payments) ? order.payments[0]?.amount : order.payments?.amount) || order.service_packages?.base_price || 0))}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={async () => {
                              setSelectedOrder(order);
                              await markOrderAsViewedAction(order.id);
                            }}
                            className="p-2 text-slate-400 hover:text-brand-navy hover:bg-slate-50 rounded-xl transition-all border border-slate-200/50 bg-white shadow-sm cursor-pointer"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye size={14} />
                          </button>
                          
                          <AdminOrderActionButtons
                            orderId={order.id}
                            status={order.status}
                            currentMitraId={order.mitra_id}
                            availableMitras={availableMitras}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-semibold">
                    Tidak ada data pesanan ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Premium Glassmorphic Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="relative w-full max-w-2xl bg-white rounded shadow-xl border border-slate-200 flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase text-gray-500 tracking-wider">
                  Detail Transaksi & Layanan
                </span>
                <h3 className="text-xl font-serif font-bold text-brand-navy flex items-center gap-2">
                  Pesanan #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  {getStatusBadge(selectedOrder.status, selectedOrder.payments)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded text-gray-500 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 text-xs text-slate-700">
              {/* Row 1: Patient and Booking user */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                {/* Patient Info */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-brand-evergreen font-bold">
                    <User size={16} />
                    <span>Data Pasien</span>
                  </div>
                  <div className="space-y-2 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Nama Lengkap</span>
                      <span className="font-bold text-slate-800 mt-0.5">{selectedOrder.patient_name}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Umur Pasien</span>
                      <span className="font-semibold text-slate-700 mt-0.5">{selectedOrder.patient_age || "-"} Tahun</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Kondisi / Keluhan</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                        {selectedOrder.patient_condition || "Tidak ada catatan kondisi khusus."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="flex flex-col gap-3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                  <div className="flex items-center gap-2 text-brand-navy font-bold">
                    <User size={16} />
                    <span>Pemesan (Pelanggan)</span>
                  </div>
                  <div className="space-y-2 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Nama Pemesan</span>
                      <span className="font-bold text-slate-800 mt-0.5">{selectedOrder.users?.full_name || "Tanpa Nama"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Email</span>
                      <span className="font-semibold text-slate-600 mt-0.5">{selectedOrder.users?.email || "-"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">WhatsApp</span>
                      <span className="font-bold text-brand-evergreen mt-0.5 flex items-center gap-1">
                        <Phone size={10} /> {selectedOrder.users?.phone || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Service Packages and Hospitals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hospital Info */}
                <div className="flex flex-col gap-2.5 bg-slate-50/20 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-brand-navy font-bold">
                    <HospitalIcon size={16} className="text-slate-400" />
                    <span>Lokasi Rumah Sakit</span>
                  </div>
                  <div className="mt-1">
                    <span className="font-bold text-slate-800 block text-xs">{selectedOrder.hospitals?.name || "Luar Rumah Sakit"}</span>
                    <span className="text-[11px] text-slate-400 mt-1 block leading-relaxed">{selectedOrder.hospitals?.address || "Layanan dilakukan mandiri di rumah pasien."}</span>
                  </div>
                </div>

                {/* Package Info */}
                <div className="flex flex-col gap-2.5 bg-slate-50/20 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-brand-navy font-bold">
                    <PackageIcon size={16} className="text-slate-400" />
                    <span>Layanan Yang Dipilih</span>
                  </div>
                  <div className="mt-1">
                    <span className="font-bold text-slate-800 block text-xs">{selectedOrder.service_packages?.name || "Paket Pendamping"}</span>
                    <span className="text-[11px] text-slate-400 mt-1 block leading-relaxed">
                      Layanan pendampingan berkualitas tinggi.
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Payments */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <CreditCard size={16} className="text-slate-400" />
                    <span>Bukti & Status Pembayaran</span>
                  </div>
                  <span>{getPaymentBadge(selectedOrder.payments)}</span>
                </div>

                {(() => {
                  const payment = selectedOrder.payments ? (Array.isArray(selectedOrder.payments) ? selectedOrder.payments[0] : selectedOrder.payments) : null;
                  if (!payment) {
                    return <span className="text-slate-400 italic text-center py-2">Belum ada catatan pembayaran.</span>;
                  }
                  return (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs mt-1">
                      <div className="space-y-1.5">
                        <div className="flex gap-4">
                          <span className="text-slate-400">Metode:</span>
                          <span className="font-bold text-slate-800">{payment.method?.toUpperCase() || "Transfer Bank"}</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-slate-400">Total Pembayaran:</span>
                          <span className="font-bold text-brand-navy">{formatCurrency(Number(payment.amount))}</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-slate-400">Tanggal:</span>
                          <span className="text-slate-600">
                            {new Date(payment.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>

                      {payment.proof_of_transfer_url ? (
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Lampiran Bukti</span>
                            <a
                              href={payment.proof_of_transfer_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-evergreen hover:bg-emerald-600 text-white font-bold text-[10px] shadow-sm hover:shadow transition-all"
                            >
                              <Eye size={12} />
                              Lihat Bukti Transfer
                            </a>
                          </div>

                          {payment.status === 'pending' && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                disabled={isVerifyingPayment}
                                onClick={async () => {
                                  if (confirm("Setujui bukti pembayaran ini? Pesanan akan otomatis diproses untuk mencari Mitra Pendamping.")) {
                                    try {
                                      setIsVerifyingPayment(true);
                                      const res = await verifyPaymentAction(payment.id, selectedOrder.id);
                                      if (res.success) {
                                        toast.success("Pembayaran Disetujui", "Pesanan telah diproses ke status 'Butuh Mitra'.");
                                        window.location.reload();
                                      } else {
                                        toast.error("Gagal Verifikasi", res.error || "Gagal memproses persetujuan.");
                                      }
                                    } catch (err: any) {
                                      toast.error("Error", err.message);
                                    } finally {
                                      setIsVerifyingPayment(false);
                                    }
                                  }
                                }}
                                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {isVerifyingPayment ? "Memproses..." : "Setujui & Proses"}
                              </button>
                              
                              <button
                                disabled={isVerifyingPayment}
                                onClick={async () => {
                                  const reason = prompt("Masukkan alasan penolakan bukti transfer (minimal 5 karakter):");
                                  if (reason) {
                                    if (reason.length < 5) {
                                      alert("Alasan penolakan minimal harus 5 karakter.");
                                      return;
                                    }
                                    try {
                                      setIsVerifyingPayment(true);
                                      const res = await rejectPaymentAction(payment.id, reason, false);
                                      if (res.success) {
                                        toast.success("Pembayaran Ditolak", "Pesanan dikembalikan ke status 'Menunggu Pembayaran'.");
                                        window.location.reload();
                                      } else {
                                        toast.error("Gagal Penolakan", res.error || "Gagal memproses penolakan.");
                                      }
                                    } catch (err: any) {
                                      toast.error("Error", err.message);
                                    } finally {
                                      setIsVerifyingPayment(false);
                                    }
                                  }
                                }}
                                className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                              >
                                Tolak Bukti
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic font-medium">Bukti transfer belum diunggah</span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">
                  Dibuat pada: {new Date(selectedOrder.created_at).toLocaleString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-slate-300">|</span>
                <Link
                  href={`/admin/pesanan/${selectedOrder.id}`}
                  className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  Detail Penuh <ArrowUpRight size={12} />
                </Link>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded bg-white border border-slate-300 hover:bg-slate-50 text-brand-navy font-medium text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
