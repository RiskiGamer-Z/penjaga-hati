import { Loader2, CheckCircle } from "lucide-react";
import React from "react";

interface FinancialFormProps {
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  onBankNameChange: (val: string) => void;
  onBankAccountNumberChange: (val: string) => void;
  onBankAccountNameChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export default function FinancialForm({
  bankName,
  bankAccountNumber,
  bankAccountName,
  onBankNameChange,
  onBankAccountNumberChange,
  onBankAccountNameChange,
  onSubmit,
  isSubmitting,
}: FinancialFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-700">Nama Bank</label>
        <select 
          required 
          value={bankName} 
          onChange={e => onBankNameChange(e.target.value)}
          className="w-full rounded-xl p-3 border border-gray-200 focus:border-brand-alpine focus:ring-2 focus:ring-brand-alpine/20 outline-none transition-all font-medium bg-white"
        >
          <option value="" disabled>Pilih Bank</option>
          <option value="BCA">BCA</option>
          <option value="Mandiri">Mandiri</option>
          <option value="BRI">BRI</option>
          <option value="BNI">BNI</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-700">Nomor Rekening</label>
        <input 
          required 
          type="text" 
          value={bankAccountNumber} 
          onChange={e => onBankAccountNumberChange(e.target.value)}
          className="w-full rounded-xl p-3 border border-gray-200 focus:border-brand-alpine focus:ring-2 focus:ring-brand-alpine/20 outline-none transition-all font-medium"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-700">Atas Nama</label>
        <input 
          required 
          type="text" 
          value={bankAccountName} 
          onChange={e => onBankAccountNameChange(e.target.value)}
          className="w-full rounded-xl p-3 border border-gray-200 focus:border-brand-alpine focus:ring-2 focus:ring-brand-alpine/20 outline-none transition-all font-medium uppercase"
        />
      </div>
      <button 
        disabled={isSubmitting} 
        type="submit" 
        className="mt-4 w-full bg-[#1A2332] text-white font-bold py-3.5 rounded-xl hover:bg-[#2A374A] transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} Perbarui Rekening
      </button>
    </form>
  );
}
