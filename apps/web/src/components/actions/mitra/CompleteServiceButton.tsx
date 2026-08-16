"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { updateOrderStatusAction } from "@/app/mitra/pesanan/actions";
import { toast } from "@/utils/toast";
import WorkflowPhotoModal from "./WorkflowPhotoModal";

export interface CompleteServiceButtonProps {
  orderId: string;
  mitraId: string;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export default function CompleteServiceButton({
  orderId,
  mitraId,
  onSuccess,
  disabled = false,
}: CompleteServiceButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleConfirm = async (proof: { photoUrl?: string; notes?: string }) => {
    setIsPending(true);
    try {
      const res = await updateOrderStatusAction(orderId, mitraId, "service_done", proof);
      if (res.success) {
        toast.success("Tugas Selesai", "Anda telah menandai tugas ini selesai. Menunggu konfirmasi dari pemesan.");
        setModalOpen(false);
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
    <>
      <button
        onClick={() => setModalOpen(true)}
        disabled={isPending || disabled}
        className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl py-3 px-8 bg-brand-evergreen hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg hover:shadow-emerald-900/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        <span>Selesaikan Tugas</span>
      </button>

      <WorkflowPhotoModal
        open={modalOpen}
        title="Selesaikan Tugas Pendampingan"
        description="Unggah foto bukti akhir pendampingan sebagai dokumentasi penyelesaian tugas."
        orderId={orderId}
        step="completed"
        requirePhoto={true}
        confirmLabel="Selesaikan Tugas"
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
