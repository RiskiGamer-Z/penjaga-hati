"use client";

import { useEffect, useState } from "react";
import { Camera, Edit3, ShieldCheck, Mail, MapPin, Phone, Building2, CreditCard, Lock, Loader2, X, CheckCircle, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/utils/toast";
import {
  updateMitraProfileAction,
  updateBankDetailsAction,
  updateMitraNameAction,
  updateMitraPhoneAction,
  updateMitraAvatarAction,
  updateMitraAvailabilityAction
} from "./actions";

// Sub-komponen Modular
import GeneralInfoForm from "./components/GeneralInfoForm";
import FinancialForm from "./components/FinancialForm";
import SecurityForm from "./components/SecurityForm";

export default function MitraProfilPage() {
  const [loading, setLoading] = useState(true);
  const [mitra, setMitra] = useState<any>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    specializations: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    password: "",
    confirm_password: "",
    avatar_url: ""
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Silakan login kembali.");
        return;
      }

      const { data, error } = await supabase
        .from('mitras')
        .select(`
          *,
          users!inner(full_name, phone, email, avatar_url, created_at)
        `)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const userData = Array.isArray(data.users) ? data.users[0] : data.users;
      const avatarUrlFallback = userData?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

      setMitra({
        ...data,
        user: { ...userData, avatar_url: avatarUrlFallback },
        email: user.email,
        password_changed_at: user.user_metadata?.password_changed_at
      });
      setFormData({
        full_name: userData.full_name || "",
        phone: userData.phone || "",
        specializations: data.specializations?.join(", ") || "",
        bank_name: data.bank_name || "",
        bank_account_number: data.bank_account_number || "",
        bank_account_name: data.bank_account_name || "",
        password: "",
        confirm_password: "",
        avatar_url: avatarUrlFallback
      });


    } catch (error: any) {
      toast.error("Gagal memuat profil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update name
      if (formData.full_name !== mitra.user.full_name) {
        const res = await updateMitraNameAction(mitra.id, formData.full_name);
        if (!res.success) throw new Error(res.error);
      }
      // Update phone
      if (formData.phone !== mitra.user.phone) {
        const res = await updateMitraPhoneAction(mitra.id, formData.phone);
        if (!res.success) throw new Error(res.error);
      }

      toast.success("Profil berhasil diperbarui!");
      setActiveModal(null);
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRekening = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await updateBankDetailsAction(mitra.id, {
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_account_name: formData.bank_account_name
      });
      if (!res.success) throw new Error(res.error);

      toast.success("Rekening berhasil diperbarui!");
      setActiveModal(null);
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      toast.error("Password baru tidak cocok.");
      return;
    }
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
        data: { password_changed_at: new Date().toISOString() }
      });
      if (error) throw error;

      toast.success("Password berhasil diperbarui!");
      setFormData({ ...formData, password: "", confirm_password: "" });
      setActiveModal(null);
      fetchProfile();
    } catch (err: any) {
      toast.error("Gagal merubah password: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload foto profil ke bucket 'avatars'
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG/PNG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const fileName = `${mitra.user_id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const res = await updateMitraAvatarAction(mitra.id, pub.publicUrl);
      if (!res.success) throw new Error(res.error);

      toast.success("Foto profil berhasil diperbarui!");
      fetchProfile();
    } catch (err: any) {
      toast.error("Gagal mengunggah foto: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Kelengkapan syarat aktivasi mitra (rekening wajib terisi)
  const hasBankDetails = !!(
    mitra?.bank_name &&
    mitra?.bank_account_number &&
    mitra?.bank_account_name
  );

  // Aktif/Nonaktif: mitra aktif akan muncul di pilihan customer
  const handleToggleActive = async () => {
    const next = !mitra.is_available;
    if (next && !hasBankDetails) {
      toast.error("Lengkapi rekening dulu", "Anda wajib melengkapi data rekening bank sebelum mengaktifkan status mitra.");
      return;
    }
    if (next && !mitra.is_verified) {
      toast.error("Belum terverifikasi", "Akun Anda belum diverifikasi admin. Silakan koordinasi dengan admin terlebih dahulu.");
      return;
    }
    setTogglingStatus(true);
    try {
      const res = await updateMitraAvailabilityAction(mitra.id, next);
      if (!res.success) throw new Error(res.error);
      toast.success(next ? "Mitra Diaktifkan" : "Mitra Dinonaktifkan", next ? "Anda kini muncul di pilihan customer." : "Anda tidak akan muncul di pilihan customer.");
      fetchProfile();
    } catch (err: any) {
      toast.error("Gagal mengubah status: " + err.message);
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-20 text-brand-evergreen">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="font-semibold animate-pulse">Memuat profil Anda...</p>
      </div>
    );
  }

  if (!mitra) return null;

  return (
    <div className="flex flex-col flex-1 gap-8 p-4 md:p-8 max-w-5xl mx-auto w-full font-sans antialiased">
      {/* Header Profile Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/75 backdrop-blur-md rounded-[2rem] p-6 md:p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-full h-40 bg-gradient-to-r from-brand-evergreen/10 via-emerald-100/20 to-brand-alpine/10 opacity-70 pointer-events-none" />

        <div className="relative z-10 shrink-0 group">
          <label className="block w-36 h-36 rounded-[2rem] bg-gray-100 border-4 border-white shadow-xl overflow-hidden relative rotate-3 transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105 cursor-pointer">
            {mitra.user?.avatar_url ? (
              <img src={mitra.user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1A2332] to-[#2A374A] text-white flex items-center justify-center text-5xl font-black">
                {mitra.user?.full_name ? mitra.user.full_name.substring(0, 2).toUpperCase() : 'M'}
              </div>
            )}
            {/* Overlay ganti foto */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
              {uploadingAvatar ? (
                <Loader2 size={26} className="animate-spin" />
              ) : (
                <>
                  <Camera size={26} />
                  <span className="text-[10px] font-bold">Ganti Foto</span>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
          </label>
          <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-[3px] border-white shadow-md flex items-center justify-center ${mitra.is_available ? 'bg-brand-evergreen' : 'bg-gray-400'}`}>
            <div className={`w-3 h-3 bg-white rounded-full ${mitra.is_available ? 'animate-ping opacity-75 absolute' : 'hidden'}`} />
            <div className="w-3 h-3 bg-white rounded-full relative" />
          </div>
        </div>

        <div className="flex flex-col items-center md:items-start gap-4 relative z-10 w-full mt-2">
          <div className="flex flex-col items-center md:items-start gap-1">
            <h1 className="font-black text-[#1A2332] text-4xl tracking-tight drop-shadow-sm">{mitra.user?.full_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 bg-emerald-50 text-brand-evergreen text-xs font-black px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                <ShieldCheck size={16} /> {mitra.is_verified ? "TERVERIFIKASI" : "MENUNGGU VERIFIKASI"}
              </div>
              <span className="text-gray-400 text-sm font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                Gabung {new Date(mitra.user?.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-white py-2 px-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <Mail size={18} className="text-brand-evergreen" /> {mitra.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-white py-2 px-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <Phone size={18} className="text-brand-evergreen" /> {mitra.user?.phone || '-'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-white py-2 px-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <MapPin size={18} className="text-brand-evergreen" /> Indonesia
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveModal('profil')}
          className="absolute top-6 right-6 p-3 rounded-2xl border border-gray-200 text-gray-500 bg-white hover:text-brand-evergreen hover:border-brand-evergreen hover:bg-emerald-50 shadow-sm transition-all group"
        >
          <Edit3 size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Keahlian & Kualifikasi */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/75 backdrop-blur-md rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6 relative overflow-hidden group"
        >
          <div className="absolute -right-10 -top-10 bg-emerald-50 w-32 h-32 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 relative z-10">
            <h2 className="font-bold text-[#1A2332] text-xl flex items-center gap-2">
              <ShieldCheck className="text-brand-evergreen" /> Keahlian & Layanan
            </h2>
          </div>

          <div className="flex flex-col gap-5 relative z-10">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Spesialisasi</span>
              <div className="flex flex-wrap gap-2">
                {mitra.specializations && mitra.specializations.length > 0 ? (
                  mitra.specializations.map((spec: string, idx: number) => (
                    <span key={idx} className="bg-brand-evergreen/10 text-brand-evergreen text-xs font-bold px-4 py-2 rounded-xl border border-brand-evergreen/20">
                      {spec}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">Belum ada spesialisasi.</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Informasi Keuangan */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="bg-white/75 backdrop-blur-md rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6 relative overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 relative z-10">
            <h2 className="font-bold text-[#1A2332] text-xl flex items-center gap-2">
              <CreditCard className="text-brand-alpine" /> Rekening Bank
            </h2>
            <button onClick={() => setActiveModal('rekening')} className="text-brand-alpine font-bold text-sm bg-orange-50 px-4 py-1.5 rounded-full hover:bg-orange-100 transition-colors">Edit</button>
          </div>

          <div className="flex flex-col gap-4 relative z-10">
            <div className="p-6 rounded-[1.5rem] bg-gradient-to-br from-[#1A2332] to-[#2A374A] flex flex-col gap-5 relative overflow-hidden shadow-xl shadow-gray-200/50">
              <div className="absolute -top-10 -right-10 opacity-10 text-white">
                <Building2 size={120} />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Bank</span>
                  <span className="font-bold text-white text-lg">{mitra.bank_name || 'Belum diatur'}</span>
                </div>
                <CreditCard size={28} className="text-brand-alpine" />
              </div>

              <div className="flex flex-col gap-1 mt-2 relative z-10">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nomor Rekening</span>
                <span className="font-mono font-bold text-white text-2xl tracking-[0.15em] drop-shadow-md">
                  {mitra.bank_account_number ? mitra.bank_account_number.replace(/(\d{4})/g, '$1 ').trim() : '**** **** ****'}
                </span>
                <span className="text-xs font-bold text-gray-300 mt-1 uppercase tracking-widest">{mitra.bank_account_name || 'NAMA PEMILIK'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Status Aktivasi Mitra */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="md:col-span-2 bg-white/75 backdrop-blur-md rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="font-bold text-[#1A2332] text-xl flex items-center gap-2">
              <ShieldCheck className="text-brand-evergreen" /> Status Aktivasi Mitra
            </h2>
            <span className={`text-xs font-black px-3 py-1.5 rounded-full border ${
              mitra.is_available
                ? "bg-emerald-50 text-brand-evergreen border-emerald-100"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}>
              {mitra.is_available ? "AKTIF" : "NONAKTIF"}
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex flex-col gap-1 max-w-md">
              <p className="font-bold text-brand-navy text-sm">
                {mitra.is_available
                  ? "Anda sedang aktif dan muncul di pilihan mitra customer."
                  : "Anda sedang nonaktif dan tidak muncul di pilihan customer."}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Untuk mengaktifkan status, Anda wajib melengkapi data rekening bank dan sudah
                diverifikasi oleh admin. Dokumen penting (KTP, sertifikat, SKCK) diunggah oleh
                admin saat proses pendaftaran &mdash; koordinasikan dengan admin bila belum lengkap.
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={handleToggleActive}
              disabled={togglingStatus}
              aria-label="Aktifkan atau nonaktifkan status mitra"
              className={`relative inline-flex h-9 w-16 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
                mitra.is_available ? "bg-brand-evergreen" : "bg-gray-300"
              }`}
            >
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transform transition-transform ${
                mitra.is_available ? "translate-x-8" : "translate-x-1"
              }`}>
                {togglingStatus && <Loader2 size={14} className="animate-spin text-gray-500" />}
              </span>
            </button>
          </div>

          {/* Requirement checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
              hasBankDetails ? "bg-emerald-50/60 border-emerald-100 text-brand-evergreen" : "bg-amber-50 border-amber-100 text-amber-700"
            }`}>
              <CheckCircle size={18} className={hasBankDetails ? "text-brand-evergreen" : "text-amber-500"} />
              <span className="font-semibold">
                Data rekening bank {hasBankDetails ? "lengkap" : "belum lengkap"}
              </span>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
              mitra.is_verified ? "bg-emerald-50/60 border-emerald-100 text-brand-evergreen" : "bg-amber-50 border-amber-100 text-amber-700"
            }`}>
              <CheckCircle size={18} className={mitra.is_verified ? "text-brand-evergreen" : "text-amber-500"} />
              <span className="font-semibold">
                Verifikasi admin {mitra.is_verified ? "selesai" : "menunggu"}
              </span>
            </div>
          </div>

          {!hasBankDetails && (
            <button
              onClick={() => setActiveModal('rekening')}
              className="self-start flex items-center gap-2 text-brand-alpine font-bold text-sm bg-orange-50 px-4 py-2 rounded-full hover:bg-orange-100 transition-colors"
            >
              <CreditCard size={16} /> Lengkapi Rekening Sekarang
            </button>
          )}
        </motion.div>

        {/* Keamanan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="md:col-span-2 bg-white/75 backdrop-blur-md rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="font-bold text-[#1A2332] text-xl flex items-center gap-2">
              <Lock className="text-blue-600" /> Keamanan Akun
            </h2>
            <button onClick={() => setActiveModal('password')} className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-1.5 rounded-full hover:bg-blue-100 transition-colors">Ubah Password</button>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 border border-gray-200 text-gray-400">
              <Lock size={20} />
            </div>
            <div>
              <p className="font-bold text-brand-navy">Password</p>
              <p className="text-sm text-gray-500">
                Terakhir diubah: {mitra.password_changed_at ? new Date(mitra.password_changed_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + " WIB" : "Tidak diketahui"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal Definitions */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setActiveModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-lg relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-bold text-brand-navy">
                  {activeModal === 'profil' ? 'Edit Profil Pribadi' :
                    activeModal === 'rekening' ? 'Edit Rekening' : 'Ubah Password'}
                </h3>
                <button onClick={() => !isSubmitting && setActiveModal(null)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors border border-gray-200">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                {activeModal === 'profil' && (
                  <GeneralInfoForm
                    fullName={formData.full_name}
                    phone={formData.phone}
                    email={mitra.email}
                    onFullNameChange={val => setFormData({ ...formData, full_name: val })}
                    onPhoneChange={val => setFormData({ ...formData, phone: val })}
                    onSubmit={handleUpdateProfil}
                    isSubmitting={isSubmitting}
                  />
                )}

                {activeModal === 'rekening' && (
                  <FinancialForm
                    bankName={formData.bank_name}
                    bankAccountNumber={formData.bank_account_number}
                    bankAccountName={formData.bank_account_name}
                    onBankNameChange={val => setFormData({ ...formData, bank_name: val })}
                    onBankAccountNumberChange={val => setFormData({ ...formData, bank_account_number: val })}
                    onBankAccountNameChange={val => setFormData({ ...formData, bank_account_name: val })}
                    onSubmit={handleUpdateRekening}
                    isSubmitting={isSubmitting}
                  />
                )}

                {activeModal === 'password' && (
                  <SecurityForm
                    password={formData.password}
                    confirmPassword={formData.confirm_password}
                    onPasswordChange={val => setFormData({ ...formData, password: val })}
                    onConfirmPasswordChange={val => setFormData({ ...formData, confirm_password: val })}
                    onSubmit={handleUpdatePassword}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
