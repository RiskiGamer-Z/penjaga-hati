import { ArrowLeft, ArrowRight, UserCheck } from "lucide-react";
import React, { useState } from "react";

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

const tierConfig = {
  bronze: { label: "Bronze", color: "text-slate-500", bgColor: "bg-slate-50", borderColor: "border-slate-300", icon: "\u{1F949}" },
  silver:   { label: "Silver", color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-400", icon: "\u{1F948}" },
  gold:     { label: "Gold",   color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-400", icon: "\u{1F947}" }
};

export default function SchedulePackageStep({
  formData,
  handleChange,
  filteredMitras,
  packages,
  handlePrev,
  handleNext,
}: SchedulePackageStepProps) {
  const [selectedMitra, setSelectedMitra] = useState<string>(formData.mitraId);
  const isNextDisabled = !formData.mitraId || !formData.packageId || !formData.startDate || !formData.startTime;

  const formatRupiah = (price: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);

  const groupedPackages = packages.reduce((acc: Record<string, any[]>, pkg) => {
    const tier = pkg.tier || "bronze";
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(pkg);
    return acc;
  }, {});

  const tiersOrder = ["bronze", "silver", "gold"];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-7">
        <h1 className="font-extrabold text-indigo-950 text-2xl">Pilih Pendamping & Paket</h1>
        <p className="text-slate-500 text-sm">Pilih preferensi mitra pendamping, tanggal mulai, dan paket layanan</p>
      </div>

      {/* ========== MITRA SELECTION - CARDS ========== */}
      <div className="flex flex-col gap-1.5 mb-8">
        <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
          Gender Mitra Pendamping <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4 mb-3">
          {["Laki-laki", "Perempuan"].map((gender) => (
            <label key={gender} className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${
              formData.mitraGender === gender ? "border-indigo-600 bg-indigo-50/60 font-bold" : "border-slate-200"
            }`}>
              <input 
                type="radio" 
                name="mitraGender" 
                value={gender} 
                onChange={handleChange} 
                checked={formData.mitraGender === gender} 
                className="accent-indigo-600" 
              />
              <span className="text-sm text-indigo-950">{gender}</span>
            </label>
          ))}
        </div>

        {/* Mitra Cards Grid */}
        {formData.mitraGender && filteredMitras.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMitras.map((m) => {
              const specs = m.specializations || ["Pendamping Pasien"];
              const isSelected = selectedMitra === m.id;
              
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMitra(m.id);
                    handleChange({ target: { name: "mitraId", value: m.id } } as any);
                  }}
                  className={`rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${
                    isSelected 
                      ? "border-indigo-600 bg-indigo-50/80 shadow-sm" 
                      : "border-slate-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3 mb-3">
                    {m.users?.avatar_url ? (
                      <img
                        src={m.users.avatar_url}
                        alt={m.users?.full_name || "Mitra"}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                        m.gender === "Perempuan" ? "bg-pink-500" : "bg-blue-500"
                      }`}>
                        {(m.users?.full_name || "M").charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-indigo-950 text-sm truncate">{m.users?.full_name || "Mitra Penjaga Hati"}</p>
                        {m.is_verified && (
                          <UserCheck size={13} className="text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{specs.slice(0, 2).join(", ")}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {specs.slice(0, 3).map((spec: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="mt-3 flex items-center gap-1 text-indigo-600 text-xs font-semibold">
                      <UserCheck size={14} /> Dipilih
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {formData.mitraGender && filteredMitras.length === 0 && (
          <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
            Belum ada mitra tersedia untuk gender ini.
          </div>
        )}
      </div>

      {/* ========== DATE & TIME ========== */}
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

      {/* ========== PACKAGES BY TIER ========== */}
      <div className="flex flex-col gap-4 mb-8">
        <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
          Pilihan Paket Layanan <span className="text-rose-500">*</span>
        </label>

        {packages.length > 0 ? tiersOrder.map((tier) => {
          const tierPkgs = groupedPackages[tier];
          if (!tierPkgs || tierPkgs.length === 0) return null;
          const cfg = tierConfig[tier as keyof typeof tierConfig];

          return (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{cfg.icon}</span>
                <span className={`font-bold text-xs uppercase tracking-wider ${cfg.color}`}>{cfg.label} Tier</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tierPkgs.map((pkg) => (
                  <label key={pkg.id} className={`flex items-start p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                    formData.packageId === pkg.id 
                      ? `${cfg.borderColor} ${cfg.bgColor} shadow-sm` 
                      : "border-slate-200 hover:border-slate-300 bg-white"
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
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-indigo-950 text-sm">{pkg.name}</span>
                          <span className="text-xs text-slate-500 ml-1">
                            ({pkg.duration_unit === "hours" ? "" : pkg.duration_unit === "days" ? "Hari" : "Minggu"} {pkg.duration_hours})
                          </span>
                        </div>
                        <span className="font-black text-rose-500 text-sm whitespace-nowrap ml-2">{formatRupiah(Number(pkg.base_price ?? pkg.price_per_unit ?? 0))}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 line-clamp-2">{pkg.description || ""}</span>
                      
                      {/* Features Preview */}
                      {pkg.features && Array.isArray(pkg.features) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pkg.features.slice(0, 3).map((f: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px]">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        }) : (
          <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
            Belum ada paket layanan aktif di database.
          </div>
        )}
      </div>

      {/* Navigation */}
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
