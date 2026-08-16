"use client";

import { useState } from "react";
import { approveMitra, suspendUser, unsuspendUser } from "../actions";
import { toast } from "@/utils/toast";
import { Loader2, Check, ShieldAlert, ShieldCheck } from "lucide-react";

interface MitraActionButtonsProps {
  mitraId: string;
  userId: string;
  isVerified: boolean;
  isActive: boolean;
  ownerId: string;
}

export default function MitraActionButtons({ 
  mitraId, 
  userId, 
  isVerified, 
  isActive, 
  ownerId 
}: MitraActionButtonsProps) {
  const [loadingAction, setLoadingAction] = useState<"approve" | "toggle_active" | null>(null);

  const handleApprove = async () => {
    if (loadingAction) return;
    setLoadingAction("approve");
    try {
      const res = await approveMitra(mitraId, ownerId);
      if (res.success) {
        toast.success("Verifikasi Berhasil", "Mitra telah disetujui untuk bertugas.");
      } else {
        toast.error("Gagal Memverifikasi", res.error || "Gagal memproses.");
      }
    } catch (err: any) {
      toast.error("Terjadi Kesalahan", err.message || "Gagal memproses.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleActive = async () => {
    if (loadingAction) return;
    setLoadingAction("toggle_active");
    try {
      let res;
      if (isActive) {
        res = await suspendUser(userId, ownerId, 'mitra');
      } else {
        res = await unsuspendUser(userId, ownerId, 'mitra');
      }
      
      if (res.success) {
        toast.success(
          isActive ? "Mitra Dinonaktifkan" : "Mitra Diaktifkan",
          isActive ? "Mitra berhasil ditangguhkan/suspend." : "Akun mitra berhasil diaktifkan kembali."
        );
      } else {
        toast.error("Gagal Mengubah Status", res.error || "Gagal memproses.");
      }
    } catch (err: any) {
      toast.error("Terjadi Kesalahan", err.message || "Gagal memproses.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Verify Button (only shows if not verified) */}
      {!isVerified && (
        <button
          onClick={handleApprove}
          disabled={loadingAction !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 disabled:opacity-60 transition-all cursor-pointer"
        >
          {loadingAction === "approve" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Check size={13} strokeWidth={3} />
          )}
          Setujui
        </button>
      )}

      {/* Toggle Suspend Button */}
      <button
        onClick={handleToggleActive}
        disabled={loadingAction !== null}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold disabled:opacity-60 transition-all cursor-pointer ${
          isActive 
            ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200" 
            : "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10"
        }`}
      >
        {loadingAction === "toggle_active" ? (
          <Loader2 size={13} className="animate-spin" />
        ) : isActive ? (
          <ShieldAlert size={13} />
        ) : (
          <ShieldCheck size={13} />
        )}
        {isActive ? "Tangguhkan (Suspend)" : "Aktifkan"}
      </button>
    </div>
  );
}
