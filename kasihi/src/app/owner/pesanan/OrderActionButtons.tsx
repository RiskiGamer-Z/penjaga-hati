"use client";

import { useState } from "react";
import { ownerAssignMitra, ownerUpdateOrderStatus } from "../actions";
import { toast } from "@/utils/toast";
import { Loader2, UserPlus, CheckCircle, XCircle, ChevronDown } from "lucide-react";

interface MitraOption {
  id: string;
  users?: {
    full_name: string;
  } | any;
}

interface OrderActionButtonsProps {
  orderId: string;
  status: string;
  currentMitraId: string | null;
  availableMitras: MitraOption[];
  ownerId: string;
}

export default function OrderActionButtons({
  orderId,
  status,
  currentMitraId,
  availableMitras,
  ownerId,
}: OrderActionButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [selectedMitraId, setSelectedMitraId] = useState("");

  const handleUpdateStatus = async (newStatus: string, actionName: string) => {
    const isConfirmed = await toast.confirm("Konfirmasi Aksi", `Apakah Anda yakin ingin ${actionName} pesanan ini?`);
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const res = await ownerUpdateOrderStatus(orderId, newStatus, ownerId);
      if (res.success) {
        toast.success(
          "Status Diperbarui",
          `Status pesanan berhasil diubah menjadi: ${newStatus.replace("_", " ")}`
        );
      } else {
        toast.error("Gagal Memperbarui", res.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      toast.error("Terjadi Kesalahan", err.message || "Gagal memproses.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMitra = async () => {
    if (!selectedMitraId) {
      toast.error("Pilih Mitra", "Pilih salah satu mitra pendamping.");
      return;
    }

    setLoading(true);
    try {
      const res = await ownerAssignMitra(orderId, selectedMitraId, ownerId);
      if (res.success) {
        toast.success(
          "Mitra Ditugaskan",
          "Mitra pendamping berhasil ditugaskan untuk pesanan ini."
        );
        setShowAssignDropdown(false);
        setSelectedMitraId("");
      } else {
        toast.error("Gagal Menetapkan", res.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      toast.error("Terjadi Kesalahan", err.message || "Gagal memproses.");
    } finally {
      setLoading(false);
    }
  };

  // Render actions based on status
  const isFinished = ["completed", "cancelled"].includes(status);
  const isActive = ["accepted", "in_transit", "arrived", "in_progress"].includes(status);
  const isWaiting = status === "waiting_mitra";

  return (
    <div className="flex flex-col items-end gap-2 text-xs">
      {loading && (
        <div className="flex items-center gap-1.5 text-slate-500 font-medium py-1">
          <Loader2 size={14} className="animate-spin text-brand-evergreen" />
          <span>Memproses...</span>
        </div>
      )}

      {!loading && !isFinished && (
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Assign Mitra Button & Dialog */}
          {(isWaiting || !currentMitraId) && (
            <div className="relative">
              <button
                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer"
              >
                <UserPlus size={12} />
                <span>{currentMitraId ? "Ganti Mitra" : "Tugaskan Mitra"}</span>
                <ChevronDown size={12} />
              </button>

              {showAssignDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 flex flex-col gap-2.5">
                  <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">
                    Pilih Mitra Pendamping
                  </span>
                  <select
                    value={selectedMitraId}
                    onChange={(e) => setSelectedMitraId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-brand-evergreen/20"
                  >
                    <option value="">Pilih Mitra...</option>
                    {availableMitras.map((m) => {
                      const user = m.users;
                      return (
                        <option key={m.id} value={m.id}>
                          {user?.full_name || "Tanpa Nama"}
                        </option>
                      );
                    })}
                  </select>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowAssignDropdown(false)}
                      className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-500 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleAssignMitra}
                      disabled={!selectedMitraId}
                      className="px-3 py-1.5 rounded-lg bg-brand-evergreen hover:bg-emerald-600 disabled:opacity-50 text-white font-bold"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Complete Order Button */}
          {isActive && (
            <button
              onClick={() => handleUpdateStatus("completed", "menyelesaikan")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <CheckCircle size={12} />
              <span>Selesaikan</span>
            </button>
          )}

          {/* Cancel Order Button */}
          <button
            onClick={() => handleUpdateStatus("cancelled", "membatalkan")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold transition-all border border-rose-500/20 cursor-pointer"
          >
            <XCircle size={12} />
            <span>Batalkan</span>
          </button>
        </div>
      )}

      {isFinished && (
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          Tidak ada aksi
        </span>
      )}
    </div>
  );
}
