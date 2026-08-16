"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { acceptOrderAction } from "@/app/mitra/pesanan/actions";
import { toast } from "@/utils/toast";

export interface AcceptOrderButtonProps {
  orderId: string;
  mitraId: string;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export default function AcceptOrderButton({
  orderId,
  mitraId,
  onSuccess,
  disabled = false,
}: AcceptOrderButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleAccept = async () => {
    setIsPending(true);
    try {
      const res = await acceptOrderAction(orderId, mitraId);
      if (res.success) {
        toast.success("Pesanan Diterima", "Anda berhasil menyetujui tugas pendampingan ini.");
        await onSuccess();
      } else {
        toast.error("Gagal Menerima Pesanan", res.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      toast.error("Error Sistem", err.message || "Gagal menghubungi server.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleAccept}
      disabled={isPending || disabled}
      className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl py-3 px-8 bg-brand-evergreen hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg hover:shadow-emerald-900/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Check size={16} />
      )}
      <span>Terima Tugas</span>
    </button>
  );
}
