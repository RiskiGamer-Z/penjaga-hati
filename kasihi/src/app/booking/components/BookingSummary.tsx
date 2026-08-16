interface BookingSummaryProps {
  formData: {
    hospitalId: string;
    mitraId: string;
    durationHours: string;
    packageId: string;
  };
  hospitals: any[];
  mitras: any[];
  packages: any[];
  getPackagePrice: () => number;
}

export default function BookingSummary({
  formData,
  hospitals,
  mitras,
  packages,
  getPackagePrice,
}: BookingSummaryProps) {
  const selectedHospital = hospitals.find(h => h.id === formData.hospitalId);
  const selectedMitra = mitras.find(m => m.id === formData.mitraId);
  const selectedPackage = packages.find(p => p.id === formData.packageId);

  return (
    <div className="flex flex-col w-full lg:w-80 shrink-0 gap-5">
      <div className="flex flex-col rounded-3xl gap-5 bg-white border border-indigo-100 p-6 md:p-7 shadow-sm">
        <h3 className="font-extrabold text-indigo-950 text-base">Ringkasan Pesanan</h3>
        <div className="w-full h-px bg-slate-100" />
        <div className="flex flex-col gap-3.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Rumah Sakit</span>
            <span className="font-bold text-indigo-950 text-right max-w-[140px] truncate">
              {selectedHospital?.name || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Mitra Pendamping</span>
            <span className="font-bold text-indigo-950 text-right max-w-[140px] truncate">
              {selectedMitra?.users?.full_name || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Durasi Layanan</span>
            <span className="font-bold text-indigo-950 text-right">
              {formData.durationHours ? `${formData.durationHours} Jam` : "—"}
            </span>
          </div>
          {formData.packageId && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Paket Terpilih</span>
              <span className="font-bold text-rose-500 text-right max-w-[140px] truncate">
                {selectedPackage?.name}
              </span>
            </div>
          )}
        </div>
        <div className="w-full h-px bg-slate-100" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-indigo-950 text-sm">Total Tagihan</span>
          <span className="font-black text-rose-500 text-lg">
            {formData.packageId
              ? `Rp ${getPackagePrice().toLocaleString("id-ID")}`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
