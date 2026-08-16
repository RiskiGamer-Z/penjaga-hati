"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { verifyPaymentAction } from "@/app/admin/verifikasi/actions";
import { toast } from "@/utils/toast";

export interface VerifyPaymentButtonProps {
  paymentId: string;
  orderId: string;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export default function VerifyPaymentButton({
  paymentId,
  orderId,
  onSuccess,
  disabled = false,
}: VerifyPaymentButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleVerify = async () => {
    const isConfirmed = await toast.confirm("Konfirmasi Pembayaran", "Setujui pembayaran ini?");
    if (!isConfirmed) return;

    setIsPending(true);
    try {
      const res = await verifyPaymentAction(paymentId, orderId);
      if (res.success) {
        toast.success("Pembayaran Disetujui", "Pembayaran pesanan berhasil diverifikasi.");
        await onSuccess();
      } else {
        toast.error("Gagal Memverifikasi", res.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      toast.error("Error Sistem", err.message || "Gagal menghubungi server.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleVerify}
      disabled={isPending || disabled}
      className="flex-[2] flex items-center justify-center rounded-xl py-3.5 px-6 gap-2 bg-brand-evergreen hover:bg-emerald-700 text-white transition-colors shadow-lg hover:shadow-emerald-900/35 active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-semibold text-sm"
    >
      {isPending ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Check size={18} />
      )}
      <span>Setujui Pembayaran</span>
    </button>
  );
}
