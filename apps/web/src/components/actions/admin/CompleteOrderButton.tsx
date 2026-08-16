"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateOrderStatusAction } from "@/app/admin/pesanan/actions";
import { toast } from "@/utils/toast";

export interface CompleteOrderButtonProps {
  orderId: string;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export default function CompleteOrderButton({
  orderId,
  onSuccess,
  disabled = false,
}: CompleteOrderButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleAction = async () => {
    setIsPending(true);
    try {
      const res = await updateOrderStatusAction(orderId, "completed");
      if (res.success) {
        toast.success("Pesanan Selesai", "Status pesanan berhasil diubah menjadi selesai.");
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
      className="flex items-center justify-center py-3 rounded-xl border border-emerald-100 text-brand-evergreen font-bold text-sm hover:bg-emerald-50 transition-colors disabled:opacity-50 w-full"
    >
      {isPending && <Loader2 size={16} className="animate-spin mr-2" />}
      <span>Tandai Selesai</span>
    </button>
  );
}
