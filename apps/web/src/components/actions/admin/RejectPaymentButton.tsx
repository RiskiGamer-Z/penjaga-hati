"use client";

import { useState } from "react";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { rejectPaymentAction } from "@/app/admin/verifikasi/actions";
import { toast } from "@/utils/toast";

export interface RejectPaymentButtonProps {
  paymentId: string;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export default function RejectPaymentButton({
  paymentId,
  onSuccess,
  disabled = false,
}: RejectPaymentButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [refundUser, setRefundUser] = useState(false);

  const openModal = () => {
    setReason("");
    setRefundUser(false);
    setIsOpen(true);
  };

  const closeModal = () => {
    if (isPending) return;
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5) {
      toast.warning("Alasan Kurang Jelas", "Alasan penolakan minimal harus 5 karakter.");
      return;
    }

    setIsPending(true);
    try {
      const res = await rejectPaymentAction(paymentId, trimmedReason, refundUser);
      if (res.success) {
        toast.success("Pembayaran Ditolak", "Pembayaran telah ditolak.");
        setIsOpen(false);
        await onSuccess();
      } else {
        toast.error("Gagal Menolak Pembayaran", res.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      toast.error("Error Sistem", err.message || "Gagal menghubungi server.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        disabled={isPending || disabled}
        className="flex-1 flex items-center justify-center rounded-xl py-3.5 px-6 gap-2 border-2 border-red-500 text-red-500 hover:bg-red-50 transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-semibold text-sm"
      >
        <X size={18} />
        <span>Tolak</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-4 p-6 border-b border-slate-100">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 shrink-0">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <h3 className="font-serif font-bold text-brand-navy text-lg">Tolak Pembayaran</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Berikan alasan penolakan. Pesan ini akan dilihat oleh pemesan.
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={isPending}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Alasan Penolakan
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder="Contoh: Bukti transfer tidak sesuai dengan nominal tagihan."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all resize-none"
                />
                <span className="text-[11px] text-gray-400">Minimal 5 karakter.</span>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={refundUser}
                  onChange={(e) => setRefundUser(e.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-brand-navy">Tandai untuk pengembalian dana</span>
                  <span className="text-[11px] text-gray-400">Aktifkan bila pemesan sudah terlanjur mentransfer.</span>
                </div>
              </label>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={closeModal}
                disabled={isPending}
                className="flex-1 rounded-xl py-3 px-4 font-semibold text-sm text-gray-600 border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-semibold text-sm text-white bg-red-500 hover:bg-red-600 transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                Tolak Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
