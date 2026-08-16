"use client";

import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { assignMitraAction } from "@/app/admin/pesanan/actions";
import { toast } from "@/utils/toast";

export interface AssignMitraButtonProps {
  orderId: string;
  availableMitras: Array<{
    id: string;
    user_id?: string;
    users?: { full_name: string; phone?: string } | Array<{ full_name: string; phone?: string }>;
  }>;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export default function AssignMitraButton({
  orderId,
  availableMitras,
  onSuccess,
  disabled = false,
}: AssignMitraButtonProps) {
  const [selectedMitraId, setSelectedMitraId] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleAssign = async () => {
    if (!selectedMitraId) {
      toast.error("Pilih Mitra", "Silakan pilih mitra terlebih dahulu.");
      return;
    }

    setIsPending(true);
    try {
      const res = await assignMitraAction(orderId, selectedMitraId);
      if (res.success) {
        toast.success("Mitra Ditetapkan", "Mitra berhasil ditugaskan untuk mendampingi pasien.");
        setSelectedMitraId("");
        await onSuccess();
      } else {
        toast.error("Gagal Menetapkan Mitra", res.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      toast.error("Error Sistem", err.message || "Gagal menghubungi server.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 relative z-10 w-full">
      <p className="text-white/60 text-xs leading-relaxed">
        Pilih salah satu mitra terverifikasi untuk mendampingi pasien ini.
      </p>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Pilih Mitra</label>
        <select
          value={selectedMitraId}
          onChange={(e) => setSelectedMitraId(e.target.value)}
          disabled={isPending || disabled}
          className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-brand-evergreen/50 appearance-none text-white disabled:opacity-50"
        >
          <option value="" className="text-gray-900">Pilih...</option>
          {availableMitras.map((m) => {
            const user = Array.isArray(m.users) ? m.users[0] : m.users;
            return (
              <option key={m.id} value={m.id} className="text-gray-900">
                {user?.full_name || "Tanpa Nama"}
              </option>
            );
          })}
        </select>
      </div>

      <button
        onClick={handleAssign}
        disabled={isPending || !selectedMitraId || disabled}
        className="w-full py-4 bg-brand-evergreen hover:bg-emerald-600 disabled:bg-white/20 disabled:text-white/40 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
      >
        {isPending ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <UserPlus size={20} />
        )}
        <span>Tetapkan Mitra</span>
      </button>
    </div>
  );
}
