"use client";

import { useState } from "react";
import { toggleUserStatus } from "../actions";
import { toast } from "@/utils/toast";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";

interface UserActionButtonsProps {
  userId: string;
  isActive: boolean;
  ownerId: string;
}

export default function UserActionButtons({ 
  userId, 
  isActive, 
  ownerId 
}: UserActionButtonsProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await toggleUserStatus(userId, isActive, ownerId);
      if (res.success) {
        toast.success(
          isActive ? "Pengguna Dinonaktifkan" : "Pengguna Diaktifkan",
          isActive ? "Akun pengguna telah ditangguhkan sementara." : "Akun pengguna telah diaktifkan kembali."
        );
      } else {
        toast.error("Gagal Memperbarui", res.error || "Gagal mengubah status pengguna.");
      }
    } catch (err: any) {
      toast.error("Terjadi Kesalahan", err.message || "Gagal memproses perubahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-60 transition-all cursor-pointer ${
        isActive 
          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200" 
          : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
      }`}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : isActive ? (
        <ShieldAlert size={12} />
      ) : (
        <ShieldCheck size={12} />
      )}
      {isActive ? "Tangguhkan (Suspend)" : "Aktifkan"}
    </button>
  );
}
