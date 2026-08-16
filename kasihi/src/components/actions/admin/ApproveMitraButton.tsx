"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { approveMitraAction } from "@/app/admin/mitra/actions";
import { toast } from "@/utils/toast";

export interface ApproveMitraButtonProps {
  mitraId: string;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export default function ApproveMitraButton({
  mitraId,
  onSuccess,
  disabled = false,
}: ApproveMitraButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleVerify = async () => {
    const isConfirmed = await toast.confirm("Konfirmasi Persetujuan", "Apakah Anda yakin ingin menyetujui mitra ini?");
    if (!isConfirmed) return;
    setIsPending(true);
    try {
      const result = await approveMitraAction(mitraId, "Disetujui oleh admin");
      if (result.success) {
        toast.success("Mitra Disetujui", "Mitra berhasil disetujui.");
        await onSuccess();
      } else {
        toast.error("Gagal Menyetujui Mitra", result.error || "Terjadi kesalahan.");
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
      className="px-4 py-2 bg-brand-evergreen text-white rounded-xl shadow-sm text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <CheckCircle size={16} />
      )}
      <span>Setujui Mitra</span>
    </button>
  );
}
