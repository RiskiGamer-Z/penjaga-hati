"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { rejectOrderAction } from "@/app/mitra/pesanan/actions";
import { toast } from "@/utils/toast";

export interface RejectOrderButtonProps {
  orderId: string;
  mitraId: string;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export default function RejectOrderButton({
  orderId,
  mitraId,
  onSuccess,
  disabled = false,
}: RejectOrderButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleReject = async () => {
    const reason = prompt("Masukkan alasan penolakan pesanan:");
    if (!reason || !reason.trim()) {
      toast.warning("Batal Menolak", "Alasan penolakan tidak boleh kosong.");
      return;
    }

    setIsPending(true);
    try {
      const res = await rejectOrderAction(orderId, mitraId, reason.trim());
      if (res.success) {
        toast.success("Pesanan Ditolak", "Pesanan telah dikembalikan ke sistem.");
        await onSuccess();
      } else {
        toast.error("Gagal Menolak Pesanan", res.error || "Terjadi kesalahan.");
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
      className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl py-3 px-6 bg-white border-2 border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <X size={16} />
      )}
      <span>Tolak Tugas</span>
    </button>
  );
}
