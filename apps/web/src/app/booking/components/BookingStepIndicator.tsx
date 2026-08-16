import { CheckCircle2 } from "lucide-react";

interface BookingStepIndicatorProps {
  step: number;
}

export default function BookingStepIndicator({ step }: BookingStepIndicatorProps) {
  return (
    <div className="flex items-center w-full max-w-4xl overflow-x-auto pb-4 md:pb-0">
      {/* Step 1 */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className={`flex items-center justify-center rounded-full shrink-0 w-9 h-9 ${
          step >= 1 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-200 text-slate-500'
        }`}>
          {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm">1</span>}
        </div>
        <span className={`font-bold text-sm ${step >= 1 ? 'text-indigo-950' : 'text-slate-400'}`}>Detail Pasien</span>
      </div>
      <div className={`grow h-0.5 mx-4 min-w-[20px] ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />

      {/* Step 2 */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className={`flex items-center justify-center rounded-full shrink-0 w-9 h-9 ${
          step >= 2 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-200 text-slate-500'
        }`}>
          {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm">2</span>}
        </div>
        <span className={`font-bold text-sm ${step >= 2 ? 'text-indigo-950' : 'text-slate-400'}`}>Jadwal & Paket</span>
      </div>
      <div className={`grow h-0.5 mx-4 min-w-[20px] ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`} />

      {/* Step 3 */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className={`flex items-center justify-center rounded-full shrink-0 w-9 h-9 ${
          step >= 3 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-200 text-slate-500'
        }`}>
          <span className="text-sm">3</span>
        </div>
        <span className={`font-bold text-sm ${step >= 3 ? 'text-indigo-950' : 'text-slate-400'}`}>Konfirmasi & Bayar</span>
      </div>
    </div>
  );
}
