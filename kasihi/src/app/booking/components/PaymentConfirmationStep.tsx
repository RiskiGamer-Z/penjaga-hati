import { ArrowLeft, CheckCircle2, CreditCard, Loader2, UploadCloud } from "lucide-react";
import React from "react";

interface PaymentConfirmationStepProps {
  formData: {
    patientName: string;
    patientAge: string;
    hospitalId: string;
    roomNumber: string;
    diagnosis: string;
    mitraId: string;
    packageId: string;
    durationHours: string;
    startDate: string;
    startTime: string;
    paymentProof: File | null;
  };
  hospitals: any[];
  mitras: any[];
  packages: any[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePrev: () => void;
  handleSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export default function PaymentConfirmationStep({
  formData,
  hospitals,
  mitras,
  packages,
  handleFileChange,
  handlePrev,
  handleSubmit,
  isSubmitting,
}: PaymentConfirmationStepProps) {
  const selectedHospital = hospitals.find(h => h.id === formData.hospitalId);
  const selectedMitra = mitras.find(m => m.id === formData.mitraId);
  const selectedPackage = packages.find(p => p.id === formData.packageId);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1.5 mb-7">
        <h1 className="font-extrabold text-indigo-950 text-2xl">Konfirmasi & Pembayaran</h1>
        <p className="text-slate-500 text-sm">Tinjau kembali data pesanan Anda dan selesaikan pembayaran transfer</p>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8 space-y-6">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informasi Pasien</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Nama Pasien</p>
              <p className="font-bold text-indigo-950">{formData.patientName || "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Usia Pasien</p>
              <p className="font-bold text-indigo-950">{formData.patientAge || "-"} Tahun</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Rumah Sakit</p>
              <p className="font-bold text-indigo-950">{selectedHospital?.name || "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Kamar / Bangsal</p>
              <p className="font-bold text-indigo-950">{formData.roomNumber || "-"}</p>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-slate-200" />

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Detail Pendampingan</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Paket Layanan</p>
              <p className="font-bold text-rose-500">{selectedPackage?.name || "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Mitra Ditunjuk</p>
              <p className="font-bold text-indigo-950">{selectedMitra?.users?.full_name || "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Waktu Mulai</p>
              <p className="font-bold text-indigo-950">{formData.startDate} pukul {formData.startTime}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Total Tagihan</p>
              <p className="font-black text-rose-500 text-base">
                Rp {selectedPackage?.base_price ? Number(selectedPackage.base_price).toLocaleString('id-ID') : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-indigo-100 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="text-indigo-600 w-5 h-5" />
          <h3 className="font-bold text-indigo-950 text-base">Instruksi Transfer Bank</h3>
        </div>

        <div className="bg-indigo-50/60 rounded-xl p-4 mb-5 border border-indigo-100">
          <p className="text-xs text-slate-600 mb-2">Silakan lakukan transfer sesuai nominal tagihan ke rekening resmi Kasihi:</p>
          <div className="font-mono font-black text-xl text-indigo-950">BCA — 8830 1928 44</div>
          <p className="text-xs text-indigo-600 font-bold mt-1">a.n. Kasihi Indonesia Mendampingi</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
            Unggah Bukti Transfer <span className="text-rose-500">*</span>
          </label>
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            formData.paymentProof ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
          }`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {formData.paymentProof ? (
                <>
                  <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-700 max-w-[220px] truncate">{formData.paymentProof.name}</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                  <p className="mb-1 text-xs text-slate-600"><span className="font-bold text-indigo-600">Klik untuk unggah file</span> atau drag & drop</p>
                  <p className="text-[10px] text-slate-400">PNG, JPG, PDF (Maks. 5MB)</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept="image/png, image/jpeg, application/pdf" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
        <button 
          type="button"
          onClick={handlePrev} 
          className="rounded-full py-3.5 px-6 border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-xs flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ubah Paket</span>
        </button>
        {formData.paymentProof ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center rounded-full py-3.5 px-8 gap-2 bg-gradient-to-r from-indigo-600 to-rose-500 hover:from-indigo-700 hover:to-rose-600 text-white font-bold text-xs shadow-lg disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Memproses Pesanan...</span>
              </>
            ) : (
              <>
                <span>Kirim Pesanan & Bukti TF</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <button 
            type="button"
            disabled 
            className="flex items-center rounded-full py-3.5 px-8 gap-2 bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed"
          >
            <span>Upload Bukti TF Dulu</span>
          </button>
        )}
      </div>
    </div>
  );
}
