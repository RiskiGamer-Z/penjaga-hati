import { useState } from "react";
import { Shield, Info, Lock, EyeOff, Eye, Loader2, Save } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/utils/toast";

interface SecurityTabProps {
  isEmailUser: boolean;
  passwordChangedAt: string | null;
  onPasswordChanged: (timestamp: string) => void;
}

export default function SecurityTab({
  isEmailUser,
  passwordChangedAt,
  onPasswordChanged,
}: SecurityTabProps) {
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);
  const [passError, setPassError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setPassError("");
  };

  const handleUpdatePassword = async () => {
    if (isEmailUser && !passwords.current) {
      setPassError("Masukkan password lama Anda untuk verifikasi.");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPassError("Konfirmasi password tidak cocok!");
      return;
    }
    if (passwords.new.length < 6) {
      setPassError("Password baru minimal 6 karakter.");
      return;
    }

    setIsSaving(true);
    setPassError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Silakan login kembali.");

      // Jika mendaftar lewat Email, lakukan verifikasi password lama dengan login ulang di background
      if (isEmailUser) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email || "",
          password: passwords.current,
        });

        if (verifyError) {
          throw new Error("Password lama salah. Verifikasi gagal.");
        }
      }

      // Update password baru di Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
        data: { password_changed_at: new Date().toISOString() },
      });

      if (error) throw error;

      const now = new Date().toISOString();
      onPasswordChanged(now);
      toast.success("Password Diperbarui", "Password akun Anda berhasil diperbarui.");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      setPassError(error.message);
      toast.error("Gagal Memperbarui Password", error.message || "Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="text-brand-evergreen" size={20} />
          <h2 className="font-bold text-brand-navy text-lg">Keamanan Akun</h2>
        </div>
      </div>
      
      {isEmailUser ? (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6">
          <Info className="text-blue-600 mt-0.5 shrink-0" size={18} />
          <p className="text-sm text-blue-800 leading-relaxed">
            Untuk mengubah password, Anda wajib memverifikasi password lama Anda terlebih dahulu demi alasan keamanan.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-xl mb-6">
          <Info className="text-yellow-600 mt-0.5 shrink-0" size={18} />
          <p className="text-sm text-yellow-800 leading-relaxed">
            Akun Anda masuk via Google OAuth. Anda tidak memerlukan password untuk masuk ke akun ini. Jika ingin menyetel password baru, Anda bisa langsung mengisi form di bawah.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-8">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-200 text-gray-400">
          <Lock size={18} />
        </div>
        <div>
          <p className="font-bold text-brand-navy text-xs leading-none mb-1">Status Password</p>
          <p className="text-xs text-gray-500">
            Terakhir diubah: {passwordChangedAt ? new Date(passwordChangedAt).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB" : "Tidak diketahui"}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col gap-6 mb-8 max-w-md">
        {passError && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
            {passError}
          </div>
        )}

        {isEmailUser && (
          <div className="flex flex-col gap-2 relative">
            <label className="font-medium text-brand-navy text-sm">Password Lama</label>
            <div className="relative">
              <input 
                type={showCurrentPassword ? "text" : "password"} 
                name="current"
                value={passwords.current}
                onChange={handlePasswordChange}
                placeholder="Masukkan password lama Anda"
                className="w-full rounded-xl py-3 px-4 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none transition-all text-sm pr-10"
              />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 relative">
          <label className="font-medium text-brand-navy text-sm">Password Baru</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              name="new"
              value={passwords.new}
              onChange={handlePasswordChange}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-xl py-3 px-4 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none transition-all text-sm pr-10"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 relative">
          <label className="font-medium text-brand-navy text-sm">Konfirmasi Password Baru</label>
          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              name="confirm"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              placeholder="Ulangi password baru"
              className="w-full rounded-xl py-3 px-4 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none transition-all text-sm pr-10"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button 
          onClick={handleUpdatePassword}
          disabled={isSaving || !passwords.new}
          className="flex items-center rounded-[10px] py-3 px-6 gap-2 bg-brand-evergreen hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="text-white animate-spin" /> : <Save size={16} className="text-white" />}
          <span className="font-semibold text-white text-sm">Update Password</span>
        </button>
      </div>
    </div>
  );
}
