"use client";

import { useState } from "react";
import { Upload, X, CheckCircle2, FileText, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { saveMitraDocumentAction, deleteMitraDocumentAction } from "@/features/mitra_documents/actions";
import { toast } from "@/utils/toast";

interface DocumentFormProps {
  mitraId: string;
  userId: string;
  documents: any[];
  onRefresh: () => void;
}

export default function DocumentForm({ mitraId, userId, documents, onRefresh }: DocumentFormProps) {
  const [uploading, setUploading] = useState<string | null>(null); // document_type
  const [deleting, setDeleting] = useState<string | null>(null); // document id

  const documentConfig = [
    { type: 'ktp', label: 'Kartu Tanda Penduduk (KTP)', desc: 'Format: JPG/PNG/PDF. Maks 5MB' },
    { type: 'sertifikat', label: 'Sertifikat Keahlian / Ijazah', desc: 'Format: JPG/PNG/PDF. Maks 5MB' },
    { type: 'skck', label: 'SKCK Aktif', desc: 'Format: JPG/PNG/PDF. Maks 5MB' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error("Format file tidak didukung");
      return;
    }

    setUploading(type);
    try {
      const supabase = createClient();
      
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mitra_documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('mitra_documents')
        .getPublicUrl(fileName);

      const fileUrl = publicUrlData.publicUrl;

      // Save to database
      const res = await saveMitraDocumentAction({
        mitraId,
        documentType: type as any,
        fileUrl
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Dokumen berhasil diunggah!");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah dokumen");
    } finally {
      setUploading(null);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    const isConfirmed = await toast.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus dokumen ini?");
    if (!isConfirmed) return;
    
    setDeleting(docId);
    try {
      const res = await deleteMitraDocumentAction(mitraId, docId);
      if (!res.success) throw new Error(res.error);
      
      toast.success("Dokumen berhasil dihapus");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus dokumen");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string, reason?: string) => {
    switch (status) {
      case 'verified':
        return <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-emerald-50 text-emerald-600 rounded">Terverifikasi</span>;
      case 'rejected':
        return (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-red-50 text-red-600 rounded">Ditolak</span>
            {reason && <span className="text-[10px] text-red-500 max-w-[150px] truncate" title={reason}>{reason}</span>}
          </div>
        );
      default:
        return <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-orange-50 text-orange-600 rounded">Menunggu Verifikasi</span>;
    }
  };

  return (
    <div className="flex flex-col gap-4 relative z-10">
      {documentConfig.map((config) => {
        const existingDoc = documents.find(d => d.document_type === config.type);
        
        return (
          <div key={config.type} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-brand-evergreen/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 text-brand-navy shadow-sm">
                <FileText size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#1A2332] text-sm">{config.label}</span>
                <span className="text-xs text-gray-400 font-medium">{config.desc}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              {existingDoc ? (
                <>
                  {getStatusBadge(existingDoc.status, existingDoc.rejection_reason)}
                  <a href={existingDoc.file_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline">
                    Lihat
                  </a>
                  {existingDoc.status !== 'verified' && (
                    <button 
                      onClick={() => handleDelete(existingDoc.id)}
                      disabled={deleting === existingDoc.id}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      {deleting === existingDoc.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                    </button>
                  )}
                </>
              ) : (
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".jpg,.jpeg,.png,.pdf" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={uploading === config.type}
                    onChange={(e) => handleFileUpload(e, config.type)}
                  />
                  <button 
                    className="flex items-center gap-2 bg-white border border-gray-200 text-brand-navy text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:border-brand-evergreen hover:text-brand-evergreen transition-colors"
                    disabled={uploading === config.type}
                  >
                    {uploading === config.type ? (
                      <><Loader2 size={14} className="animate-spin" /> Mengunggah...</>
                    ) : (
                      <><Upload size={14} /> Unggah File</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
