"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { confirmOrderCompletionAction } from "@/app/user/orders/actions";
import { toast } from "@/utils/toast";
import { useRouter } from "next/navigation";

export interface ConfirmCompletionButtonProps {
  orderId: string;
  onSuccess?: () => void | Promise<void>;
  disabled?: boolean;
}

export default function ConfirmCompletionButton({
  orderId,
  onSuccess,
  disabled = false,
}: ConfirmCompletionButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleAction = async () => {
    const isConfirmed = await toast.confirm("Konfirmasi Selesai", "Apakah Anda yakin ingin mengonfirmasi bahwa tugas pendampingan ini telah selesai?");
    if (!isConfirmed) return;

    setIsPending(true);
    try {
      const res = await confirmOrderCompletionAction(orderId);
      if (res.success) {
        toast.success("Pesanan Selesai", "Terima kasih telah mengonfirmasi penyelesaian tugas ini.");
        if (onSuccess) {
          await onSuccess();
        } else {
          router.refresh();
        }
      } else {
        toast.error("Gagal Mengonfirmasi", res.error || "Terjadi kesalahan.");
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
      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-8 bg-brand-evergreen hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg hover:shadow-emerald-900/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <CheckCircle2 size={16} />
      )}
      <span>Konfirmasi Selesai</span>
    </button>
  );
}
