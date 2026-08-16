"use client";

import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { updateOrderStatusAction } from "@/app/mitra/pesanan/actions";
import { toast } from "@/utils/toast";

export interface ArriveAtLocationButtonProps {
  orderId: string;
  mitraId: string;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export default function ArriveAtLocationButton({
  orderId,
  mitraId,
  onSuccess,
  disabled = false,
}: ArriveAtLocationButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleAction = async () => {
    setIsPending(true);
    try {
      const res = await updateOrderStatusAction(orderId, mitraId, "arrived");
      if (res.success) {
        toast.success("Status Diperbarui", "Anda telah tiba di lokasi pasien.");
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
      className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl py-3 px-8 bg-brand-evergreen hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg hover:shadow-emerald-900/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <MapPin size={16} />
      )}
      <span>Tiba di Lokasi</span>
    </button>
  );
}
