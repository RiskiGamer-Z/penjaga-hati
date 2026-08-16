import { Loader2, CheckCircle } from "lucide-react";
import React from "react";

interface GeneralInfoFormProps {
  fullName: string;
  phone: string;
  email: string;
  onFullNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export default function GeneralInfoForm({
  fullName,
  phone,
  email,
  onFullNameChange,
  onPhoneChange,
  onSubmit,
  isSubmitting,
}: GeneralInfoFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-700">Nama Lengkap</label>
        <input 
          required 
          type="text" 
          value={fullName} 
          onChange={e => onFullNameChange(e.target.value)}
          className="w-full rounded-xl p-3 border border-gray-200 focus:border-brand-evergreen focus:ring-2 focus:ring-brand-evergreen/20 outline-none transition-all font-medium"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-700">Nomor Telepon (WhatsApp)</label>
        <input 
          required 
          type="text" 
          value={phone} 
          onChange={e => onPhoneChange(e.target.value)}
          className="w-full rounded-xl p-3 border border-gray-200 focus:border-brand-evergreen focus:ring-2 focus:ring-brand-evergreen/20 outline-none transition-all font-medium"
        />
      </div>
      <div className="flex flex-col gap-2 opacity-60">
        <label className="text-sm font-bold text-gray-700">Email (Hubungi Admin untuk ubah)</label>
        <input 
          type="email" 
          value={email} 
          disabled 
          className="w-full rounded-xl p-3 border border-gray-200 bg-gray-50 font-medium cursor-not-allowed" 
        />
      </div>
      <button 
        disabled={isSubmitting} 
        type="submit" 
        className="mt-4 w-full bg-brand-evergreen text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} Simpan Perubahan
      </button>
    </form>
  );
}
