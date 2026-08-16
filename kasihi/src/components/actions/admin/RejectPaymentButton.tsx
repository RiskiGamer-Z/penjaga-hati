"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
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

  const handleReject = async () => {
    const reason = prompt("Masukkan alasan penolakan pembayaran:");
    if (reason === null) return; // cancelled

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5) {
      toast.warning("Alasan Kurang Jelas", "Alasan penolakan minimal harus 5 karakter.");
      return;
    }

    setIsPending(true);
    try {
      const res = await rejectPaymentAction(paymentId, trimmedReason, false);
      if (res.success) {
        toast.success("Pembayaran Ditolak", "Pembayaran telah ditolak.");
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
    <button
      onClick={handleReject}
      disabled={isPending || disabled}
      className="flex-1 flex items-center justify-center rounded-xl py-3.5 px-6 gap-2 border-2 border-red-500 text-red-500 hover:bg-red-50 transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-semibold text-sm"
    >
      {isPending ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <X size={18} />
      )}
      <span>Tolak</span>
    </button>
  );
}
