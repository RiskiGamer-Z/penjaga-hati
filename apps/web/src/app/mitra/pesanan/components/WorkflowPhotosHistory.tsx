"use client";

import { useEffect, useState } from "react";
import { Loader2, Image as ImageIcon, Camera } from "lucide-react";
import { getOrderPhotosAction } from "@/app/mitra/pesanan/actions";

interface WorkflowPhotosHistoryProps {
  orderId: string;
  /** Trigger refetch saat berubah */
  refreshKey?: number;
}

const STEP_LABELS: Record<string, { label: string; color: string }> = {
  accepted: { label: "Diterima", color: "bg-indigo-50 text-indigo-600" },
  arrived: { label: "Tiba di Lokasi", color: "bg-sky-50 text-sky-600" },
  started: { label: "Mulai Pendampingan", color: "bg-purple-50 text-purple-600" },
  completed: { label: "Selesai", color: "bg-emerald-50 text-emerald-600" },
};

export default function WorkflowPhotosHistory({ orderId, refreshKey }: WorkflowPhotosHistoryProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getOrderPhotosAction(orderId);
      if (res.success) setPhotos(res.data);
      setLoading(false);
    })();
  }, [orderId, refreshKey]);

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div className="py-4 px-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="font-bold text-brand-navy text-base flex items-center gap-2">
          <Camera size={18} className="text-brand-evergreen" />
          Foto & Catatan Progres
        </h2>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={22} className="animate-spin text-brand-evergreen" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-gray-400">
            <ImageIcon size={36} className="mb-2 opacity-30" />
            <p className="text-sm">Belum ada foto bukti progres.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((p) => {
              const meta = STEP_LABELS[p.step] || { label: p.step, color: "bg-gray-50 text-gray-600" };
              return (
                <div key={p.id} className="flex flex-col rounded-xl border border-gray-100 overflow-hidden">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={meta.label} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gray-50 flex items-center justify-center">
                      <ImageIcon size={28} className="text-gray-300" />
                    </div>
                  )}
                  <div className="p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider rounded-md px-2 py-0.5 ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(p.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {p.notes && <p className="text-xs text-gray-600 leading-relaxed">{p.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
