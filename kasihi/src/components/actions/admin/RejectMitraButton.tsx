"use client";

import { useState } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { rejectMitraAction } from "@/app/admin/mitra/actions";
import { toast } from "@/utils/toast";

export interface RejectMitraButtonProps {
  mitraId: string;
  onSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

export default function RejectMitraButton({
  mitraId,
  onSuccess,
  disabled = false,
}: RejectMitraButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleRejectConfirm = async () => {
    if (!reason || reason.length < 5) {
      toast.error("Format Salah", "Alasan minimal 5 karakter.");
      return;
    }
    setIsPending(true);
    try {
      const result = await rejectMitraAction(mitraId, reason);
      if (result.success) {
        toast.success("Mitra Ditolak", "Mitra berhasil ditolak.");
        setIsOpen(false);
        setReason("");
        await onSuccess();
      } else {
        toast.error("Gagal Menolak Mitra", result.error || "Terjadi kesalahan.");
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
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-xl shadow-sm text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        <ShieldAlert size={16} />
        <span>Tolak</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 text-gray-900">
            <h3 className="text-lg font-bold text-brand-navy mb-4">
              Tolak Mitra
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alasan *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan alasan penolakan..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-evergreen outline-none"
                  rows={4}
                />
                <span className="text-xs text-gray-500 mt-1 block">Minimal 5 karakter</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setReason("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  disabled={isPending || reason.length < 5}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending && <Loader2 size={16} className="animate-spin" />}
                  <span>Tolak</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
