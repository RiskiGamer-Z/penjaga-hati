"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "@/utils/toast";
import { updateUserPreferencesAction, uploadAvatarAction } from "./actions";

// Sub-komponen Modular
import SidebarMenu from "./components/SidebarMenu";
import ProfileTab from "./components/ProfileTab";
import SecurityTab from "./components/SecurityTab";
import NotificationsTab from "./components/NotificationsTab";

export default function UserProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // State form profil
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: ""
  });

  const [passwordChangedAt, setPasswordChangedAt] = useState<string | null>(null);
  const [isEmailUser, setIsEmailUser] = useState(true);

  // Preferensi notifikasi
  const [preferences, setPreferences] = useState({
    notifications_email: true,
    notifications_whatsapp: true
  });

  // Ambil data user
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setPasswordChangedAt(user.user_metadata?.password_changed_at || null);
      
      // Cek apakah user login via email/password atau OAuth (Google)
      const providers = user.app_metadata?.providers || [];
      const hasEmailProvider = providers.includes('email') || user.identities?.some(id => id.provider === 'email');
      setIsEmailUser(!!hasEmailProvider);

      // Ambil profile dari public.users
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfileData({
          full_name: profile.full_name || "",
          email: profile.email || user.email || "",
          phone: profile.phone || "",
          address: user.user_metadata?.address || "" // Read address from user auth metadata
        });
        setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
      }

      // Ambil preferensi notifikasi
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefs) {
        setPreferences({
          notifications_email: prefs.notifications_email !== false,
          notifications_whatsapp: prefs.notifications_whatsapp !== false
        });
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak ditemukan");

      // 1. Update in public.users (hanya kolom yang ada di schema)
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Update address in auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { address: profileData.address }
      });

      if (authError) throw authError;

      setSaveSuccess(true);
      toast.success("Profil Berhasil Diperbarui", "Perubahan profil Anda telah berhasil disimpan.");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      toast.error("Gagal Menyimpan Profil", error.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (!file.type.startsWith("image/")) {
      toast.error("Format File Salah", "Mohon pilih file gambar (JPG/PNG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File Terlalu Besar", "Ukuran foto profil maksimal adalah 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Panggil server action (bypass RLS pada bucket storage!)
      const res = await uploadAvatarAction(formData);

      if (!res.success) {
        throw new Error(res.error);
      }

      setAvatarUrl(res.publicUrl || null);
      toast.success("Foto Profil Diperbarui", "Foto profil Anda berhasil diunggah.");
      
      // Refresh halaman setelah jeda 1 detik agar navbar ikut ter-update
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast.error("Gagal Mengunggah", err.message || "Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePreference = async (key: 'notifications_email' | 'notifications_whatsapp') => {
    const updatedValue = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: updatedValue }));

    try {
      const res = await updateUserPreferencesAction({
        [key]: updatedValue
      });
      if (res.success) {
        toast.success("Preferensi Diperbarui", "Pengaturan notifikasi berhasil disimpan.");
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      // Revert state jika gagal
      setPreferences(prev => ({ ...prev, [key]: !updatedValue }));
      toast.error("Gagal Memperbarui Preferensi", err.message || "Koneksi terputus.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-evergreen animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans antialiased">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="tracking-[-0.02em] font-bold text-brand-navy text-[26px]">
            Pengaturan Akun
          </h1>
          <p className="text-[#6B7B8D] text-[15px]">
            Kelola informasi profil, keamanan, dan preferensi akun Anda.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Menu */}
          <SidebarMenu activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <ProfileTab 
                profileData={profileData}
                handleChange={handleChange}
                handleSaveProfile={handleSaveProfile}
                isSaving={isSaving}
                saveSuccess={saveSuccess}
                avatarUrl={avatarUrl}
                handleAvatarClick={handleAvatarClick}
                isUploading={isUploading}
                fileInputRef={fileInputRef}
                handleAvatarChange={handleAvatarChange}
              />
            )}

            {activeTab === "security" && (
              <SecurityTab 
                isEmailUser={isEmailUser}
                passwordChangedAt={passwordChangedAt}
                onPasswordChanged={(timestamp) => setPasswordChangedAt(timestamp)}
              />
            )}

            {activeTab === "notifications" && (
              <NotificationsTab 
                preferences={preferences}
                handleTogglePreference={handleTogglePreference}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
