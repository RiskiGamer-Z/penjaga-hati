"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateOrderStatusAction } from "@/app/admin/pesanan/actions";
import { toast } from "@/utils/toast";

export interface CancelOrderButtonProps {
  orderId: string;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export default function CancelOrderButton({
  orderId,
  onSuccess,
  disabled = false,
}: CancelOrderButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleAction = async () => {
    const isConfirmed = await toast.confirm("Konfirmasi Batal", "Apakah Anda yakin ingin membatalkan pesanan ini?");
    if (!isConfirmed) return;
    setIsPending(true);
    try {
      const res = await updateOrderStatusAction(orderId, "cancelled");
      if (res.success) {
        toast.success("Pesanan Dibatalkan", "Status pesanan berhasil diubah menjadi dibatalkan.");
        await onSuccess();
      } else {
        toast.error("Gagal Memperbarui Status", res.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      toast.error("Error Sistem", err.message || "Gagal menghubungi server.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleAction}
      disabled={isPending || disabled}
      className="flex items-center justify-center py-3 rounded-xl border border-red-50 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-50 w-full"
    >
      {isPending && <Loader2 size={16} className="animate-spin mr-2" />}
      <span>Batalkan Pesanan</span>
    </button>
  );
}
