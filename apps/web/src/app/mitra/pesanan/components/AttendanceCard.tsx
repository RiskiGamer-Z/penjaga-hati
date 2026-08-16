"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Clock, Camera, CheckCircle2, UploadCloud, History } from "lucide-react";
import {
  submitAttendanceAction,
  getOrderAttendancesAction,
  uploadWorkflowPhotoAction,
} from "@/app/mitra/pesanan/actions";
import { toast } from "@/utils/toast";
import { compressImage } from "@/utils/imageCompression";

interface AttendanceCardProps {
  orderId: string;
  mitraId: string;
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export default function AttendanceCard({ orderId, mitraId }: AttendanceCardProps) {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchAttendances = async () => {
    setLoading(true);
    const res = await getOrderAttendancesAction(orderId);
    if (res.success) setAttendances(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendances();
  }, [orderId]);

  // Tick setiap 30 detik untuk update countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const lastCheckIn = attendances.length > 0 ? new Date(attendances[0].check_in_time).getTime() : null;
  const nextAllowedAt = lastCheckIn ? lastCheckIn + SIX_HOURS_MS : null;
  const canCheckIn = !nextAllowedAt || now >= nextAllowedAt;
  const remainingMs = nextAllowedAt ? Math.max(0, nextAllowedAt - now) : 0;
  const remainingH = Math.floor(remainingMs / 3600000);
  const remainingM = Math.ceil((remainingMs % 3600000) / 60000);

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

  const captureGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      toast.warning("GPS Tidak Didukung", "Perangkat tidak mendukung geolokasi.");
      return;
    }
    setGpsStatus("loading");
    setGpsAddress(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGps(coords);
        setGpsStatus("done");
        // Reverse geocoding untuk pratinjau nama lokasi (OpenStreetMap Nominatim)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "id" } }
          );
          const data = await res.json();
          setGpsAddress(data?.display_name || null);
        } catch {
          setGpsAddress(null);
        }
      },
      () => {
        setGpsStatus("error");
        toast.warning("Gagal Ambil Lokasi", "Izinkan akses lokasi untuk absensi.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.warning("Foto Diperlukan", "Mohon unggah foto sebagai bukti absensi.");
      return;
    }
    setIsSubmitting(true);
    try {
      // Upload foto
      const fd = new FormData();
      fd.append("file", file);
      fd.append("orderId", orderId);
      fd.append("step", "attendance");
      const upRes = await uploadWorkflowPhotoAction(fd);
      if (!upRes.success || !upRes.publicUrl) {
        toast.error("Gagal Mengunggah", upRes.error || "Upload foto gagal.");
        setIsSubmitting(false);
        return;
      }

      const res = await submitAttendanceAction(orderId, mitraId, {
        photoUrl: upRes.publicUrl,
        gps,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success("Absensi Tercatat", "Check-in berhasil disimpan.");
        setFile(null);
        setPreview(null);
        setNotes("");
        setGps(null);
        setGpsStatus("idle");
        setGpsAddress(null);
        await fetchAttendances();
      } else {
        toast.error("Gagal Absensi", res.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      toast.error("Error Sistem", err.message || "Gagal menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div className="py-4 px-6 border-b border-gray-100 bg-purple-50/40 flex items-center justify-between">
        <h2 className="font-bold text-brand-navy text-base flex items-center gap-2">
          <Clock size={18} className="text-purple-600" />
          Absensi Berkala (6 Jam)
        </h2>
        <span className="text-xs font-bold text-purple-600 bg-purple-100 rounded-full px-2.5 py-1">
          {attendances.length}x tercatat
        </span>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Status countdown */}
        {!canCheckIn && (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 p-3">
            <Clock size={18} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">
              Absensi berikutnya dalam{" "}
              <span className="font-bold">
                {remainingH > 0 ? `${remainingH} jam ` : ""}{remainingM} menit
              </span>
            </p>
          </div>
        )}

        {/* Form check-in (hanya jika boleh) */}
        {canCheckIn && (
          <div className="flex flex-col gap-3">
            <div
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
                preview ? "border-emerald-500 bg-emerald-50/40" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {preview ? (
                <img src={preview} alt="Preview absensi" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-center px-4">
                  <UploadCloud className="w-7 h-7 mb-1.5 text-gray-400" />
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-brand-evergreen">Unggah foto</span> absensi
                  </p>
                </div>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileChange} />

            {/* GPS */}
            <button
              type="button"
              onClick={captureGps}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                gpsStatus === "done"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {gpsStatus === "loading" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : gpsStatus === "done" ? (
                <CheckCircle2 size={14} />
              ) : (
                <MapPin size={14} />
              )}
              {gpsStatus === "done" ? "Lokasi Tersimpan" : "Ambil Lokasi GPS"}
            </button>

            {/* Pratinjau lokasi setelah GPS diambil */}
            {gpsStatus === "done" && gps && (
              <div className="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="flex items-start gap-2">
                  <MapPin size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Lokasi Anda Saat Ini</span>
                    {gpsAddress ? (
                      <span className="text-xs text-gray-700 leading-snug">{gpsAddress}</span>
                    ) : (
                      <span className="text-xs text-gray-500 italic flex items-center gap-1">
                        <Loader2 size={11} className="animate-spin" /> Mengambil nama lokasi...
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 mt-0.5 font-mono">
                      {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                    </span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${gps.lat},${gps.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start text-[11px] font-bold text-emerald-700 underline hover:text-emerald-800"
                >
                  Lihat di Google Maps →
                </a>
              </div>
            )}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Catatan kondisi pasien (opsional)..."
              className="w-full rounded-xl py-2.5 px-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              <span>Check-in Sekarang</span>
            </button>
          </div>
        )}

        {/* Riwayat absensi */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
            <History size={14} /> Riwayat Absensi
          </div>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-purple-500" />
            </div>
          ) : attendances.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Belum ada absensi tercatat.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {attendances.map((att) => (
                <div key={att.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5 bg-gray-50/50">
                  {att.photo_url ? (
                    <img src={att.photo_url} alt="Absensi" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <Clock size={18} className="text-purple-500" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-brand-navy text-xs">
                      {new Date(att.check_in_time).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB
                    </span>
                    {att.notes && <span className="text-[11px] text-gray-500 truncate">{att.notes}</span>}
                    {att.gps_location && (
                      <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                        <MapPin size={10} /> Lokasi tercatat
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
