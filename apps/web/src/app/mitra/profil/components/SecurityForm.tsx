import { Loader2, Lock, EyeOff, Eye } from "lucide-react";
import React, { useState } from "react";

interface SecurityFormProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export default function SecurityForm({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  isSubmitting,
}: SecurityFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 relative">
        <label className="text-sm font-bold text-gray-700">Password Baru</label>
        <div className="relative">
          <input 
            required 
            type={showPassword ? "text" : "password"} 
            minLength={6} 
            value={password} 
            onChange={e => onPasswordChange(e.target.value)}
            className="w-full rounded-xl p-3 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium pr-10"
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 relative">
        <label className="text-sm font-bold text-gray-700">Konfirmasi Password Baru</label>
        <div className="relative">
          <input 
            required 
            type={showConfirmPassword ? "text" : "password"} 
            minLength={6} 
            value={confirmPassword} 
            onChange={e => onConfirmPasswordChange(e.target.value)}
            className="w-full rounded-xl p-3 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium pr-10"
          />
          <button 
            type="button" 
            onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <button 
        disabled={isSubmitting} 
        type="submit" 
        className="mt-4 w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />} Ganti Password
      </button>
    </form>
  );
}
