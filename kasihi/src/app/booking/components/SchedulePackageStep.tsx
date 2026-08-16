import { ArrowLeft, ArrowRight, UserCheck } from "lucide-react";
import React from "react";

interface SchedulePackageStepProps {
  formData: {
    mitraGender: string;
    mitraId: string;
    durationHours: string;
    startDate: string;
    startTime: string;
    packageId: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  filteredMitras: any[];
  packages: any[];
  handlePrev: () => void;
  handleNext: () => void;
}

export default function SchedulePackageStep({
  formData,
  handleChange,
  filteredMitras,
  packages,
  handlePrev,
  handleNext,
}: SchedulePackageStepProps) {
  const isNextDisabled = 
    !formData.mitraId || 
    !formData.packageId || 
    !formData.startDate || 
    !formData.startTime;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1.5 mb-7">
        <h1 className="font-extrabold text-indigo-950 text-2xl">Pilih Pendamping & Paket</h1>
        <p className="text-slate-500 text-sm">Pilih preferensi mitra pendamping, tanggal mulai, dan paket layanan</p>
      </div>

      <div className="flex flex-col gap-1.5 mb-6">
        <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
          Gender Mitra Pendamping <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <label className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${
            formData.mitraGender === 'Laki-laki' ? 'border-indigo-600 bg-indigo-50/60 font-bold' : 'border-slate-200'
          }`}>
            <input 
              type="radio" 
              name="mitraGender" 
              value="Laki-laki" 
              onChange={handleChange} 
              checked={formData.mitraGender === 'Laki-laki'} 
              className="accent-indigo-600" 
            />
            <span className="text-sm text-indigo-950">Laki-laki</span>
          </label>
          <label className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${
            formData.mitraGender === 'Perempuan' ? 'border-indigo-600 bg-indigo-50/60 font-bold' : 'border-slate-200'
          }`}>
            <input 
              type="radio" 
              name="mitraGender" 
              value="Perempuan" 
              onChange={handleChange} 
              checked={formData.mitraGender === 'Perempuan'} 
              className="accent-indigo-600" 
            />
            <span className="text-sm text-indigo-950">Perempuan</span>
          </label>
        </div>

        {formData.mitraGender && (
          <div className="relative">
            <select
              name="mitraId" 
              value={formData.mitraId} 
              onChange={handleChange}
              className="w-full rounded-2xl py-3.5 pl-4 pr-10 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-medium"
            >
              <option value="" disabled>Pilih Mitra ({filteredMitras.length} tersedia)</option>
              {filteredMitras.map(m => (
                <option key={m.id} value={m.id}>
                  {m.users?.full_name || 'Mitra Kasihi'} ({m.specializations?.join(', ') || 'Pendamping Pasien'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
            Tanggal Mulai Pendampingan <span className="text-rose-500">*</span>
          </label>
          <input
            name="startDate" 
            value={formData.startDate} 
            onChange={handleChange}
            type="date"
            className="w-full rounded-2xl py-3.5 px-4 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-medium"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
            Jam Mulai <span className="text-rose-500">*</span>
          </label>
          <input
            name="startTime" 
            value={formData.startTime} 
            onChange={handleChange}
            type="time"
            className="w-full rounded-2xl py-3.5 px-4 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
          Pilihan Paket Layanan <span className="text-rose-500">*</span>
        </label>

        {packages.length > 0 ? packages.map((pkg) => (
          <label key={pkg.id} className={`flex items-start p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden ${
            formData.packageId === pkg.id ? "border-indigo-600 bg-indigo-50/60" : "border-slate-200 hover:border-slate-300"
          }`}>
            <input
              type="radio" 
              name="packageId" 
              value={pkg.id}
              onChange={handleChange} 
              checked={formData.packageId === pkg.id}
              className="mt-1 w-4 h-4 accent-indigo-600"
            />
            <div className="ml-3 flex flex-col flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-950">{pkg.name} ({pkg.duration_hours} Jam)</span>
                <span className="font-black text-rose-500">Rp {Number(pkg.base_price).toLocaleString('id-ID')}</span>
              </div>
              <span className="text-xs text-slate-500 mt-1">{pkg.description || "Termasuk pendampingan penuh & bantuan perawatan pasien dasar."}</span>
            </div>
          </label>
        )) : (
          <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
            Belum ada paket layanan aktif di database.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100">
        <button 
          type="button"
          onClick={handlePrev} 
          className="rounded-full py-3.5 px-6 border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-xs flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled}
          className="flex items-center rounded-full py-3.5 px-8 gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md"
        >
          <span>Lanjut ke Konfirmasi</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
