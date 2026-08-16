"use client";

import { useRef, useState } from "react";
import { X, UploadCloud, Loader2, CheckCircle2, Camera } from "lucide-react";
import { uploadWorkflowPhotoAction } from "@/app/mitra/pesanan/actions";
import { toast } from "@/utils/toast";
import { compressImage } from "@/utils/imageCompression";

export interface WorkflowPhotoModalProps {
  open: boolean;
  title: string;
  description?: string;
  orderId: string;
  step: string;
  /** Jika true, foto wajib diunggah sebelum konfirmasi */
  requirePhoto?: boolean;
  confirmLabel?: string;
  onClose: () => void;
  /** Dipanggil setelah user konfirmasi. Mengembalikan URL foto (jika ada) & catatan. */
  onConfirm: (proof: { photoUrl?: string; notes?: string }) => Promise<void> | void;
}

/**
 * Modal untuk mengunggah foto bukti + catatan pada transisi step workflow mitra.
 * Foto diunggah ke bucket 'order_photos' via server action sebelum konfirmasi.
 */
export default function WorkflowPhotoModal({
  open,
  title,
  description,
  orderId,
  step,
  requirePhoto = false,
  confirmLabel = "Konfirmasi",
  onClose,
  onConfirm,
}: WorkflowPhotoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File Terlalu Besar", "Ukuran foto maksimal 10MB.");
      return;
    }
    // Kompres gambar agar hemat ruang & aman dari limit 1MB Server Action
    const compressed = await compressImage(f);
    setFile(compressed);
    setPreview(URL.createObjectURL(compressed));
  };

  const handleConfirm = async () => {
    if (requirePhoto && !file) {
      toast.warning("Foto Diperlukan", "Mohon unggah foto bukti terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl: string | undefined;

      if (file) {
        setIsUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        fd.append("orderId", orderId);
        fd.append("step", step);
        const res = await uploadWorkflowPhotoAction(fd);
        setIsUploading(false);
        if (!res.success || !res.publicUrl) {
          toast.error("Gagal Mengunggah", res.error || "Upload foto gagal.");
          setIsSubmitting(false);
          return;
        }
        photoUrl = res.publicUrl;
      }

      await onConfirm({ photoUrl, notes: notes.trim() || undefined });
      // Reset
      setFile(null);
      setPreview(null);
      setNotes("");
    } catch (err: any) {
      toast.error("Terjadi Kesalahan", err.message || "Gagal memproses.");
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between py-4 px-6 border-b border-gray-100">
          <h3 className="font-bold text-brand-navy text-lg">{title}</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          {description && <p className="text-sm text-gray-500">{description}</p>}

          {/* Upload area */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-brand-navy text-xs uppercase tracking-wider">
              Foto Bukti {requirePhoto && <span className="text-rose-500">*</span>}
            </label>
            <div
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
                preview ? "border-emerald-500 bg-emerald-50/40" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-center px-4">
                  <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-brand-evergreen">Klik untuk unggah</span> foto
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PNG / JPG (Maks. 5MB)</p>
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-brand-navy text-xs uppercase tracking-wider">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Tambahkan catatan kondisi pasien atau situasi..."
              className="w-full rounded-xl py-2.5 px-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none transition-all text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 py-4 px-6 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="py-2.5 px-5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-brand-evergreen hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isUploading ? "Mengunggah..." : "Memproses..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
