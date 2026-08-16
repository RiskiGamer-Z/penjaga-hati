import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";

interface PatientDetailsStepProps {
  formData: {
    patientName: string;
    patientAge: string;
    hospitalId: string;
    roomNumber: string;
    diagnosis: string;
    specialNotes: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  hospitals: any[];
  handleNext: () => void;
}

export default function PatientDetailsStep({
  formData,
  handleChange,
  hospitals,
  handleNext,
}: PatientDetailsStepProps) {
  const isNextDisabled = 
    !formData.patientName || 
    !formData.patientAge || 
    !formData.hospitalId || 
    !formData.diagnosis;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1.5 mb-7">
        <h1 className="font-extrabold text-indigo-950 text-2xl">Detail Pasien & Rumah Sakit</h1>
        <p className="text-slate-500 text-sm">Isikan informasi mengenai anggota keluarga yang memerlukan pendampingan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
            Nama Pasien <span className="text-rose-500">*</span>
          </label>
          <input
            name="patientName" 
            value={formData.patientName} 
            onChange={handleChange}
            type="text" 
            placeholder="Nama lengkap pasien"
            className="w-full rounded-2xl py-3.5 px-4 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-medium"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
            Usia Pasien (Tahun) <span className="text-rose-500">*</span>
          </label>
          <input
            name="patientAge" 
            value={formData.patientAge} 
            onChange={handleChange}
            type="number" 
            placeholder="Contoh: 65" 
            min="0"
            className="w-full rounded-2xl py-3.5 px-4 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-4">
        <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
          Pilihan Rumah Sakit <span className="text-rose-500">*</span>
        </label>
        <select
          name="hospitalId" 
          value={formData.hospitalId} 
          onChange={handleChange}
          className="w-full rounded-2xl py-3.5 px-4 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-medium"
        >
          <option value="" disabled>Pilih Rumah Sakit Rujukan</option>
          {hospitals.map((rs) => (
            <option key={rs.id} value={rs.id}>{rs.name} ({rs.city})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
            Nomor Kamar / Bangsal
          </label>
          <input
            name="roomNumber" 
            value={formData.roomNumber} 
            onChange={handleChange}
            type="text" 
            placeholder="Contoh: Lantai 3 - Kamar 302"
            className="w-full rounded-2xl py-3.5 px-4 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-medium"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
            Diagnosa / Keluhan Utama <span className="text-rose-500">*</span>
          </label>
          <input
            name="diagnosis" 
            value={formData.diagnosis} 
            onChange={handleChange}
            type="text" 
            placeholder="Kondisi umum pasien"
            className="w-full rounded-2xl py-3.5 px-4 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
          Catatan / Penanganan Khusus (Opsional)
        </label>
        <textarea
          name="specialNotes" 
          value={formData.specialNotes} 
          onChange={handleChange}
          placeholder="Instruksi khusus untuk pendamping (misal: pantau jam minum obat, butuh bantuan mobilitas)..."
          className="w-full min-h-[90px] rounded-2xl py-3.5 px-4 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-medium resize-y"
        />
      </div>

      <div className="flex items-center justify-end pt-6 gap-3 mt-8 border-t border-slate-100">
        <Link href="/" className="rounded-full py-3.5 px-6 border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-xs">
          Batal
        </Link>
        <button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled}
          className="flex items-center rounded-full py-3.5 px-8 gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md"
        >
          <span>Lanjut ke Jadwal</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
